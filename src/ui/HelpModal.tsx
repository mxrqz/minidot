import { useEffect } from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Option", "Shift", "Space"], description: "Open/close app" },
  { keys: ["Option", "←"], description: "Previous page" },
  { keys: ["Option", "→"], description: "Next page" },
  { keys: ["↑", "↓"], description: "Navigate tasks" },
  { keys: ["Enter"], description: "Add task" },
  { keys: ["Cmd", "Enter"], description: "Toggle done" },
  { keys: ["Backspace"], description: "Delete task" },
  { keys: ["Cmd", "Z"], description: "Undo delete" },
  { keys: ["Cmd", "F"], description: "Search all tasks" },
  { keys: ["Cmd", ","], description: "Settings" },
  { keys: ["Esc"], description: "Close window" },
  { keys: ["Cmd", "/"], description: "Show this help" },
];

function HelpModal({ isOpen, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.key === "/" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true); // capture phase
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

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
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
          Keyboard Shortcuts
        </h2>
        <div className="space-y-2">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                {shortcut.description}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                    style={{
                      background: "var(--color-bg-elevated)",
                      color: "var(--color-text-secondary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-3 text-center" style={{ color: "var(--color-text-muted)" }}>
          Press Esc to close
        </p>
      </div>
    </div>
  );
}

export default HelpModal;
