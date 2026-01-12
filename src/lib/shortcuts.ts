import {
  register,
  isRegistered,
  unregister,
} from "@tauri-apps/plugin-global-shortcut";
import { toggleWindow } from "./windowBehavior";

const GLOBAL_SHORTCUT = "CommandOrControl+Shift+Space";

/**
 * Register the global shortcut for toggling window visibility.
 * Handles the case where the shortcut might already be registered.
 */
export async function registerGlobalShortcut(): Promise<void> {
  try {
    // Check if shortcut is already registered
    const alreadyRegistered = await isRegistered(GLOBAL_SHORTCUT);

    if (alreadyRegistered) {
      // Unregister first to ensure we have the latest handler
      await unregister(GLOBAL_SHORTCUT);
    }

    // Register the shortcut with our handler
    await register(GLOBAL_SHORTCUT, async (event) => {
      // Only trigger on key down to avoid double-firing
      if (event.state === "Pressed") {
        await toggleWindow();
      }
    });

    console.log(`Global shortcut "${GLOBAL_SHORTCUT}" registered successfully`);
  } catch (error) {
    console.error("Failed to register global shortcut:", error);
  }
}

/**
 * Unregister the global shortcut (useful for cleanup)
 */
export async function unregisterGlobalShortcut(): Promise<void> {
  try {
    const alreadyRegistered = await isRegistered(GLOBAL_SHORTCUT);
    if (alreadyRegistered) {
      await unregister(GLOBAL_SHORTCUT);
      console.log(`Global shortcut "${GLOBAL_SHORTCUT}" unregistered`);
    }
  } catch (error) {
    console.error("Failed to unregister global shortcut:", error);
  }
}
