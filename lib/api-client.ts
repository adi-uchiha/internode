import { toast } from '@/lib/toast';

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
  toastDescription?: string;
}

export const apiClient = {
  async request<T>(url: string, options: ApiOptions = {}): Promise<T> {
    const { showToast = true, toastMessage, toastDescription, ...fetchOptions } = options;

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

        if (showToast) {
          toast.error(toastMessage || errorMessage, {
            description: toastDescription || `ERR_CODE: ${errorCode}`,
          });
        }

        throw new ApiClientError(errorMessage, response.status, errorCode, errorData.details);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Network error';
      if (showToast) {
        toast.error(toastMessage || errorMessage, {
          description: 'NETWORK_FAILURE',
        });
      }

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
