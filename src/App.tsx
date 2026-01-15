import { useEffect, useCallback, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { setDockVisibility } from "@tauri-apps/api/app";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { useNotifications } from "./hooks/useNotifications";
import { useTodoStore } from "./state/todoStore";
import { hideWindow } from "./lib/windowBehavior";
import PageContent from "./ui/PageContent";
import PageDots from "./ui/PageDots";
import HelpModal from "./ui/HelpModal";
import SearchModal from "./ui/SearchModal";
import SettingsModal from "./ui/SettingsModal";
import Toast from "./ui/Toast";
import UndoToast from "./ui/UndoToast";
import GridBackground from "./ui/GridBackground";
// Initialize theme on app load
import "./state/themeStore";

// Trigger opening animation
const triggerOpenAnimation = () => {
  const container = document.getElementById("app-container");
  if (container) {
    container.style.opacity = "";
    container.style.transform = "";
    container.classList.remove("window-open", "window-close");
    void container.offsetWidth;
    container.classList.add("window-open");
  }
};

function App() {
  const loadPages = useTodoStore((state) => state.loadPages);
  const nextPage = useTodoStore((state) => state.nextPage);
  const prevPage = useTodoStore((state) => state.prevPage);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Set up keyboard navigation with animated hide
  useKeyboardNavigation(hideWindow);

  // Set up due date notifications
  useNotifications();

  // Handle keyboard shortcuts for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsHelpOpen(true);
      }
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for window show/hide events from Rust (tray click, shortcut)
  useEffect(() => {
    const unlistenShow = listen("window-did-show", () => {
      triggerOpenAnimation();
    });

    const unlistenHide = listen("window-will-hide", async () => {
      await hideWindow();
    });

    // Trigger animation on initial mount
    triggerOpenAnimation();

    return () => {
      unlistenShow.then((fn) => fn());
      unlistenHide.then((fn) => fn());
    };
  }, []);

  // Load pages on mount and hide dock icon
  useEffect(() => {
    loadPages();
    // Hide from dock (macOS only)
    setDockVisibility(false).catch(() => {});
  }, [loadPages]);

  // Handle actual page change after animation
  const handlePageChange = useCallback((direction: "next" | "prev") => {
    if (direction === "next") {
      nextPage();
    } else {
      prevPage();
    }
  }, [nextPage, prevPage]);

  return (
    <div
      id="app-container"
      className="window-open h-screen rounded-xl flex flex-col overflow-hidden relative"
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border-subtle)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 rgba(0, 0, 0, 0.04)",
      }}
    >
      <GridBackground />
      <PageContent onPageChange={handlePageChange} />
      <PageDots />
      <Toast />
      <UndoToast />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

export default App;
