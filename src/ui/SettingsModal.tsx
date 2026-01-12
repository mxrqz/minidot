import { useEffect, useState } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useThemeStore, type Theme } from "../state/themeStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeIcon = ({ type }: { type: Theme }) => {
  if (type === "system") {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === "light") {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
};

const themeOptions: { value: Theme; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [autostart, setAutostart] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    if (isOpen) {
      // Load current autostart status
      isEnabled().then((enabled) => {
        setAutostart(enabled);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.key === "," && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  const handleAutostartToggle = async () => {
    try {
      if (autostart) {
        await disable();
        setAutostart(false);
      } else {
        await enable();
        setAutostart(true);
      }
    } catch (error) {
      console.error("Failed to toggle autostart:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      style={{ background: "var(--color-modal-overlay)" }}
      onClick={onClose}
    >
      <div
        className="backdrop-blur-xl rounded-lg p-4 min-w-[280px] help-modal-enter"
        style={{ background: "var(--color-modal-bg)", border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Settings</h2>

        <div className="space-y-4">
          {/* Theme Option */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[var(--color-text-primary)] text-sm">Appearance</span>
                <p className="text-[var(--color-text-muted)] text-[10px]">Choose your preferred theme</p>
              </div>
            </div>
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--color-bg-elevated)" }}>
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    theme === option.value
                      ? "shadow-sm"
                      : "hover:opacity-80"
                  }`}
                  style={{
                    background: theme === option.value ? "var(--color-bg-active)" : "transparent",
                    color: theme === option.value ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  }}
                >
                  <ThemeIcon type={option.value} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Autostart Option */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>Launch at login</span>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Start minidot when you log in</p>
            </div>
            <button
              onClick={handleAutostartToggle}
              disabled={loading}
              className={`relative w-10 h-6 rounded-full transition-colors ${loading ? "opacity-50" : ""}`}
              style={{ background: autostart ? "var(--color-accent)" : "var(--color-checkbox-bg)" }}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                  autostart ? "translate-x-4" : "translate-x-0"
                }`}
                style={{ background: "var(--color-checkbox-check)" }}
              />
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <p className="text-[10px] text-center" style={{ color: "var(--color-text-muted)" }}>
            Press <kbd className="px-1 rounded" style={{ background: "var(--color-bg-elevated)" }}>Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
