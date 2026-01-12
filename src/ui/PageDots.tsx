import { useTodoStore } from "../state/todoStore";

function PageDots() {
  const pages = useTodoStore((state) => state.pages);
  const currentPageIndex = useTodoStore((state) => state.currentPageIndex);

  if (pages.length <= 1) return null;

  return (
    <div className="flex justify-center gap-1.5 py-2">
      {pages.map((_, index) => (
        <div
          key={index}
          className="w-1.5 h-1.5 rounded-full transition-all duration-200"
          style={{
            background: index === currentPageIndex
              ? "var(--color-text-secondary)"
              : "var(--color-text-muted)",
          }}
        />
      ))}
    </div>
  );
}

export default PageDots;
