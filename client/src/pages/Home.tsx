import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Star, Lock, FileText, Folder as FolderIcon } from "lucide-react";

export default function Home() {
  const { data: notes = [], isLoading } = trpc.notes.list.useQuery();
  const { data: folders = [] } = trpc.folders.list.useQuery();

  const toggleFavoriteMutation = trpc.notes.toggleFavorite.useMutation({
    onSuccess: () => {
      trpc.useUtils().notes.list.invalidate();
    },
  });

  const handleToggleFavorite = (noteId: number, currentFavorite: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteMutation.mutate({ noteId, isFavorite: !currentFavorite });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2 heading">
          Мои заметки
        </h1>
        <p className="text-muted-foreground text-sm">
          Организуйте свои мысли в тенях, освещайте свои идеи
        </p>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 heading">Папки</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {folders.map((folder) => (
              <Link key={folder.id} href={`/folder/${folder.id}`}>
                <div className="border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 cursor-pointer group p-3 bg-white">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{folder.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 heading">Все заметки</h2>
        {notes.length === 0 ? (
          <Card className="border border-gray-200 p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground mb-2 heading">
              NO NOTES YET
            </h3>
            <p className="text-muted-foreground mb-6">
              Создайте свою первую заметку, чтобы начать
            </p>
            <Link href="/note/new">
              <Button className="glow-golden">Создать заметку</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {notes.map((note) => (
              <Link key={note.id} href={`/note/${note.id}/view`}>
                <div className="border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 cursor-pointer group h-full p-2 bg-white">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {note.passwordHash && (
                        <Lock className="h-3 w-3 text-accent" />
                      )}
                      <button
                        onClick={(e) => handleToggleFavorite(note.id, note.isFavorite, e)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-3 w-3 ${
                            note.isFavorite
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {note.passwordHash
                      ? "🔒 Защищено"
                      : note.content.substring(0, 60)}
                  </p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(note.updatedAt).toLocaleDateString()}
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
