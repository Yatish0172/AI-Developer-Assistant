import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { streamRequest, jsonRequest, getRequest, deleteRequest } from './api';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'aiAssistant.sidebarPanel';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
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
  public async runTask(task: string, code: string, language?: string) {
    if (!this._view) { return; }
    this._view.show(true);
    this._view.webview.postMessage({ command: 'startTask', task, code });
    await this._handleTask(task, code, language);
  }

  public async runDiagram(code: string) {
    if (!this._view) { return; }
    this._view.show(true);
    this._view.webview.postMessage({ command: 'diagramStart' });
    await this._handleDiagram(code);
  }

  private async _handleTask(task: string, code: string, language?: string) {
    this._post({ command: 'streamStart', task });
    try {
      await streamRequest(
        task,
        { code, language: language || null },
        (chunk) => this._post({ command: 'streamChunk', chunk })
      );
    } catch (err) {
      this._post({ command: 'streamError', message: String(err) });
      return;
    }
    this._post({ command: 'streamEnd' });
  }

  private async _handleDiagram(code: string) {
    this._post({ command: 'diagramStart' });
    try {
      const result = await jsonRequest<{ diagram: string }>('diagram', { code });
      this._post({ command: 'diagramReady', mermaid: result.diagram });
    } catch (err) {
      this._post({ command: 'streamError', message: String(err) });
    }
  }

  private async _sendHistory() {
    try {
      const history = await getRequest('history');
      this._post({ command: 'historyData', history });
    } catch (err) {
      this._post({ command: 'streamError', message: String(err) });
    }
  }

  private async _clearHistory() {
    try {
      await deleteRequest('history/deleteall');
      this._post({ command: 'historyClearedOk' });
    } catch (err) {
      this._post({ command: 'streamError', message: String(err) });
    }
  }

  private _sendEditorCode() {
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

  private _applyToEditor(code: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }
    editor.edit((eb) => {
      const selection = editor.selection;
      if (selection.isEmpty) {
        const full = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        eb.replace(full, code);
      } else {
        eb.replace(selection, code);
      }
    });
  }

  private async _handleVoice(fileData: string, fileName: string, code: string) {
    const cfg = vscode.workspace.getConfiguration('aiAssistant');
    const apiUrl = (cfg.get<string>('apiUrl') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const apiKey = cfg.get<string>('apiKey') || '';

    try {
      const base64 = fileData.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const ext = fileName.endsWith('.mp3') ? '.mp3' : '.wav';
      const tmpPath = path.join(require('os').tmpdir(), `voice_cmd_${Date.now()}${ext}`);
      fs.writeFileSync(tmpPath, buffer);

      const boundary = `----FormBoundary${Date.now()}`;
      const fileBuffer = fs.readFileSync(tmpPath);
      const mimeType = ext === '.mp3' ? 'audio/mpeg' : 'audio/wav';

      const bodyParts: Buffer[] = [];
      const addField = (name: string, value: string) => {
        bodyParts.push(Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
        ));
      };
      const addFile = (name: string, fn: string, mime: string, data: Buffer) => {
        bodyParts.push(Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${fn}"\r\nContent-Type: ${mime}\r\n\r\n`
        ));
        bodyParts.push(data);
        bodyParts.push(Buffer.from('\r\n'));
      };

      addField('code', code);
      addFile('file', fileName, mimeType, fileBuffer);
      bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
      const bodyBuffer = Buffer.concat(bodyParts);

      const http  = require('http')  as typeof import('http');
      const https = require('https') as typeof import('https');
      const url = new URL(`${apiUrl}/voice-command`);
      const lib = url.protocol === 'https:' ? https : http;

      const responseText = await new Promise<string>((resolve, reject) => {
        let raw = '';
        const req = lib.request(
          {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Content-Length': bodyBuffer.length,
              'x-api-key': apiKey,
            },
          },
          (res: import('http').IncomingMessage) => {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`Backend returned ${res.statusCode}`));
              return;
            }
            res.on('data', (c: Buffer) => (raw += c.toString()));
            res.on('end', () => resolve(raw));
            res.on('error', reject);
          }
        );
        req.on('error', reject);
        req.write(bodyBuffer);
        req.end();
      });

      fs.unlinkSync(tmpPath);
      this._post({ command: 'voiceResult', text: responseText });
    } catch (err: any) {
      this._post({ command: 'voiceError', message: err.message || String(err) });
    }
  }

  private _post(msg: object) {
    this._view?.webview.postMessage(msg);
  }

  /** Load HTML from Frontend/sidebar.html at runtime */
  private _getHtml(): string {
    const htmlPath = path.join(this._extensionUri.fsPath, 'Frontend', 'sidebar.html');
    return fs.readFileSync(htmlPath, 'utf8');
  }
}
