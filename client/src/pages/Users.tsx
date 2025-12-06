import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users as UsersIcon, Shield, User, Trash2, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Users() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading } = trpc.users.list.useQuery();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Роль пользователя обновлена");
      trpc.useUtils().users.list.invalidate();
    },
    onError: () => {
      toast.error("Не удалось обновить роль");
    },
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Пользователь удалён");
      trpc.useUtils().users.list.invalidate();
    },
    onError: () => {
      toast.error("Не удалось удалить пользователя");
    },
  });

  const handleRoleChange = (userId: number, role: "user" | "admin") => {
    updateRoleMutation.mutate({ userId, role });
  };

  const handleDeleteUser = (userId: number, userName: string | null) => {
    if (confirm(`Вы уверены, что хотите удалить пользователя ${userName || "Неизвестный"}?`)) {
      deleteUserMutation.mutate({ userId });
    }
  };

  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    // TODO: Implement user creation API
    toast.info("Функция регистрации будет добавлена");
    setIsCreateOpen(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("user");
  };

  const handleEditUser = (user: typeof users[0]) => {
    setEditingUser(user);
    setNewUserName(user.name || "");
    setNewUserEmail(user.email || "");
    setNewUserRole(user.role);
    setIsEditOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    // TODO: Implement user update API
    toast.info("Функция редактирования будет добавлена");
    setIsEditOpen(false);
    setEditingUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Загрузка пользователей...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold heading">
              Управление пользователями
            </h1>
            <p className="text-muted-foreground text-sm">
              Управляйте ролями и правами пользователей
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить пользователя
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle className="heading">Добавить пользователя</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="createName">Имя</Label>
                  <Input
                    id="createName"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Введите имя пользователя"
                  />
                </div>
                <div>
                  <Label htmlFor="createEmail">Email</Label>
                  <Input
                    id="createEmail"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Введите email"
                    type="email"
                  />
                </div>
                <div>
                  <Label htmlFor="createRole">Роль</Label>
                  <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as "user" | "admin")}>
                    <SelectTrigger id="createRole">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Пользователь</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateUser} className="w-full">
                  Добавить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 max-w-4xl">
        {users.map((user) => (
          <Card key={user.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {user.role === "admin" ? (
                      <Shield className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">
                      {user.name || "Неизвестный пользователь"}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                        {user.role === "admin" ? "Администратор" : "Пользователь"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.lastSignedIn).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditUser(user)}
                    disabled={user.id === currentUser?.id}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    disabled={user.id === currentUser?.id || deleteUserMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="heading">Редактировать пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Имя</Label>
              <Input
                id="editName"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Введите имя пользователя"
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Введите email"
                type="email"
              />
            </div>
            <div>
              <Label htmlFor="editRole">Роль</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as "user" | "admin")}>
                <SelectTrigger id="editRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateUser} className="w-full">
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
