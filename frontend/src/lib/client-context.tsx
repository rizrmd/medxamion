import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export interface ClientInfo {
  id: number;
  name: string;
  slug: string;
  subdomain?: string;
  settings?: any;
}

interface ClientContextType {
  client: ClientInfo | null;
  setClient: (client: ClientInfo | null) => void;
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get client from subdomain or localStorage
    const detectClient = async () => {
      try {
        const hostname = window.location.hostname;
        const subdomain = hostname.split(".")[0];
        
        // Check if we have a subdomain (not localhost or main domain)
        if (subdomain && subdomain !== "localhost" && subdomain !== "www") {
          // Fetch client info by subdomain
          const response = await fetch(`/api/client/by-subdomain/${subdomain}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setClient(data.data);
              localStorage.setItem("client", JSON.stringify(data.data));
            }
          }
        } else {
          // Check localStorage for client
          const storedClient = localStorage.getItem("client");
          if (storedClient) {
            setClient(JSON.parse(storedClient));
          }
        }
      } catch (error) {
        console.error("Failed to detect client:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    detectClient();
  }, []);
  
  const contextValue: ClientContextType = {
    client,
    setClient: (newClient) => {
      setClient(newClient);
      if (newClient) {
        localStorage.setItem("client", JSON.stringify(newClient));
      } else {
        localStorage.removeItem("client");
      }
    },
    isLoading
  };
  
  return (
    <ClientContext.Provider value={contextValue}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
}

// Helper to add client headers to API calls
export function getClientHeaders(client: ClientInfo | null) {
  if (!client) return {};
  
  return {
    "X-Client-Id": client.id.toString(),
    "X-Client-Slug": client.slug
  };
}