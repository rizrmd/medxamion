import { crudHandler } from "@/lib/crud-handler";
import { getClientFromRequest } from "./client-context";

interface ClientCrudOptions {
  requireClient?: boolean;
  allowSuperAdmin?: boolean;
  softDelete?: {
    enabled: boolean;
    field: string;
    method: "null_is_available" | "boolean_flag";
  };
  primaryKey?: string;
  list?: { 
    prisma?: any; 
    transform?: (item: any) => any;
  };
  nested?: Record<string, {
    parentField: string;
    model: string;
  }>;
}

export function clientCrudHandler(modelName: string, options: ClientCrudOptions = {}) {
  return async function(this: any, arg: any) {
    const req = this.req!;
    const client = getClientFromRequest(req);
    
    // Check client requirements
    if (options.requireClient && !client?.clientId) {
      return {
        success: false,
        message: "Konteks client diperlukan",
        status: 400
      };
    }
    
    // Get user from token/session to check super admin status
    const isUserSuperAdmin = false; // TODO: Extract from auth context
    
    // Create base where condition with client filter
    const baseWhere = client?.clientId ? { client_id: client.clientId } : {};
    
    // Extend the original crud handler with client filtering
    const originalHandler = crudHandler(modelName, {
      ...options,
      list: {
        ...options.list,
        prisma: {
          ...options.list?.prisma,
          where: {
            ...options.list?.prisma?.where,
            ...baseWhere
          }
        }
      }
    });
    
    // For create/update operations, automatically add client_id
    if ((arg.action === "create" || arg.action === "update") && client?.clientId) {
      if (arg.data && typeof arg.data === "object") {
        arg.data.client_id = client.clientId;
      }
    }
    
    // For list/get operations, add client filter to where condition
    if (arg.action === "list" || arg.action === "get") {
      if (client?.clientId) {
        arg.where = {
          ...arg.where,
          ...baseWhere
        };
      }
    }
    
    // For delete operations, ensure we only delete within client scope
    if (arg.action === "delete" || arg.action === "bulkDelete") {
      if (client?.clientId) {
        arg.where = {
          ...arg.where,
          ...baseWhere
        };
      }
    }
    
    return originalHandler.call(this, arg);
  };
}