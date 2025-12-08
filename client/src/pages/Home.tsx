import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Star, Lock, FileText, Folder as FolderIcon, Edit2, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: notes = [], isLoading } = trpc.notes.list.useQuery();
  const { data: folders = [] } = trpc.folders.list.useQuery();
  const { data: suggestions = [] } = trpc.search.suggestions.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const filteredNotes = searchQuery.length > 0
    ? notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Загрузка заметок...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Мои заметки</h1>
        <p className="text-gray-600">Организуйте свои мысли в тенях, освещайте свои идеи</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по заметкам и папкам"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-gray-200 text-sm rounded-lg"
          />
        </div>
        
        {suggestions.length > 0 && (
          <div className="mt-2 bg-white rounded-md border border-gray-200 overflow-hidden max-w-md">
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0">
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Папки</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map((folder) => (
              <Link key={folder.id} href={`/folder/${folder.id}`}>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-3 mb-2">
                    <FolderIcon className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    <span className="text-sm font-semibold text-gray-900 truncate flex-1">{folder.name}</span>
                  </div>
                  <p className="text-xs text-gray-500">Папка</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Все заметки</h2>
        {notes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Нет заметок</h3>
            <p className="text-gray-600 mb-6">Создайте свою первую заметку, чтобы начать</p>
            <Link href="/note/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Создать заметку
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotes.map((note) => (
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


