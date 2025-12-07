import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TaskDetail() {
  const [, params] = useRoute("/task/:id");
  const [, setLocation] = useLocation();
  const taskId = params?.id ? parseInt(params.id) : null;

  const { data: task, isLoading, error } = trpc.tasks.getTaskById.useQuery(
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

  if (error || !task) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Ошибка загрузки задачи</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/tasks")}
              className="p-0 h-auto"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteTaskMutation.mutate({ id: task.id })}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {task.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Описание</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-6">
            {task.dueDate && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Крайний срок</h2>
                <p className="text-gray-600">{new Date(task.dueDate).toLocaleDateString("ru-RU")}</p>
              </div>
            )}

            {task.assignedToUserId && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Исполнитель</h2>
                <p className="text-gray-600">Пользователь #{task.assignedToUserId}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-6 text-xs text-gray-500">
            <p>Создано: {new Date(task.createdAt).toLocaleString("ru-RU")}</p>
            {task.updatedAt && (
              <p>Обновлено: {new Date(task.updatedAt).toLocaleString("ru-RU")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
