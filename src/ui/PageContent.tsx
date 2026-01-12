import { useEffect, useRef, useState, useCallback } from "react";
import { useTodoStore } from "../state/todoStore";
import Input from "./Input";
import TodoList from "./TodoList";

interface PageContentProps {
  onPageChange: (direction: "next" | "prev") => void;
}

function PageContent({ onPageChange }: PageContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [animationClass, setAnimationClass] = useState("");
  const pages = useTodoStore((state) => state.pages);
  const currentPageIndex = useTodoStore((state) => state.currentPageIndex);
  const todos = useTodoStore((state) => state.todos);
  const updatePageTitle = useTodoStore((state) => state.updatePageTitle);
  const prevPageIndexRef = useRef(currentPageIndex);

  // Notification state
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = (message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(message);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  // Cleanup notification timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Title editing state
  const currentPage = pages[currentPageIndex];
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editText, setEditText] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleClick = () => {
    if (currentPage) {
      setEditText(currentPage.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    if (currentPage) {
      const trimmed = editText.trim();
      if (trimmed && trimmed !== currentPage.title) {
        updatePageTitle(currentPage.id, trimmed);
      }
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const animatePageChange = useCallback((direction: "next" | "prev") => {
    // Force save title if editing before navigating
    if (titleInputRef.current) {
      titleInputRef.current.blur();
    }

    // Don't animate if at first page and trying to go prev
    if (direction === "prev" && currentPageIndex <= 0) {
      showNotification("First page");
      return;
    }

    // Don't animate if at last page with empty todos (won't create new page)
    const isLastPage = currentPageIndex >= pages.length - 1;
    if (direction === "next" && isLastPage && todos.length === 0) {
      showNotification("Add a task to create a new page");
      return;
    }

    const content = contentRef.current;
    if (!content) return;

    // Slide out
    const outClass = direction === "next" ? "slide-out-left" : "slide-out-right";
    setAnimationClass(outClass);
  }, [currentPageIndex, pages.length, todos.length]);

  // Expose animatePageChange to parent via a stable callback
  useEffect(() => {
    (window as any).__animatePageChange = animatePageChange;
    return () => {
      delete (window as any).__animatePageChange;
    };
  }, [animatePageChange]);

  // When page index changes, animate in immediately
  useEffect(() => {
    if (prevPageIndexRef.current !== currentPageIndex) {
      const direction = currentPageIndex > prevPageIndexRef.current ? "next" : "prev";
      const inClass = direction === "next" ? "slide-in-right" : "slide-in-left";
      setAnimationClass(inClass);
      prevPageIndexRef.current = currentPageIndex;
    }
  }, [currentPageIndex]);

  // Handle animation end
  const handleAnimationEnd = () => {
    if (animationClass.startsWith("slide-out")) {
      // After slide out, trigger the actual page change
      const direction = animationClass === "slide-out-left" ? "next" : "prev";
      onPageChange(direction);
    } else if (animationClass.startsWith("slide-in")) {
      // After slide in, clear the class
      setAnimationClass("");
    }
  };

  return (
    <>
      <div
        ref={contentRef}
        className={`flex-1 flex flex-col overflow-hidden ${animationClass}`}
        style={{ willChange: "transform, opacity" }}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Page Title */}
        <div className="px-4 pt-3 pb-1">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="bg-transparent text-sm font-semibold outline-none w-full"
              style={{ color: "var(--color-text-primary)" }}
            />
          ) : (
            <h1
              onClick={handleTitleClick}
              className="text-sm font-semibold cursor-pointer transition-colors"
              style={{ color: "var(--color-text-primary)" }}
            >
              {currentPage?.title}
            </h1>
          )}
        </div>
        <Input />
        <TodoList />
      </div>

      {/* Notification */}
      {notification && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none">
          <div
            className="notification-expand backdrop-blur-md text-xs px-3 py-1.5 rounded-full"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}
          >
            {notification}
          </div>
        </div>
      )}
    </>
  );
}

export default PageContent;
