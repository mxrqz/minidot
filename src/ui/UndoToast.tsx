import { useEffect, useRef } from "react";
import { useTodoStore } from "../state/todoStore";

function UndoToast() {
  const lastDeletedTodo = useTodoStore((state) => state.lastDeletedTodo);
  const undoDelete = useTodoStore((state) => state.undoDelete);
  const clearLastDeleted = useTodoStore((state) => state.clearLastDeleted);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lastDeletedTodo) {
      // Auto-hide after 4 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        clearLastDeleted();
      }, 4000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [lastDeletedTodo, clearLastDeleted]);

  if (!lastDeletedTodo) return null;

  const handleUndo = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    await undoDelete();
  };

  return (
    <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-40">
      <div
        className="notification-expand backdrop-blur-md text-xs px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-auto"
        style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}
      >
        <span>Task deleted</span>
        <button
          onClick={handleUndo}
          className="font-medium transition-colors"
          style={{ color: "var(--color-accent)" }}
        >
          Undo
        </button>
      </div>
    </div>
  );
}

export default UndoToast;
