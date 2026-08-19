import {
  PeakerrBalanceResponse,
  PeakerrCancelResponse,
  PeakerrCreateOrderResult,
  PeakerrMultiStatusResponse,
  PeakerrOrderRequest,
  PeakerrOrderStatusResponse,
  PeakerrRefillResponse,
  PeakerrRefillStatusResponse,
  PeakerrService,
} from './peakerr.types';
import { classifyPeakerrError } from '@/lib/fulfillment/fallback-policy';

export class PeakerrClient {
  private apiKey?: string;
  private apiUrl: string;
  private timeoutMs: number;

  constructor() {
    this.apiKey = process.env.PEAKERR_API_KEY;
    this.apiUrl = process.env.PEAKERR_API_URL || 'https://peakerr.com/api/v2';
    this.timeoutMs = 25000; // 25 seconds conservative timeout
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public isLiveEnabled(): boolean {
    return process.env.PEAKERR_LIVE_FULFILLMENT === 'true';
  }

  /**
   * Sanitizes any log or error object so that the API key is never exposed.
   */
  public sanitizeOutput<T extends Record<string, unknown>>(data: T): T {
    if (!data || typeof data !== 'object') return data;
    const copy: any = Array.isArray(data) ? [...data] : { ...data };
    if ('key' in copy) delete copy.key;
    if ('apiKey' in copy) delete copy.apiKey;
    return copy;
  }

  /**
   * Internal private fetch helper executing official Peakerr application/x-www-form-urlencoded POST requests.
   */
  private async executeRequest<T>(params: Record<string, string>): Promise<{ ok: boolean; status: number; data?: T; rawText?: string; error?: string; isTimeout?: boolean }> {
    if (!this.isConfigured()) {
      return { ok: false, status: 500, error: 'Peakerr API key is not configured in server environment.' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const formBody = new URLSearchParams({
        key: this.apiKey!.trim(),
        ...params,
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const rawText = await response.text();

      let json: any;
      try {
        json = JSON.parse(rawText);
      } catch {
        return {
          ok: false,
          status: response.status,
          rawText,
          error: 'PROVIDER_INVALID_RESPONSE: Response from Peakerr was not valid JSON.',
        };
      }

      return {
        ok: response.ok,
        status: response.status,
        data: json as T,
        rawText,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const error = err as Error;
      const isAbort = error.name === 'AbortError' || error.message.includes('abort') || error.message.includes('timeout');

      return {
        ok: false,
        status: isAbort ? 408 : 500,
        isTimeout: isAbort,
        error: isAbort ? 'ETIMEDOUT: Peakerr request timed out after 25000ms' : error.message,
      };
    }
  }

  /**
   * DRY RUN PREVIEW: Zero HTTP execution, returns verified structure for testing & UI simulation.
   */
  public async createOrderDryRun(request: PeakerrOrderRequest): Promise<{ dryRun: true; request: PeakerrOrderRequest }> {
    return {
      dryRun: true,
      request,
    };
  }

  /**
   * Official createOrder (action=add).
   * STRICT SAFETY GATE: Only executes if process.env.PEAKERR_LIVE_FULFILLMENT === 'true'.
   */
  public async createOrder(request: PeakerrOrderRequest): Promise<PeakerrCreateOrderResult> {
    if (!this.isLiveEnabled()) {
      return {
        success: false,
        error: 'PEAKERR_LIVE_FULFILLMENT_DISABLED: Live fulfillment kill switch is active (flag is false or absent).',
        errorKind: 'LIVE_FULFILLMENT_DISABLED',
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'CONFIG_MISSING: PEAKERR_API_KEY is not configured in environment.',
        errorKind: 'CONFIG_MISSING',
      };
    }

    const payloadParams: Record<string, string> = {
      action: 'add',
      service: String(request.service),
      link: request.link.trim(),
      quantity: String(request.quantity),
    };

    if (request.runs !== undefined) payloadParams.runs = String(request.runs);
    if (request.interval !== undefined) payloadParams.interval = String(request.interval);
    if (request.comments !== undefined) payloadParams.comments = request.comments;

    const res = await this.executeRequest<{ order?: string | number; error?: string }>(payloadParams);

    // 1. Handle Timeout / Socket drop -> AMBIGUOUS_SUBMISSION (Strict: Do NOT assume safe failure)
    if (res.isTimeout) {
      return {
        success: false,
        error: 'AMBIGUOUS_SUBMISSION: Request to Peakerr timed out before confirmation. Do not retry automatically.',
        errorKind: 'AMBIGUOUS_SUBMISSION',
        isAmbiguous: true,
      };
    }

    if (!res.ok || !res.data) {
      const errorMsg = res.error || 'Peakerr HTTP error with empty response';
      const kind = classifyPeakerrError(errorMsg);
      return {
        success: false,
        error: errorMsg,
        errorKind: kind,
        rawResponse: res.rawText,
      };
    }

    // 2. Handle Provider Error in JSON payload
    if (res.data.error) {
      const errorMsg = String(res.data.error);
      const kind = classifyPeakerrError(errorMsg);
      return {
        success: false,
        error: errorMsg,
        errorKind: kind,
        rawResponse: this.sanitizeOutput(res.data as Record<string, unknown>),
      };
    }

    // 3. Handle Successful Order Creation
    if (res.data.order !== undefined && res.data.order !== null) {
      return {
        success: true,
        order: res.data.order,
        rawResponse: this.sanitizeOutput(res.data as Record<string, unknown>),
      };
    }

    return {
      success: false,
      error: 'PROVIDER_INVALID_RESPONSE: Neither order ID nor error field found in response.',
      errorKind: 'PROVIDER_INVALID_RESPONSE',
      rawResponse: res.data,
    };
  }

  /**
   * Official getStatus (action=status, order=<orderId>).
   */
  public async getStatus(orderId: string | number): Promise<PeakerrOrderStatusResponse> {
    const res = await this.executeRequest<PeakerrOrderStatusResponse>({
      action: 'status',
      order: String(orderId),
    });

    if (!res.ok || !res.data) {
      return { error: res.error || 'Failed to fetch status' };
    }
    return this.sanitizeOutput(res.data as Record<string, unknown>);
  }

  /**
   * Official getMultiStatus (action=status, orders=<id1,id2,id3>).
   */
  public async getMultiStatus(orderIds: (string | number)[]): Promise<PeakerrMultiStatusResponse | { error: string }> {
    const res = await this.executeRequest<PeakerrMultiStatusResponse>({
      action: 'status',
      orders: orderIds.join(','),
    });

    if (!res.ok || !res.data) {
      return { error: res.error || 'Failed to fetch multi status' };
    }
    return res.data;
  }

  /**
   * Official getBalance (action=balance).
   */
  public async getBalance(): Promise<PeakerrBalanceResponse | { error: string }> {
    const res = await this.executeRequest<PeakerrBalanceResponse>({
      action: 'balance',
    });

    if (!res.ok || !res.data) {
      return { error: res.error || 'Failed to fetch balance' };
    }
    return this.sanitizeOutput(res.data as unknown as Record<string, unknown>) as unknown as PeakerrBalanceResponse;
  }

  /**
   * Official getServices (action=services).
   */
  public async getServices(): Promise<PeakerrService[] | { error: string }> {
    const res = await this.executeRequest<PeakerrService[]>({
      action: 'services',
    });

    if (!res.ok || !res.data) {
      return { error: res.error || 'Failed to fetch services list' };
    }
    return res.data;
  }

  /**
   * Official createRefill (action=refill, order=<orderId>).
   */
  public async createRefill(orderId: string | number): Promise<PeakerrRefillResponse> {
    const res = await this.executeRequest<PeakerrRefillResponse>({
      action: 'refill',
      order: String(orderId),
    });

    if (!res.ok || !res.data) {
      return { error: res.error || 'Failed to request refill' };
    }
    return this.sanitizeOutput(res.data as Record<string, unknown>);
  }

  /**
   * Official getRefillStatus (action=refill_status, refill=<refillId>).
   */
  public async getRefillStatus(refillId: string | number): Promise<PeakerrRefillStatusResponse> {
    const res = await this.executeRequest<PeakerrRefillStatusResponse>({
      action: 'refill_status',
      refill: String(refillId),
    });

    if (!res.ok || !res.data) {
      return { error: res.error || 'Failed to get refill status' };
    }
    return this.sanitizeOutput(res.data as Record<string, unknown>);
  }

  /**
   * Official cancelOrders (action=cancel, orders=<id1,id2,id3>).
   */
  public async cancelOrders(orderIds: (string | number)[]): Promise<PeakerrCancelResponse | PeakerrCancelResponse[]> {
    const res = await this.executeRequest<PeakerrCancelResponse | PeakerrCancelResponse[]>({
      action: 'cancel',
      orders: orderIds.join(','),
    });

    if (!res.ok || !res.data) {
      return { error: res.error || 'Failed to cancel orders' };
    }
    return res.data;
  }
}

export const peakerrClient = new PeakerrClient();
