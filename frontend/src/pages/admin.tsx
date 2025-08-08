import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, BarChart3, Settings, LogOut, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin, logout, initialized } = useAuth();
  const [stats, setStats] = useState<any>({
    statistics: {
      totalTakers: 0,
      totalQuestions: 0,
      activeExams: 0,
      todayResults: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialized && isAuthenticated() && isAdmin()) {
      fetchDashboardData();
    }
  }, [initialized]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.admin_dashboard();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  const menuItems = [
    {
      title: "Manajemen Client",
      description: "Kelola client dan pengaturan mereka",
      icon: Building2,
      href: "/admin/clients",
      color: "text-cyan-600"
    },
    {
      title: "Manajemen Peserta",
      description: "Kelola data peserta ujian",
      icon: Users,
      href: "/admin/takers",
      color: "text-blue-600"
    },
    {
      title: "Bank Soal",
      description: "Kelola soal-soal ujian",
      icon: BookOpen,
      href: "/admin/questions",
      color: "text-green-600"
    },
    {
      title: "Kategori Soal",
      description: "Kelola kategori soal",
      icon: BookOpen,
      href: "/admin/categories",
      color: "text-indigo-600"
    },
    {
      title: "Hasil Ujian",
      description: "Lihat dan analisis hasil ujian",
      icon: BarChart3,
      href: "/admin/results",
      color: "text-purple-600"
    },
    {
      title: "Pengaturan",
      description: "Konfigurasi sistem",
      icon: Settings,
      href: "/admin/settings",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Selamat datang, {user?.name || user?.username || 'Admin'}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Peserta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.statistics.totalTakers}</p>
              <p className="text-sm text-gray-600">Peserta terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Soal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.statistics.totalQuestions}</p>
              <p className="text-sm text-gray-600">Soal tersedia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ujian Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.statistics.activeExams}</p>
              <p className="text-sm text-gray-600">Sedang berlangsung</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Hasil Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.statistics.todayResults}</p>
              <p className="text-sm text-gray-600">Ujian selesai</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mb-4">Menu Utama</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {menuItems.map((item) => (
            <Card 
              key={item.href} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(item.href)}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}