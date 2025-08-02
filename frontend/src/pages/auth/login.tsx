import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";

interface LoginForm {
  username: string;
  password: string;
  userType: string;
}

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  
  const local = useLocal<{
    form: LoginForm;
    showError: boolean;
  }>({
    form: {
      username: "",
      password: "",
      userType: "taker"
    },
    showError: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    local.showError = false;

    try {
      await login(local.form.username, local.form.password, local.form.userType);
      
      // Redirect based on user type
      if (local.form.userType === "taker") {
        navigate("/exam");
      } else if (local.form.userType === "internal") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      local.showError = true;
    }
  };

  const userTypeOptions = [
    { value: "taker", label: "Peserta Ujian" },
    { value: "customer", label: "Pelanggan" },
    { value: "author", label: "Penulis" },
    { value: "internal", label: "Administrator" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Masuk</CardTitle>
          <p className="text-gray-600">Masukkan kredensial Anda untuk melanjutkan</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {local.showError && error && (
              <Alert variant="destructive">
                {error}
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="userType">Tipe Pengguna</Label>
              <Select 
                value={local.form.userType} 
                onValueChange={(value) => {
                  local.form.userType = value;
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe pengguna" />
                </SelectTrigger>
                <SelectContent>
                  {userTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username / Email</Label>
              <Input
                id="username"
                type="text"
                value={local.form.username}
                onChange={(e) => {
                  local.form.username = e.target.value;
                }}
                placeholder="Masukkan username atau email"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={local.form.password}
                onChange={(e) => {
                  local.form.password = e.target.value;
                }}
                placeholder="Masukkan password"
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          {local.form.userType === "taker" && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Peserta Ujian:</strong> Gunakan username dan password yang diberikan oleh administrator.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}