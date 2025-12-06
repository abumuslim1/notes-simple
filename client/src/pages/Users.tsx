import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Trash2, Shield, User, Plus, Edit2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Users() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [error, setError] = useState("");

  // Form states for adding user
  const [addUsername, setAddUsername] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState<"user" | "admin">("user");

  // Form states for editing user
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"user" | "admin">("user");

  const usersQuery = trpc.users.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const addUserMutation = trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      // If role is admin, update it
      if (addRole === "admin") {
        await updateRoleMutation.mutateAsync({ userId: data.id, role: "admin" });
      }
      toast.success("User added successfully");
      setAddUsername("");
      setAddPassword("");
      setAddName("");
      setAddRole("user");
      setIsAddDialogOpen(false);
      usersQuery.refetch();
    },
    onError: (err) => {
      setError(err.message || "Failed to add user");
      toast.error(err.message || "Failed to add user");
    },
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
    },
    onError: (err) => {
      setError(err.message || "Failed to update user role");
      toast.error(err.message || "Failed to update user role");
    },
  });

  const updateUserMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      setEditingUser(null);
      usersQuery.refetch();
    },
    onError: (err) => {
      setError(err.message || "Failed to update user");
      toast.error(err.message || "Failed to update user");
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      usersQuery.refetch();
    },
    onError: (err) => {
      setError(err.message || "Failed to delete user");
      toast.error(err.message || "Failed to delete user");
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex-1 p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>You don't have permission to access this page</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = usersQuery.data?.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAddUser = () => {
    if (!addUsername || !addPassword || !addName) {
      setError("All fields are required");
      return;
    }
    setError("");
    addUserMutation.mutate({
      username: addUsername,
      password: addPassword,
      name: addName,
    });
  };

  const handleEditUser = () => {
    if (!editName) {
      setError("Name is required");
      return;
    }
    setError("");
    updateUserMutation.mutate({
      userId: editingUser.id,
      name: editName,
    });
    // Update role if changed
    if (editRole !== editingUser.role) {
      updateRoleMutation.mutate({
        userId: editingUser.id,
        role: editRole,
      });
    }
  };

  return (
    <div className="flex-1 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление пользователями</h1>
          <p className="text-muted-foreground mt-1">Добавляйте, редактируйте и удаляйте пользователей</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" />
              Добавить пользователя
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Добавить нового пользователя</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <div>
                <Label htmlFor="add-name" className="text-gray-700">Имя</Label>
                <Input
                  id="add-name"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Введите имя"
                  className="border-gray-200 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="add-username" className="text-gray-700">Логин</Label>
                <Input
                  id="add-username"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="Введите логин"
                  className="border-gray-200 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="add-password" className="text-gray-700">Пароль</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="border-gray-200 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="add-role" className="text-gray-700">Права</Label>
                <Select value={addRole} onValueChange={(val) => setAddRole(val as "user" | "admin")}>
                  <SelectTrigger className="border-gray-200 bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Пользователь</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddUser}
                disabled={addUserMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {addUserMutation.isPending ? "Добавление..." : "Добавить"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-4">
        <Input
          placeholder="Поиск по логину или имени..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {usersQuery.isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка пользователей...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Пользователи не найдены</div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((u) => (
            <Card key={u.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-sm text-muted-foreground">@{u.username}</div>
                    </div>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Администратор
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 mr-1" />
                          Пользователь
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {u.id !== user?.id && (
                      <>
                        <Dialog open={isEditDialogOpen && editingUser?.id === u.id} onOpenChange={(open) => {
                          if (open) {
                            setEditingUser(u);
                            setEditName(u.name);
                            setEditRole(u.role);
                          } else {
                            setEditingUser(null);
                          }
                          setIsEditDialogOpen(open);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUser(u);
                                setEditName(u.name);
                                setEditRole(u.role);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white border-gray-200">
                            <DialogHeader>
                              <DialogTitle className="text-gray-900">Редактировать пользователя</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-sm">{error}</span>
                                </div>
                              )}
                              <div>
                                <Label htmlFor="edit-name" className="text-gray-700">Имя</Label>
                                <Input
                                  id="edit-name"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Введите имя"
                                  className="border-gray-200 bg-gray-50"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-role" className="text-gray-700">Права</Label>
                                <Select value={editRole} onValueChange={(val) => setEditRole(val as "user" | "admin")}>
                                  <SelectTrigger className="border-gray-200 bg-gray-50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">Пользователь</SelectItem>
                                    <SelectItem value="admin">Администратор</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                onClick={handleEditUser}
                                disabled={updateUserMutation.isPending}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                {updateUserMutation.isPending ? "Сохранение..." : "Сохранить"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Вы уверены, что хотите удалить ${u.name}?`)) {
                              deleteMutation.mutate({ userId: u.id });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
