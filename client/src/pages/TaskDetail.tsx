import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, Edit2, X, Check, Upload, File, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/RichTextEditor";

export default function TaskDetail() {
  const [, params] = useRoute("/task/:id");
  const [, setLocation] = useLocation();
  const taskId = params?.id ? parseInt(params.id) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [showStatusHistory, setShowStatusHistory] = useState(false);

  const { data: task, isLoading, error, refetch } = trpc.tasks.getTaskById.useQuery(
    { id: taskId! },
    { enabled: !!taskId }
  );

  const { data: column } = trpc.tasks.getColumns.useQuery(undefined, {
    enabled: !!task,
  });

  const { data: users = [] } = trpc.tasks.getUsers.useQuery();

  const { data: comments = [] } = trpc.tasks.getComments.useQuery(
    { taskId: taskId! },
    { enabled: !!taskId }
  );

  const { data: statusHistory = [] } = trpc.tasks.getTaskStatusHistory.useQuery(
    { taskId: taskId! },
    { enabled: !!taskId }
  );
  
  // Fetch comment files for each comment
  const [commentFilesMap, setCommentFilesMap] = useState<Record<number, any[]>>({});
  
  useEffect(() => {
    if (comments.length > 0) {
      const fetchFiles = async () => {
        const filesMap: Record<number, any[]> = {};
        for (const comment of comments) {
          try {
            const files = await utils.tasks.getCommentFiles.fetch({ commentId: (comment as any).id });
            filesMap[(comment as any).id] = files;
          } catch (error) {
            console.error('Error fetching comment files:', error);
            filesMap[(comment as any).id] = [];
          }
        }
        setCommentFilesMap(filesMap);
      };
      fetchFiles();
    }
  }, [comments]);

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

  const updateTaskStatusMutation = trpc.tasks.updateTaskStatus.useMutation({
    onSuccess: () => {
      toast.success("Статус задачи обновлен");
      refetch();
    },
    onError: () => toast.error("Ошибка обновления статуса"),
  });

  const utils = trpc.useUtils();
  
  const addCommentMutation = trpc.tasks.addComment.useMutation({
    onMutate: async (newComment) => {
      // Cancel outgoing refetches
      await utils.tasks.getComments.cancel({ taskId: taskId! });
      
      // Snapshot previous value
      const previousComments = utils.tasks.getComments.getData({ taskId: taskId! });
      
      // Optimistically update to the new value
      const now = new Date();
      const optimisticComment = {
        id: Date.now(), // temporary ID
        taskId: taskId!,
        userId: 0, // will be filled by server
        content: newComment.content,
        createdAt: now,
        updatedAt: now,
        author: { id: 0, name: "Вы", username: "" },
      };
      
      utils.tasks.getComments.setData(
        { taskId: taskId! },
        (old) => old ? [optimisticComment, ...old] : [optimisticComment]
      );
      
      return { previousComments };
    },
    onSuccess: () => {
      setCommentText("");
      toast.success("Комментарий добавлен");
      // Refetch to get the real data from server
      utils.tasks.getComments.invalidate({ taskId: taskId! });
    },
    onError: (error, newComment, context) => {
      // Rollback on error
      if (context?.previousComments) {
        utils.tasks.getComments.setData({ taskId: taskId! }, context.previousComments);
      }
      console.error("Error adding comment:", error);
      toast.error("Ошибка добавления комментария");
    },
  });

  const deleteCommentMutation = trpc.tasks.deleteComment.useMutation({
    onSuccess: () => {
      toast.success("Комментарий удален");
      const utils = trpc.useUtils();
      utils.tasks.getComments.invalidate({ taskId: taskId! });
    },
    onError: () => toast.error("Ошибка удаления комментария"),
  });

  const deleteCommentFileMutation = trpc.tasks.deleteCommentFile.useMutation({
    onSuccess: () => {
      toast.success("Файл удален");
      // Refetch comment files
      if (comments.length > 0) {
        const fetchFiles = async () => {
          const filesMap: Record<number, any[]> = {};
          for (const comment of comments) {
            try {
              const files = await utils.tasks.getCommentFiles.fetch({ commentId: (comment as any).id });
              filesMap[(comment as any).id] = files;
            } catch (error) {
              filesMap[(comment as any).id] = [];
            }
          }
          setCommentFilesMap(filesMap);
        };
        fetchFiles();
      }
    },
    onError: () => toast.error("Ошибка удаления файла"),
  });

  const deleteTaskFileMutation = trpc.tasks.deleteTaskFile.useMutation({
    onSuccess: () => {
      toast.success("Файл удален");
      refetch();
    },
    onError: () => toast.error("Ошибка удаления файла"),
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
    updateTaskMutation.mutate({
      id: editData.id,
      title: editData.title,
      description: editData.description || undefined,
      priority: editData.priority,
      dueDate: editData.dueDate || undefined,
      assignedToUserId: editData.assignedToUserId ? parseInt(editData.assignedToUserId) : undefined,
    }, {
      onSuccess: async () => {
        if (uploadedFiles.length > 0) {
          try {
            for (const file of uploadedFiles) {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('taskId', editData.id.toString());
              const response = await fetch('/api/upload-task-file', {
                method: 'POST',
                body: formData,
              });
              if (!response.ok) throw new Error('Failed to upload file');
            }
            setUploadedFiles([]);
            refetch();
          } catch (error) {
            console.error('Error uploading files:', error);
            toast.error('Ошибка при загрузке файлов');
          }
        }
      }
    });
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    // First, add the comment
    addCommentMutation.mutate({
      taskId: taskId!,
      content: commentText,
    }, {
      onSuccess: async (newComment) => {
        // Then upload files if any
        if (commentFiles.length > 0) {
          try {
            for (const file of commentFiles) {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('commentId', newComment.id.toString());
              
              // Upload file to server
              const response = await fetch('/api/upload-comment-file', {
                method: 'POST',
                body: formData,
              });
              
              if (!response.ok) {
                throw new Error('File upload failed');
              }
            }
            setCommentFiles([]);
          } catch (error) {
            console.error('Error uploading files:', error);
            toast.error('Ошибка загрузки файлов');
          }
        }
      }
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
              <RichTextEditor
                value={editData.description || ""}
                onChange={(content) => setEditData({ ...editData, description: content })}
                placeholder="Описание задачи"
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
            <input
              type="checkbox"
              checked={(task as any).status === "completed"}
              onChange={(e) => {
                updateTaskStatusMutation.mutate({
                  id: task.id,
                  status: (task as any).status === "completed" ? "pending" : "completed",
                });
              }}
              className="w-5 h-5 cursor-pointer"
            />
            <h1 className={`text-2xl font-bold ${
              (task as any).status === "completed"
                ? "text-gray-400 line-through"
                : "text-gray-900"
            }`}>{task.title}</h1>
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
              <div 
                className="text-gray-600 prose prose-sm max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:my-1 [&_p]:my-1 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:my-1 [&_strong]:font-bold [&_em]:italic [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
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

          {(task as any).attachments && (task as any).attachments.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Файлы</h2>
              <ul className="space-y-2">
                {(task as any).attachments.map((file: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <File className="w-4 h-4 text-gray-400" />
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex-1 truncate">
                      {file.name || "Файл"}
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => deleteTaskFileMutation.mutate({ id: file.id })}
                      disabled={deleteTaskFileMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-700">Комментарии ({comments.length})</h2>
            </div>

            {/* Add Comment Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Добавить комментарий..."
                rows={3}
                className="mb-3"
              />
              
              {/* File Upload for Comments */}
              <div className="mb-3">
                <input
                  type="file"
                  id="comment-file-upload"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setCommentFiles(prev => [...prev, ...files]);
                  }}
                />
                <label
                  htmlFor="comment-file-upload"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100"
                >
                  <Upload className="w-4 h-4" />
                  Прикрепить файл
                </label>
              </div>

              {/* Preview attached files */}
              {commentFiles.length > 0 && (
                <div className="mb-3 space-y-2">
                  {commentFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                      <File className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setCommentFiles(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!commentText.trim() || addCommentMutation.isPending}
              >
                {addCommentMutation.isPending ? "Добавление..." : "Добавить комментарий"}
              </Button>
            </div>

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {comment.author?.name || comment.author?.username || "Неизвестный пользователь"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCommentMutation.mutate({ id: comment.id })}
                        disabled={deleteCommentMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-3">{comment.content}</p>
                    
                    {/* Comment Files */}
                    {commentFilesMap[comment.id] && commentFilesMap[comment.id].length > 0 && (
                      <div className="mt-3 space-y-2">
                        {commentFilesMap[comment.id].map((file: any) => (
                          <div key={file.id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                            <File className="w-4 h-4 text-gray-400" />
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex-1 truncate"
                            >
                              {file.name}
                            </a>
                            <span className="text-xs text-gray-500">
                              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => deleteCommentFileMutation.mutate({ id: file.id })}
                              disabled={deleteCommentFileMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Нет комментариев</p>
            )}
          </div>

          <div className="border-t pt-6 mt-6">
            <button
              onClick={() => setShowStatusHistory(!showStatusHistory)}
              className="text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900"
            >
              {showStatusHistory ? "Скрыть" : "Показать"} историю изменения статуса
            </button>
            {showStatusHistory && statusHistory.length > 0 && (
              <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                {statusHistory.map((entry: any) => (
                  <div key={entry.id} className="text-xs text-gray-600">
                    <p>
                      <span className="font-semibold">{users.find(u => u.id === entry.userId)?.name || users.find(u => u.id === entry.userId)?.username || "Unknown"}</span>
                      {" "}изменил статус с "{entry.oldStatus === 'pending' ? 'В работе' : 'Завершена'}" на "{entry.newStatus === 'pending' ? 'В работе' : 'Завершена'}" {new Date(entry.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-500">
              <p>Крейтано: {new Date(task.createdAt).toLocaleString("ru-RU")}</p>
              {task.updatedAt && (
                <p>Обновлено: {new Date(task.updatedAt).toLocaleString("ru-RU")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
