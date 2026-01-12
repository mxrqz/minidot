import { create } from "zustand";

interface ToastStore {
  message: string | null;
  type: "success" | "error";
  show: (message: string, type?: "success" | "error") => void;
  hide: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  message: null,
  type: "success",

  show: (message: string, type: "success" | "error" = "success") => {
    set({ message, type });
    // Auto-hide after 2 seconds
    setTimeout(() => {
      set({ message: null });
    }, 2000);
  },

  hide: () => {
    set({ message: null });
  },
}));
