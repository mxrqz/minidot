import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Window behavior module for menu bar popup-style window management.
 *
 * This module handles:
 * - Hiding the window when it loses focus (blur behavior)
 * - Preventing immediate re-hide after showing the window
 * - Cleanup of event listeners
 * - Window animations
 */

// Debounce delay to prevent immediate re-hide when window is shown
const BLUR_DEBOUNCE_MS = 100;

// Track whether we should ignore blur events (e.g., right after showing)
let ignoreBlurUntil = 0;

// Store the unlisten function for cleanup
let unlistenFocusChanged: (() => void) | null = null;

/**
 * Trigger opening animation
 */
const triggerOpenAnimation = () => {
  const container = document.getElementById("app-container");
  if (container) {
    container.style.opacity = "";
    container.style.transform = "";
    container.classList.remove("window-open", "window-close");
    void container.offsetWidth;
    container.classList.add("window-open");
  }
};

/**
 * Trigger closing animation and return promise that resolves when done
 */
const triggerCloseAnimation = (): Promise<void> => {
  return new Promise((resolve) => {
    const container = document.getElementById("app-container");
    if (container) {
      container.classList.remove("window-open");
      container.classList.add("window-close");
      setTimeout(() => {
        container.classList.remove("window-close");
        container.style.opacity = "0";
        container.style.transform = "scale(0)";
        resolve();
      }, 120);
    } else {
      resolve();
    }
  });
};

/**
 * Temporarily disable blur-to-hide behavior.
 * Call this before showing the window to prevent immediate re-hide.
 *
 * @param durationMs - How long to ignore blur events (default: 200ms)
 */
export function pauseBlurHide(durationMs = 200): void {
  ignoreBlurUntil = Date.now() + durationMs;
}

/**
 * Show the window with animation and temporarily disable blur-hide.
 */
export async function showWindow(): Promise<void> {
  const window = getCurrentWindow();

  // Pause blur handling before showing to prevent immediate re-hide
  pauseBlurHide(300);

  await window.show();
  await window.setFocus();
  triggerOpenAnimation();
}

/**
 * Hide the window with animation.
 */
export async function hideWindow(): Promise<void> {
  await triggerCloseAnimation();
  const window = getCurrentWindow();
  await window.hide();
}

/**
 * Setup window behavior for menu bar popup style.
 *
 * The window will:
 * - Hide when it loses focus (like clicking outside)
 * - Not quit when hidden
 * - Be showable again via tray icon or global shortcut
 *
 * @returns A cleanup function to remove event listeners
 */
export async function setupWindowBehavior(): Promise<() => void> {
  const window = getCurrentWindow();

  // Set up focus change listener
  unlistenFocusChanged = await window.onFocusChanged(({ payload: focused }) => {
    if (!focused) {
      // Window lost focus - check if we should hide

      // Skip if we're in the debounce period (window was just shown)
      if (Date.now() < ignoreBlurUntil) {
        return;
      }

      // Small delay to handle edge cases like:
      // - System dialogs opening
      // - Context menus appearing
      // - Drag operations
      setTimeout(async () => {
        // Re-check the blur ignore flag in case it was set during the timeout
        if (Date.now() < ignoreBlurUntil) {
          return;
        }

        // Check if window is still unfocused before hiding
        const stillFocused = await window.isFocused();
        if (!stillFocused) {
          await hideWindow();
        }
      }, BLUR_DEBOUNCE_MS);
    }
  });

  // Return cleanup function
  return () => {
    if (unlistenFocusChanged) {
      unlistenFocusChanged();
      unlistenFocusChanged = null;
    }
  };
}

/**
 * Toggle window visibility.
 * If visible, hide it. If hidden, show it.
 */
export async function toggleWindow(): Promise<void> {
  const window = getCurrentWindow();
  const isVisible = await window.isVisible();

  if (isVisible) {
    await hideWindow();
  } else {
    await showWindow();
  }
}
