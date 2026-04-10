const { contextBridge, ipcRenderer } = require('electron');

const SERVER_URL = 'http://localhost:3001';

// Store the current abort controller for cancelling requests
let currentAbortController = null;

// Expose safe API to renderer process via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // Abort the current ongoing request (client-side)
  abortCurrentRequest: () => {
    if (currentAbortController) {
      console.log('[PRELOAD] Aborting current request');
      currentAbortController.abort();
      currentAbortController = null;
    }
  },

  // Stop the backend query execution
  stopQuery: async (chatId, provider = 'claude') => {
    console.log('[PRELOAD] Stopping query for chatId:', chatId, 'provider:', provider);
    try {
      const response = await fetch(`${SERVER_URL}/api/abort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatId, provider })
      });
      const result = await response.json();
      console.log('[PRELOAD] Stop query result:', result);
      return result;
    } catch (error) {
      console.error('[PRELOAD] Error stopping query:', error);
      return { success: false, error: error.message };
    }
  },

  // Send a chat message to the backend with chat ID, provider, and model
  sendMessage: async (message, chatId, provider = 'claude', model = null, clientId = null, matterId = null) => {
    // Abort any previous request
    if (currentAbortController) {
      currentAbortController.abort();
    }

    // Create new abort controller for this request
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    return new Promise((resolve, reject) => {
      console.log('[PRELOAD] Sending message to backend:', message);
      console.log('[PRELOAD] Chat ID:', chatId);
      console.log('[PRELOAD] Provider:', provider);
      console.log('[PRELOAD] Model:', model);

      fetch(`${SERVER_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, chatId, provider, model, clientId, matterId }),
        signal
      })
        .then(response => {

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
          }

          console.log('[PRELOAD] Connected to backend successfully');

          // Return a custom object with methods to read the stream
          resolve({
            getReader: async function() {
              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              return {
                read: async () => {
                  try {
                    const { done, value } = await reader.read();
                    if (done) {
                      console.log('[PRELOAD] Stream ended');
                    }
                    return {
                      done,
                      value: done ? undefined : decoder.decode(value, { stream: true })
                    };
                  } catch (readError) {
                    console.error('[PRELOAD] Read error:', readError);
                    throw readError;
                  }
                }
              };
            }
          });
        })
        .catch(error => {
          console.error('[PRELOAD] Connection error:', error);
          console.error('[PRELOAD] Error stack:', error.stack);
          reject(new Error(`Failed to connect to backend: ${error.message}`));
        });
    });
  },

  // Get available providers from backend
  getProviders: async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/providers`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[PRELOAD] Error fetching providers:', error);
      return { providers: ['claude'], default: 'claude' };
    }
  },

  // --- Client & Matter Workspace APIs ---

  createClient: async (name, displayName = null) => {
    const response = await fetch(`${SERVER_URL}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, displayName })
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to create client');
    return response.json();
  },

  listClients: async () => {
    const response = await fetch(`${SERVER_URL}/api/clients`);
    if (!response.ok) throw new Error('Failed to list clients');
    return response.json();
  },

  getClient: async (id) => {
    const response = await fetch(`${SERVER_URL}/api/clients/${id}`);
    if (!response.ok) throw new Error('Client not found');
    return response.json();
  },

  createMatter: async (clientId, name, matterType = null) => {
    const response = await fetch(`${SERVER_URL}/api/matters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, name, matterType })
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to create matter');
    return response.json();
  },

  listMatters: async (clientId) => {
    const response = await fetch(`${SERVER_URL}/api/matters?clientId=${encodeURIComponent(clientId)}`);
    if (!response.ok) throw new Error('Failed to list matters');
    return response.json();
  },

  getMatter: async (id) => {
    const response = await fetch(`${SERVER_URL}/api/matters/${id}`);
    if (!response.ok) throw new Error('Matter not found');
    return response.json();
  },

  // --- Template Library APIs ---

  listTemplates: async (type = null) => {
    const url = type
      ? `${SERVER_URL}/api/templates?type=${encodeURIComponent(type)}`
      : `${SERVER_URL}/api/templates`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to list templates');
    return response.json();
  },

  getTemplate: async (id) => {
    const response = await fetch(`${SERVER_URL}/api/templates/${id}`);
    if (!response.ok) throw new Error('Template not found');
    return response.json();
  },

  // --- Draft APIs ---

  generateDraftPrompt: async (templateId, clientId, matterId = null, instructions = '') => {
    const response = await fetch(`${SERVER_URL}/api/drafts/generate-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, clientId, matterId, instructions })
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to generate prompt');
    return response.json();
  },

  saveDraft: async (content, clientId, { templateId = null, matterId = null, title = null } = {}) => {
    const response = await fetch(`${SERVER_URL}/api/drafts/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, clientId, templateId, matterId, title })
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to save draft');
    return response.json();
  },

  listDrafts: async (clientId, matterId = null) => {
    let url = `${SERVER_URL}/api/drafts?clientId=${encodeURIComponent(clientId)}`;
    if (matterId) url += `&matterId=${encodeURIComponent(matterId)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to list drafts');
    return response.json();
  },

  getDraft: async (id) => {
    const response = await fetch(`${SERVER_URL}/api/drafts/${id}`);
    if (!response.ok) throw new Error('Draft not found');
    return response.json();
  },

  // --- File Browser APIs ---

  browseFiles: async (relativePath = '') => {
    const url = relativePath
      ? `${SERVER_URL}/api/files?path=${encodeURIComponent(relativePath)}`
      : `${SERVER_URL}/api/files`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to browse files');
    return response.json();
  },

  createFolder: async (relativePath) => {
    const response = await fetch(`${SERVER_URL}/api/files/mkdir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: relativePath })
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to create folder');
    return response.json();
  },

  deleteFile: async (relativePath) => {
    const response = await fetch(`${SERVER_URL}/api/files?path=${encodeURIComponent(relativePath)}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete');
    return response.json();
  },

  // Transcribe audio using local Whisper model
  transcribeAudio: async (audioBuffer) => {
    return ipcRenderer.invoke('transcribe-audio', audioBuffer);
  },

  // Open document in editor window
  openDocumentEditor: async (documentId, documentTitle) => {
    return ipcRenderer.invoke('open-document-editor', documentId, documentTitle);
  },

  // Document CRUD
  createDocument: async (matterId, title) => {
    const response = await fetch(`${SERVER_URL}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matterId, title })
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to create document');
    return response.json();
  },

  listDocuments: async (matterId) => {
    const response = await fetch(`${SERVER_URL}/api/documents?matterId=${encodeURIComponent(matterId)}`);
    if (!response.ok) throw new Error('Failed to list documents');
    return response.json();
  },

  getDocument: async (id) => {
    const response = await fetch(`${SERVER_URL}/api/documents/${id}`);
    if (!response.ok) throw new Error('Document not found');
    return response.json();
  },

  // Navigation search — find clients, matters, drafts by name
  searchWorkspace: async (query) => {
    const response = await fetch(`${SERVER_URL}/api/navigate/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  // Reveal a file/folder in Finder (selects it in parent)
  openInFinder: async (targetPath) => {
    return ipcRenderer.invoke('open-in-finder', targetPath);
  },

  // Open a folder directly in Finder
  openFolderInFinder: async (targetPath) => {
    return ipcRenderer.invoke('open-folder-in-finder', targetPath);
  }
});
