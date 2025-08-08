import { getClientHeaders } from "./client-context";

// Wrapper for API calls with client context
export async function clientApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
  client: { id: number; slug: string } | null = null
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getClientHeaders(client),
    ...options.headers
  };
  
  const response = await fetch(endpoint, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  return response.json();
}

// Create client-aware API client
export function createClientApiClient(client: { id: number; slug: string } | null) {
  return {
    get: <T = any>(url: string) => 
      clientApi<T>(url, { method: "GET" }, client),
    
    post: <T = any>(url: string, data: any) =>
      clientApi<T>(url, {
        method: "POST",
        body: JSON.stringify(data)
      }, client),
    
    put: <T = any>(url: string, data: any) =>
      clientApi<T>(url, {
        method: "PUT", 
        body: JSON.stringify(data)
      }, client),
    
    delete: <T = any>(url: string) =>
      clientApi<T>(url, { method: "DELETE" }, client)
  };
}