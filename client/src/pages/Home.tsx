import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Star, Lock, FileText, Folder as FolderIcon } from "lucide-react";
import { toast } from "sonner";

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
      <div className="mb-12 relative">
        <div className="absolute top-0 right-0 w-96 h-96 light-ray opacity-20 pointer-events-none" />
        <h1 className="text-6xl font-bold text-gradient-light mb-4 heading">
          МОИ ЗАМЕТКИ
        </h1>
        <p className="text-muted-foreground text-lg">
          Организуйте свои мысли в тенях, освещайте свои идеи
        </p>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 heading">ПАПКИ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {folders.map((folder) => (
              <Link key={folder.id} href={`/folder/${folder.id}`}>
                <Card className="card-cinematic border-cinematic hover:glow-golden transition-all duration-300 cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-foreground group-hover:text-primary transition-colors">
                      <FolderIcon className="h-6 w-6" />
                      <span className="heading text-lg">{folder.name}</span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6 heading">ВСЕ ЗАМЕТКИ</h2>
        {notes.length === 0 ? (
          <Card className="card-cinematic border-cinematic p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {notes.map((note) => (
              <Link key={note.id} href={`/note/${note.id}/view`}>
                <Card className="card-cinematic border-cinematic hover:glow-golden transition-all duration-300 cursor-pointer group h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-foreground group-hover:text-primary transition-colors heading text-base line-clamp-2">
                        {note.title}
                      </CardTitle>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {note.passwordHash && (
                          <Lock className="h-4 w-4 text-accent" />
                        )}
                        <button
                          onClick={(e) => handleToggleFavorite(note.id, note.isFavorite, e)}
                          className="hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              note.isFavorite
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {note.passwordHash
                        ? "🔒 Protected content"
                        : note.content.substring(0, 100)}
                    </p>
                    <div className="mt-4 text-xs text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
