import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      toast.success("Note created");
      setLocation(`/note/${data.id}`);
    },
    onError: () => {
      toast.error("Failed to create note");
    },
  });

  const updateNoteMutation = trpc.notes.update.useMutation({
    onSuccess: () => {
      toast.success("Note saved");
      trpc.useUtils().notes.get.invalidate({ noteId: noteId! });
      trpc.useUtils().notes.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to save note");
    },
  });

  const deleteNoteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      toast.success("Note deleted");
      setLocation("/");
    },
    onError: () => {
      toast.error("Failed to delete note");
    },
  });

  const uploadFileMutation = trpc.files.upload.useMutation({
    onSuccess: () => {
      toast.success("File uploaded");
      trpc.useUtils().files.list.invalidate({ noteId: noteId! });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload file");
    },
  });

  const deleteFileMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      toast.success("File deleted");
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

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Title is required");
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
      createNoteMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (noteId && confirm("Are you sure you want to delete this note?")) {
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
    if (!noteId) {
      toast.error("Please save the note first before uploading files");
      return;
    }

    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit`);
        continue;
      }

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
    }
  };

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
              {noteId ? "EDIT NOTE" : "NEW NOTE"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {noteId && (
              <>
                <Dialog open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <History className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-card text-card-foreground">
                    <DialogHeader>
                      <DialogTitle className="heading">VERSION HISTORY</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {versions.map((version) => (
                        <Card key={version.id} className="p-4 card-cinematic">
                          <div className="text-xs text-muted-foreground mb-2">
                            {new Date(version.createdAt).toLocaleString()}
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
                <Button variant="outline" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button onClick={handleSave} className="glow-golden">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-lg heading">
              TITLE
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="text-2xl font-semibold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 bg-transparent"
            />
          </div>

          {/* Folder Selection */}
          <div>
            <Label htmlFor="folder" className="heading">
              FOLDER
            </Label>
            <Select
              value={folderId?.toString() || "none"}
              onValueChange={(value) => setFolderId(value === "none" ? undefined : Number(value))}
            >
              <SelectTrigger id="folder" className="bg-card">
                <SelectValue placeholder="No folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
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
            <div className="flex items-center justify-between mb-2">
              <Label className="heading">PASSWORD PROTECTION</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHasPassword(!hasPassword)}
              >
                {hasPassword ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Protected
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Not Protected
                  </>
                )}
              </Button>
            </div>
            {hasPassword && (
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="bg-card"
              />
            )}
          </div>

          {/* Tags */}
          <div>
            <Label className="heading">TAGS</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
                className="bg-card"
              />
              <Button onClick={handleAddTag} variant="outline">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="heading">
              CONTENT
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note..."
              className="min-h-96 bg-card font-mono text-base"
            />
          </div>

          {/* File Attachments */}
          {noteId && (
            <div>
              <Label className="heading">ATTACHMENTS</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="bg-card"
                />
                <div className="text-xs text-muted-foreground">
                  Maximum file size: 50MB per file
                </div>
                {noteFiles.length > 0 && (
                  <div className="space-y-2 mt-4">
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
                              {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFileMutation.mutate({ fileId: file.id })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
