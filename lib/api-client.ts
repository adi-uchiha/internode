export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}
export class ApiClientError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}
interface ApiOptions extends RequestInit {
  showToast?: boolean;
  toastMessage?: string;
}
export const apiClient = {
  async request<T>(url: string, options: ApiOptions = {}): Promise<T> {
    const { ...fetchOptions } = options;
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorData = data as ApiErrorResponse;
        const errorMessage = errorData.error || 'Something went wrong';
        const errorCode = errorData.code || 'unknown_error';
        throw new ApiClientError(errorMessage, response.status, errorCode, errorData.details);
      }
      return data as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      throw new ApiClientError(errorMessage, 0, 'network_error');
    }
  },
  get<T>(url: string, options?: ApiOptions) {
    return this.request<T>(url, { ...options, method: 'GET' });
  },
  post<T>(url: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  put<T>(url: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  patch<T>(url: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  delete<T>(url: string, options?: ApiOptions) {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  },
};
