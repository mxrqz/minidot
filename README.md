# minidot

A minimal menu bar TODO app.

![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-0078D6?style=flat&logo=windows&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat&logo=linux&logoColor=black)
![Tauri](https://img.shields.io/badge/Tauri-24C8D8?style=flat&logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)

## Installation

Download the latest release from [GitHub Releases](https://github.com/mxrqz/minidot/releases).

### macOS

1. Download the `.dmg` file
2. Open and drag to Applications
3. First launch (unsigned app):
   - Try to open normally (it will fail)
   - Go to **System Settings → Privacy & Security**
   - Scroll down to find the warning about the app
   - Click **"Open Anyway"**

### Windows

1. Download the `.msi` or `.exe` file
2. Run the installer
3. First launch: Click "More info" → "Run anyway" (SmartScreen warning)

### Linux

1. Download the `.deb` or `.AppImage` file
2. For `.deb`: `sudo dpkg -i minidot_*.deb`
3. For `.AppImage`: `chmod +x minidot_*.AppImage && ./minidot_*.AppImage`

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
