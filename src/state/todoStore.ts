import { create } from "zustand";
import type { Todo, Page } from "../types/todo";
import {
  initDb,
  getAllPages,
  createPage,
  updatePageTitle as dbUpdatePageTitle,
  deletePage as dbDeletePage,
  getTodosByPage,
  createTodo,
  toggleTodo as dbToggleTodo,
  deleteTodo as dbDeleteTodo,
  updateTodoText as dbUpdateTodoText,
  restoreTodo as dbRestoreTodo,
  updateTodoDueDate as dbUpdateTodoDueDate,
  searchAllTodos as dbSearchAllTodos,
} from "../lib/db";
import { useToastStore } from "./toastStore";

const showError = (message: string) => {
  useToastStore.getState().show(message, "error");
};

interface TodoStore {
  // State
  pages: Page[];
  currentPageIndex: number;
  todos: Todo[];
  selectedIndex: number;
  editingTodoId: string | null;
  deletedTodos: Todo[]; // Stack for undo
  lastDeletedTodo: Todo | null; // For showing undo UI

  // Computed
  currentPage: () => Page | undefined;

  // Page Actions
  loadPages: () => Promise<void>;
  loadTodosForCurrentPage: () => Promise<void>;
  addPage: (title: string) => Promise<void>;
  updatePageTitle: (id: string, title: string) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;

  // Todo Actions
  addTodo: (text: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  clearLastDeleted: () => void;
  updateTodoText: (id: string, text: string) => Promise<void>;
  setEditingTodo: (id: string | null) => void;
  selectNext: () => void;
  selectPrev: () => void;
  setSelectedIndex: (index: number) => void;
  updateTodoDueDate: (id: string, dueDate: number | null) => Promise<void>;
  searchAllTodos: (query: string) => Promise<(Todo & { pageTitle: string })[]>;
  goToPage: (pageId: string) => Promise<void>;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  // Initial State
  pages: [],
  currentPageIndex: 0,
  todos: [],
  selectedIndex: -1,
  editingTodoId: null,
  deletedTodos: [],
  lastDeletedTodo: null,

  // Computed: get current page from pages[currentPageIndex]
  currentPage: () => {
    const state = get();
    return state.pages[state.currentPageIndex];
  },

  // Load all pages, set first as current, load its todos
  loadPages: async () => {
    try {
      await initDb();
      const pages = await getAllPages();

      set({ pages, currentPageIndex: 0, selectedIndex: -1 });

      // Load todos for the first page if it exists
      if (pages.length > 0) {
        const todos = await getTodosByPage(pages[0].id);
        set({ todos });
      } else {
        set({ todos: [] });
      }
    } catch (error) {
      showError("Failed to load pages");
    }
  },

  // Load todos for the current page
  loadTodosForCurrentPage: async () => {
    const state = get();
    const currentPage = state.pages[state.currentPageIndex];

    if (!currentPage) {
      set({ todos: [], selectedIndex: -1 });
      return;
    }

    try {
      const todos = await getTodosByPage(currentPage.id);
      set({ todos, selectedIndex: -1, editingTodoId: null });
    } catch (error) {
      showError("Failed to load tasks");
    }
  },

  // Add a new page
  addPage: async (title: string) => {
    try {
      const newPage = await createPage(title);

      set((state) => ({
        pages: [...state.pages, newPage],
      }));
    } catch (error) {
      showError("Failed to create page");
    }
  },

  // Update page title
  updatePageTitle: async (id: string, title: string) => {
    try {
      await dbUpdatePageTitle(id, title);
      set((state) => ({
        pages: state.pages.map((page) =>
          page.id === id ? { ...page, title } : page
        ),
      }));
    } catch (error) {
      showError("Failed to update title");
    }
  },

  // Delete a page
  deletePage: async (id: string) => {
    try {
      await dbDeletePage(id);

      set((state) => {
        const newPages = state.pages.filter((page) => page.id !== id);
        const newIndex = Math.min(state.currentPageIndex, Math.max(0, newPages.length - 1));
        return {
          pages: newPages,
          currentPageIndex: newIndex,
        };
      });

      // Reload todos for the new current page
      await get().loadTodosForCurrentPage();
    } catch (error) {
      showError("Failed to delete page");
    }
  },

  // Go to next page, or create a new one if at the last page (synchronous for fast UI)
  nextPage: () => {
    const state = get();
    const currentPage = state.pages[state.currentPageIndex];
    const isCurrentPageEmpty = state.todos.length === 0;
    const isNotFirstPage = state.currentPageIndex > 0;

    // If at the last page, create a new one (but not if current page is empty)
    if (state.currentPageIndex >= state.pages.length - 1) {
      if (isCurrentPageEmpty) {
        // At last page and empty - delete if not first page and go back
        if (isNotFirstPage && currentPage) {
          const newPages = state.pages.filter((p) => p.id !== currentPage.id);
          set({
            pages: newPages,
            currentPageIndex: state.currentPageIndex - 1,
          });
          if (!currentPage.id.startsWith("temp-")) {
            dbDeletePage(currentPage.id).catch(() => {
              showError("Failed to delete page");
            });
          }
          get().loadTodosForCurrentPage();
        }
        return;
      }
      const newPageNumber = state.pages.length + 1;
      const tempId = `temp-${Date.now()}`;
      const tempPage: Page = { id: tempId, title: `Page ${newPageNumber}`, order: newPageNumber };

      // Update UI immediately with temp page
      set((s) => ({
        pages: [...s.pages, tempPage],
        currentPageIndex: s.pages.length,
        todos: [],
        selectedIndex: -1,
        editingTodoId: null,
      }));

      // Persist to database in background
      createPage(`Page ${newPageNumber}`).then((realPage) => {
        set((s) => ({
          pages: s.pages.map((p) => (p.id === tempId ? realPage : p)),
        }));
      });
    } else if (isCurrentPageEmpty && isNotFirstPage && currentPage) {
      // Current page is empty and not first - delete it and stay at same index (which now points to next page)
      const newPages = state.pages.filter((p) => p.id !== currentPage.id);

      set({
        pages: newPages,
        // currentPageIndex stays the same, which now points to what was the next page
      });

      // Delete from database in background (skip if temp page)
      if (!currentPage.id.startsWith("temp-")) {
        dbDeletePage(currentPage.id).catch(() => {
          showError("Failed to delete page");
        });
      }

      // Load todos for the new current page (what was the next page)
      get().loadTodosForCurrentPage();
    } else {
      // Go to next existing page
      const newIndex = state.currentPageIndex + 1;
      set({ currentPageIndex: newIndex });
      get().loadTodosForCurrentPage();
    }
  },

  // Go to previous page (do nothing if at the first page)
  // If current page is empty, delete it before moving back
  prevPage: () => {
    const state = get();

    // If at the first page, do nothing
    if (state.currentPageIndex <= 0) {
      return;
    }

    const currentPage = state.pages[state.currentPageIndex];
    const isCurrentPageEmpty = state.todos.length === 0;
    const isNotFirstPage = state.currentPageIndex > 0;

    // If current page is empty and not the first page, delete it
    if (isCurrentPageEmpty && isNotFirstPage && currentPage) {
      // Remove from state immediately
      const newPages = state.pages.filter((p) => p.id !== currentPage.id);
      const newIndex = state.currentPageIndex - 1;

      set({
        pages: newPages,
        currentPageIndex: newIndex,
      });

      // Delete from database in background (skip if temp page)
      if (!currentPage.id.startsWith("temp-")) {
        dbDeletePage(currentPage.id).catch(() => {
          showError("Failed to delete page");
        });
      }

      // Load todos for previous page
      get().loadTodosForCurrentPage();
    } else {
      // Normal navigation to previous page
      const newIndex = state.currentPageIndex - 1;
      set({ currentPageIndex: newIndex });
      get().loadTodosForCurrentPage();
    }
  },

  // Add a new todo to the current page
  addTodo: async (text: string) => {
    const state = get();
    const currentPage = state.pages[state.currentPageIndex];

    if (!currentPage) {
      showError("No page selected");
      return;
    }

    try {
      const newTodo = await createTodo(text, currentPage.id);

      set((state) => ({
        todos: [newTodo, ...state.todos],
      }));
    } catch (error) {
      showError("Failed to add task");
    }
  },

  // Toggle todo done status
  toggleTodo: async (id: string) => {
    try {
      await dbToggleTodo(id);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo
        ),
      }));
    } catch (error) {
      showError("Failed to update task");
    }
  },

  // Delete a todo (saves to undo stack)
  deleteTodo: async (id: string) => {
    const state = get();
    const todoToDelete = state.todos.find((todo) => todo.id === id);

    if (!todoToDelete) return;

    try {
      await dbDeleteTodo(id);
      set((state) => {
        const newTodos = state.todos.filter((todo) => todo.id !== id);
        const newIndex = Math.min(state.selectedIndex, Math.max(0, newTodos.length - 1));
        return {
          todos: newTodos,
          selectedIndex: newIndex,
          editingTodoId: state.editingTodoId === id ? null : state.editingTodoId,
          deletedTodos: [...state.deletedTodos, todoToDelete],
          lastDeletedTodo: todoToDelete,
        };
      });
    } catch (error) {
      showError("Failed to delete task");
    }
  },

  // Undo last delete (Cmd+Z)
  undoDelete: async () => {
    const state = get();
    if (state.deletedTodos.length === 0) return;

    const todoToRestore = state.deletedTodos[state.deletedTodos.length - 1];

    try {
      await dbRestoreTodo(todoToRestore);
      set((state) => {
        const newDeletedTodos = state.deletedTodos.slice(0, -1);
        // Only add to current todos if on the same page
        const isOnSamePage = state.pages[state.currentPageIndex]?.id === todoToRestore.pageId;
        return {
          deletedTodos: newDeletedTodos,
          lastDeletedTodo: null,
          todos: isOnSamePage ? [todoToRestore, ...state.todos] : state.todos,
        };
      });
    } catch (error) {
      showError("Failed to restore task");
    }
  },

  // Clear last deleted (hide undo UI)
  clearLastDeleted: () => {
    set({ lastDeletedTodo: null });
  },

  // Update todo text
  updateTodoText: async (id: string, text: string) => {
    try {
      await dbUpdateTodoText(id, text);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, text } : todo
        ),
      }));
    } catch (error) {
      showError("Failed to update task");
    }
  },

  // Set the currently editing todo
  setEditingTodo: (id: string | null) => {
    set({ editingTodoId: id });
  },

  // Select next todo in the list
  selectNext: () => {
    set((state) => {
      if (state.todos.length === 0) return state;
      // If no selection, select first item
      if (state.selectedIndex < 0) return { selectedIndex: 0 };
      return { selectedIndex: Math.min(state.selectedIndex + 1, state.todos.length - 1) };
    });
  },

  // Select previous todo in the list
  selectPrev: () => {
    set((state) => {
      if (state.todos.length === 0) return state;
      // If no selection, select last item
      if (state.selectedIndex < 0) return { selectedIndex: state.todos.length - 1 };
      return { selectedIndex: Math.max(state.selectedIndex - 1, 0) };
    });
  },

  // Set selected index directly (-1 means no selection)
  setSelectedIndex: (index: number) => {
    set((state) => ({
      selectedIndex: index < 0 ? -1 : Math.min(index, state.todos.length - 1),
    }));
  },

  // Update todo due date
  updateTodoDueDate: async (id: string, dueDate: number | null) => {
    try {
      await dbUpdateTodoDueDate(id, dueDate);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, dueDate } : todo
        ),
      }));
    } catch (error) {
      showError("Failed to update due date");
    }
  },

  // Search all todos across all pages
  searchAllTodos: async (query: string) => {
    try {
      return await dbSearchAllTodos(query);
    } catch (error) {
      showError("Failed to search");
      return [];
    }
  },

  // Navigate to a specific page by ID
  goToPage: async (pageId: string) => {
    const state = get();
    const pageIndex = state.pages.findIndex((p) => p.id === pageId);
    if (pageIndex !== -1) {
      set({ currentPageIndex: pageIndex });
      await get().loadTodosForCurrentPage();
    }
  },
}));
