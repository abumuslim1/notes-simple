import { AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function TrialBanner() {
  const { data: license, isLoading } = trpc.license.getInfo.useQuery();

  if (isLoading || !license) {
    return null;
  }

  const isBlocked = license.isBlocked;
  const isActive = license.isActive;
  const trialDays = license.trialDaysRemaining;

  // Если лицензия активна, не показываем баннер
  if (isActive) {
    return null;
  }

  // Если сервис заблокирован
  if (isBlocked) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-900">
            ⚠️ Пробный период истек. Активируйте лицензию для продолжения работы.
          </p>
        </div>
      </div>
    );
  }

  // Если пробный период еще активен
  if (trialDays > 0) {
    const isWarning = trialDays <= 3;
    const bgColor = isWarning ? "bg-orange-50" : "bg-blue-50";
    const borderColor = isWarning ? "border-orange-200" : "border-blue-200";
    const textColor = isWarning ? "text-orange-900" : "text-blue-900";
    const iconColor = isWarning ? "text-orange-600" : "text-blue-600";

    return (
      <div className={`${bgColor} border-b ${borderColor} px-4 py-3 flex items-center gap-3`}>
        <AlertCircle className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${textColor}`}>
            ⏰ Пробный период: осталось <strong>{trialDays}</strong> {trialDays === 1 ? "день" : "дней"}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
