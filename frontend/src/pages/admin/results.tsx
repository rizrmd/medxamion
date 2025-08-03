import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Eye, Calendar, Filter, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocal } from "@/lib/hooks/use-local";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/gen/api";
import { useEffect } from "react";
import { toast } from "sonner";

interface ExamResult {
  id: number;
  exam_id: number;
  exam_name?: string;
  taker_id: number;
  taker_name?: string;
  taker_reg?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  duration: number;
  status: string;
  started_at: string;
  finished_at?: string;
  created_at: string;
}

export default function AdminResultsPage() {
  const { user, isAuthenticated, isAdmin, initialized } = useAuth();
  
  const local = useLocal({
    searchQuery: "",
    selectedExam: "all",
    dateFilter: "all",
    results: [] as ExamResult[],
    loading: false,
    stats: {
      totalExams: 0,
      averageScore: 0,
      passingRate: 0,
      activeTakers: 0
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    }
  });

  const loadResults = async () => {
    try {
      local.loading = true;
      local.render();

      // Will use api.admin_exam_results once generated
      // const response = await api.admin_exam_results({
      //   action: "list",
      //   page: local.pagination.page,
      //   limit: local.pagination.limit,
      //   ...(local.selectedExam !== "all" && { exam_id: parseInt(local.selectedExam) }),
      //   ...(local.dateFilter !== "all" && { date_filter: local.dateFilter }),
      //   ...(local.searchQuery && { search: local.searchQuery })
      // });

      // Mock data for now
      local.results = [];
      local.pagination.total = 0;
      
    } catch (error) {
      console.error("Failed to load results:", error);
      toast.error("Gagal memuat hasil ujian");
    } finally {
      local.loading = false;
      local.render();
    }
  };

  const loadStatistics = async () => {
    try {
      // Will use api.admin_exam_results once generated
      // const response = await api.admin_exam_results({
      //   action: "statistics"
      // });
      
      // Mock data for now
      local.stats = {
        totalExams: 0,
        averageScore: 0,
        passingRate: 0,
        activeTakers: 0
      };
      local.render();
    } catch (error) {
      console.error("Failed to load statistics:", error);
    }
  };

  useEffect(() => {
    if (initialized && isAuthenticated() && isAdmin()) {
      loadResults();
      loadStatistics();
    }
  }, [initialized]);

  const handleExport = async () => {
    try {
      // Will implement export functionality
      toast.info("Fitur export akan segera tersedia");
    } catch (error) {
      toast.error("Gagal mengekspor data");
    }
  };

  const handleViewDetail = (resultId: number) => {
    navigate(`/admin/results/${resultId}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Hasil Ujian</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Ujian</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{local.stats.totalExams}</p>
              <p className="text-xs text-gray-600">Selesai hari ini</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rata-rata Nilai</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{local.stats.averageScore}</p>
              <p className="text-xs text-gray-600">Dari semua ujian</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tingkat Kelulusan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{local.stats.passingRate}%</p>
              <p className="text-xs text-gray-600">Nilai ≥ 70</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Peserta Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{local.stats.activeTakers}</p>
              <p className="text-xs text-gray-600">Sedang ujian</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Daftar Hasil Ujian</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadResults}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Cari peserta atau ujian..."
                  value={local.searchQuery}
                  onChange={(e) => {
                    local.searchQuery = e.target.value;
                    local.render();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadResults();
                    }
                  }}
                />
              </div>
              <Select value={local.selectedExam} onValueChange={(value) => {
                local.selectedExam = value;
                local.render();
                loadResults();
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Semua Ujian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Ujian</SelectItem>
                  {/* Will populate from exams list */}
                </SelectContent>
              </Select>
              <Select value={local.dateFilter} onValueChange={(value) => {
                local.dateFilter = value;
                local.render();
                loadResults();
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Semua Waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Waktu</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">Minggu Ini</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peserta</TableHead>
                    <TableHead>No. Registrasi</TableHead>
                    <TableHead>Ujian</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {local.loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : local.results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        Belum ada hasil ujian
                      </TableCell>
                    </TableRow>
                  ) : (
                    local.results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.taker_name}</TableCell>
                        <TableCell>{result.taker_reg}</TableCell>
                        <TableCell>{result.exam_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(result.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </TableCell>
                        <TableCell>{result.duration} menit</TableCell>
                        <TableCell>
                          <span className={`font-bold ${
                            result.score >= 70 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.score}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            result.score >= 70 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.score >= 70 ? 'Lulus' : 'Tidak Lulus'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetail(result.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}