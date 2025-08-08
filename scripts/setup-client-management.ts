import { PrismaClient } from '../shared/models';
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function setupClientManagement() {
  try {
    console.log("Setting up client management roles and permissions...");

    // 0. Create sample clients for testing
    const defaultClient = await db.clients.upsert({
      where: { slug: 'default' },
      update: {},
      create: {
        name: 'Default Client',
        slug: 'default',
        is_active: true
      }
    });

    await db.clients.upsert({
      where: { slug: 'medxamion' },
      update: {},
      create: {
        name: 'PT Medxamion Indonesia',
        slug: 'medxamion',
        domain: 'medxamion.com',
        is_active: true
      }
    });

    await db.clients.upsert({
      where: { slug: 'siloam' },
      update: {},
      create: {
        name: 'RS Siloam',
        slug: 'siloam',
        domain: 'siloam.co.id',
        is_active: true
      }
    });

    await db.clients.upsert({
      where: { slug: 'rscm' },
      update: {},
      create: {
        name: 'RSCM Jakarta',
        slug: 'rscm',
        domain: 'rscm.co.id',
        is_active: true
      }
    });

    console.log("✓ Created sample clients");

    // 1. Create permissions for client management
    let clientViewPermission = await db.permissions.findFirst({
      where: { slug: 'client-view' }
    });

    if (!clientViewPermission) {
      clientViewPermission = await db.permissions.create({
        data: {
          name: 'Lihat Client',
          slug: 'client-view',
          description: 'Dapat melihat daftar client',
          model: 'clients'
        }
      });
    }

    let clientManagePermission = await db.permissions.findFirst({
      where: { slug: 'client-manage' }
    });

    if (!clientManagePermission) {
      clientManagePermission = await db.permissions.create({
        data: {
          name: 'Kelola Client',
          slug: 'client-manage',
          description: 'Dapat membuat, mengedit, dan menghapus client',
          model: 'clients'
        }
      });
    }

    console.log("✓ Created client permissions");

    // 2. Create internal role for client management
    let clientManagerRole = await db.roles.findFirst({
      where: { slug: 'client-manager' }
    });

    if (!clientManagerRole) {
      clientManagerRole = await db.roles.create({
        data: {
          name: 'Client Manager',
          slug: 'client-manager',
          description: 'Role untuk mengelola client'
        }
      });
    }

    console.log("✓ Created client manager role");

    // 3. Assign permissions to role
    const existingViewPermRole = await db.permission_role.findFirst({
      where: {
        permission_id: clientViewPermission.id,
        role_id: clientManagerRole.id
      }
    });

    if (!existingViewPermRole) {
      await db.permission_role.create({
        data: {
          permission_id: clientViewPermission.id,
          role_id: clientManagerRole.id,
          granted: true
        }
      });
    }

    const existingManagePermRole = await db.permission_role.findFirst({
      where: {
        permission_id: clientManagePermission.id,
        role_id: clientManagerRole.id
      }
    });

    if (!existingManagePermRole) {
      await db.permission_role.create({
        data: {
          permission_id: clientManagePermission.id,
          role_id: clientManagerRole.id,
          granted: true
        }
      });
    }

    console.log("✓ Assigned permissions to client manager role");

    // 4. Create internal user for client management
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    let clientManagerUser = await db.users.findFirst({
      where: {
        username: 'client-manager'
      }
    });

    if (!clientManagerUser) {
      clientManagerUser = await db.users.create({
        data: {
          name: 'Client Manager',
          username: 'client-manager',
          email: 'client-manager@medxamion.com',
          password: hashedPassword,
          email_verified_at: new Date()
        }
      });
    }

    console.log("✓ Created client manager user");

    // 5. Assign role to user
    const existingRoleUser = await db.role_user.findFirst({
      where: {
        role_id: clientManagerRole.id,
        user_id: clientManagerUser.id
      }
    });

    if (!existingRoleUser) {
      await db.role_user.create({
        data: {
          role_id: clientManagerRole.id,
          user_id: clientManagerUser.id,
          granted: true
        }
      });
    }

    console.log("✓ Assigned client manager role to user");

    console.log("\n=== Setup Complete ===");
    console.log("Client Manager User Created:");
    console.log(`Username: client-manager`);
    console.log(`Email: client-manager@medxamion.com`);
    console.log(`Password: admin123`);
    console.log("\nThis user can now login and manage clients.");

  } catch (error) {
    console.error("Error setting up client management:", error);
  } finally {
    await db.$disconnect();
  }
}

setupClientManagement();