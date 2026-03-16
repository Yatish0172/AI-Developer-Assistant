# ⚡ AI Developer Assistant — VS Code Extension

A fully-featured VS Code extension that connects to your FastAPI + Ollama backend to give you AI-powered code assistance directly inside the editor.

---

## 📁 Project Structure

```
ai-developer-assistant/
├── src/
│   ├── extension.ts      ← Main entry point, all command registration
│   ├── api.ts            ← HTTP client (streaming + JSON requests)
│   ├── sidebar.ts        ← Sidebar webview HTML (the panel UI)
│   └── diagramPanel.ts   ← Flowchart webview HTML (Mermaid renderer)
├── media/
│   └── sidebar-icon.svg  ← Activity bar icon
├── package.json          ← Extension manifest + commands + keybindings
├── tsconfig.json         ← TypeScript config
└── .vscodeignore
```

---

## 🚀 Setup (One Time)

### Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **VS Code** 1.85+
- Your **backend running**: `uvicorn main:app --reload` in the `backend/` folder

### Steps

```bash
# 1. Go into the extension folder
cd ai-developer-assistant

# 2. Install dependencies
npm install

# 3. Compile TypeScript
npm run compile
```

---

## 🧪 Run in Development

1. Open the `ai-developer-assistant/` folder in VS Code:
   ```bash
   code .
   ```
2. Press **F5** — this launches a new VS Code window with your extension loaded.
3. In the new window, open any code file.

---

## ⚙️ Configuration

Go to **Settings → Extensions → AI Developer Assistant**:

| Setting | Default | Description |
|---|---|---|
| `aiAssistant.apiUrl` | `http://127.0.0.1:8000` | URL of your FastAPI backend |
| `aiAssistant.apiKey` | *(empty)* | The API key you set in your `.env` file |

Or add to `settings.json`:
```json
{
  "aiAssistant.apiUrl": "http://127.0.0.1:8000",
  "aiAssistant.apiKey": "YourCustomAPIKey123"
}
```

---

## ✨ Features & How to Use

### Sidebar Panel
Click the **⚡ lightning bolt icon** in the Activity Bar (left side) to open the panel.

- Select code in the editor (or leave cursor anywhere for full file)
- Click any action button in the sidebar
- Output streams directly in the panel

### Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Explain | `Ctrl+Alt+E` |
| Debug | `Ctrl+Alt+D` |
| Optimize | `Ctrl+Alt+O` |
| Add Comments | `Ctrl+Alt+C` |
| Generate Flowchart | `Ctrl+Alt+F` |
| Convert Language | `Ctrl+Alt+V` |

### Right-Click Context Menu
Right-click on any code → look for **AI:** entries in the menu.

### Command Palette
Press `Ctrl+Shift+P` → type **AI:** to see all commands.

### Flowchart
Running **Generate Flowchart** opens a live Mermaid diagram in a side panel. The raw Mermaid code is shown below the diagram and can be copied.

### Voice Command
1. Click "Choose audio file" in the sidebar
2. Select a `.wav` or `.mp3` file where you say: "explain", "debug", or "optimize"
3. Click **Send Voice Command** — the active file's code is sent along with your audio

---

## 📦 Package as `.vsix` (Install Permanently)

```bash
# Install vsce globally
npm install -g @vscode/vsce

# Package the extension
vsce package

# Install from the .vsix file
code --install-extension ai-developer-assistant-1.0.0.vsix
```

---

## 🛠 Development Tips

- **Watch mode**: Run `npm run watch` to auto-recompile on changes
- **Reload**: After making changes, press `Ctrl+Shift+P` → "Developer: Reload Window" in the Extension Development Host
- **Logs**: Open **Output** panel → select "AI Developer Assistant" from the dropdown
- **Backend must be running** before using any feature

---

## 🔌 Backend Endpoints Used

| Feature | Endpoint |
|---|---|
| Explain | `POST /explain` |
| Debug | `POST /debug` |
| Optimize | `POST /optimize` |
| Comment | `POST /comment` |
| Convert | `POST /convert` |
| Flowchart | `POST /diagram` |
| Voice | `POST /voice-command` (multipart) |

All requests include `x-api-key` header from your settings.

---

## Author
**Yatish Sharma** — AI & Full-Stack Developer, UPES Dehradun  
© 2025 Yatish Sharma. MIT License.
