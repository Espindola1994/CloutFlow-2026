export interface PeakerrService {
  service: string | number;
  name: string;
  type: string;
  category: string;
  rate: string | number;
  min: string | number;
  max: string | number;
  refill: boolean | string | number;
  cancel: boolean | string | number;
  dripfeed?: boolean | string | number;
}

export interface PeakerrBalanceResponse {
  balance: string | number;
  currency: string;
}

export interface PeakerrOrderRequest {
  service: string | number;
  link: string;
  quantity: number;
  runs?: number;
  interval?: number;
  comments?: string;
}

export interface PeakerrCreateOrderSuccess {
  success: true;
  order: string | number;
  rawResponse: Record<string, unknown>;
}

export interface PeakerrCreateOrderError {
  success: false;
  error: string;
  errorKind: PeakerrErrorKind;
  isAmbiguous?: boolean;
  rawResponse?: unknown;
}

export type PeakerrCreateOrderResult = PeakerrCreateOrderSuccess | PeakerrCreateOrderError;

export interface PeakerrOrderStatusResponse {
  status?: 'Pending' | 'In progress' | 'Completed' | 'Partial' | 'Canceled' | 'Processing' | string;
  charge?: string | number;
  start_count?: string | number;
  remains?: string | number;
  currency?: string;
  error?: string;
}

export type PeakerrMultiStatusResponse = Record<string, PeakerrOrderStatusResponse>;

export interface PeakerrRefillResponse {
  refill?: string | number;
  error?: string;
}

export interface PeakerrRefillStatusResponse {
  status?: string;
  error?: string;
}

export interface PeakerrCancelResponse {
  order?: string | number;
  cancel?: string | number | boolean;
  error?: string;
}

export type PeakerrErrorKind =
  | 'AUTH_ERROR'
  | 'BAD_API_KEY'
  | 'INSUFFICIENT_BALANCE'
  | 'SERVICE_UNAVAILABLE'
  | 'SERVICE_DISABLED'
  | 'TEMPORARY_UNAVAILABLE'
  | 'INVALID_LINK'
  | 'INVALID_QUANTITY'
  | 'PROVIDER_ACTIVE_ORDER_CONFLICT'
  | 'AMBIGUOUS_SUBMISSION'
  | 'LIVE_FULFILLMENT_DISABLED'
  | 'CONFIG_MISSING'
  | 'PROVIDER_INVALID_RESPONSE'
  | 'UNKNOWN_ERROR';
