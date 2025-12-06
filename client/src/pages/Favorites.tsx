import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Star, Lock } from "lucide-react";

export default function Favorites() {
  const { data: notes = [], isLoading } = trpc.notes.favorites.useQuery();

  const toggleFavoriteMutation = trpc.notes.toggleFavorite.useMutation({
    onSuccess: () => {
      trpc.useUtils().notes.favorites.invalidate();
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
        <div className="text-muted-foreground">Loading favorites...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-12 relative">
        <div className="absolute top-0 right-0 w-96 h-96 light-ray opacity-20 pointer-events-none" />
        <h1 className="text-6xl font-bold text-gradient-light mb-4 heading">
          ИЗБРАННОЕ
        </h1>
        <p className="text-muted-foreground text-lg">
          Ваши избранные заметки для быстрого доступа
        </p>
      </div>

      {notes.length === 0 ? (
        <Card className="card-cinematic border-cinematic p-12 text-center">
          <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold text-foreground mb-2 heading">
            ПОКА НЕТ ИЗБРАННЫХ
          </h3>
          <p className="text-muted-foreground">
            Отметьте заметки звездочкой, чтобы добавить их в избранное
          </p>
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
                        <Star className="h-4 w-4 fill-primary text-primary" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {note.passwordHash
                      ? "🔒 Protected content"
                      : note.content.replace(/<[^>]*>/g, '').substring(0, 100)}
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
  );
}
