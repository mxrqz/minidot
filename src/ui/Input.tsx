import { useEffect, useRef, useState } from "react";
import { useTodoStore } from "../state/todoStore";

function Input() {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isAddingRef = useRef(false);
  const addTodo = useTodoStore((state) => state.addTodo);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const trimmedText = text.trim();
      if (trimmedText && !isAddingRef.current) {
        isAddingRef.current = true;
        setText(""); // Clear immediately to prevent visual duplicate
        try {
          await addTodo(trimmedText);
        } finally {
          isAddingRef.current = false;
        }
      }
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Add a task..."
      className="bg-transparent w-full outline-none text-sm py-2 px-4"
      style={{
        color: "var(--color-text-primary)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    />
  );
}

export default Input;
