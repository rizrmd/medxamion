import { navigate } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, FileCheck, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            MedXamion
          </h1>
          <p className="text-xl text-gray-600">
            Sistem Ujian Medis Profesional
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Selamat Datang di MedXamion</CardTitle>
              <CardDescription className="text-lg">
                Platform ujian digital untuk pendidikan medis dengan fitur lengkap dan mudah digunakan
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Button size="lg" onClick={() => navigate("/auth/login")}>
                Login Peserta
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth/login?type=internal")}>
                Login Admin
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <BookOpen className="w-10 h-10 text-blue-600 mb-2" />
              <CardTitle>Bank Soal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Kelola ribuan soal dengan kategori dan tingkat kesulitan yang terstruktur
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-green-600 mb-2" />
              <CardTitle>Manajemen Peserta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Atur peserta ujian dalam grup dan monitor aktivitas mereka
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileCheck className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>Penilaian Otomatis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Sistem penilaian otomatis untuk soal pilihan ganda dengan hasil instan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-orange-600 mb-2" />
              <CardTitle>Analisis Hasil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Laporan komprehensif dengan statistik dan analisis performa peserta
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center text-gray-500">
          <p>&copy; 2024 MedXamion. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}