import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Lock,
  Unlock,
  Upload,
  X,
  FileText,
  History,
  Tag,
  Trash2,
} from "lucide-react";
import { Link } from "wouter";

export default function NoteEditor() {
  const [, params] = useRoute("/note/:id");
  const [, setLocation] = useLocation();
  const noteId = params?.id === "new" ? null : Number(params?.id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folderId, setFolderId] = useState<number | undefined>();
  const [password, setPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const { data: note } = trpc.notes.get.useQuery(
    { noteId: noteId! },
    { enabled: noteId !== null }
  );

  const { data: folders = [] } = trpc.folders.list.useQuery();
  const { data: noteTags = [] } = trpc.notes.tags.useQuery(
    { noteId: noteId! },
    { enabled: noteId !== null }
  );
  const { data: noteFiles = [] } = trpc.files.list.useQuery(
    { noteId: noteId! },
    { enabled: noteId !== null }
  );
  const { data: versions = [] } = trpc.notes.versions.useQuery(
    { noteId: noteId! },
    { enabled: noteId !== null }
  );

  const createNoteMutation = trpc.notes.create.useMutation({
    onSuccess: (data) => {
      toast.success("Заметка создана");
      setLocation(`/note/${data.id}`);
    },
    onError: () => {
      toast.error("Ошибка при создании заметки");
    },
  });

  const updateNoteMutation = trpc.notes.update.useMutation({
    onSuccess: () => {
      toast.success("Заметка сохранена");
      trpc.useUtils().notes.get.invalidate({ noteId: noteId! });
      trpc.useUtils().notes.list.invalidate();
    },
    onError: () => {
      toast.error("Ошибка при сохранении заметки");
    },
  });

  const deleteNoteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      toast.success("Заметка удалена");
      setLocation("/");
    },
    onError: () => {
      toast.error("Ошибка при удалении заметки");
    },
  });

  const uploadFileMutation = trpc.files.upload.useMutation({
    onSuccess: () => {
      toast.success("Файл загружен");
      trpc.useUtils().files.list.invalidate({ noteId: noteId! });
      setPendingFiles([]);
    },
    onError: (error) => {
      toast.error(error.message || "Ошибка при загрузке файла");
    },
  });

  const deleteFileMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      toast.success("Файл удален");
      trpc.useUtils().files.list.invalidate({ noteId: noteId! });
    },
  });

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setFolderId(note.folderId || undefined);
      setHasPassword(!!note.passwordHash);
    }
  }, [note]);

  useEffect(() => {
    if (noteTags.length > 0) {
      setTags(noteTags.map((t) => t.tag));
    }
  }, [noteTags]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Заголовок обязателен");
      return;
    }

    const data = {
      title,
      content,
      folderId: folderId || undefined,
      password: hasPassword ? (password || undefined) : undefined,
      tags,
    };

    if (noteId) {
      updateNoteMutation.mutate({ noteId, ...data });
    } else {
      const newNote = await new Promise((resolve, reject) => {
        createNoteMutation.mutate(data, {
          onSuccess: (result) => resolve(result),
          onError: reject,
        });
      });
      if (newNote && pendingFiles.length > 0) {
        const newNoteId = (newNote as any).id;
        for (const file of pendingFiles) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = (reader.result as string).split(",")[1];
            uploadFileMutation.mutate({
              noteId: newNoteId,
              fileName: file.name,
              fileData: base64,
              mimeType: file.type,
            });
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleDelete = () => {
    if (noteId && confirm("Вы уверены, что хотите удалить эту заметку?")) {
      deleteNoteMutation.mutate({ noteId });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} превышает лимит 50МБ`);
        continue;
      }

      if (noteId) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          uploadFileMutation.mutate({
            noteId: noteId!,
            fileName: file.name,
            fileData: base64,
            mimeType: file.type,
          });
        };
        reader.readAsDataURL(file);
      } else {
        setPendingFiles([...pendingFiles, file]);
        toast.success(`${file.name} добавлен, будет загружен после сохранения`);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-gradient-light heading truncate">
              {noteId ? "РЕДАКТИРОВАТЬ" : "НОВАЯ ЗАМЕТКА"}
            </h1>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {noteId && (
              <>
                <Dialog open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <History className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-card text-card-foreground">
                    <DialogHeader>
                      <DialogTitle className="heading">ИСТОРИЯ ВЕРСИЙ</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {versions.map((version) => (
                        <Card key={version.id} className="p-2 card-cinematic">
                          <div className="text-xs text-muted-foreground mb-1">
                            {new Date(version.createdAt).toLocaleString()}
                          </div>
                          <h3 className="text-sm font-semibold mb-1 heading">{version.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {version.content}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="icon" onClick={handleDelete} className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button onClick={handleSave} className="glow-golden h-8 px-3 text-sm">
              <Save className="mr-1 h-3 w-3" />
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-xs font-semibold heading">
              ЗАГОЛОВОК
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок..."
              className="text-lg font-semibold border-0 border-b border-border rounded-none px-0 py-1 focus-visible:ring-0 bg-transparent"
            />
          </div>

          {/* Folder & Password Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Folder Selection */}
            <div>
              <Label htmlFor="folder" className="text-xs font-semibold heading">
                ПАПКА
              </Label>
              <Select
                value={folderId?.toString() || "none"}
                onValueChange={(value) => setFolderId(value === "none" ? undefined : Number(value))}
              >
                <SelectTrigger id="folder" className="bg-card h-8 text-sm">
                  <SelectValue placeholder="Без папки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без папки</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password Protection */}
            <div>
              <Label className="text-xs font-semibold heading">ЗАЩИТА</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHasPassword(!hasPassword)}
                className="w-full h-8 text-xs justify-start"
              >
                {hasPassword ? (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Защищено
                  </>
                ) : (
                  <>
                    <Unlock className="mr-1 h-3 w-3" />
                    Открыто
                  </>
                )}
              </Button>
            </div>
          </div>

          {hasPassword && (
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль..."
              className="bg-card h-8 text-sm"
            />
          )}

          {/* Tags */}
          <div>
            <Label className="text-xs font-semibold heading">ТЕГИ</Label>
            <div className="flex gap-1 mb-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Тег..."
                className="bg-card h-8 text-sm"
              />
              <Button onClick={handleAddTag} variant="outline" size="sm" className="h-8 w-8 p-0">
                <Tag className="h-3 w-3" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-0.5 text-xs">
                    {tag}
                    <X
                      className="h-2 w-2 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-xs font-semibold heading">
              СОДЕРЖАНИЕ
            </Label>
            <div className="border border-border rounded-md overflow-hidden">
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Напишите вашу заметку..."
              />
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <Label className="text-xs font-semibold heading">ВЛОЖЕНИЯ</Label>
            <div className="space-y-1">
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="bg-card h-8 text-xs"
              />
              <div className="text-xs text-muted-foreground">
                Макс. 50МБ {!noteId && pendingFiles.length > 0 && `(${pendingFiles.length} файлов ждут сохранения)`}
              </div>
              
              {/* Pending Files */}
              {pendingFiles.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="text-xs font-semibold text-amber-600">Ожидают загрузки:</div>
                  {pendingFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-amber-50 p-1 rounded text-xs">
                      <span className="truncate">{file.name}</span>
                      <button
                        onClick={() => setPendingFiles(pendingFiles.filter((_, i) => i !== idx))}
                        className="text-amber-600 hover:text-amber-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded Files */}
              {noteFiles.length > 0 && (
                <div className="space-y-1 mt-2">
                  {noteFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 p-1 rounded text-xs">
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {file.fileName}
                      </a>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-muted-foreground">
                          {(file.fileSize / 1024 / 1024).toFixed(1)}MB
                        </span>
                        <button
                          onClick={() => deleteFileMutation.mutate({ fileId: file.id })}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
