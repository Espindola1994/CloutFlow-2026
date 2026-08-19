import {
  PeakerrBalanceResponse,
  PeakerrOrderRequest,
  PeakerrOrderResponse,
  PeakerrOrderStatusResponse,
  PeakerrServiceInfo,
} from './peakerr.types';

export class PeakerrClient {
  private apiKey?: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.PEAKERR_API_KEY;
    this.apiUrl = process.env.PEAKERR_API_URL || 'https://peakerr.com/api/v2';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * DRY RUN SAFETY: Real creation is strictly disabled in Phase 3.0.
   * Calling this method in Dry Run mode returns a simulated response and does not perform HTTP execution.
   */
  public async createOrderDryRun(request: PeakerrOrderRequest): Promise<{ dryRun: true; request: PeakerrOrderRequest }> {
    return {
      dryRun: true,
      request,
    };
  }

  /**
   * Placeholder for future live execution once credentials and tests are approved.
   */
  public async getBalance(): Promise<PeakerrBalanceResponse> {
    if (!this.isConfigured()) {
      throw new Error('Peakerr API key is not configured in environment.');
    }
    throw new Error('Peakerr live calls are disabled in Phase 3.0 Dry Run.');
  }

  public async getServices(): Promise<PeakerrServiceInfo[]> {
    if (!this.isConfigured()) {
      throw new Error('Peakerr API key is not configured in environment.');
    }
    throw new Error('Peakerr live calls are disabled in Phase 3.0 Dry Run.');
  }
}

export const peakerrClient = new PeakerrClient();
