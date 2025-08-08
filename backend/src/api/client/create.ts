import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "client_create",
  url: "/api/client/create",
  async handler(arg: {
    name: string;
    slug: string;
    domain?: string;
    subdomain?: string;
    settings?: any;
  }) {
    // Check if slug or subdomain already exists
    const existing = await db.clients.findFirst({
      where: {
        OR: [
          { slug: arg.slug },
          ...(arg.subdomain ? [{ subdomain: arg.subdomain }] : [])
        ]
      }
    });
    
    if (existing) {
      return {
        success: false,
        message: "Client dengan slug atau subdomain tersebut sudah ada"
      };
    }
    
    const client = await db.clients.create({
      data: {
        name: arg.name,
        slug: arg.slug,
        domain: arg.domain,
        subdomain: arg.subdomain,
        settings: arg.settings || {},
        is_active: true
      }
    });
    
    return {
      success: true,
      data: client,
      message: "Client berhasil dibuat"
    };
  }
});