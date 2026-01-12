import { useEffect } from "react";
import { useTodoStore } from "../state/todoStore";

/**
 * Custom hook that sets up global keyboard event listeners for todo navigation.
 *
 * Keyboard controls:
 * - Cmd+Z: Undo last deleted task
 * - Option+Left: Previous page
 * - Option+Right: Next page
 * - Cmd/Ctrl+Enter: Toggle done on selected todo
 * - Backspace/Delete: Delete selected todo (when input not focused)
 * - ArrowUp: Select previous todo
 * - ArrowDown: Select next todo
 * - Escape: Hide the window with animation
 */
export function useKeyboardNavigation(hideWindow: () => Promise<void>) {
  const todos = useTodoStore((state) => state.todos);
  const selectedIndex = useTodoStore((state) => state.selectedIndex);
  const toggleTodo = useTodoStore((state) => state.toggleTodo);
  const deleteTodo = useTodoStore((state) => state.deleteTodo);
  const undoDelete = useTodoStore((state) => state.undoDelete);
  const selectNext = useTodoStore((state) => state.selectNext);
  const selectPrev = useTodoStore((state) => state.selectPrev);
  const setSelectedIndex = useTodoStore((state) => state.setSelectedIndex);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement;

      // Escape: Hide the window with animation (works regardless of focus)
      if (e.key === "Escape") {
        e.preventDefault();
        await hideWindow();
        return;
      }

      // Cmd+Z: Undo last deleted task
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        await undoDelete();
        return;
      }

      // Option+Left: Previous page (with animation)
      if (e.key === "ArrowLeft" && e.altKey) {
        e.preventDefault();
        const animate = (window as any).__animatePageChange;
        if (animate) animate("prev");
        return;
      }

      // Option+Right: Next page (with animation)
      if (e.key === "ArrowRight" && e.altKey) {
        e.preventDefault();
        const animate = (window as any).__animatePageChange;
        if (animate) animate("next");
        return;
      }

      // Cmd/Ctrl+Enter: Toggle done on selected todo
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const selectedTodo = todos[selectedIndex];
        if (selectedTodo) {
          await toggleTodo(selectedTodo.id);
        }
        return;
      }

      // Enter (without modifier): Edit selected todo (only if not already editing)
      const editingTodoId = useTodoStore.getState().editingTodoId;
      if (e.key === "Enter" && !isInputFocused && !editingTodoId && selectedIndex >= 0) {
        e.preventDefault();
        const selectedTodo = todos[selectedIndex];
        if (selectedTodo) {
          useTodoStore.getState().setEditingTodo(selectedTodo.id);
        }
        return;
      }

      // Arrow keys for navigation
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (isInputFocused) {
          // From input, go to last task
          if (todos.length > 0) {
            (activeElement as HTMLElement).blur();
            setSelectedIndex(todos.length - 1);
          }
        } else if (selectedIndex <= 0) {
          // From first task or no selection, go to input and clear selection
          setSelectedIndex(-1);
          const input = document.querySelector('input[placeholder="Add a task..."]') as HTMLInputElement;
          if (input) input.focus();
        } else {
          selectPrev();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (isInputFocused) {
          // From input, go to first task
          if (todos.length > 0) {
            (activeElement as HTMLElement).blur();
            setSelectedIndex(0);
          }
        } else if (selectedIndex >= todos.length - 1) {
          // From last task, go to input and clear selection
          setSelectedIndex(-1);
          const input = document.querySelector('input[placeholder="Add a task..."]') as HTMLInputElement;
          if (input) input.focus();
        } else {
          selectNext();
        }
        return;
      }

      // Backspace/Delete: Delete selected todo (only when input not focused)
      if ((e.key === "Backspace" || e.key === "Delete") && !isInputFocused) {
        e.preventDefault();
        const selectedTodo = todos[selectedIndex];
        if (selectedTodo) {
          await deleteTodo(selectedTodo.id);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [todos, selectedIndex, toggleTodo, deleteTodo, undoDelete, selectNext, selectPrev, setSelectedIndex, hideWindow]);
}
