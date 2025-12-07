import { useState, useMemo } from "react";
import { useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar, Flag } from "lucide-react";
import { toast } from "sonner";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

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

const COLOR_PRESETS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#6366f1", // indigo
];

export default function Tasks() {
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("#22c55e");
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

  const { data: columns = [], refetch: refetchColumns } = trpc.tasks.getColumns.useQuery();

  const createColumnMutation = trpc.tasks.createColumn.useMutation({
    onSuccess: () => {
      toast.success("Столбец создан");
      refetchColumns();
      setNewColumnName("");
      setNewColumnColor("#22c55e");
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

  const moveTaskMutation = trpc.tasks.moveTask.useMutation({
    onError: () => toast.error("Ошибка перемещения задачи"),
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

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const taskId = parseInt(draggableId.split("-")[1]);
    const newColumnId = parseInt(destination.droppableId.split("-")[1]);
    const newPosition = destination.index;

    moveTaskMutation.mutate(
      {
        taskId,
        columnId: newColumnId,
        position: newPosition,
      },
      {
        onSuccess: () => {
          refetchColumns();
        },
      }
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col bg-white">
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Мои задачи</h1>
            <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
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
                    <Label htmlFor="columnName">Название столбца</Label>
                    <Input
                      id="columnName"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Название столбца"
                    />
                  </div>
                  <div>
                    <Label>Цвет столбца</Label>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewColumnColor(color)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            newColumnColor === color
                              ? "border-gray-900 scale-110"
                              : "border-gray-300"
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
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
          <div className="flex gap-6 h-full min-w-min">
            {columns.map((column, index) => (
              <div key={column.id} className="flex items-start gap-3">
                <TaskColumn
                  column={column}
                  onDelete={() => deleteColumnMutation.mutate({ id: column.id })}
                  onRefetch={refetchColumns}
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
                        <div>
                          <Label>Цвет столбца</Label>
                          <div className="flex gap-2 flex-wrap mt-2">
                            {COLOR_PRESETS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setNewColumnColor(color)}
                                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                  newColumnColor === color
                                    ? "border-gray-900 scale-110"
                                    : "border-gray-300"
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
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
                    <div>
                      <Label>Цвет столбца</Label>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewColumnColor(color)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                              newColumnColor === color
                                ? "border-gray-900 scale-110"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
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
    </DragDropContext>
  );
}

function TaskColumn({
  column,
  onDelete,
  onRefetch,
}: {
  column: any;
  onDelete: () => void;
  onRefetch: () => void;
}) {
  const [, setLocation] = useRouter() as any;
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [columnColor, setColumnColor] = useState(column.color || "#22c55e");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");

  const { data: tasks = [], refetch: refetchTasks } = trpc.tasks.getTasksByColumn.useQuery({ columnId: column.id });

  const createTaskMutation = trpc.tasks.createTask.useMutation({
    onSuccess: () => {
      toast.success("Задача создана");
      refetchTasks();
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskDueDate("");
      setNewTaskTags("");
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

  const updateColumnMutation = trpc.tasks.updateColumn.useMutation({
    onSuccess: () => {
      toast.success("Цвет столбца обновлен");
      onRefetch();
      setIsColorPickerOpen(false);
    },
    onError: () => toast.error("Ошибка обновления цвета"),
  });

  const handleUpdateColumnColor = (newColor: string) => {
    setColumnColor(newColor);
    updateColumnMutation.mutate({
      id: column.id,
      color: newColor,
    });
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error("Введите название задачи");
      return;
    }
    createTaskMutation.mutate({
      columnId: column.id,
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority as "low" | "medium" | "high",
      dueDate: newTaskDueDate,
      position: tasks.length,
      tags: newTaskTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t),
    });
  };

  return (
    <div className="flex-shrink-0 w-80">
      <div className="flex flex-col h-full">
        {/* Column header with color */}
        <div
          className="rounded-lg px-4 py-3 mb-4 flex items-center justify-between group cursor-pointer hover:opacity-90 transition-opacity"
          style={{ backgroundColor: columnColor }}
          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
        >
          <h3 className="font-semibold text-white text-sm">{column.name}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-6 w-6 p-0 hover:bg-white/20"
          >
            <Trash2 className="w-3 h-3 text-white" />
          </Button>
        </div>

        {/* Color picker */}
        {isColorPickerOpen && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-2 font-medium">Выберите цвет:</p>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleUpdateColumnColor(color)}
                  className={`w-6 h-6 rounded-lg border-2 transition-all ${
                    columnColor === color
                      ? "border-gray-900 scale-110"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tasks container with Droppable */}
        <Droppable droppableId={`column-${column.id}`}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 flex flex-col gap-3 overflow-y-auto pr-2 ${
                snapshot.isDraggingOver ? "bg-blue-50 rounded-lg p-2" : ""
              }`}
            >
              {tasks && tasks.length > 0 ? (
                tasks.map((task: any, index: number) => (
                  <Draggable
                    key={task.id}
                    draggableId={`task-${task.id}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => setLocation(`/task/${task.id}`)}
                        className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer ${
                          snapshot.isDragging ? "shadow-lg bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {task.title}
                              </h4>
                              {task.priority && (
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]
                                  }`}
                                >
                                  {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {task.tags && task.tags.length > 0 && (
                                task.tags.map((tag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))
                              )}
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString("ru-RU")}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTaskMutation.mutate({ id: task.id });
                            }}
                            className="h-5 w-5 p-0 flex-shrink-0 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Нет задач
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Add task button */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white">
              Добавить задачу
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="taskPriority">Приоритет</Label>
                <select
                  id="taskPriority"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
              <div>
                <Label htmlFor="taskDueDate">Крайний срок</Label>
                <Input
                  id="taskDueDate"
                  type="datetime-local"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="taskTags">Теги (через запятую)</Label>
                <Input
                  id="taskTags"
                  value={newTaskTags}
                  onChange={(e) => setNewTaskTags(e.target.value)}
                  placeholder="тег1, тег2, тег3"
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
  );
}
