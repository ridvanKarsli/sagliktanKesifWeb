/** API hata zarfı: {error:{code,message,details,request_id}} */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;
  readonly requestId?: string | null;

  constructor(status: number, body: Partial<ApiErrorBody> | null, fallback: string) {
    super(body?.message || fallback);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code || 'http_error';
    this.details = body?.details || {};
    this.requestId = body?.request_id;
  }
}

export const errorMessage = (e: unknown): string =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Beklenmeyen hata';
