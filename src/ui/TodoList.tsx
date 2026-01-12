import { useTodoStore } from "../state/todoStore";
import TodoItem from "./TodoItem";

function TodoList() {
  const todos = useTodoStore((state) => state.todos);
  const selectedIndex = useTodoStore((state) => state.selectedIndex);
  const setSelectedIndex = useTodoStore((state) => state.setSelectedIndex);

  if (todos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No tasks yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto py-1 px-1">
      {todos.map((todo, index) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isSelected={selectedIndex >= 0 && index === selectedIndex}
          onClick={() => setSelectedIndex(index)}
        />
      ))}
    </div>
  );
}

export default TodoList;
