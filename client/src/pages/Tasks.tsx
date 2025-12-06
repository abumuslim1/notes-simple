import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Tasks() {
  const [newColumnName, setNewColumnName] = useState("");
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

  const { data: columns = [], refetch: refetchColumns } = trpc.tasks.getColumns.useQuery();
  
  const createColumnMutation = trpc.tasks.createColumn.useMutation({
    onSuccess: () => {
      toast.success("Столбец создан");
      refetchColumns();
      setNewColumnName("");
      setIsColumnDialogOpen(false);
    },
    onError: () => toast.error("Ошибка создания столбца"),
  });

  const deleteColumnMutation = trpc.tasks.deleteColumn.useMutation({
    onSuccess: () => {
      toast.success("Столбец удален");
      refetchColumns();
    },
    onError: () => toast.error("Ошибка удаления столбца"),
  });

  const handleCreateColumn = () => {
    if (!newColumnName.trim()) {
      toast.error("Введите название столбца");
      return;
    }
    createColumnMutation.mutate({
      name: newColumnName,
      color: "#22c55e", // Default green color
      position: columns.length,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Мои задачи</h1>
          <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Добавить задачу
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать столбец</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="columnName">Название столбца</Label>
                  <Input
                    id="columnName"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Название столбца"
                  />
                </div>
                <Button onClick={handleCreateColumn} className="w-full">
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 h-full">
          {columns.map((column, index) => (
            <div key={column.id} className="flex items-start gap-3">
              <TaskColumn
                column={column}
                onDelete={() => deleteColumnMutation.mutate({ id: column.id })}
              />
              {index === columns.length - 1 && (
                <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="text-2xl text-gray-400 hover:text-gray-600 font-light mt-8">
                      +
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Создать столбец</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="columnName">Название столбца</Label>
                        <Input
                          id="columnName"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          placeholder="Название столбца"
                        />
                      </div>
                      <Button onClick={handleCreateColumn} className="w-full">
                        Создать
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ))}
          
          {columns.length === 0 && (
            <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
              <DialogTrigger asChild>
                <button className="text-2xl text-gray-400 hover:text-gray-600 font-light">
                  +
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать столбец</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="columnName">Название столбца</Label>
                    <Input
                      id="columnName"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Название столбца"
                    />
                  </div>
                  <Button onClick={handleCreateColumn} className="w-full">
                    Создать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskColumn({ column, onDelete }: { column: any; onDelete: () => void }) {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  const { data: tasks = [], refetch: refetchTasks } = trpc.tasks.getTasksByColumn.useQuery({
    columnId: column.id,
  });

  const createTaskMutation = trpc.tasks.createTask.useMutation({
    onSuccess: () => {
      toast.success("Задача создана");
      refetchTasks();
      setNewTaskTitle("");
      setNewTaskDescription("");
      setIsTaskDialogOpen(false);
    },
    onError: () => toast.error("Ошибка создания задачи"),
  });

  const deleteTaskMutation = trpc.tasks.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Задача удалена");
      refetchTasks();
    },
    onError: () => toast.error("Ошибка удаления задачи"),
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error("Введите название задачи");
      return;
    }
    createTaskMutation.mutate({
      columnId: column.id,
      title: newTaskTitle,
      description: newTaskDescription,
      position: tasks.length,
    });
  };

  return (
    <div className="flex-shrink-0 w-80">
      <div className="flex flex-col h-full">
        {/* Column header with color */}
        <div
          className="rounded-lg px-4 py-3 mb-4 flex items-center justify-between"
          style={{ backgroundColor: column.color || "#22c55e" }}
        >
          <h3 className="font-semibold text-white text-sm">{column.name}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0 hover:bg-white/20"
          >
            <Trash2 className="w-3 h-3 text-white" />
          </Button>
        </div>

        {/* Tasks container */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
          {tasks.map((task: any) => (
            <div
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(task.dueDate).toLocaleDateString("ru-RU")}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTaskMutation.mutate({ id: task.id })}
                  className="h-5 w-5 p-0 flex-shrink-0 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add task button */}
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white border-0"
              >
                Добавить задачу
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать задачу</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="taskTitle">Название</Label>
                  <Input
                    id="taskTitle"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Название задачи"
                  />
                </div>
                <div>
                  <Label htmlFor="taskDescription">Описание</Label>
                  <Textarea
                    id="taskDescription"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Описание задачи"
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreateTask} className="w-full">
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
