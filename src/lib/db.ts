import Database from "@tauri-apps/plugin-sql";
import type { Todo, Page } from "../types/todo";

// Database row types (snake_case from SQLite)
interface TodoRow {
  id: string;
  text: string;
  done: number;
  created_at: number;
  page_id: string;
  due_date: number | null;
}

interface PageRow {
  id: string;
  title: string;
  order_num: number;
}

// Singleton database instance
let db: Database | null = null;

/**
 * Get the singleton database connection
 */
export async function getDb(): Promise<Database> {
  if (!db) {
    console.log("[DB] Loading database...");
    db = await Database.load("sqlite:minidot.db");
    console.log("[DB] Database loaded successfully");
  }
  return db;
}

/**
 * Convert a database row to a Todo object (snake_case to camelCase)
 */
function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    done: row.done === 1,
    createdAt: row.created_at,
    pageId: row.page_id,
    dueDate: row.due_date,
  };
}

/**
 * Convert a database row to a Page object (snake_case to camelCase)
 */
function rowToPage(row: PageRow): Page {
  return {
    id: row.id,
    title: row.title,
    order: row.order_num,
  };
}

/**
 * Initialize the database and run migrations
 */
export async function initDb(): Promise<void> {
  const database = await getDb();

  // Create pages table
  console.log("[DB] Creating pages table if not exists...");
  await database.execute(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      order_num INTEGER NOT NULL
    )
  `);

  // Check if todos table exists
  const tableInfo = await database.select<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='todos'"
  );

  if (tableInfo.length === 0) {
    // Create todos table with page_id from scratch
    console.log("[DB] Creating todos table with page_id...");
    await database.execute(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        done INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        page_id TEXT NOT NULL
      )
    `);
  } else {
    // Check if page_id column exists
    const columns = await database.select<{ name: string }[]>(
      "PRAGMA table_info(todos)"
    );
    const hasPageId = columns.some((col) => col.name === "page_id");

    if (!hasPageId) {
      console.log("[DB] Migrating todos table: adding page_id column...");
      // Add page_id column with a default value (will be updated after default page creation)
      await database.execute(
        "ALTER TABLE todos ADD COLUMN page_id TEXT NOT NULL DEFAULT 'default'"
      );
      console.log("[DB] Migration complete: page_id column added");
    }

    // Check if due_date column exists
    const hasDueDate = columns.some((col) => col.name === "due_date");
    if (!hasDueDate) {
      console.log("[DB] Migrating todos table: adding due_date column...");
      await database.execute(
        "ALTER TABLE todos ADD COLUMN due_date INTEGER DEFAULT NULL"
      );
      console.log("[DB] Migration complete: due_date column added");
    }
  }

  // Create default page if no pages exist
  const pages = await database.select<PageRow[]>("SELECT * FROM pages");
  if (pages.length === 0) {
    console.log("[DB] Creating default 'Tasks' page...");
    const defaultPageId = crypto.randomUUID();
    await database.execute(
      "INSERT INTO pages (id, title, order_num) VALUES ($1, $2, $3)",
      [defaultPageId, "Tasks", 0]
    );

    // Update any existing todos with 'default' page_id to use the new default page
    await database.execute(
      "UPDATE todos SET page_id = $1 WHERE page_id = 'default'",
      [defaultPageId]
    );
    console.log("[DB] Default page created with id:", defaultPageId);
  }
}

// ============================================
// Page CRUD functions
// ============================================

/**
 * Get all pages ordered by order_num
 */
export async function getAllPages(): Promise<Page[]> {
  console.log("[DB] getAllPages called");
  const database = await getDb();
  const rows = await database.select<PageRow[]>(
    "SELECT * FROM pages ORDER BY order_num ASC"
  );
  console.log("[DB] getAllPages returning", rows.length, "pages");
  return rows.map(rowToPage);
}

/**
 * Create a new page
 */
export async function createPage(title: string): Promise<Page> {
  console.log("[DB] createPage called with:", title);
  const database = await getDb();
  const id = crypto.randomUUID();

  // Get the max order_num to place new page at the end
  const result = await database.select<{ max_order: number | null }[]>(
    "SELECT MAX(order_num) as max_order FROM pages"
  );
  const maxOrder = result[0]?.max_order ?? -1;
  const newOrder = maxOrder + 1;

  console.log("[DB] Executing INSERT for page...");
  await database.execute(
    "INSERT INTO pages (id, title, order_num) VALUES ($1, $2, $3)",
    [id, title, newOrder]
  );
  console.log("[DB] Page INSERT completed successfully");

  return {
    id,
    title,
    order: newOrder,
  };
}

/**
 * Update a page's title
 */
export async function updatePageTitle(id: string, title: string): Promise<void> {
  console.log("[DB] updatePageTitle called with:", id, title);
  const database = await getDb();
  await database.execute(
    "UPDATE pages SET title = $1 WHERE id = $2",
    [title, id]
  );
  console.log("[DB] Page title updated successfully");
}

/**
 * Delete a page and all its todos
 */
export async function deletePage(id: string): Promise<void> {
  console.log("[DB] deletePage called with:", id);
  const database = await getDb();

  // Delete all todos in this page first
  console.log("[DB] Deleting todos for page:", id);
  await database.execute("DELETE FROM todos WHERE page_id = $1", [id]);

  // Delete the page
  console.log("[DB] Deleting page:", id);
  await database.execute("DELETE FROM pages WHERE id = $1", [id]);
  console.log("[DB] Page and its todos deleted successfully");
}

// ============================================
// Todo CRUD functions
// ============================================

/**
 * Get all todos for a specific page ordered by creation date (newest first)
 */
export async function getTodosByPage(pageId: string): Promise<Todo[]> {
  console.log("[DB] getTodosByPage called with pageId:", pageId);
  const database = await getDb();
  const rows = await database.select<TodoRow[]>(
    "SELECT * FROM todos WHERE page_id = $1 ORDER BY created_at DESC",
    [pageId]
  );
  console.log("[DB] getTodosByPage returning", rows.length, "todos");
  return rows.map(rowToTodo);
}

/**
 * Create a new todo in a specific page
 */
export async function createTodo(text: string, pageId: string, dueDate: number | null = null): Promise<Todo> {
  const database = await getDb();
  const id = crypto.randomUUID();
  const createdAt = Date.now();

  await database.execute(
    "INSERT INTO todos (id, text, done, created_at, page_id, due_date) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, text, 0, createdAt, pageId, dueDate]
  );

  return {
    id,
    text,
    done: false,
    createdAt,
    pageId,
    dueDate,
  };
}

/**
 * Update a todo's text
 */
export async function updateTodoText(id: string, text: string): Promise<void> {
  console.log("[DB] updateTodoText called with:", id, text);
  const database = await getDb();
  await database.execute(
    "UPDATE todos SET text = $1 WHERE id = $2",
    [text, id]
  );
  console.log("[DB] Todo text updated successfully");
}

/**
 * Toggle the done status of a todo
 */
export async function toggleTodo(id: string): Promise<void> {
  const database = await getDb();
  await database.execute(
    "UPDATE todos SET done = NOT done WHERE id = $1",
    [id]
  );
}

/**
 * Delete a todo by id
 */
export async function deleteTodo(id: string): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM todos WHERE id = $1", [id]);
}

/**
 * Restore a deleted todo (insert with all original data)
 */
export async function restoreTodo(todo: Todo): Promise<void> {
  const database = await getDb();
  await database.execute(
    "INSERT INTO todos (id, text, done, created_at, page_id, due_date) VALUES ($1, $2, $3, $4, $5, $6)",
    [todo.id, todo.text, todo.done ? 1 : 0, todo.createdAt, todo.pageId, todo.dueDate]
  );
}

/**
 * Update a todo's due date
 */
export async function updateTodoDueDate(id: string, dueDate: number | null): Promise<void> {
  const database = await getDb();
  await database.execute(
    "UPDATE todos SET due_date = $1 WHERE id = $2",
    [dueDate, id]
  );
}

/**
 * Search all todos across all pages
 */
export async function searchAllTodos(query: string): Promise<(Todo & { pageTitle: string })[]> {
  const database = await getDb();
  const rows = await database.select<(TodoRow & { page_title: string })[]>(
    `SELECT t.*, p.title as page_title
     FROM todos t
     JOIN pages p ON t.page_id = p.id
     WHERE t.text LIKE $1
     ORDER BY t.created_at DESC`,
    [`%${query}%`]
  );
  return rows.map((row) => ({
    ...rowToTodo(row),
    pageTitle: row.page_title,
  }));
}

/**
 * Get todos with upcoming due dates (within next 24 hours)
 */
export async function getTodosWithUpcomingDueDates(): Promise<Todo[]> {
  const database = await getDb();
  const now = Date.now();
  const next24Hours = now + 24 * 60 * 60 * 1000;

  const rows = await database.select<TodoRow[]>(
    `SELECT * FROM todos
     WHERE due_date IS NOT NULL
     AND due_date > $1
     AND due_date <= $2
     AND done = 0
     ORDER BY due_date ASC`,
    [now, next24Hours]
  );
  return rows.map(rowToTodo);
}
