"use client";

import { create } from "zustand";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  open: boolean;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (toast: { title: string; description?: string }) => void;
  dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: ({ title, description }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, title, description, open: true }],
    }));
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export function toast(opts: { title: string; description?: string }) {
  useToastStore.getState().showToast(opts);
}
