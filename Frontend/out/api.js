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
exports.streamRequest = streamRequest;
exports.jsonRequest = jsonRequest;
exports.getRequest = getRequest;
exports.deleteRequest = deleteRequest;
const vscode = __importStar(require("vscode"));
const http = __importStar(require("http"));
const https = __importStar(require("https"));
function getConfig() {
    const cfg = vscode.workspace.getConfiguration('aiAssistant');
    return {
        baseUrl: (cfg.get('apiUrl') || 'http://localhost:8000').replace(/\/$/, ''),
        apiKey: cfg.get('apiKey') || '',
    };
}
/** Stream a text response from the backend, calling onChunk for each chunk. */
async function streamRequest(endpoint, body, onChunk, signal) {
    const { baseUrl, apiKey } = getConfig();
    const url = new URL(`${baseUrl}/${endpoint}`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const payload = JSON.stringify(body);
    return new Promise((resolve, reject) => {
        const req = lib.request({
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'x-api-key': apiKey,
            },
        }, (res) => {
            if (res.statusCode === 403) {
                reject(new Error('Invalid API key. Set it in Settings → AI Developer Assistant → Api Key'));
                return;
            }
            if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`Backend returned HTTP ${res.statusCode}`));
                return;
            }
            res.setEncoding('utf8');
            res.on('data', (chunk) => onChunk(chunk));
            res.on('end', resolve);
            res.on('error', reject);
        });
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
async function jsonRequest(endpoint, body) {
    const { baseUrl, apiKey } = getConfig();
    const url = new URL(`${baseUrl}/${endpoint}`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const payload = JSON.stringify(body);
    return new Promise((resolve, reject) => {
        const req = lib.request({
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'x-api-key': apiKey,
            },
        }, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (c) => (data += c));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch {
                    reject(new Error(`Failed to parse JSON response: ${data}`));
                }
            });
            res.on('error', reject);
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}
/** GET request returning JSON (for /history). */
async function getRequest(endpoint) {
    const { baseUrl, apiKey } = getConfig();
    const url = new URL(`${baseUrl}/${endpoint}`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    return new Promise((resolve, reject) => {
        const req = lib.request({
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'GET',
            headers: { 'x-api-key': apiKey },
        }, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (c) => (data += c));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch {
                    reject(new Error(`Bad JSON: ${data}`));
                }
            });
            res.on('error', reject);
        });
        req.on('error', reject);
        req.end();
    });
}
/** DELETE request. */
async function deleteRequest(endpoint) {
    const { baseUrl, apiKey } = getConfig();
    const url = new URL(`${baseUrl}/${endpoint}`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    return new Promise((resolve, reject) => {
        const req = lib.request({
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'DELETE',
            headers: { 'x-api-key': apiKey },
        }, (res) => {
            res.resume();
            res.on('end', resolve);
            res.on('error', reject);
        });
        req.on('error', reject);
        req.end();
    });
}
//# sourceMappingURL=api.js.map