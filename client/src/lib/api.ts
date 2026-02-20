const API_BASE = "/api";

export async function apiRequest<T>(
  method: string,
  endpoint: string,
  data?: unknown,
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error de conexión" }));
    throw new Error(error.message || "Error en la solicitud");
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, token?: string) => apiRequest<T>("GET", endpoint, undefined, token),
  post: <T>(endpoint: string, data: unknown, token?: string) => apiRequest<T>("POST", endpoint, data, token),
  put: <T>(endpoint: string, data: unknown, token?: string) => apiRequest<T>("PUT", endpoint, data, token),
  delete: <T>(endpoint: string, token?: string) => apiRequest<T>("DELETE", endpoint, undefined, token),
};
