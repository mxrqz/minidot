import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "system" | "light" | "dark";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme: "light" | "dark") => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      resolvedTheme: getSystemTheme(),
      setTheme: (theme: Theme) => {
        const resolved = theme === "system" ? getSystemTheme() : theme;
        applyTheme(resolved);
        set({ theme, resolvedTheme: resolved });
      },
    }),
    {
      name: "minidot-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = state.theme === "system" ? getSystemTheme() : state.theme;
          applyTheme(resolved);
          state.resolvedTheme = resolved;
        }
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== "undefined") {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = () => {
    const state = useThemeStore.getState();
    if (state.theme === "system") {
      const newResolved = getSystemTheme();
      applyTheme(newResolved);
      useThemeStore.setState({ resolvedTheme: newResolved });
    }
  };

  mediaQuery.addEventListener("change", handleChange);

  // Apply theme on initial load
  const state = useThemeStore.getState();
  const resolved = state.theme === "system" ? getSystemTheme() : state.theme;
  applyTheme(resolved);
}
