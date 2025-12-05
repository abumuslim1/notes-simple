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
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/">
          <h1 className="text-3xl font-bold text-gradient-light cursor-pointer heading">
            NOTES
          </h1>
        </Link>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск заметок..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-sidebar-border"
          />
        </div>
        
        {/* Search suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2 bg-sidebar-accent rounded-md border border-sidebar-border overflow-hidden">
            {suggestions.map((suggestion) => (
              <Link key={suggestion.id} href={`/note/${suggestion.id}`}>
                <div className="px-3 py-2 hover:bg-sidebar-primary/10 cursor-pointer text-sm text-sidebar-foreground">
                  {suggestion.title}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {/* My Notes */}
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <Home className="mr-2 h-4 w-4" />
                Мои заметки
              </Button>
            </Link>
            <Link href="/note/new">
              <Button size="icon" variant="ghost" className="ml-2">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Folders */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Папки
              </span>
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <FolderPlus className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card text-card-foreground">
                  <DialogHeader>
                    <DialogTitle className="heading">СОЗДАТЬ ПАПКУ</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folderName">Название папки</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Введите название папки"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateFolder();
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim() || createFolderMutation.isPending}
                      className="w-full"
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
                      variant={isActive(`/folder/${folder.id}`) ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Folder className="mr-2 h-4 w-4" />
                      <span className="flex-1 text-left">{folder.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{notesCount}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Favorites */}
          <Link href="/favorites">
            <Button
              variant={isActive("/favorites") ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Star className="mr-2 h-4 w-4" />
              Избранное
            </Button>
          </Link>

          {/* Password Generator */}
          <Link href="/password-generator">
            <Button
              variant={isActive("/password-generator") ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Key className="mr-2 h-4 w-4" />
              Генератор паролей
            </Button>
          </Link>

          {/* Users (Admin only) */}
          {user?.role === "admin" && (
            <Link href="/users">
              <Button
                variant={isActive("/users") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Пользователи
              </Button>
            </Link>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
