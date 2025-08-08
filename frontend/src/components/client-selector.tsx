import React, { useEffect, useState } from "react";
import { useClient } from "@/lib/client-context";
import { api } from "@/lib/api";

interface Client {
  id: number;
  name: string;
  slug: string;
  subdomain?: string;
}

export function ClientSelector() {
  const { client, setClient } = useClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadClients();
  }, []);
  
  const loadClients = async () => {
    try {
      const response = await api.client_list({});
      if (response.success && response.data) {
        setClients(response.data);
      }
    } catch (error) {
      console.error("Failed to load clients:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectClient = (selectedClient: Client) => {
    setClient({
      id: selectedClient.id,
      name: selectedClient.name,
      slug: selectedClient.slug,
      subdomain: selectedClient.subdomain
    });
    
    // Optionally redirect to client subdomain
    if (selectedClient.subdomain && window.location.hostname !== `${selectedClient.subdomain}.${window.location.hostname.split('.').slice(1).join('.')}`) {
      // window.location.href = `https://${selectedClient.subdomain}.${window.location.hostname.split('.').slice(1).join('.')}`;
    }
  };
  
  if (isLoading) {
    return <div className="p-4">Memuat...</div>;
  }
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Pilih Client</h3>
      
      {client && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            Client Aktif: <strong>{client.name}</strong>
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        {clients.map((clientItem) => (
          <button
            key={clientItem.id}
            onClick={() => handleSelectClient(clientItem)}
            className={`w-full text-left p-3 rounded border transition-colors ${
              client?.id === clientItem.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="font-medium">{clientItem.name}</div>
            <div className="text-sm text-gray-500">
              {clientItem.subdomain ? `${clientItem.subdomain}.domain.com` : clientItem.slug}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}