import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function Register() {
  const [, navigate] = useLocation();
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Notes Service</CardTitle>
          <CardDescription className="text-center">Регистрация</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Регистрация отключена. Пожалуйста, свяжитесь с администратором для создания аккаунта.</span>
          </div>
          <div className="mt-4 text-center text-sm">
            Уже есть аккаунт?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:underline font-medium"
            >
              Войти
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
