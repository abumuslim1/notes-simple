import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, ArrowLeft, Trash2, Edit2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

interface Column {
  id: number;
  name: string;
  color: string;
  position: number;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  columnId: number;
  assignedToUserId: number | null;
  dueDate: Date | null;
  position: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

const colorOptions = [
  { name: "blue", label: "Синий", bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700" },
  { name: "red", label: "Красный", bg: "bg-red-100", border: "border-red-300", text: "text-red-700" },
  { name: "green", label: "Зелёный", bg: "bg-green-100", border: "border-green-300", text: "text-green-700" },
  { name: "purple", label: "Фиолетовый", bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700" },
  { name: "yellow", label: "Жёлтый", bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-700" },
  { name: "pink", label: "Розовый", bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-700" },
];

export default function Tasks() {
  const { user } = useAuth();
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Record<number, Task[]>>({});
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("blue");
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);

  // Fetch columns
  const { data: columnsData, isLoading: columnsLoading } = trpc.tasks.columns.list.useQuery();
  
  // Create column mutation
  const createColumnMutation = trpc.tasks.columns.create.useMutation({
    onSuccess: () => {
      toast.success("Столбец создан");
      setNewColumnName("");
      setNewColumnColor("blue");
      setIsCreateColumnOpen(false);
      trpc.useUtils().tasks.columns.list.invalidate();
    },
    onError: () => {
      toast.error("Ошибка при создании столбца");
    },
  });

  // Initialize default columns if empty
  useEffect(() => {
    if (columnsData && columnsData.length === 0) {
      // Create default columns
      const defaultColumns = [
        { name: "Новые", color: "blue" },
        { name: "Отложено", color: "yellow" },
        { name: "Закрыто", color: "green" },
      ];
      
      defaultColumns.forEach((col) => {
        createColumnMutation.mutate(col);
      });
    } else if (columnsData) {
      setColumns(columnsData);
      // Fetch tasks for each column
      columnsData.forEach((col) => {
        trpc.tasks.list.useQuery({ columnId: col.id });
      });
    }
  }, [columnsData]);

  const handleCreateColumn = () => {
    if (newColumnName.trim()) {
      createColumnMutation.mutate({
        name: newColumnName,
        color: newColumnColor,
      });
    }
  };

  if (columnsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка задач...</p>
        </div>
      </div>
    );
  }

  const getColorClass = (colorName: string) => {
    const color = colorOptions.find((c) => c.name === colorName);
    return color || colorOptions[0];
  };

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
          <h1 className="text-4xl font-bold text-gray-900">Мои задачи</h1>
        </div>
        <p className="text-gray-600">Управляйте своими задачами с помощью Kanban-доски</p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn key={column.id} column={column} colorClass={getColorClass(column.color)} />
        ))}

        {/* Add Column Button */}
        <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
          <DialogTrigger asChild>
            <div className="flex-shrink-0 w-80 h-fit">
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Добавить столбец
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Создать столбец</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="columnName" className="text-gray-700">
                  Название столбца
                </Label>
                <Input
                  id="columnName"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Введите название"
                  className="border-gray-200 bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-gray-700 mb-2 block">Цвет</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setNewColumnColor(color.name)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        newColumnColor === color.name
                          ? `${color.bg} ${color.border} border-2`
                          : `${color.bg} border-transparent`
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreateColumn}
                disabled={!newColumnName.trim() || createColumnMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function KanbanColumn({ column, colorClass }: { column: Column; colorClass: any }) {
  const { data: columnTasks = [] } = trpc.tasks.list.useQuery({ columnId: column.id });
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Задача создана");
      setTaskTitle("");
      setTaskDescription("");
      setIsAddTaskOpen(false);
      trpc.useUtils().tasks.list.invalidate();
    },
    onError: () => {
      toast.error("Ошибка при создании задачи");
    },
  });

  const handleAddTask = () => {
    if (taskTitle.trim()) {
      createTaskMutation.mutate({
        columnId: column.id,
        title: taskTitle,
        description: taskDescription,
      });
    }
  };

  return (
    <div className="flex-shrink-0 w-80 bg-white rounded-lg border border-gray-200 p-4 h-fit">
      {/* Column Header */}
      <div className={`mb-4 pb-3 border-b-2 ${colorClass.border}`}>
        <h2 className={`font-semibold text-lg ${colorClass.text}`}>{column.name}</h2>
        <p className="text-xs text-gray-500 mt-1">{columnTasks.length} задач</p>
      </div>

      {/* Tasks */}
      <div className="space-y-2 mb-4 min-h-96">
        {columnTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* Add Task Button */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:bg-gray-100"
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить задачу
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Новая задача</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="taskTitle" className="text-gray-700">
                Название задачи
              </Label>
              <Input
                id="taskTitle"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Введите название"
                className="border-gray-200 bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="taskDescription" className="text-gray-700">
                Описание
              </Label>
              <textarea
                id="taskDescription"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Введите описание (опционально)"
                className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-sm"
                rows={3}
              />
            </div>
            <Button
              onClick={handleAddTask}
              disabled={!taskTitle.trim() || createTaskMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Создать задачу
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-move group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm truncate">{task.title}</h3>
          {task.description && task.description.length > 0 && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button className="p-1 hover:bg-gray-200 rounded text-gray-600">
            <Edit2 className="h-3 w-3" />
          </button>
          <button className="p-1 hover:bg-red-100 rounded text-red-600">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
