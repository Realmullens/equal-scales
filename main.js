const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const os = require('os');

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  try {
    // Enable live-reload for the main and renderer processes during development
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
      ignored: /server|node_modules/
    });
  } catch (err) {
    console.warn('Live reload unavailable:', err);
  }
}

// Global window reference
let mainWindow;

// Create Electron window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      enableWebSQL: false,
      webSecurity: true
    }
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Open DevTools in development (comment out for production)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    // If navigating away from our app, open in external browser
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

// IPC handlers
const VAULT_ROOT = path.join(os.homedir(), 'EqualScalesVault');

function isInsideVault(fullPath) {
  const normalized = path.resolve(fullPath);
  return normalized === VAULT_ROOT || normalized.startsWith(VAULT_ROOT + path.sep);
}

// Reveal a file in Finder (selects it in the parent folder)
ipcMain.handle('open-in-finder', (event, targetPath) => {
  // Support both relative (to vault) and absolute paths
  const fullPath = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(VAULT_ROOT, targetPath);
  if (!isInsideVault(fullPath)) return { error: 'Access denied' };
  shell.showItemInFolder(fullPath);
  return { success: true };
});

// Open a folder directly in Finder
ipcMain.handle('open-folder-in-finder', (event, targetPath) => {
  const fullPath = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(VAULT_ROOT, targetPath);
  if (!isInsideVault(fullPath)) return { error: 'Access denied' };
  shell.openPath(fullPath);
  return { success: true };
});

// Whisper speech-to-text via transformers.js (runs in main process)
let whisperPipeline = null;

ipcMain.handle('transcribe-audio', async (event, audioBuffer) => {
  try {
    if (!whisperPipeline) {
      const { pipeline } = await import('@huggingface/transformers');
      whisperPipeline = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny.en',
        { dtype: 'q8' }
      );
    }

    // audioBuffer is an ArrayBuffer from the renderer
    const float32 = new Float32Array(audioBuffer);
    const result = await whisperPipeline(float32);
    return { text: result.text || '' };
  } catch (err) {
    console.error('[Whisper] Transcription error:', err);
    return { error: err.message };
  }
});

// Open document in a dedicated editor window
ipcMain.handle('open-document-editor', (event, documentId, documentTitle) => {
  const editorWindow = new BrowserWindow({
    width: 900,
    height: 700,
    title: documentTitle || 'Document Editor',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the built React document workspace with the document ID as a query param
  const distPath = path.join(__dirname, 'renderer', 'document-dist', 'index.html');
  editorWindow.loadFile(distPath, { query: { id: documentId } });

  editorWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return { success: true };
});

// App lifecycle
app.on('ready', () => {
  console.log('Electron app ready');
  createWindow();
});

app.on('window-all-closed', () => {
  // On macOS, apps stay active until user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});
