import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Star, Lock, Edit2, Trash2, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function FolderView() {
  const [, params] = useRoute("/folder/:id");
  const folderId = Number(params?.id);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const { data: notes = [], isLoading } = trpc.notes.list.useQuery();
  const { data: folders = [] } = trpc.folders.list.useQuery();

  const folder = folders.find((f) => f.id === folderId);
  const folderNotes = notes.filter((note) => note.folderId === folderId);

  const updateFolderMutation = trpc.folders.update.useMutation({
    onSuccess: () => {
      toast.success("Папка обновлена");
      setIsEditOpen(false);
      trpc.useUtils().folders.list.invalidate();
    },
  });

  const deleteFolderMutation = trpc.folders.delete.useMutation({
    onSuccess: () => {
      toast.success("Папка удалена");
      window.location.href = "/";
    },
  });

  const toggleFavoriteMutation = trpc.notes.toggleFavorite.useMutation({
    onMutate: async ({ noteId, isFavorite }) => {
      await trpc.useUtils().notes.list.cancel();
      const previousNotes = trpc.useUtils().notes.list.getData();
      trpc.useUtils().notes.list.setData(undefined, (old) =>
        old ? old.map((note) => 
          note.id === noteId ? { ...note, isFavorite } : note
        ) : old
      );
      return { previousNotes };
    },
    onError: (err, newData, context) => {
      if (context?.previousNotes) {
        trpc.useUtils().notes.list.setData(undefined, context.previousNotes);
      }
    },
  });

  const deleteNoteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      toast.success("Заметка удалена");
      trpc.useUtils().notes.list.invalidate();
    },
    onError: () => {
      toast.error("Не удалось удалить заметку");
    },
  });

  const handleToggleFavorite = (noteId: number, currentFavorite: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteMutation.mutate({ noteId, isFavorite: !currentFavorite });
  };

  const handleDeleteNote = (noteId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Вы уверены, что хотите удалить эту заметку?")) {
      deleteNoteMutation.mutate({ noteId });
    }
  };

  const handleUpdateFolder = () => {
    if (folderName.trim()) {
      updateFolderMutation.mutate({ folderId, name: folderName });
    }
  };

  const handleDeleteFolder = () => {
    if (confirm("Вы уверены, что хотите удалить эту папку? Заметки не будут удалены.")) {
      deleteFolderMutation.mutate({ folderId });
    }
  };

  if (isLoading || !folder) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Загрузка папки...</div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold text-gray-900">{folder.name}</h1>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFolderName(folder.name)}
                className="text-gray-600 hover:text-blue-600"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-gray-900">Редактировать папку</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName" className="text-gray-700">Название папки</Label>
                  <Input
                    id="folderName"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateFolder();
                    }}
                    className="border-gray-200 bg-gray-50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateFolder}
                    disabled={!folderName.trim() || updateFolderMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Обновить
                  </Button>
                  <Button
                    onClick={handleDeleteFolder}
                    variant="destructive"
                    disabled={deleteFolderMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-gray-600">{folderNotes.length} {folderNotes.length === 1 ? "заметка" : folderNotes.length < 5 ? "заметки" : "заметок"} в этой папке</p>
      </div>

      {/* Notes Section */}
      <div>
        {folderNotes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Нет заметок</h3>
            <p className="text-gray-600 mb-6">Создайте заметку и назначьте её в эту папку</p>
            <Link href="/note/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Создать заметку
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folderNotes.map((note) => (
              <Link key={note.id} href={`/note/${note.id}/view`}>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {note.passwordHash && (
                        <Lock className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                    {note.passwordHash
                      ? "🔒 Эта заметка защищена паролем"
                      : note.content.replace(/<[^>]*>/g, '').substring(0, 100)}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {new Date(note.updatedAt).toLocaleDateString("ru-RU")}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleToggleFavorite(note.id, note.isFavorite, e)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            note.isFavorite
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-400 hover:text-yellow-400"
                          }`}
                        />
                      </button>
                      <Link href={`/note/${note.id}`}>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit2 className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                        </button>
                      </Link>
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
