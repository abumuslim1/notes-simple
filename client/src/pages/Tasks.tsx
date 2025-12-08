import { useState, useMemo } from "react";
import { useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export default function Tasks() {
  const [newColumnName, setNewColumnName] = useState("");
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<{from?: string, to?: string}>({});
  const [sortBy, setSortBy] = useState<"createdAt" | "dueDate" | "priority">("createdAt");
  const [assigneeFilter, setAssigneeFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [hideCompleted, setHideCompleted] = useState(false);

  const utils = trpc.useUtils();
  const { data: columns = [], refetch: refetchColumns } = trpc.tasks.getColumns.useQuery();
  const { data: users = [] } = trpc.tasks.getUsers.useQuery();
  
  // We'll fetch tasks per column in the TaskColumn component instead
  // This avoids conditional hook calls
  const refetchAllTasks = () => {
    refetchColumns();
  };
  
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

  const moveTaskMutation = trpc.tasks.moveTask.useMutation({
    onSuccess: () => {
      // Invalidate all task queries to refetch
      utils.tasks.getTasksByColumn.invalidate();
    },
    onError: () => toast.error("Ошибка перемещения задачи"),
  });

  const updateTaskStatusMutation = trpc.tasks.updateTaskStatus.useMutation({
    onMutate: async (newStatus) => {
      await utils.tasks.getTasksByColumn.cancel();
      const previousData = utils.tasks.getTasksByColumn.getData();
      utils.tasks.getTasksByColumn.setData({ columnId: 0 }, (old: any) => {
        if (!old) return old;
        return old.map((task: any) => 
          task.id === newStatus.id ? { ...task, status: newStatus.status } : task
        );
      });
      return { previousData };
    },
    onSuccess: () => {
      toast.success("Статус задачи обновлен");
    },
    onError: (err, newStatus, context: any) => {
      if (context?.previousData) {
        utils.tasks.getTasksByColumn.setData({ columnId: 0 }, context.previousData);
      }
      toast.error("Ошибка обновления статуса задачи");
    },
  });

  const handleCreateColumn = () => {
    if (!newColumnName.trim()) {
      toast.error("Введите название столбца");
      return;
    }
    createColumnMutation.mutate({
      name: newColumnName,
      color: "#22c55e",
      position: columns.length,
    });
  };

  const reorderColumnsMutation = trpc.tasks.reorderColumns.useMutation({
    onSuccess: () => {
      utils.tasks.getColumns.invalidate();
      refetchColumns();
    },
    onError: () => toast.error("Ошибка переупорядочивания столбцов"),
  });

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result;

    // If dropped outside a valid droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Handle column reordering
    if (type === "COLUMN") {
      const newColumnOrder = Array.from(columns);
      const [movedColumn] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, movedColumn);
      
      reorderColumnsMutation.mutate({
        columnIds: newColumnOrder.map((col: any) => col.id),
      });
      return;
    }

    // Handle task reordering
    const taskId = parseInt(draggableId.split("-")[1]);
    const newColumnId = parseInt(destination.droppableId.split("-")[1]);
    const newPosition = destination.index;

    moveTaskMutation.mutate({
      taskId,
      columnId: newColumnId,
      position: newPosition,
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col bg-white">
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Задачи</h1>
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
                  <Button onClick={handleCreateColumn} className="w-full">
                    Создать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          
          {/* Filters Panel */}
          <div className="flex flex-wrap gap-2 md:gap-4 items-center">
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 md:max-w-xs"
            />
            <select
              value={priorityFilter || ""}
              onChange={(e) => setPriorityFilter(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Все приоритеты</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
            <Input
              type="date"
              placeholder="От"
              value={dateFilter.from || ""}
              onChange={(e) => setDateFilter({...dateFilter, from: e.target.value})}
              className="min-w-0 md:max-w-xs"
            />
            <Input
              type="date"
              placeholder="До"
              value={dateFilter.to || ""}
              onChange={(e) => setDateFilter({...dateFilter, to: e.target.value})}
              className="min-w-0 md:max-w-xs"
            />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "createdAt" | "dueDate" | "priority")}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="createdAt">По дате создания</option>
                  <option value="dueDate">По крайнему сроку</option>
                  <option value="priority">По приоритету</option>
                </select>
                <select
                  value={assigneeFilter || ""}
                  onChange={(e) => setAssigneeFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Все исполнители</option>
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.username}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "completed")}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">Все статусы</option>
                  <option value="pending">В работе</option>
                  <option value="completed">Завершена</option>
                </select>
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={hideCompleted}
                    onChange={(e) => setHideCompleted(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Скрыть завершенные</span>
                </label>
                {(searchQuery || priorityFilter || dateFilter.from || dateFilter.to || assigneeFilter || statusFilter !== "all" || hideCompleted) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setPriorityFilter(null);
                  setDateFilter({});
                  setAssigneeFilter(null);
                  setStatusFilter("all");
                  setHideCompleted(false);
                }}
              >
                Очистить
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto p-6">
          <Droppable droppableId="columns" type="COLUMN" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-6 h-full min-w-min pb-4"
              >
                {columns.map((column, index) => (
                  <Draggable key={column.id} draggableId={`column-${column.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex items-start gap-3 ${snapshot.isDragging ? "opacity-50" : ""}`}
                      >
                        <TaskColumn
                          column={column}
                          onDelete={() => deleteColumnMutation.mutate({ id: column.id })}
                          onRefetch={refetchAllTasks}
                          searchQuery={searchQuery}
                          priorityFilter={priorityFilter}
                          dateFilter={dateFilter}
                          sortBy={sortBy}
                          assigneeFilter={assigneeFilter}
                          statusFilter={statusFilter}
                          hideCompleted={hideCompleted}
                        />
                        {false && index === columns.length - 1 && (
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

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
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  );
}

// TaskColumn component
function TaskColumn({ column, onDelete, onRefetch, searchQuery = "", priorityFilter = null, dateFilter = {}, sortBy = "createdAt", assigneeFilter = null, statusFilter = "all", hideCompleted = false }: any) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");
  const [columnColor, setColumnColor] = useState(column.color);
  const [isEditingColor, setIsEditingColor] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newColumnName, setNewColumnName] = useState(column.name);

  const { data: allTasks = [] } = trpc.tasks.getTasksByColumn.useQuery(
    { columnId: column.id },
    { enabled: !!column.id }
  );

  // Filter tasks based on search and filters
  const filteredTasks = allTasks.filter((task: any) => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Priority filter
    if (priorityFilter && task.priority !== priorityFilter) {
      return false;
    }
    
    // Assignee filter
    if (assigneeFilter && task.assignedToUserId !== assigneeFilter) {
      return false;
    }
    
    // Date filter
    if (task.dueDate) {
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      if (dateFilter.from && taskDate < dateFilter.from) {
        return false;
      }
      if (dateFilter.to && taskDate > dateFilter.to) {
        return false;
      }
    }
    
    // Status filter
    if (hideCompleted && (task as any).status === "completed") {
      return false;
    }
    if (statusFilter !== "all" && (task as any).status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a: any, b: any) => {
    if (sortBy === "createdAt") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aOrder = priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
      const bOrder = priorityOrder[b.priority as keyof typeof priorityOrder] || 3;
      return aOrder - bOrder;
    }
    return 0;
  });

  const tasks = sortedTasks;

  const { data: users = [] } = trpc.tasks.getUsers.useQuery();

  const utils = trpc.useUtils();

  const updateTaskStatusMutation = trpc.tasks.updateTaskStatus.useMutation({
    onMutate: async (newStatus) => {
      await utils.tasks.getTasksByColumn.cancel();
      const previousData = utils.tasks.getTasksByColumn.getData();
      utils.tasks.getTasksByColumn.setData({ columnId: 0 }, (old: any) => {
        if (!old) return old;
        return old.map((task: any) => 
          task.id === newStatus.id ? { ...task, status: newStatus.status } : task
        );
      });
      return { previousData };
    },
    onSuccess: () => {
      toast.success("Статус задачи обновлен");
    },
    onError: (err, newStatus, context: any) => {
      if (context?.previousData) {
        utils.tasks.getTasksByColumn.setData({ columnId: 0 }, context.previousData);
      }
      toast.error("Ошибка обновления статуса задачи");
    },
  });

  const createTaskMutation = trpc.tasks.createTask.useMutation({
    onSuccess: () => {
      toast.success("Задача создана");
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskDueDate("");
      setNewTaskAssignee("");
      setNewTaskTags("");
      setIsAddingTask(false);
      utils.tasks.getTasksByColumn.invalidate({ columnId: column.id });
      onRefetch();
    },
    onError: () => toast.error("Ошибка создания задачи"),
  });

  const updateColumnColorMutation = trpc.tasks.updateColumn.useMutation({
    onSuccess: () => {
      toast.success("Цвет столбца изменен");
      setIsEditingColor(false);
      utils.tasks.getColumns.invalidate();
      onRefetch();
    },
    onError: () => toast.error("Ошибка изменения цвета"),
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error("Введите название задачи");
      return;
    }

    const tags = newTaskTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    createTaskMutation.mutate({
      columnId: column.id,
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      priority: newTaskPriority as "low" | "medium" | "high",
      dueDate: newTaskDueDate || undefined,
      assignedToUserId: newTaskAssignee ? parseInt(newTaskAssignee) : undefined,
      tags,
      position: allTasks.length,
    });
  };

  const colorOptions = [
    "#22c55e",
    "#ef4444",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#6b7280",
  ];

  const priorityColors: Record<string, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const priorityLabels: Record<string, string> = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  };

  const updateColumnNameMutation = trpc.tasks.updateColumn.useMutation({
    onSuccess: () => {
      toast.success("Название столбца изменено");
      setIsEditingName(false);
      utils.tasks.getColumns.invalidate();
      onRefetch();
    },
    onError: () => toast.error("Ошибка изменения названия"),
  });

  return (
    <div className="flex flex-col w-80 bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="relative">
        {isEditingName ? (
          <div className="h-12 flex items-center px-3 gap-2" style={{ backgroundColor: columnColor }}>
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onBlur={() => {
                if (newColumnName.trim() && newColumnName !== column.name) {
                  updateColumnNameMutation.mutate({ id: column.id, name: newColumnName });
                } else {
                  setIsEditingName(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (newColumnName.trim() && newColumnName !== column.name) {
                    updateColumnNameMutation.mutate({ id: column.id, name: newColumnName });
                  } else {
                    setIsEditingName(false);
                  }
                } else if (e.key === "Escape") {
                  setNewColumnName(column.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="flex-1 px-2 py-1 rounded text-black font-semibold text-sm bg-white bg-opacity-90 focus:outline-none focus:bg-opacity-95"
            />
          </div>
        ) : (
          <div className="h-12 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-between px-3" style={{ backgroundColor: columnColor }} onDoubleClick={() => setIsEditingName(true)}>
            <span className="text-white font-semibold text-sm flex-1">{column.name}</span>
            <button onClick={() => setIsEditingColor(!isEditingColor)} className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded ml-2">
              ●
            </button>
            <button onClick={() => onDelete()} className="text-white hover:bg-red-500 hover:bg-opacity-50 p-1 rounded">
              ✕
            </button>
          </div>
        )}

        {isEditingColor && (
          <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded shadow-lg p-3 z-10 flex gap-2 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-600"
                style={{ backgroundColor: color }}
                onClick={() => {
                  setColumnColor(color);
                  updateColumnColorMutation.mutate({
                    id: column.id,
                    color,
                  });
                }}
              />
            ))}
          </div>
        )}


      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Droppable droppableId={`column-${column.id}`} type="TASK">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-3 min-h-20 ${
                snapshot.isDraggingOver ? "bg-blue-50 rounded" : ""
              }`}
            >
              {tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 bg-white border border-gray-200 rounded cursor-pointer hover:shadow-md transition-shadow ${
                          snapshot.isDragging ? "opacity-50" : ""
                        } ${(task as any).status === "completed" ? "bg-gray-100 opacity-60" : ""}`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={(task as any).status === "completed"}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateTaskStatusMutation.mutate({
                                id: task.id,
                                status: (task as any).status === "completed" ? "pending" : "completed",
                              });
                            }}
                            className="mt-0.5 cursor-pointer"
                          />
                          <div
                            onClick={() => {
                              window.location.href = `/task/${task.id}`;
                            }}
                            className="flex-1"
                          >
                            <h3 className={`font-semibold text-sm mb-2 ${
                              (task as any).status === "completed" ? "text-gray-500 line-through" : "text-gray-900"
                            }`}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <div className="text-xs text-gray-600 mb-2 line-clamp-2 [&_h1]:text-xs [&_h1]:font-bold [&_h1]:my-0 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:my-0 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:my-0 [&_p]:my-0 [&_ul]:list-disc [&_ul]:ml-3 [&_ol]:list-decimal [&_ol]:ml-3 [&_li]:my-0 [&_strong]:font-bold [&_em]:italic [&_code]:bg-gray-100 [&_code]:px-0.5 [&_code]:rounded [&_pre]:bg-gray-100 [&_pre]:p-1 [&_pre]:rounded [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-2 [&_blockquote]:italic"
                                dangerouslySetInnerHTML={{ __html: task.description }}
                              />
                            )}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {task.priority && (
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    priorityColors[task.priority] ||
                                    "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {priorityLabels[task.priority] || task.priority}
                                </span>
                              )}

                            </div>
                            {task.dueDate && (
                              <p className="text-xs text-gray-500">
                                {new Date(task.dueDate).toLocaleDateString("ru-RU")}
                              </p>
                            )}

                            {task.assignedToUserId && (
                              <p className="text-xs text-gray-500">
                                Исполнитель: {users.find((u: any) => u.id === task.assignedToUserId)?.name || users.find((u: any) => u.id === task.assignedToUserId)?.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">Нет задач</p>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      <div className="border-t p-4">
        {!isAddingTask ? (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full py-2 px-3 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
          >
            + Добавить задачу
          </button>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="Название задачи"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder="Описание"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="text-sm min-h-20"
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
            >
              <option value="low">Низкий приоритет</option>
              <option value="medium">Средний приоритет</option>
              <option value="high">Высокий приоритет</option>
            </select>
            <Input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="text-sm"
            />
            <select
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
            >
              <option value="">Выберите исполнителя</option>
              {users.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.username}
                </option>
              ))}
            </select>
            <Input
              placeholder="Теги (через запятую)"
              value={newTaskTags}
              onChange={(e) => setNewTaskTags(e.target.value)}
              className="text-sm"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleCreateTask}
                className="flex-1 text-sm"
                disabled={createTaskMutation.isPending}
              >
                Создать
              </Button>
              <Button
                onClick={() => setIsAddingTask(false)}
                variant="outline"
                className="flex-1 text-sm"
              >
                Отмена
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
