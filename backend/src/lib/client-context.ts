import type { Request } from "express";

export interface ClientContext {
  clientId: number;
  clientSlug: string;
  subdomain?: string;
}

export function getClientFromRequest(req: Request): ClientContext | null {
  const host = req.headers.host || "";
  const subdomain = host.split(".")[0];
  
  // Get client from subdomain or header
  const clientId = req.headers["x-client-id"];
  const clientSlug = req.headers["x-client-slug"] || subdomain;
  
  if (!clientId && !clientSlug) {
    return null;
  }
  
  return {
    clientId: clientId ? parseInt(clientId as string) : 0,
    clientSlug: clientSlug as string,
    subdomain: subdomain
  };
}

export function createClientFilter(clientId: number) {
  return { client_id: clientId };
}

export function addClientToData<T extends Record<string, any>>(data: T, clientId: number): T & { client_id: number } {
  return { ...data, client_id: clientId };
}