import { useEffect, useState, useRef } from "react";
import { useTodoStore } from "../state/todoStore";
import type { Todo } from "../types/todo";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = Todo & { pageTitle: string };

function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchAllTodos = useTodoStore((state) => state.searchAllTodos);
  const goToPage = useTodoStore((state) => state.goToPage);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose, results, selectedIndex]);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length > 0) {
      const searchResults = await searchAllTodos(value);
      setResults(searchResults);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  };

  const handleSelect = async (result: SearchResult) => {
    await goToPage(result.pageId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 backdrop-blur-sm flex items-start justify-center pt-20 z-50"
      style={{ background: "var(--color-modal-overlay)" }}
      onClick={onClose}
    >
      <div
        className="backdrop-blur-xl rounded-lg w-[320px] help-modal-enter overflow-hidden"
        style={{ background: "var(--color-modal-bg)", border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>
        {results.length > 0 && (
          <div className="max-h-[240px] overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={result.id}
                onClick={() => handleSelect(result)}
                className="px-3 py-2 cursor-pointer flex items-center justify-between gap-2"
                style={{
                  background: index === selectedIndex ? "var(--color-bg-elevated)" : "transparent",
                }}
              >
                <span
                  className={`text-sm truncate ${result.done ? "line-through" : ""}`}
                  style={{ color: result.done ? "var(--color-text-muted)" : "var(--color-text-primary)" }}
                >
                  {result.text}
                </span>
                <span className="text-[10px] whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                  {result.pageTitle}
                </span>
              </div>
            ))}
          </div>
        )}
        {query.trim().length > 0 && results.length === 0 && (
          <div className="px-3 py-4 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            No results found
          </div>
        )}
        <div
          className="px-3 py-2 flex justify-between text-[10px]"
          style={{ borderTop: "1px solid var(--color-border-subtle)", color: "var(--color-text-muted)" }}
        >
          <span>↑↓ Navigate</span>
          <span>Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
