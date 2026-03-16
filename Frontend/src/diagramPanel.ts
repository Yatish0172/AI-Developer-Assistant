import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Reads Frontend/diagramPanel.html and injects the Mermaid code
 * by replacing the {{MERMAID_CODE}} placeholder.
 */
export function getDiagramHtml(extensionUri: vscode.Uri, mermaidCode: string): string {
  // Strip markdown fences if the model included them
  const clean = mermaidCode
    .replace(/```mermaid/gi, '')
    .replace(/```/g, '')
    .trim();

  const htmlPath = path.join(extensionUri.fsPath, 'Frontend', 'diagramPanel.html');
  const template = fs.readFileSync(htmlPath, 'utf8');

  // Replace both occurrences of {{MERMAID_CODE}} (diagram div + pre block)
  return template.split('{{MERMAID_CODE}}').join(escapeHtml(clean));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
