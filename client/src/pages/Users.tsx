import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, Shield, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Users() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const usersQuery = trpc.users.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      setSuccess("User role updated successfully");
      usersQuery.refetch();
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to update user role");
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      setSuccess("User deleted successfully");
      usersQuery.refetch();
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to delete user");
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

  return (
    <div className="flex-1 p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage users and their roles</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
          <span>{success}</span>
        </div>
      )}

      <div className="flex gap-4">
        <Input
          placeholder="Search by username or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {usersQuery.isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No users found</div>
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
                          Admin
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 mr-1" />
                          User
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {u.role === "user" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setError("");
                          updateRoleMutation.mutate({ userId: u.id, role: "admin" });
                        }}
                        disabled={updateRoleMutation.isPending}
                      >
                        Make Admin
                      </Button>
                    )}

                    {u.role === "admin" && u.id !== user?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setError("");
                          updateRoleMutation.mutate({ userId: u.id, role: "user" });
                        }}
                        disabled={updateRoleMutation.isPending}
                      >
                        Remove Admin
                      </Button>
                    )}

                    {u.id !== user?.id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${u.name}?`)) {
                            setError("");
                            deleteMutation.mutate({ userId: u.id });
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
