import { defineAPI } from "rlib/server";
import { getClientFromRequest, createClientFilter, addClientToData } from "./client-context";
import type { ClientContext } from "./client-context";

interface ClientAPIOptions {
  requireClient?: boolean;
  superAdminOnly?: boolean;
}

export function defineClientAPI<T, R>(config: {
  name: string;
  url: string;
  handler: (this: { req?: any; client?: ClientContext | null }, arg: T) => Promise<R>;
  options?: ClientAPIOptions;
}) {
  return defineAPI({
    name: config.name,
    url: config.url,
    async handler(arg: T) {
      const req = this.req!;
      const client = getClientFromRequest(req);
      
      // Check if client is required
      if (config.options?.requireClient && !client?.clientId) {
        throw new Error("Client context required");
      }
      
      // Set client context on handler
      const context = { req, client };
      
      return await config.handler.call(context, arg);
    }
  });
}

// Helper for client-scoped database queries
export async function clientQuery<T>(
  clientId: number,
  queryFn: (filter: { client_id: number }) => Promise<T>
): Promise<T> {
  const filter = createClientFilter(clientId);
  return await queryFn(filter);
}

// Helper for client-scoped create operations
export function clientCreate<T extends Record<string, any>>(
  clientId: number,
  data: T
): T & { client_id: number } {
  return addClientToData(data, clientId);
}