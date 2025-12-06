import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Home,
  Star,
  Folder,
  Key,
  Users,
  FolderPlus,
  Lock,
  LogOut,
  Settings,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export function NoteSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  const { data: folders = [] } = trpc.folders.list.useQuery();
  const { data: notes = [] } = trpc.notes.list.useQuery();
  const { data: suggestions = [] } = trpc.search.suggestions.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const getNotesCountInFolder = (folderId: number) => {
    return notes.filter((note) => note.folderId === folderId).length;
  };

  const createFolderMutation = trpc.folders.create.useMutation({
    onSuccess: () => {
      toast.success("Папка создана");
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      trpc.useUtils().folders.list.invalidate();
    },
    onError: () => {
      toast.error("Не удалось создать папку");
    },
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate({ name: newFolderName });
    }
  };

  const isActive = (path: string) => location === path;

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/">
          <div className="cursor-pointer">
            <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
            <p className="text-xs text-gray-500 mt-1">@{user?.name || "admin"}</p>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по заметкам и папкам"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 text-sm rounded-lg"
          />
        </div>
        
        {/* Search suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
            {suggestions.map((suggestion) => (
              <Link key={suggestion.id} href={`/note/${suggestion.id}`}>
                <div className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0">
                  {suggestion.title}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {/* My Notes */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <Link href="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className={`flex-1 justify-start h-9 rounded-lg ${
                  isActive("/")
                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Home className="mr-2 h-4 w-4" />
                Мои заметки
              </Button>
            </Link>
            <Link href="/note/new">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Tasks */}
          <Link href="/tasks">
            <Button
              variant={isActive("/tasks") ? "default" : "ghost"}
              className={`w-full justify-start h-9 rounded-lg mb-4 ${
                isActive("/tasks")
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Мои задачи
            </Button>
          </Link>

          {/* Folders */}
          <div className="pt-2 pb-4">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Папки
              </span>
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <FolderPlus className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-gray-200">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900">Создать папку</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folderName" className="text-gray-700">Название папки</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Введите название"
                        className="border-gray-200 bg-gray-50"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateFolder();
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim() || createFolderMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Создать
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-1">
              {folders.map((folder) => {
                const notesCount = getNotesCountInFolder(folder.id);
                return (
                  <Link key={folder.id} href={`/folder/${folder.id}`}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start h-8 rounded-lg text-sm ${
                        isActive(`/folder/${folder.id}`)
                          ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Folder className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{notesCount}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 my-2" />

          {/* Favorites */}
          <Link href="/favorites">
            <Button
              variant="ghost"
              className={`w-full justify-start h-8 rounded-lg text-sm ${
                isActive("/favorites")
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Star className="mr-2 h-4 w-4" />
              Избранное
            </Button>
          </Link>

          {/* Password Generator */}
          <Link href="/password-generator">
            <Button
              variant="ghost"
              className={`w-full justify-start h-8 rounded-lg text-sm ${
                isActive("/password-generator")
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Key className="mr-2 h-4 w-4" />
              Генератор паролей
            </Button>
          </Link>

          {/* Admin Section */}
          {user?.role === "admin" && (
            <>
              <div className="h-px bg-gray-200 my-2" />

              {/* Users */}
              <Link href="/users">
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-8 rounded-lg text-sm ${
                    isActive("/users")
                      ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Пользователи
                </Button>
              </Link>

              {/* License */}
              <Link href="/license">
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-8 rounded-lg text-sm ${
                    isActive("/license")
                      ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Лицензии
                </Button>
              </Link>

              {/* Settings */}
              <Link href="/settings">
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-8 rounded-lg text-sm ${
                    isActive("/settings")
                      ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Настройки
                </Button>
              </Link>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer - Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={() => logoutMutation.mutate()}
          variant="ghost"
          className="w-full justify-start h-8 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Выход
        </Button>
      </div>
    </div>
  );
}
