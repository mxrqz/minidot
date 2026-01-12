export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  pageId: string;
  dueDate: number | null; // Unix timestamp or null
}

export interface Page {
  id: string;
  title: string;
  order: number;
}
