export interface PeakerrServiceInfo {
  service: string;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
}

export interface PeakerrBalanceResponse {
  balance: string;
  currency: string;
}

export interface PeakerrOrderRequest {
  service: string;
  link: string;
  quantity: number;
  runs?: number;
  interval?: number;
  comments?: string;
}

export interface PeakerrOrderResponse {
  order?: number | string;
  error?: string;
}

export interface PeakerrOrderStatusResponse {
  charge?: string;
  start_count?: string;
  status?: 'Pending' | 'In progress' | 'Completed' | 'Partial' | 'Canceled' | 'Processing';
  remains?: string;
  currency?: string;
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
  | 'UNKNOWN_ERROR';
