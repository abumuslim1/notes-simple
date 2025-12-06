import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Crown } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function Register() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: licenseSettings } = trpc.license.getSettings.useQuery();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      // If this is the first user (admin), show special message
      if (data.role === "admin") {
        setIsFirstAdmin(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    },
    onError: (err) => {
      setError(err.message || "Registration failed");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    if (password.length < 6) {
      setError("Пароль должен состоять из не менее 6 символов");
      setIsLoading(false);
      return;
    }

    try {
      await registerMutation.mutateAsync({ username, password, name });
    } catch (err) {
      setError("Ошибка регистрации. Попытайте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  // If public registration is disabled, show message
  if (licenseSettings && !licenseSettings.allowPublicRegistration) {
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
              <span className="text-sm">Регистрация отключена администратором. Пожалуйста, свяжитесь с администратором для создания аккаунта.</span>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Notes Service</CardTitle>
          <CardDescription className="text-center">Создать новый аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && isFirstAdmin && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                <Crown className="w-4 h-4" />
                <div className="text-sm">
                  <p className="font-semibold">Поздравляем! Вы администратор</p>
                  <p className="text-xs">Вам доступны пункты "Лицензии" и "Пользователи"</p>
                </div>
              </div>
            )}

            {success && !isFirstAdmin && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Аккаунт успешно создан! Перенаправление...</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Полное имя
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Введите ваше полное имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Логин
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Выберите логин (3+ символов)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                minLength={3}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль (6+ символов)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                minLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !username || !password || !name}
            >
              {isLoading ? "Создание аккаунта..." : "Создать аккаунт"}
            </Button>
          </form>

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
