"use client";

import * as React from "react";
import { useToastStore } from "@/lib/toast";
import { Toast, ToastTitle, ToastDescription, ToastClose } from "./toast";

export function Toaster() {
  const { toasts, dismissToast } = useToastStore();

  return (
    <>
      {toasts.map((item) => (
        <Toast
          key={item.id}
          open={item.open}
          onOpenChange={(open) => {
            if (!open) dismissToast(item.id);
          }}
        >
          <div className="flex flex-col gap-1 pr-6">
            <ToastTitle>{item.title}</ToastTitle>
            {item.description && (
              <ToastDescription>{item.description}</ToastDescription>
            )}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </>
  );
}
