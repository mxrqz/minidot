import { useEffect, useRef } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { getTodosWithUpcomingDueDates } from "../lib/db";

const NOTIFICATION_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes
const NOTIFIED_KEY = "minidot_notified_todos";

function getNotifiedTodos(): Set<string> {
  try {
    const stored = localStorage.getItem(NOTIFIED_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Clean old entries (older than 24 hours)
      const now = Date.now();
      const cleaned: Record<string, number> = {};
      for (const [id, timestamp] of Object.entries(parsed)) {
        if (now - (timestamp as number) < 24 * 60 * 60 * 1000) {
          cleaned[id] = timestamp as number;
        }
      }
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify(cleaned));
      return new Set(Object.keys(cleaned));
    }
  } catch {
    // Ignore errors
  }
  return new Set();
}

function markAsNotified(todoId: string) {
  try {
    const stored = localStorage.getItem(NOTIFIED_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[todoId] = Date.now();
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore errors
  }
}

export function useNotifications() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAndNotify = async () => {
      if (!mounted) return;

      try {
        // Check permission
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          const permission = await requestPermission();
          permissionGranted = permission === "granted";
        }

        if (!permissionGranted) return;

        // Get todos with upcoming due dates
        const upcomingTodos = await getTodosWithUpcomingDueDates();
        const notifiedTodos = getNotifiedTodos();

        for (const todo of upcomingTodos) {
          if (notifiedTodos.has(todo.id)) continue;

          const dueDate = new Date(todo.dueDate!);
          const now = new Date();
          const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

          // Notify if due within 2 hours
          if (hoursUntilDue <= 2) {
            const timeText = hoursUntilDue <= 1
              ? "due in less than 1 hour"
              : `due in ${Math.round(hoursUntilDue)} hours`;

            sendNotification({
              title: "Task Reminder",
              body: `"${todo.text}" is ${timeText}`,
            });

            markAsNotified(todo.id);
          }
        }
      } catch (error) {
        console.error("Notification check failed:", error);
      }
    };

    // Initial check after a short delay
    const timeout = setTimeout(checkAndNotify, 5000);

    // Periodic checks
    intervalRef.current = setInterval(checkAndNotify, NOTIFICATION_INTERVAL);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
