import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';

export type TaskType = 'explain' | 'debug' | 'optimize' | 'comment' | 'convert' | 'diagram';

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
}

function getConfig(): ApiConfig {
  const cfg = vscode.workspace.getConfiguration('aiAssistant');
  return {
    baseUrl: (cfg.get<string>('apiUrl') || 'http://localhost:8000').replace(/\/$/, ''),
    apiKey: cfg.get<string>('apiKey') || '',
  };
}

/** Stream a text response from the backend, calling onChunk for each chunk. */
export async function streamRequest(
  endpoint: string,
  body: object,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const { baseUrl, apiKey } = getConfig();
  const url = new URL(`${baseUrl}/${endpoint}`);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-api-key': apiKey,
        },
      },
      (res) => {
        if (res.statusCode === 403) {
          reject(new Error('Invalid API key. Set it in Settings → AI Developer Assistant → Api Key'));
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Backend returned HTTP ${res.statusCode}`));
          return;
        }
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => onChunk(chunk));
        res.on('end', resolve);
        res.on('error', reject);
      }
    );

    req.on('error', reject);

    if (signal) {
      signal.addEventListener('abort', () => {
        req.destroy();
        reject(new Error('Request aborted'));
      });
    }

    req.write(payload);
    req.end();
  });
}

/** POST and return full JSON response (non-streaming). */
export async function jsonRequest<T = unknown>(endpoint: string, body: object): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const url = new URL(`${baseUrl}/${endpoint}`);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-api-key': apiKey,
        },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c: string) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error(`Failed to parse JSON response: ${data}`));
          }
        });
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/** GET request returning JSON (for /history). */
export async function getRequest<T = unknown>(endpoint: string): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const url = new URL(`${baseUrl}/${endpoint}`);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        headers: { 'x-api-key': apiKey },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c: string) => (data += c));
        res.on('end', () => {
          try { resolve(JSON.parse(data) as T); }
          catch { reject(new Error(`Bad JSON: ${data}`)); }
        });
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.end();
  });
}

/** DELETE request. */
export async function deleteRequest(endpoint: string): Promise<void> {
  const { baseUrl, apiKey } = getConfig();
  const url = new URL(`${baseUrl}/${endpoint}`);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'DELETE',
        headers: { 'x-api-key': apiKey },
      },
      (res) => {
        res.resume();
        res.on('end', resolve);
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.end();
  });
}
