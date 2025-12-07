import { useRoute, useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Calendar, Flag } from "lucide-react";
import { toast } from "sonner";

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export default function TaskDetail() {
  const [match, params] = useRoute("/task/:id");
  const [, setLocation] = useRouter() as any;
  const taskId = match && params?.id ? parseInt(params.id) : null;

  const { data: task, isLoading } = trpc.tasks.getTaskById.useQuery(
    { id: taskId! },
    { enabled: !!taskId }
  );

  const deleteTaskMutation = trpc.tasks.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Задача удалена");
      setLocation("/tasks");
    },
    onError: () => toast.error("Ошибка удаления задачи"),
  });

  if (!taskId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Задача не найдена</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Задача не найдена</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/tasks")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Задача</h1>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteTaskMutation.mutate({ id: task.id })}
          disabled={deleteTaskMutation.isPending}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Удалить
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {task.title}
            </h2>
            <div className="flex items-center gap-2">
              {task.priority && (
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${
                    PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]
                  }`}
                >
                  <Flag className="w-3 h-3 inline mr-1" />
                  {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Описание
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Крайний срок
              </h3>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                {new Date(task.dueDate).toLocaleString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Теги</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Создана</p>
                <p className="text-gray-900 font-medium">
                  {new Date(task.createdAt).toLocaleString("ru-RU")}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Обновлена</p>
                <p className="text-gray-900 font-medium">
                  {new Date(task.updatedAt).toLocaleString("ru-RU")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
