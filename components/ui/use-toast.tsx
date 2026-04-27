"use client";

import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "@/components/ui/toast";

type ToastData = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastProps["variant"];
  duration?: number;
};

type ToasterContextType = {
  toast: (t: Omit<ToastData, "id">) => void;
};

const ToasterContext = React.createContext<ToasterContextType | null>(null);

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback<ToasterContextType["toast"]>((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  return (
    <ToasterContext.Provider value={{ toast }}>
      <ToastProvider>
        {children}
        {toasts.map(({ id, title, description, variant, duration = 3200 }) => (
          <Toast
            key={id}
            variant={variant}
            duration={duration}
            onOpenChange={(open) => {
              if (!open) setToasts((prev) => prev.filter((t) => t.id !== id));
            }}
          >
            <div className="grid gap-0.5">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? (
                <ToastDescription>{description}</ToastDescription>
              ) : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToasterContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToasterContext);
  if (!ctx) {
    throw new Error("useToast must be used within <Toaster>");
  }
  return ctx;
}
