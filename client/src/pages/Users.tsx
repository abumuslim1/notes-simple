import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users as UsersIcon, Shield, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Users() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading } = trpc.users.list.useQuery();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
      trpc.useUtils().users.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to update user role");
    },
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted");
      trpc.useUtils().users.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  const handleRoleChange = (userId: number, role: "user" | "admin") => {
    updateRoleMutation.mutate({ userId, role });
  };

  const handleDeleteUser = (userId: number, userName: string | null) => {
    if (confirm(`Are you sure you want to delete user ${userName || "Unknown"}?`)) {
      deleteUserMutation.mutate({ userId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-12 relative">
        <div className="absolute top-0 right-0 w-96 h-96 light-ray opacity-20 pointer-events-none" />
        <h1 className="text-6xl font-bold text-gradient-light mb-4 heading">
          USER MANAGEMENT
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage user roles and permissions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-4xl">
        {users.map((user) => (
          <Card key={user.id} className="card-cinematic border-cinematic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    {user.role === "admin" ? (
                      <Shield className="h-6 w-6 text-primary" />
                    ) : (
                      <User className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg heading">
                      {user.name || "Unknown User"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Last signed in: {new Date(user.lastSignedIn).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(value) =>
                      handleRoleChange(user.id, value as "user" | "admin")
                    }
                    disabled={user.id === currentUser?.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="icon"
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
    </div>
  );
}
