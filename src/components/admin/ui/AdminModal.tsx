import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AdminModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: AdminModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text)] sm:max-w-lg rounded-[12px] p-6 shadow-2xl",
          className
        )}
      >
        {(title || description) && (
          <DialogHeader className="space-y-1.5 pb-2">
            {title && (
              <DialogTitle className="text-[18px] font-bold text-[var(--admin-text)] tracking-tight">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-[13px] text-[var(--admin-text-secondary)]">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        <div className="py-2 text-[13px] text-[var(--admin-text)]">{children}</div>

        {footer && (
          <DialogFooter className="pt-3 border-t border-[var(--admin-divider)] sm:justify-end gap-2">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
