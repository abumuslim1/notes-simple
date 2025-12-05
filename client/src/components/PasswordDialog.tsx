import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordSubmit: (password: string) => void;
  isVerifying?: boolean;
}

export function PasswordDialog({
  open,
  onOpenChange,
  onPasswordSubmit,
  isVerifying = false,
}: PasswordDialogProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onPasswordSubmit(password);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 heading">
            <Lock className="h-5 w-5 text-primary" />
            ЗАЩИЩЕННАЯ ЗАМЕТКА
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Эта заметка защищена паролем. Введите пароль для доступа к содержимому.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль..."
              className="bg-sidebar-accent"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPassword("");
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={!password.trim() || isVerifying}
              className="flex-1 glow-golden"
            >
              {isVerifying ? "Проверка..." : "Открыть"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
