"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  const { t } = useI18n();
  const titleId = React.useId();
  const descriptionId = React.useId();

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-card text-card-foreground shadow-lg animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t("common.cancel")}</span>
        </button>
        <div className="flex flex-col space-y-1.5 p-6 pb-2">
          <h3 id={titleId} className="leading-none tracking-tight">{title}</h3>
          {description && <p id={descriptionId} className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="p-6 pt-2">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
