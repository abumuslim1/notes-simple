import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, Edit2, X, Check, Upload, File } from "lucide-react";
import { toast } from "sonner";

export default function TaskDetail() {
  const [, params] = useRoute("/task/:id");
  const [, setLocation] = useLocation();
  const taskId = params?.id ? parseInt(params.id) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: task, isLoading, error, refetch } = trpc.tasks.getTaskById.useQuery(
    { id: taskId! },
    { enabled: !!taskId }
  );

  const { data: column } = trpc.tasks.getColumns.useQuery(undefined, {
    enabled: !!task,
  });

  const { data: users = [] } = trpc.tasks.getUsers.useQuery();

  const deleteTaskMutation = trpc.tasks.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Задача удалена");
      setLocation("/tasks");
    },
    onError: () => toast.error("Ошибка удаления задачи"),
  });

  const updateTaskMutation = trpc.tasks.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Задача обновлена");
      setIsEditing(false);
      refetch();
    },
    onError: () => toast.error("Ошибка обновления задачи"),
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

  const currentColumn = column?.find((c: any) => c.id === task.columnId);

  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  const priorityLabels: Record<string, string> = {
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };

  const handleEdit = () => {
    setEditData({
      id: task.id,
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      assignedToUserId: task.assignedToUserId || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    // TODO: Implement file upload to S3
    // For now, just save task data
    updateTaskMutation.mutate({
      id: editData.id,
      title: editData.title,
      description: editData.description || undefined,
      priority: editData.priority,
      dueDate: editData.dueDate || undefined,
      assignedToUserId: editData.assignedToUserId ? parseInt(editData.assignedToUserId) : undefined,
    });
  };

  if (isEditing && editData) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Редактирование задачи</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Отмена
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateTaskMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                Сохранить
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Название</label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="Название задачи"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Описание</label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Описание задачи"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Приоритет</label>
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Крайний срок</label>
                <Input
                  type="date"
                  value={editData.dueDate}
                  onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Исполнитель</label>
              <select
                value={editData.assignedToUserId}
                onChange={(e) => setEditData({ ...editData, assignedToUserId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Не выбран</option>
                {users.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Файлы</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadedFiles(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-600">Нажмите для загружения файлов</p>
                  </div>
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Выбранные файлы:</p>
                  <ul className="space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
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
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {currentColumn && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Столбец</h2>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: currentColumn.color }}
                />
                <p className="text-gray-600 font-medium">{currentColumn.name}</p>
              </div>
            </div>
          )}

          {task.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Описание</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-6">
            {task.priority && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Приоритет</h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${priorityColors[task.priority] || "bg-gray-100 text-gray-800"}`}>
                  {priorityLabels[task.priority] || task.priority}
                </span>
              </div>
            )}

            {task.dueDate && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Крайний срок</h2>
                <p className="text-gray-600">{new Date(task.dueDate).toLocaleDateString("ru-RU")}</p>
              </div>
            )}
          </div>

          {(task as any).assignee && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Исполнитель</h2>
              <p className="text-gray-600">{(task as any).assignee.name || (task as any).assignee.username}</p>
            </div>
          )}
          {task.assignedToUserId && !(task as any).assignee && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Исполнитель</h2>
              <p className="text-gray-600">Пользователь #{task.assignedToUserId}</p>
            </div>
          )}

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
