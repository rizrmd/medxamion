import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "admin_settings",
  url: "/api/admin/settings",
  async handler(arg: {
    action?: string;
    settings?: {
      siteName?: string;
      siteDescription?: string;
      passingScore?: number;
      maxAttempts?: number;
      examDuration?: number;
      showResultsImmediately?: boolean;
      allowReview?: boolean;
      emailNotifications?: boolean;
      maintenanceMode?: boolean;
    }
  }) {
    try {
      const req = this.req!;
      const action = arg.action || 'get';
      
      // Check admin authentication
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return {
          success: false,
          message: "Unauthorized",
          status: 401
        };
      }
      
      // TODO: Verify admin token
      
      switch (action) {
        case 'get':
          // Get all settings
          const settings = await db.settings.findMany({
            select: {
              key: true,
              value: true,
              type: true
            }
          });
          
          // Convert to object format
          const settingsObj: any = {};
          for (const setting of settings) {
            const value = setting.value;
            
            // Parse value based on type
            if (setting.type === 'boolean') {
              settingsObj[setting.key] = value === 'true';
            } else if (setting.type === 'number') {
              settingsObj[setting.key] = parseInt(value);
            } else {
              settingsObj[setting.key] = value;
            }
          }
          
          // Return with defaults if not set
          return {
            success: true,
            data: {
              siteName: settingsObj.siteName || 'MedXamion',
              siteDescription: settingsObj.siteDescription || 'Sistem Ujian Medis Profesional',
              passingScore: settingsObj.passingScore || 70,
              maxAttempts: settingsObj.maxAttempts || 3,
              examDuration: settingsObj.examDuration || 120,
              showResultsImmediately: settingsObj.showResultsImmediately ?? true,
              allowReview: settingsObj.allowReview ?? false,
              emailNotifications: settingsObj.emailNotifications ?? true,
              maintenanceMode: settingsObj.maintenanceMode ?? false
            }
          };
          
        case 'update':
          if (!arg.settings) {
            return {
              success: false,
              message: "Settings data is required"
            };
          }
          
          // Update each setting
          const updates = [];
          for (const [key, value] of Object.entries(arg.settings)) {
            let type = 'string';
            let stringValue = String(value);
            
            if (typeof value === 'boolean') {
              type = 'boolean';
            } else if (typeof value === 'number') {
              type = 'number';
            }
            
            updates.push(
              db.settings.upsert({
                where: { key },
                create: {
                  key,
                  value: stringValue,
                  type,
                  description: `${key} setting`
                },
                update: {
                  value: stringValue,
                  type
                }
              })
            );
          }
          
          await Promise.all(updates);
          
          return {
            success: true,
            message: "Pengaturan berhasil disimpan"
          };
          
        default:
          return {
            success: false,
            message: "Invalid action"
          };
      }
    } catch (error) {
      console.error("Settings error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan server"
      };
    }
  }
});