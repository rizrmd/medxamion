// Script to set up a new client
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

interface ClientSetupOptions {
  name: string;
  slug: string;
  subdomain?: string;
  domain?: string;
  adminUser: {
    name: string;
    email: string;
    username: string;
    password: string;
  };
}

export async function setupNewClient(options: ClientSetupOptions) {
  console.log(`Setting up new client: ${options.name}`);
  
  try {
    // 1. Create the client
    const client = await db.clients.create({
      data: {
        name: options.name,
        slug: options.slug,
        subdomain: options.subdomain,
        domain: options.domain,
        is_active: true,
        settings: {
          timezone: "Asia/Jakarta",
          language: "id",
          currency: "IDR"
        }
      }
    });
    
    console.log(`✅ Client created with ID: ${client.id}`);
    
    // 2. Create admin user for this tenant
    const hashedPassword = await bcrypt.hash(options.adminUser.password, 12);
    
    const adminUser = await db.users.create({
      data: {
        client_id: client.id,
        name: options.adminUser.name,
        email: options.adminUser.email,
        username: options.adminUser.username,
        password: hashedPassword,
        email_verified_at: new Date(),
        is_super_admin: false
      }
    });
    
    console.log(`✅ Admin user created: ${adminUser.username}`);
    
    // 3. Create default categories for this client
    const defaultCategories = [
      { name: "Kategori Umum", code: "general", type: "category" },
      { name: "Matematika", code: "math", type: "subject" },
      { name: "Bahasa Indonesia", code: "indonesian", type: "subject" },
      { name: "Bahasa Inggris", code: "english", type: "subject" }
    ];
    
    for (const category of defaultCategories) {
      await db.categories.create({
        data: {
          client_id: client.id,
          name: category.name,
          code: category.code,
          type: category.type
        }
      });
    }
    
    console.log(`✅ Default categories created`);
    
    // 4. Create a default group
    const defaultGroup = await db.groups.create({
      data: {
        client_id: client.id,
        name: "Grup Default",
        code: "default",
        description: "Grup default untuk peserta ujian"
      }
    });
    
    console.log(`✅ Default group created`);
    
    console.log(`\n🎉 Client setup complete!`);
    console.log(`\nClient Details:`);
    console.log(`- Name: ${client.name}`);
    console.log(`- Slug: ${client.slug}`);
    console.log(`- ID: ${client.id}`);
    if (client.subdomain) {
      console.log(`- Subdomain: ${client.subdomain}`);
    }
    console.log(`\nAdmin User:`);
    console.log(`- Username: ${adminUser.username}`);
    console.log(`- Email: ${adminUser.email}`);
    
    return {
      client,
      adminUser,
      defaultGroup
    };
    
  } catch (error) {
    console.error("❌ Failed to setup client:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log("Usage: bun run scripts/setup-client.ts <name> <slug> <admin-email> <admin-password> [subdomain]");
    process.exit(1);
  }
  
  const [name, slug, adminEmail, adminPassword, subdomain] = args;
  
  setupNewClient({
    name,
    slug,
    subdomain,
    adminUser: {
      name: "Administrator",
      email: adminEmail,
      username: adminEmail.split("@")[0],
      password: adminPassword
    }
  }).then(() => {
    console.log("Setup completed successfully!");
  }).catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
}