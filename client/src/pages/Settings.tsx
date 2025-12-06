import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function Settings() {
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading } = trpc.license.getSettings.useQuery();

  // Update settings mutation
  const updateSettingsMutation = trpc.license.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Настройки сохранены");
      setHasChanges(false);
      setIsSaving(false);
    },
    onError: () => {
      toast.error("Ошибка при сохранении настроек");
      setIsSaving(false);
    },
  });

  // Initialize form with fetched settings
  useEffect(() => {
    if (settings) {
      setAllowPublicRegistration(settings.allowPublicRegistration);
    }
  }, [settings]);

  const handleToggleRegistration = () => {
    setAllowPublicRegistration(!allowPublicRegistration);
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await updateSettingsMutation.mutateAsync({
      allowPublicRegistration,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Настройки</h1>
        </div>
        <p className="text-gray-600">Управление параметрами сервиса</p>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
        {/* Registration Settings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Регистрация пользователей</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900">Разрешить публичную регистрацию</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {allowPublicRegistration
                    ? "Пользователи могут самостоятельно создавать аккаунты"
                    : "Только администратор может создавать аккаунты"}
                </p>
              </div>
              <button
                onClick={handleToggleRegistration}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  allowPublicRegistration ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    allowPublicRegistration ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {allowPublicRegistration && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Любой пользователь может создать аккаунт через страницу регистрации
                </p>
              </div>
            )}

            {!allowPublicRegistration && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Новые пользователи могут быть созданы только администратором на странице "Пользователи"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-2 pt-6 border-t border-gray-200">
          <Button
            onClick={handleSaveSettings}
            disabled={!hasChanges || isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
          {hasChanges && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Есть несохраненные изменения
            </p>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-2xl">
        <h3 className="font-semibold text-blue-900 mb-2">Информация</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Эта страница доступна только администраторам</li>
          <li>• Изменения вступают в силу немедленно</li>
          <li>• Вы можете в любой момент изменить настройки регистрации</li>
        </ul>
      </div>
    </div>
  );
}
