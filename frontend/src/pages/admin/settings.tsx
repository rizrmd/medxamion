import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocal } from "@/lib/hooks/use-local";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { user, isAuthenticated, isAdmin, initialized } = useAuth();
  
  const local = useLocal({
    settings: {
      siteName: "MedXamion",
      siteDescription: "Sistem Ujian Medis Profesional",
      passingScore: 70,
      maxAttempts: 3,
      examDuration: 120,
      showResultsImmediately: true,
      allowReview: false,
      emailNotifications: true,
      maintenanceMode: false
    }
  });

  // Show loading while auth is initializing
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated() || !isAdmin()) {
    navigate("/auth/login?type=internal");
    return null;
  }

  const handleSave = () => {
    // TODO: Save settings to backend
    toast.success("Pengaturan berhasil disimpan");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
              <CardDescription>Konfigurasi dasar sistem ujian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Nama Situs</Label>
                <Input
                  id="siteName"
                  value={local.settings.siteName}
                  onChange={(e) => {
                    local.settings.siteName = e.target.value;
                    local.render();
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Deskripsi Situs</Label>
                <Textarea
                  id="siteDescription"
                  value={local.settings.siteDescription}
                  onChange={(e) => {
                    local.settings.siteDescription = e.target.value;
                    local.render();
                  }}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Exam Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Ujian</CardTitle>
              <CardDescription>Konfigurasi parameter ujian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Nilai Kelulusan</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    value={local.settings.passingScore}
                    onChange={(e) => {
                      local.settings.passingScore = parseInt(e.target.value) || 0;
                      local.render();
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Maksimal Percobaan</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min="1"
                    value={local.settings.maxAttempts}
                    onChange={(e) => {
                      local.settings.maxAttempts = parseInt(e.target.value) || 1;
                      local.render();
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="examDuration">Durasi Ujian (menit)</Label>
                  <Input
                    id="examDuration"
                    type="number"
                    min="1"
                    value={local.settings.examDuration}
                    onChange={(e) => {
                      local.settings.examDuration = parseInt(e.target.value) || 1;
                      local.render();
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tampilkan Hasil Langsung</Label>
                    <p className="text-sm text-gray-600">Peserta dapat melihat nilai setelah selesai ujian</p>
                  </div>
                  <Switch
                    checked={local.settings.showResultsImmediately}
                    onCheckedChange={(checked) => {
                      local.settings.showResultsImmediately = checked;
                      local.render();
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Izinkan Review Jawaban</Label>
                    <p className="text-sm text-gray-600">Peserta dapat melihat jawaban yang benar</p>
                  </div>
                  <Switch
                    checked={local.settings.allowReview}
                    onCheckedChange={(checked) => {
                      local.settings.allowReview = checked;
                      local.render();
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Sistem</CardTitle>
              <CardDescription>Konfigurasi sistem dan notifikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi Email</Label>
                  <p className="text-sm text-gray-600">Kirim email untuk aktivitas penting</p>
                </div>
                <Switch
                  checked={local.settings.emailNotifications}
                  onCheckedChange={(checked) => {
                    local.settings.emailNotifications = checked;
                    local.render();
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode Pemeliharaan</Label>
                  <p className="text-sm text-gray-600">Nonaktifkan akses untuk peserta ujian</p>
                </div>
                <Switch
                  checked={local.settings.maintenanceMode}
                  onCheckedChange={(checked) => {
                    local.settings.maintenanceMode = checked;
                    local.render();
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Simpan Pengaturan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}