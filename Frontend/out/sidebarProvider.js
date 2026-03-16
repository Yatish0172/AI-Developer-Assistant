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
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const api_1 = require("./api");
class SidebarProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri,
                vscode.Uri.joinPath(this._extensionUri, 'Frontend'),
            ],
        };
        webviewView.webview.html = this._getHtml();
        webviewView.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'runTask':
                    await this._handleTask(msg.task, msg.code, msg.language);
                    break;
                case 'diagram':
                    await this._handleDiagram(msg.code);
                    break;
                case 'getHistory':
                    await this._sendHistory();
                    break;
                case 'clearHistory':
                    await this._clearHistory();
                    break;
                case 'getEditorCode':
                    this._sendEditorCode();
                    break;
                case 'applyToEditor':
                    this._applyToEditor(msg.code);
                    break;
                case 'voiceCommand':
                    await this._handleVoice(msg.fileData, msg.fileName, msg.code);
                    break;
            }
        });
    }
    /** Called from commands to push a task into the webview. */
    async runTask(task, code, language) {
        if (!this._view) {
            return;
        }
        this._view.show(true);
        this._view.webview.postMessage({ command: 'startTask', task, code });
        await this._handleTask(task, code, language);
    }
    async runDiagram(code) {
        if (!this._view) {
            return;
        }
        this._view.show(true);
        this._view.webview.postMessage({ command: 'diagramStart' });
        await this._handleDiagram(code);
    }
    async _handleTask(task, code, language) {
        this._post({ command: 'streamStart', task });
        try {
            await (0, api_1.streamRequest)(task, { code, language: language || null }, (chunk) => this._post({ command: 'streamChunk', chunk }));
        }
        catch (err) {
            this._post({ command: 'streamError', message: String(err) });
            return;
        }
        this._post({ command: 'streamEnd' });
    }
    async _handleDiagram(code) {
        this._post({ command: 'diagramStart' });
        try {
            const result = await (0, api_1.jsonRequest)('diagram', { code });
            this._post({ command: 'diagramReady', mermaid: result.diagram });
        }
        catch (err) {
            this._post({ command: 'streamError', message: String(err) });
        }
    }
    async _sendHistory() {
        try {
            const history = await (0, api_1.getRequest)('history');
            this._post({ command: 'historyData', history });
        }
        catch (err) {
            this._post({ command: 'streamError', message: String(err) });
        }
    }
    async _clearHistory() {
        try {
            await (0, api_1.deleteRequest)('history/deleteall');
            this._post({ command: 'historyClearedOk' });
        }
        catch (err) {
            this._post({ command: 'streamError', message: String(err) });
        }
    }
    _sendEditorCode() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._post({ command: 'noEditor' });
            return;
        }
        const selection = editor.selection;
        const code = selection.isEmpty
            ? editor.document.getText()
            : editor.document.getText(selection);
        const language = editor.document.languageId;
        this._post({ command: 'editorCode', code, language });
    }
    _applyToEditor(code) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        editor.edit((eb) => {
            const selection = editor.selection;
            if (selection.isEmpty) {
                const full = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
                eb.replace(full, code);
            }
            else {
                eb.replace(selection, code);
            }
        });
    }
    async _handleVoice(fileData, fileName, code) {
        const cfg = vscode.workspace.getConfiguration('aiAssistant');
        const apiUrl = (cfg.get('apiUrl') || 'http://127.0.0.1:8000').replace(/\/$/, '');
        const apiKey = cfg.get('apiKey') || '';
        try {
            const base64 = fileData.split(',')[1];
            const buffer = Buffer.from(base64, 'base64');
            const ext = fileName.endsWith('.mp3') ? '.mp3' : '.wav';
            const tmpPath = path.join(require('os').tmpdir(), `voice_cmd_${Date.now()}${ext}`);
            fs.writeFileSync(tmpPath, buffer);
            const boundary = `----FormBoundary${Date.now()}`;
            const fileBuffer = fs.readFileSync(tmpPath);
            const mimeType = ext === '.mp3' ? 'audio/mpeg' : 'audio/wav';
            const bodyParts = [];
            const addField = (name, value) => {
                bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
            };
            const addFile = (name, fn, mime, data) => {
                bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${fn}"\r\nContent-Type: ${mime}\r\n\r\n`));
                bodyParts.push(data);
                bodyParts.push(Buffer.from('\r\n'));
            };
            addField('code', code);
            addFile('file', fileName, mimeType, fileBuffer);
            bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
            const bodyBuffer = Buffer.concat(bodyParts);
            const http = require('http');
            const https = require('https');
            const url = new URL(`${apiUrl}/voice-command`);
            const lib = url.protocol === 'https:' ? https : http;
            const responseText = await new Promise((resolve, reject) => {
                let raw = '';
                const req = lib.request({
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    path: url.pathname,
                    method: 'POST',
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${boundary}`,
                        'Content-Length': bodyBuffer.length,
                        'x-api-key': apiKey,
                    },
                }, (res) => {
                    if (res.statusCode && res.statusCode >= 400) {
                        reject(new Error(`Backend returned ${res.statusCode}`));
                        return;
                    }
                    res.on('data', (c) => (raw += c.toString()));
                    res.on('end', () => resolve(raw));
                    res.on('error', reject);
                });
                req.on('error', reject);
                req.write(bodyBuffer);
                req.end();
            });
            fs.unlinkSync(tmpPath);
            this._post({ command: 'voiceResult', text: responseText });
        }
        catch (err) {
            this._post({ command: 'voiceError', message: err.message || String(err) });
        }
    }
    _post(msg) {
        this._view?.webview.postMessage(msg);
    }
    /** Load HTML from Frontend/sidebar.html at runtime */
    _getHtml() {
        const htmlPath = path.join(this._extensionUri.fsPath, 'Frontend', 'sidebar.html');
        return fs.readFileSync(htmlPath, 'utf8');
    }
}
exports.SidebarProvider = SidebarProvider;
SidebarProvider.viewId = 'aiAssistant.sidebarPanel';
//# sourceMappingURL=sidebarProvider.js.map