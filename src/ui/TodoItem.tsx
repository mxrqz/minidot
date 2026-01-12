import { useState, useRef, useEffect } from "react";
import { Todo } from "../types/todo";
import { useTodoStore } from "../state/todoStore";

interface TodoItemProps {
  todo: Todo;
  isSelected: boolean;
  onClick: () => void;
}

function formatDueDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dueDay.getTime() === today.getTime()) {
    return "Today";
  } else if (dueDay.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else if (dueDay < today) {
    return "Overdue";
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function isOverdue(timestamp: number): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return timestamp < today.getTime();
}

function TodoItem({ todo, isSelected, onClick }: TodoItemProps) {
  const toggleTodo = useTodoStore((state) => state.toggleTodo);
  const editingTodoId = useTodoStore((state) => state.editingTodoId);
  const setEditingTodo = useTodoStore((state) => state.setEditingTodo);
  const updateTodoText = useTodoStore((state) => state.updateTodoText);
  const updateTodoDueDate = useTodoStore((state) => state.updateTodoDueDate);

  const isEditing = editingTodoId === todo.id;
  const [editText, setEditText] = useState(todo.text);
  const [, setShowDatePicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditText(todo.text);
  }, [todo.text]);

  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditText(todo.text);
    setEditingTodo(todo.id);
  };

  const handleSave = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      updateTodoText(todo.id, trimmed);
    }
    setEditingTodo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      handleSave();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setEditText(todo.text);
      setEditingTodo(null);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTodo(todo.id);
  };

  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDatePicker(true);
    setTimeout(() => dateInputRef.current?.showPicker(), 50);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const date = new Date(value);
      date.setHours(9, 0, 0, 0); // Default to 9 AM
      updateTodoDueDate(todo.id, date.getTime());
    } else {
      updateTodoDueDate(todo.id, null);
    }
    setShowDatePicker(false);
  };

  const handleRemoveDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTodoDueDate(todo.id, null);
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all duration-150 ${todo.done ? "opacity-50" : ""}`}
      style={{
        background: isSelected ? "var(--color-bg-elevated)" : "transparent",
      }}
      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = "var(--color-bg-hover)")}
      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = "transparent")}
    >
      <button
        onClick={handleToggle}
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150"
        style={{
          background: todo.done ? "var(--color-checkbox-checked)" : "transparent",
          borderColor: todo.done ? "var(--color-checkbox-checked)" : "var(--color-text-tertiary)",
        }}
      >
        {todo.done && (
          <svg
            className="w-2.5 h-2.5"
            style={{ color: "var(--color-checkbox-check)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--color-text-primary)" }}
        />
      ) : (
        <span
          onClick={handleTextClick}
          className={`flex-1 text-sm transition-all duration-150 ${todo.done ? "line-through" : ""}`}
          style={{ color: todo.done ? "var(--color-text-muted)" : "var(--color-text-primary)" }}
        >
          {todo.text}
        </span>
      )}

      {/* Due date indicator */}
      <div className="relative flex items-center">
        {todo.dueDate && !todo.done ? (
          <button
            onClick={handleDateClick}
            onContextMenu={handleRemoveDate}
            className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
            style={{
              color: isOverdue(todo.dueDate) ? "var(--color-error)" : "var(--color-text-tertiary)",
              background: isOverdue(todo.dueDate) ? "var(--color-error-bg)" : "transparent",
            }}
            title="Click to change, right-click to remove"
          >
            {formatDueDate(todo.dueDate)}
          </button>
        ) : !todo.done && isSelected ? (
          <button
            onClick={handleDateClick}
            className="transition-colors p-1"
            style={{ color: "var(--color-text-muted)" }}
            title="Add due date"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        ) : null}
        <input
          ref={dateInputRef}
          type="date"
          onChange={handleDateChange}
          onBlur={() => setShowDatePicker(false)}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          style={{ position: "absolute", right: 0 }}
        />
      </div>
    </div>
  );
}

export default TodoItem;
