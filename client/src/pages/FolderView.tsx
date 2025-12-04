import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Star, Lock, Edit2, Trash2, ArrowLeft } from "lucide-react";
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
      toast.success("Folder updated");
      setIsEditOpen(false);
      trpc.useUtils().folders.list.invalidate();
    },
  });

  const deleteFolderMutation = trpc.folders.delete.useMutation({
    onSuccess: () => {
      toast.success("Folder deleted");
      window.location.href = "/";
    },
  });

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

  const handleUpdateFolder = () => {
    if (folderName.trim()) {
      updateFolderMutation.mutate({ folderId, name: folderName });
    }
  };

  const handleDeleteFolder = () => {
    if (confirm("Are you sure you want to delete this folder? Notes will not be deleted.")) {
      deleteFolderMutation.mutate({ folderId });
    }
  };

  if (isLoading || !folder) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading folder...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-12 relative">
        <div className="absolute top-0 right-0 w-96 h-96 light-ray opacity-20 pointer-events-none" />
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-6xl font-bold text-gradient-light heading">
            {folder.name.toUpperCase()}
          </h1>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFolderName(folder.name)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle className="heading">EDIT FOLDER</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateFolder();
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateFolder}
                    disabled={!folderName.trim() || updateFolderMutation.isPending}
                    className="flex-1"
                  >
                    Update
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
        <p className="text-muted-foreground text-lg">
          {folderNotes.length} {folderNotes.length === 1 ? "note" : "notes"} in this folder
        </p>
      </div>

      {folderNotes.length === 0 ? (
        <Card className="card-cinematic border-cinematic p-12 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2 heading">
            NO NOTES IN THIS FOLDER
          </h3>
          <p className="text-muted-foreground mb-6">
            Create a note and assign it to this folder
          </p>
          <Link href="/note/new">
            <Button className="glow-golden">Create Note</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {folderNotes.map((note) => (
            <Link key={note.id} href={`/note/${note.id}`}>
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
  );
}
