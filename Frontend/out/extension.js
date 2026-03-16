"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const api_1 = require("./api");
const sidebarProvider_1 = require("./sidebarProvider");
const diagramPanel_1 = require("./diagramPanel");
// ─── Output Channel ──────────────────────────────────────────────────────────
let outputChannel;
let extensionUri;
// ─── Editor Helpers ───────────────────────────────────────────────────────────
function getActiveCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return undefined;
    }
    const sel = editor.selection;
    return sel.isEmpty ? editor.document.getText() : editor.document.getText(sel);
}
function getLanguage() {
    return vscode.window.activeTextEditor?.document.languageId;
}
// ─── Diagram Panel ────────────────────────────────────────────────────────────
function openDiagramPanel(mermaidCode) {
    const panel = vscode.window.createWebviewPanel("aiDiagram", "AI Flowchart", vscode.ViewColumn.Beside, { enableScripts: true });
    // Pass extensionUri so getDiagramHtml can locate Frontend/diagramPanel.html
    panel.webview.html = (0, diagramPanel_1.getDiagramHtml)(extensionUri, mermaidCode);
}
// ─── Output-channel Runners (keyboard shortcuts / command palette) ────────────
async function runTaskInOutput(task) {
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
            const result = await (0, api_1.jsonRequest)("diagram", {
                code,
                language: getLanguage(),
            });
            openDiagramPanel(result?.diagram || String(result));
            outputChannel.appendLine("✓ Flowchart opened in side panel.");
        }
        catch (err) {
            outputChannel.appendLine(`❌ Error: ${err.message}`);
        }
        return;
    }
    try {
        await (0, api_1.streamRequest)(task, { code, language: getLanguage() }, (chunk) => outputChannel.append(chunk));
        outputChannel.appendLine("\n\n═══ Done ═══");
    }
    catch (err) {
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
    if (!target) {
        return;
    }
    outputChannel.clear();
    outputChannel.show(true);
    outputChannel.appendLine(`═══ Converting to ${target} ═══\n`);
    try {
        await (0, api_1.streamRequest)("convert", { code, language: target }, (chunk) => outputChannel.append(chunk));
        outputChannel.appendLine("\n\n═══ Done ═══");
    }
    catch (err) {
        outputChannel.appendLine(`\n❌ Error: ${err.message}`);
    }
}
// ─── Extension Activate ───────────────────────────────────────────────────────
function activate(context) {
    extensionUri = context.extensionUri;
    outputChannel = vscode.window.createOutputChannel("AI Developer Assistant");
    // ── Sidebar ──────────────────────────────────────────────────────────────
    const sidebarProvider = new sidebarProvider_1.SidebarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebarProvider_1.SidebarProvider.viewId, sidebarProvider));
    // ── Helper ───────────────────────────────────────────────────────────────
    const register = (id, fn) => context.subscriptions.push(vscode.commands.registerCommand(id, fn));
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
        vscode.window.showInformationMessage("⚡ AI Assistant: Open the sidebar and go to the Voice tab to record a command.");
    });
    // ── Clear history ─────────────────────────────────────────────────────────
    register("aiAssistant.clearHistory", async () => {
        const answer = await vscode.window.showWarningMessage("Clear ALL conversation history from MongoDB?", { modal: true }, "Yes, Clear All");
        if (answer !== "Yes, Clear All") {
            return;
        }
        try {
            await (0, api_1.deleteRequest)("history/deleteall");
            vscode.window.showInformationMessage("✓ All conversation history cleared.");
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to clear history: ${err.message}`);
        }
    });
    vscode.window.showInformationMessage("⚡ AI Developer Assistant is ready!");
}
function deactivate() { }
//# sourceMappingURL=extension.js.map