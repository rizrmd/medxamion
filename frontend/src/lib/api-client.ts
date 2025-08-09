import { getClientHeaders } from "./client-context";
import type { ClientInfo } from "./client-context";

// Wrapper for API calls with client context
export async function clientApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
  client: ClientInfo | null = null
): Promise<T> {
  const clientHeaders = getClientHeaders(client);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(clientHeaders && Object.fromEntries(
      Object.entries(clientHeaders).filter(([_, value]) => value !== undefined)
    )),
    ...(options.headers && Object.fromEntries(
      Object.entries(options.headers as Record<string, string>).filter(([_, value]) => value !== undefined)
    ))
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
export function createClientApiClient(client: ClientInfo | null) {
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