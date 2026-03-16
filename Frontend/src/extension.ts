import * as vscode from "vscode";
import { streamRequest, jsonRequest, deleteRequest } from "./api";
import { SidebarProvider } from "./sidebarProvider";
import { getDiagramHtml } from "./diagramPanel";

// ─── Output Channel ──────────────────────────────────────────────────────────

let outputChannel: vscode.OutputChannel;
let extensionUri: vscode.Uri;

// ─── Editor Helpers ───────────────────────────────────────────────────────────

function getActiveCode(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return undefined; }
  const sel = editor.selection;
  return sel.isEmpty ? editor.document.getText() : editor.document.getText(sel);
}

function getLanguage(): string | undefined {
  return vscode.window.activeTextEditor?.document.languageId;
}

// ─── Diagram Panel ────────────────────────────────────────────────────────────

function openDiagramPanel(mermaidCode: string) {
  const panel = vscode.window.createWebviewPanel(
    "aiDiagram",
    "AI Flowchart",
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );
  // Pass extensionUri so getDiagramHtml can locate Frontend/diagramPanel.html
  panel.webview.html = getDiagramHtml(extensionUri, mermaidCode);
}

// ─── Output-channel Runners (keyboard shortcuts / command palette) ────────────

async function runTaskInOutput(task: string) {
  const code = getActiveCode();
  if (!code?.trim()) {
    vscode.window.showWarningMessage("AI Assistant: No code selected or file is empty.");
    return;
  }

  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine(`═══ AI Developer Assistant · ${task.toUpperCase()} ═══\n`);

  if (task === "diagram") {
    try {
      outputChannel.appendLine("Generating flowchart…");
      const result = await jsonRequest<{ diagram: string }>("diagram", {
        code,
        language: getLanguage(),
      });
      openDiagramPanel(result?.diagram || String(result));
      outputChannel.appendLine("✓ Flowchart opened in side panel.");
    } catch (err: any) {
      outputChannel.appendLine(`❌ Error: ${err.message}`);
    }
    return;
  }

  try {
    await streamRequest(
      task,
      { code, language: getLanguage() },
      (chunk) => outputChannel.append(chunk)
    );
    outputChannel.appendLine("\n\n═══ Done ═══");
  } catch (err: any) {
    outputChannel.appendLine(`\n❌ Error: ${err.message}`);
  }
}

async function runConvertInOutput() {
  const code = getActiveCode();
  if (!code?.trim()) {
    vscode.window.showWarningMessage("AI Assistant: No code selected or file is empty.");
    return;
  }

  const languages = [
    "Python", "JavaScript", "TypeScript", "Java",
    "C++", "C#", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby",
  ];
  const target = await vscode.window.showQuickPick(languages, {
    placeHolder: "Select target language",
  });
  if (!target) { return; }

  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine(`═══ Converting to ${target} ═══\n`);

  try {
    await streamRequest("convert", { code, language: target }, (chunk) =>
      outputChannel.append(chunk)
    );
    outputChannel.appendLine("\n\n═══ Done ═══");
  } catch (err: any) {
    outputChannel.appendLine(`\n❌ Error: ${err.message}`);
  }
}

// ─── Extension Activate ───────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  extensionUri = context.extensionUri;
  outputChannel = vscode.window.createOutputChannel("AI Developer Assistant");

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, sidebarProvider)
  );

  // ── Helper ───────────────────────────────────────────────────────────────
  const register = (id: string, fn: () => void | Promise<void>) =>
    context.subscriptions.push(vscode.commands.registerCommand(id, fn));

  // ── Core code commands ───────────────────────────────────────────────────
  register("aiAssistant.explain", () => runTaskInOutput("explain"));
  register("aiAssistant.debug", () => runTaskInOutput("debug"));
  register("aiAssistant.optimize", () => runTaskInOutput("optimize"));
  register("aiAssistant.comment", () => runTaskInOutput("comment"));
  register("aiAssistant.diagram", () => runTaskInOutput("diagram"));
  register("aiAssistant.convert", () => runConvertInOutput());

  // ── Open sidebar panel ───────────────────────────────────────────────────

  register("aiAssistant.openPanel", () => {
    void vscode.commands.executeCommand("workbench.view.extension.aiAssistant");
  });

  // ── Voice command ─────────────────────────────────────────────────────────
  register("aiAssistant.voiceCommand", async () => {
    await vscode.commands.executeCommand("workbench.view.extension.aiAssistant");
    vscode.window.showInformationMessage(
      "⚡ AI Assistant: Open the sidebar and go to the Voice tab to record a command."
    );
  });

  // ── Clear history ─────────────────────────────────────────────────────────
  register("aiAssistant.clearHistory", async () => {
    const answer = await vscode.window.showWarningMessage(
      "Clear ALL conversation history from MongoDB?",
      { modal: true },
      "Yes, Clear All"
    );
    if (answer !== "Yes, Clear All") { return; }
    try {
      await deleteRequest("history/deleteall");
      vscode.window.showInformationMessage("✓ All conversation history cleared.");
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to clear history: ${err.message}`);
    }
  });

  vscode.window.showInformationMessage("⚡ AI Developer Assistant is ready!");
}

export function deactivate() { }
