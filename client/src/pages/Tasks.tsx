import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Tasks() {
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("#3b82f6");
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

  const { data: columns = [], refetch: refetchColumns } = trpc.tasks.getColumns.useQuery();
  
  const createColumnMutation = trpc.tasks.createColumn.useMutation({
    onSuccess: () => {
      toast.success("Столбец создан");
      refetchColumns();
      setNewColumnName("");
      setNewColumnColor("#3b82f6");
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
      color: newColumnColor,
      position: columns.length,
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Мои задачи</h1>
          <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Добавить столбец
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать столбец</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="columnName">Название</Label>
                  <Input
                    id="columnName"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Название столбца"
                  />
                </div>
                <div>
                  <Label htmlFor="columnColor">Цвет</Label>
                  <Input
                    id="columnColor"
                    type="color"
                    value={newColumnColor}
                    onChange={(e) => setNewColumnColor(e.target.value)}
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
        <div className="flex gap-4 h-full">
          {columns.map((column) => (
            <TaskColumn
              key={column.id}
              column={column}
              onDelete={() => deleteColumnMutation.mutate({ id: column.id })}
            />
          ))}
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
      <Card className="h-full flex flex-col">
        <CardHeader
          className="pb-3"
          style={{ borderTopColor: column.color, borderTopWidth: "4px" }}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{column.name}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {tasks.map((task: any) => (
            <Card key={task.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTaskMutation.mutate({ id: task.id })}
                  className="h-6 w-6 p-0 ml-2"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
          
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mt-2">
                <Plus className="w-4 h-4 mr-2" />
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
        </CardContent>
      </Card>
    </div>
  );
}
