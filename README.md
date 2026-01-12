# minidot

A minimal menu bar TODO app for macOS.

![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8D8?style=flat&logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)

## Features

- **Menu bar app** — Lives in your tray, out of the way
- **Multiple pages** — Organize tasks into separate lists
- **Keyboard-first** — Navigate and manage tasks without touching the mouse
- **Due dates** — Set deadlines with native notifications
- **Search** — Find tasks across all pages instantly
- **Themes** — Light, Dark, or follow system preference
- **Autostart** — Optionally launch at login

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Option + Shift + Space` | Open/close app |
| `Option + ←/→` | Switch pages |
| `↑/↓` | Navigate tasks |
| `Enter` | Add task / Edit selected |
| `Cmd + Enter` | Toggle done |
| `Backspace` | Delete task |
| `Cmd + Z` | Undo delete |
| `Cmd + F` | Search |
| `Cmd + ,` | Settings |
| `Cmd + /` | Help |
| `Esc` | Close window |

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run tauri dev

# Build for production
bun run tauri build
```

## Tech Stack

- [Tauri v2](https://tauri.app) — Native app framework
- [React 19](https://react.dev) — UI library
- [TypeScript](https://typescriptlang.org) — Type safety
- [Zustand](https://zustand-demo.pmnd.rs) — State management
- [Tailwind CSS](https://tailwindcss.com) — Styling
- SQLite — Local persistence

## License

MIT
