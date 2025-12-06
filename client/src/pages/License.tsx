import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Copy, Check, AlertCircle, CheckCircle2 } from "lucide-react";

export default function License() {
  const [copied, setCopied] = useState(false);
  const licenseQuery = trpc.license.getInfo.useQuery();
  const activateMutation = trpc.license.activate.useMutation();
  const [licenseKey, setLicenseKey] = useState("");
  const [activationError, setActivationError] = useState("");

  const handleCopyServerId = () => {
    if (licenseQuery.data?.serverId) {
      navigator.clipboard.writeText(licenseQuery.data.serverId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setActivationError("Пожалуйста, введите лицензионный ключ");
      return;
    }

    setActivationError("");
    const result = await activateMutation.mutateAsync({ key: licenseKey });

    if (result.success) {
      setLicenseKey("");
      await licenseQuery.refetch();
    } else {
      setActivationError(result.message);
    }
  };

  if (licenseQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка информации о лицензии...</p>
        </div>
      </div>
    );
  }

  const license = licenseQuery.data;
  if (!license) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Ошибка загрузки информации о лицензии</p>
      </div>
    );
  }

  const isBlocked = license.isBlocked;
  const isActive = license.isActive;
  const trialDays = license.trialDaysRemaining;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Лицензирование</h1>
          <p className="text-muted-foreground">Управление лицензией вашего сервиса</p>
        </div>

        {/* Status Alert */}
        {isBlocked && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Сервис заблокирован</h3>
              <p className="text-sm text-red-700 mt-1">
                Пробный период истек. Пожалуйста, активируйте лицензию для продолжения работы.
              </p>
            </div>
          </div>
        )}

        {isActive && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Лицензия активна</h3>
              <p className="text-sm text-green-700 mt-1">
                Владелец: <strong>{license.ownerName}</strong>
              </p>
              {license.expiresAt && (
                <p className="text-sm text-green-700">
                  Действительна до: <strong>{new Date(license.expiresAt).toLocaleDateString("ru-RU")}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {!isActive && !isBlocked && trialDays > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Пробный период</h3>
              <p className="text-sm text-blue-700 mt-1">
                Осталось дней: <strong>{trialDays}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Server ID Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ID вашего сервиса</h2>
          <p className="text-sm text-gray-600 mb-4">
            Отправьте этот ID разработчику для получения лицензионного ключа
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={license.serverId}
              readOnly
              className="flex-1 bg-gray-50 border border-gray-300 rounded p-3 font-mono text-sm text-gray-900"
              style={{ wordBreak: "break-all" }}
            />
            <Button
              onClick={handleCopyServerId}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Activation Section */}
        {!isActive && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Активировать лицензию</h2>
            <p className="text-sm text-gray-600 mb-4">
              Введите лицензионный ключ, полученный от разработчика
            </p>

            {activationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {activationError}
              </div>
            )}

            <div className="space-y-3">
              <textarea
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Вставьте лицензионный ключ здесь..."
                className="w-full border border-gray-300 rounded p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <Button
                onClick={handleActivate}
                disabled={activateMutation.isPending || !licenseKey.trim()}
                className="w-full"
              >
                {activateMutation.isPending ? "Активирование..." : "Активировать лицензию"}
              </Button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Как это работает:</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>1.</strong> Скопируйте ID вашего сервиса выше
            </li>
            <li>
              <strong>2.</strong> Отправьте ID разработчику
            </li>
            <li>
              <strong>3.</strong> Получите лицензионный ключ
            </li>
            <li>
              <strong>4.</strong> Вставьте ключ в поле выше и активируйте
            </li>
            <li>
              <strong>5.</strong> Лицензия активирована и будет действовать до указанной даты
            </li>
          </ol>
        </div>

        {/* Version and Author Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Информация о сервисе</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Сервис:</strong> Notes Service
            </p>
            <p>
              <strong>Версия:</strong> 1.0.0
            </p>
            <p>
              <strong>Разработчик:</strong> <a href="https://abumuslim.ru" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">abumuslim.ru</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
