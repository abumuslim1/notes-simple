import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PasswordDialog } from "@/components/PasswordDialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Star,
  Lock,
  FileText,
  History,
  Tag,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function NoteView() {
  const [, params] = useRoute("/note/:id/view");
  const [, setLocation] = useLocation();
  const noteId = Number(params?.id);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const { data: note, isLoading } = trpc.notes.get.useQuery({ noteId });
  const { data: noteTags = [] } = trpc.notes.tags.useQuery({ noteId });
  const { data: noteFiles = [] } = trpc.files.list.useQuery({ noteId });
  const { data: versions = [] } = trpc.notes.versions.useQuery({ noteId });

  const verifyPasswordMutation = trpc.notes.verifyPassword.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        setIsUnlocked(true);
        setShowPasswordDialog(false);
        toast.success("Заметка разблокирована");
      } else {
        toast.error("Неверный пароль");
      }
    },
    onError: () => {
      toast.error("Ошибка проверки пароля");
    },
  });

  const toggleFavoriteMutation = trpc.notes.toggleFavorite.useMutation({
    onSuccess: () => {
      trpc.useUtils().notes.get.invalidate({ noteId });
      trpc.useUtils().notes.list.invalidate();
    },
  });

  useEffect(() => {
    if (note && note.passwordHash && !isUnlocked) {
      setShowPasswordDialog(true);
    }
  }, [note, isUnlocked]);

  const handlePasswordSubmit = (password: string) => {
    verifyPasswordMutation.mutate({ noteId, password });
  };

  const handleToggleFavorite = () => {
    if (note) {
      toggleFavoriteMutation.mutate({
        noteId: note.id,
        isFavorite: !note.isFavorite,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Загрузка заметки...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Заметка не найдена</div>
      </div>
    );
  }

  const canViewContent = !note.passwordHash || isUnlocked;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gradient-light heading">
              {note.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleFavorite}
              disabled={toggleFavoriteMutation.isPending}
            >
              <Star
                className={`h-4 w-4 ${
                  note.isFavorite ? "fill-primary text-primary" : ""
                }`}
              />
            </Button>
            {canViewContent && (
              <>
                <Dialog open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <History className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-card text-card-foreground">
                    <DialogHeader>
                      <DialogTitle className="heading">ИСТОРИЯ ВЕРСИЙ</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {versions.map((version) => (
                        <Card key={version.id} className="p-4 card-cinematic">
                          <div className="text-xs text-muted-foreground mb-2">
                            {new Date(version.createdAt).toLocaleString("ru-RU")}
                          </div>
                          <h3 className="font-semibold mb-2 heading">{version.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {version.content}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <Link href={`/note/${note.id}`}>
                  <Button className="glow-golden">
                    <Edit className="mr-2 h-4 w-4" />
                    Редактировать
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Password protection indicator */}
          {note.passwordHash && (
            <Card className="p-4 card-cinematic border-primary/50">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">
                    Защищенная заметка
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isUnlocked
                      ? "Заметка разблокирована"
                      : "Требуется пароль для просмотра"}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Tags */}
          {canViewContent && noteTags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground uppercase">
                  Теги
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {noteTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {canViewContent ? (
            <Card className="p-6 card-cinematic">
              <div 
                className="prose prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </Card>
          ) : (
            <Card className="p-12 card-cinematic text-center">
              <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground mb-2 heading">
                СОДЕРЖИМОЕ СКРЫТО
              </h3>
              <p className="text-muted-foreground mb-6">
                Введите пароль для просмотра содержимого заметки
              </p>
              <Button
                onClick={() => setShowPasswordDialog(true)}
                className="glow-golden"
              >
                Ввести пароль
              </Button>
            </Card>
          )}

          {/* Files */}
          {canViewContent && noteFiles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground uppercase">
                  Вложения
                </span>
              </div>
              <div className="space-y-2">
                {noteFiles.map((file) => (
                  <Card key={file.id} className="p-3 flex items-center justify-between card-cinematic">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary"
                        >
                          {file.fileName}
                        </a>
                        <div className="text-xs text-muted-foreground">
                          {(file.fileSize / 1024 / 1024).toFixed(2)} МБ
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Создано: {new Date(note.createdAt).toLocaleString("ru-RU")}</div>
            <div>Обновлено: {new Date(note.updatedAt).toLocaleString("ru-RU")}</div>
          </div>
        </div>
      </div>

      {/* Password Dialog */}
      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onPasswordSubmit={handlePasswordSubmit}
        isVerifying={verifyPasswordMutation.isPending}
      />
    </div>
  );
}
