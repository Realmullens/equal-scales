// DOM Elements - Views
const homeView = document.getElementById('homeView');
const chatView = document.getElementById('chatView');

// DOM Elements - Home
const homeForm = document.getElementById('homeForm');
const homeInput = document.getElementById('homeInput');
const homeSendBtn = document.getElementById('homeSendBtn');

// DOM Elements - Chat
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatMessages = document.getElementById('chatMessages');
const chatTitle = document.getElementById('chatTitle');

// DOM Elements - Right Sidebar
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const rightSidebarExpand = document.getElementById('rightSidebarExpand');
const stepsList = document.getElementById('stepsList');
const stepsCount = document.getElementById('stepsCount');
const toolCallsList = document.getElementById('toolCallsList');
const emptySteps = document.getElementById('emptySteps');
const emptyTools = document.getElementById('emptyTools');

// DOM Elements - Left Sidebar (Chat History)
const chatHistoryList = document.getElementById('chatHistoryList');
const leftSidebar = document.getElementById('leftSidebar');
const leftSidebarToggle = document.getElementById('leftSidebarToggle');
const leftSidebarExpand = document.getElementById('leftSidebarExpand');

// State
let isFirstMessage = true;
let todos = [];
let toolCalls = [];
let attachedFiles = [];
let selectedProvider = 'claude';
let selectedModel = 'claude-sonnet-4-6';
let thinkingMode = 'normal'; // 'normal' or 'extended'
let isWaitingForResponse = false;

let activeBrowserSession = null; // { url: string, sessionId: string, inlineElement: HTMLElement }
let browserDisplayMode = 'hidden'; // 'inline' | 'sidebar' | 'hidden'

// Multi-chat state
let allChats = [];
let currentChatId = null;

// Workspace state (Phase 2)
let allClients = [];
let currentClientId = null;
let currentMatterId = null;
let expandedClients = new Set(); // track which clients are expanded in sidebar

// Model configurations per provider
const providerModels = {
  claude: [
    { value: 'claude-opus-4-6', label: 'Opus 4.6', desc: 'Most capable for complex work' },
    { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6', desc: 'Best for everyday tasks', default: true },
    { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', desc: 'Fastest for quick answers' }
  ],
  opencode: [
    // Opencode Zen (Free)
    { value: 'opencode/big-pickle', label: 'Big Pickle', desc: 'Reasoning model', default: true },
    { value: 'opencode/gpt-5-nano', label: 'GPT-5 Nano', desc: 'OpenAI reasoning' },
    { value: 'opencode/glm-4.7-free', label: 'GLM-4.7', desc: 'Zhipu GLM free' },
    { value: 'opencode/grok-code', label: 'Grok Code Fast', desc: 'xAI coding model' },
    { value: 'opencode/minimax-m2.1-free', label: 'MiniMax M2.1', desc: 'MiniMax free' },
    // Anthropic Claude
    { value: 'anthropic/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', desc: 'Best balance' },
    { value: 'anthropic/claude-opus-4-5-20251101', label: 'Claude Opus 4.5', desc: 'Most capable' },
    { value: 'anthropic/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', desc: 'Fastest' }
  ]
};

// Theme management
function getPreferredTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
  document.documentElement.classList.add('theme-transitioning');
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  const theme = getPreferredTheme();
  document.documentElement.setAttribute('data-theme', theme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

// Initialize
function init() {
  initTheme();
  updateGreeting();
  setupEventListeners();
  loadAllChats();
  renderChatHistory();
  loadClients().then(() => {
    updateWorkspaceSelector();
    renderHomeActivity();
  });
  loadTemplates();
  restoreFileBrowserState();
  homeInput.focus();
}

function generateId() {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// Save current chat state
function saveState() {
  if (!currentChatId) return;

  if (isWaitingForResponse) {
    console.log('[Save] Skipping save during streaming');
    return;
  }

  const chatData = {
    id: currentChatId,
    title: chatTitle.textContent,
    messages: Array.from(chatMessages.children).map(msg => {
      const contentDiv = msg.querySelector('.message-content');
      const rawContent = contentDiv?.dataset.rawContent || contentDiv?.textContent || '';

      // Save complete message structure including tool calls
      return {
        class: msg.className,
        content: rawContent,
        html: contentDiv?.innerHTML || '' // Save rendered HTML to restore tool calls
      };
    }),
    todos,
    toolCalls,
    provider: selectedProvider,
    model: selectedModel,
    updatedAt: Date.now()
  };

  // Update or add chat in allChats
  const index = allChats.findIndex(c => c.id === currentChatId);
  if (index >= 0) {
    allChats[index] = chatData;
  } else {
    allChats.unshift(chatData);
  }

  // Save to localStorage
  localStorage.setItem('allChats', JSON.stringify(allChats));
  localStorage.setItem('currentChatId', currentChatId);
  // Also save current provider/model globally
  localStorage.setItem('selectedProvider', selectedProvider);
  localStorage.setItem('selectedModel', selectedModel);

  renderChatHistory();
  renderHomeActivity();
}

// Load all chats from localStorage
function loadAllChats() {
  try {
    const saved = localStorage.getItem('allChats');
    allChats = saved ? JSON.parse(saved) : [];
    currentChatId = localStorage.getItem('currentChatId');

    // Restore global provider/model settings
    const savedProvider = localStorage.getItem('selectedProvider');
    const savedModel = localStorage.getItem('selectedModel');
    if (savedProvider && providerModels[savedProvider]) {
      selectedProvider = savedProvider;
      updateProviderUI(savedProvider);
    }
    if (savedModel) {
      selectedModel = savedModel;
      // Find the model label to update UI
      const models = providerModels[selectedProvider] || [];
      const modelInfo = models.find(m => m.value === savedModel);
      if (modelInfo) {
        document.querySelectorAll('.model-selector .model-label').forEach(l => {
          l.textContent = modelInfo.label;
        });
      }
    }

    // If there's a current chat, load it
    if (currentChatId) {
      const chat = allChats.find(c => c.id === currentChatId);
      if (chat) {
        loadChat(chat);
      } else {
        currentChatId = null;
        localStorage.removeItem('currentChatId');
      }
    }
  } catch (err) {
    console.error('Failed to load chats:', err);
    allChats = [];
  }
}

// Update provider UI across all dropdowns
function updateProviderUI(provider) {
  const providerLabel = provider === 'claude' ? 'Claude' : 'Opencode';
  document.querySelectorAll('.provider-selector .provider-label').forEach(l => {
    l.textContent = providerLabel;
  });
  document.querySelectorAll('.provider-menu .dropdown-item').forEach(item => {
    const isSelected = item.dataset.value === provider;
    item.classList.toggle('selected', isSelected);
    const checkIcon = item.querySelector('.check-icon');
    if (checkIcon) {
      checkIcon.style.display = isSelected ? 'block' : 'none';
    }
  });
  // Update model dropdown for the provider
  updateModelDropdowns(provider);
}

// Load a specific chat
function loadChat(chat) {
  currentChatId = chat.id;
  chatTitle.textContent = chat.title;
  isFirstMessage = false;
  todos = chat.todos || [];
  toolCalls = chat.toolCalls || [];

  // Restore provider/model for this chat
  if (chat.provider && providerModels[chat.provider]) {
    selectedProvider = chat.provider;
    updateProviderUI(chat.provider);
  }
  if (chat.model) {
    selectedModel = chat.model;
    const models = providerModels[selectedProvider] || [];
    const modelInfo = models.find(m => m.value === chat.model);
    if (modelInfo) {
      document.querySelectorAll('.model-selector .model-label').forEach(l => {
        l.textContent = modelInfo.label;
      });
      // Update checkmarks in model menu
      document.querySelectorAll('.model-menu .dropdown-item').forEach(item => {
        const isSelected = item.dataset.value === chat.model;
        item.classList.toggle('selected', isSelected);
        const checkIcon = item.querySelector('.check-icon');
        if (checkIcon) {
          checkIcon.style.display = isSelected ? 'block' : 'none';
        }
      });
    }
  }

  // Switch to chat view
  switchToChatView();

  // Restore messages
  chatMessages.innerHTML = '';
  (chat.messages || []).forEach(msgData => {
    const messageDiv = document.createElement('div');
    messageDiv.className = msgData.class;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.dataset.rawContent = msgData.content;

    if (msgData.class.includes('user')) {
      contentDiv.textContent = msgData.content;
    } else if (msgData.class.includes('assistant')) {
      // Restore complete HTML structure including tool calls
      if (msgData.html) {
        contentDiv.innerHTML = msgData.html;
      } else {
        // Fallback for old messages without HTML
        renderMarkdown(contentDiv);
      }
    }

    messageDiv.appendChild(contentDiv);

    if (msgData.class.includes('assistant')) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'message-actions';
      actionsDiv.innerHTML = `
        <button class="action-btn" title="Copy" onclick="copyMessage(this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      `;
      messageDiv.appendChild(actionsDiv);
    }

    chatMessages.appendChild(messageDiv);
  });

  renderTodos();

  scrollToBottom();
  renderChatHistory();
  localStorage.setItem('currentChatId', currentChatId);
}

// Render chat history sidebar
function renderChatHistory() {
  if (!chatHistoryList) return; // element removed in new layout
  chatHistoryList.innerHTML = '';

  if (allChats.length === 0) {
    chatHistoryList.innerHTML = '<div class="chat-history-empty">No chats yet</div>';
    return;
  }

  // Sort by updated time (most recent first)
  const sortedChats = [...allChats].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  sortedChats.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'chat-history-item' + (chat.id === currentChatId ? ' active' : '');
    item.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="chat-title">${escapeHtml(chat.title || 'New chat')}</span>
      <button class="delete-chat-btn" onclick="deleteChat('${chat.id}', event)" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    item.onclick = (e) => {
      if (!e.target.closest('.delete-chat-btn')) {
        switchToChat(chat.id);
      }
    };
    chatHistoryList.appendChild(item);
  });
}

// ==================== VOICE INPUT (Local Whisper) ====================

let whisperReady = false;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let selectedAudioDeviceId = localStorage.getItem('voiceDeviceId') || 'default';
let holdToRecord = localStorage.getItem('voiceHoldToRecord') !== 'false'; // default true

/**
 * Transcribe audio via the main process Whisper pipeline (IPC bridge).
 * Model downloads automatically on first use (~40MB) and caches.
 */
async function transcribeAudio(audioData) {
  if (!whisperReady) {
    showToast('Loading speech model (first time)...');
  }
  const result = await window.electronAPI.transcribeAudio(audioData);
  whisperReady = true;
  if (result.error) throw new Error(result.error);
  return result.text || '';
}

/**
 * Start voice recording with the selected audio device.
 */
async function startVoiceRecording(targetInput) {
  if (isRecording) return;

  try {
    const constraints = { audio: selectedAudioDeviceId === 'default'
      ? true
      : { deviceId: { exact: selectedAudioDeviceId } }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    isRecording = true;
    audioChunks = [];

    document.querySelectorAll('.voice-widget').forEach(w => w.classList.add('recording'));

    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      document.querySelectorAll('.voice-widget').forEach(w => w.classList.remove('recording'));
      document.querySelectorAll('.voice-btn').forEach(b => b.classList.add('loading'));

      try {
        // Convert WebM to PCM Float32 via AudioContext decoding
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        const pcmData = decoded.getChannelData(0); // mono, 16kHz
        audioCtx.close();

        // Send PCM data to main process for Whisper transcription
        const text = await transcribeAudio(pcmData.buffer);

        if (text && text.trim() && targetInput) {
          const trimmed = text.trim();
          const start = targetInput.selectionStart;
          const end = targetInput.selectionEnd;
          const before = targetInput.value.substring(0, start);
          const after = targetInput.value.substring(end);
          const spaceBefore = before && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
          targetInput.value = before + spaceBefore + trimmed + after;
          targetInput.selectionStart = targetInput.selectionEnd = start + spaceBefore.length + trimmed.length;
          targetInput.dispatchEvent(new Event('input'));
          targetInput.focus();
          showToast(trimmed.length > 60 ? trimmed.substring(0, 60) + '...' : trimmed);
        }
      } catch (err) {
        console.error('[Voice] Transcription error:', err);
        showToast('Transcription failed: ' + err.message);
      } finally {
        document.querySelectorAll('.voice-btn').forEach(b => b.classList.remove('loading'));
      }
    };

    mediaRecorder.start();
  } catch (err) {
    console.error('[Voice] Microphone error:', err);
    showToast('Microphone access denied');
    isRecording = false;
    document.querySelectorAll('.voice-widget').forEach(w => w.classList.remove('recording'));
  }
}

function stopVoiceRecording() {
  if (mediaRecorder && isRecording) {
    isRecording = false;
    mediaRecorder.stop();
  }
}

/**
 * Show the audio source selection dropdown.
 */
async function showAudioSourceMenu(widget) {
  // Close any existing menu
  const existing = document.querySelector('.voice-source-menu');
  if (existing) { existing.remove(); widget.classList.remove('source-open'); return; }

  widget.classList.add('source-open');

  // Enumerate audio input devices
  let devices = [];
  try {
    // Trigger permission prompt, then immediately stop the probe stream
    const probeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    probeStream.getTracks().forEach(t => t.stop());
    const all = await navigator.mediaDevices.enumerateDevices();
    devices = all.filter(d => d.kind === 'audioinput');
  } catch (err) {
    showToast('Cannot access audio devices');
    widget.classList.remove('source-open');
    return;
  }

  const menu = document.createElement('div');
  menu.className = 'voice-source-menu';

  // Header with mic icon and dot
  menu.innerHTML = `
    <div class="voice-source-menu-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
      <span class="voice-source-dot"></span>
    </div>
  `;

  // Device list
  devices.forEach(device => {
    const item = document.createElement('div');
    item.className = 'voice-source-item';
    const isSelected = device.deviceId === selectedAudioDeviceId ||
      (selectedAudioDeviceId === 'default' && device.deviceId === 'default');
    item.innerHTML = `
      <span class="source-name">${device.label || 'Default'}</span>
      ${isSelected ? '<span class="check">&#10003;</span>' : ''}
    `;
    item.onclick = () => {
      selectedAudioDeviceId = device.deviceId;
      localStorage.setItem('voiceDeviceId', device.deviceId);
      menu.remove();
      widget.classList.remove('source-open');
    };
    menu.appendChild(item);
  });

  // Divider + hold-to-record toggle
  const divider = document.createElement('div');
  divider.className = 'voice-source-divider';
  menu.appendChild(divider);

  const toggle = document.createElement('div');
  toggle.className = 'voice-source-toggle';
  toggle.innerHTML = `
    <div class="voice-source-toggle-left">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      </svg>
      <span>Hold to record</span>
    </div>
    <div class="toggle-switch ${holdToRecord ? 'active' : ''}" id="holdToRecordToggle"></div>
  `;
  toggle.querySelector('.toggle-switch').onclick = (e) => {
    e.stopPropagation();
    holdToRecord = !holdToRecord;
    localStorage.setItem('voiceHoldToRecord', holdToRecord);
    e.target.classList.toggle('active', holdToRecord);
    // Update tooltips
    document.querySelectorAll('.voice-tooltip').forEach(t => {
      t.textContent = holdToRecord ? 'Press and hold to record' : 'Click to record';
    });
  };
  menu.appendChild(toggle);

  widget.appendChild(menu);

  // Close on outside click
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && !e.target.closest('.voice-source-btn')) {
      menu.remove();
      widget.classList.remove('source-open');
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

/**
 * Wire voice widget events: hold-to-record or click-to-toggle.
 */
function setupVoiceWidget(widget, targetInput) {
  const voiceBtn = widget.querySelector('.voice-btn');
  const sourceBtn = widget.querySelector('.voice-source-btn');

  // Source selector
  sourceBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showAudioSourceMenu(widget);
  });

  // Hold-to-record: mousedown starts, mouseup stops
  // Click-to-toggle: click starts, click again stops
  let holdTimer = null;
  let isHolding = false;

  voiceBtn.addEventListener('mousedown', () => {
    if (isRecording) return;
    if (holdToRecord) {
      isHolding = true;
      holdTimer = setTimeout(() => {
        // Only start if still holding after a brief delay (avoid accidental taps)
        if (isHolding) startVoiceRecording(targetInput);
      }, 150);
    }
  });

  voiceBtn.addEventListener('mouseup', () => {
    if (holdToRecord && isHolding) {
      isHolding = false;
      clearTimeout(holdTimer);
      if (isRecording) stopVoiceRecording();
    }
  });

  voiceBtn.addEventListener('mouseleave', () => {
    if (holdToRecord && isHolding) {
      isHolding = false;
      clearTimeout(holdTimer);
      if (isRecording) stopVoiceRecording();
    }
  });

  voiceBtn.addEventListener('click', () => {
    if (!holdToRecord) {
      if (isRecording) stopVoiceRecording();
      else startVoiceRecording(targetInput);
    }
  });

  // Update tooltip based on mode
  const tooltip = widget.querySelector('.voice-tooltip');
  if (tooltip) {
    tooltip.textContent = holdToRecord ? 'Press and hold to record' : 'Click to record';
  }
}

// ==================== FINDER-FIRST FILE ACTIONS ====================

/**
 * Open the appropriate vault location in Finder based on current workspace context.
 * - If a matter is selected → open the matter folder
 * - If only a client is selected → open the client folder
 * - Otherwise → open the vault root
 */
function openContextualFinder() {
  if (currentMatterId && currentClientId) {
    const client = allClients.find(c => c.id === currentClientId);
    const matter = client?._matters?.find(m => m.id === currentMatterId);
    if (matter?.matter_path) {
      window.electronAPI.openFolderInFinder(matter.matter_path);
      showToast(`Opened ${matter.name} in Finder`);
      return;
    }
  }
  if (currentClientId) {
    const client = allClients.find(c => c.id === currentClientId);
    if (client?.root_path) {
      window.electronAPI.openFolderInFinder(client.root_path);
      showToast(`Opened ${client.display_name || client.name} in Finder`);
      return;
    }
  }
  // Default: open vault root
  window.electronAPI.openFolderInFinder('');
  showToast('Opened vault in Finder');
}

/**
 * Open vault root in Finder.
 */
function openVaultInFinder() {
  window.electronAPI.openFolderInFinder('');
  showToast('Opened vault in Finder');
}

/**
 * Open the active client folder in Finder.
 */
function openClientInFinder() {
  if (!currentClientId) { showToast('No client selected'); return; }
  const client = allClients.find(c => c.id === currentClientId);
  if (!client?.root_path) { showToast('Client folder not found'); return; }
  window.electronAPI.openFolderInFinder(client.root_path);
  showToast(`Opened ${client.display_name || client.name} in Finder`);
}

/**
 * Open the active matter folder in Finder.
 */
function openMatterInFinder() {
  if (!currentMatterId) { showToast('No matter selected'); return; }
  const client = allClients.find(c => c.id === currentClientId);
  const matter = client?._matters?.find(m => m.id === currentMatterId);
  if (!matter?.matter_path) { showToast('Matter folder not found'); return; }
  window.electronAPI.openFolderInFinder(matter.matter_path);
  showToast(`Opened ${matter.name} in Finder`);
}

/**
 * Open the active matter's drafts folder in Finder.
 */
function openDraftsInFinder() {
  if (!currentMatterId) { showToast('No matter selected'); return; }
  const client = allClients.find(c => c.id === currentClientId);
  const matter = client?._matters?.find(m => m.id === currentMatterId);
  if (!matter?.matter_path) { showToast('Matter folder not found'); return; }
  window.electronAPI.openFolderInFinder(matter.matter_path + '/drafts');
  showToast('Opened drafts folder in Finder');
}

/**
 * Open the active matter's source-documents folder in Finder.
 */
function openSourceDocsInFinder() {
  if (!currentMatterId) { showToast('No matter selected'); return; }
  const client = allClients.find(c => c.id === currentClientId);
  const matter = client?._matters?.find(m => m.id === currentMatterId);
  if (!matter?.matter_path) { showToast('Matter folder not found'); return; }
  window.electronAPI.openFolderInFinder(matter.matter_path + '/source-documents');
  showToast('Opened source documents in Finder');
}

/**
 * Reveal a specific file in Finder.
 */
function revealFileInFinder(filePath) {
  if (!filePath) { showToast('No file path'); return; }
  window.electronAPI.openInFinder(filePath);
}

// Legacy stubs — old code may reference these
function toggleFileBrowser() { openContextualFinder(); }

// Stubs for removed file browser functions — safe no-ops
function restoreFileBrowserState() { /* Finder-first: no in-app panel to restore */ }

function initFileBrowserResize() {
  const handle = document.getElementById('fbResizeHandle');
  const panel = document.getElementById('fileBrowserPanel');
  if (!handle || !panel) return;

  let isResizing = false;

  handle.addEventListener('pointerdown', (e) => {
    isResizing = true;
    handle.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('pointermove', (e) => {
    if (!isResizing) return;
    const newWidth = Math.max(280, Math.min(window.innerWidth * 0.6, e.clientX));
    panel.style.width = newWidth + 'px';
    panel.style.minWidth = newWidth + 'px';
  });

  document.addEventListener('pointerup', () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem('fbPanelWidth', panel.style.width);
  });
}

/**
 * Browse to a path in the vault.
 */
async function browseToPath(relativePath) {
  try {
    const data = await window.electronAPI.browseFiles(relativePath);
    if (data.entries !== undefined) {
      renderFileBrowser(data);
      fileBrowserPath.push(relativePath);
      updateBreadcrumb(data.path);
      document.getElementById('fbBackBtn').disabled = fileBrowserPath.length <= 1;
    }
  } catch (err) {
    console.error('[FileBrowser] Browse error:', err);
  }
}

/**
 * Go back in file browser history.
 */
function fileBrowserBack() {
  if (fileBrowserPath.length > 1) {
    fileBrowserPath.pop(); // remove current
    const prev = fileBrowserPath.pop(); // get previous (browseToPath will re-push)
    browseToPath(prev);
  }
}

/**
 * Render file browser entries.
 */
function renderFileBrowser(data) {
  const content = document.getElementById('fileBrowserContent');
  content.className = 'file-browser-content' + (fileBrowserViewMode === 'grid' ? ' grid-view' : '');
  content.innerHTML = '';
  fileBrowserEntries = data.entries || [];
  fbSelectedIndex = -1;

  if (fileBrowserEntries.length === 0) {
    content.innerHTML = '<div class="fb-empty">Empty folder</div>';
    return;
  }

  fileBrowserEntries.forEach((entry, index) => {
    const el = document.createElement('div');
    el.className = 'fb-entry';
    el.dataset.index = index;

    if (entry.type === 'directory') {
      el.innerHTML = `
        <svg class="fb-entry-icon folder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="fb-entry-name">${escapeHtml(entry.name)}</span>
        <span class="fb-entry-count">${entry.childCount || 0} items</span>
      `;
      el.onclick = () => browseToPath(entry.path);
    } else {
      el.innerHTML = `
        ${getFileIcon(entry.extension)}
        <span class="fb-entry-name">${escapeHtml(entry.name)}</span>
        <span class="fb-entry-meta">${formatFileSize(entry.size)}</span>
      `;
      el.onclick = () => openFileFromBrowser(entry);
    }

    // Right-click context menu
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showFileContextMenu(entry, e);
    });

    content.appendChild(el);
  });
}

function getFileIcon(ext) {
  const mdIcon = '<svg class="fb-entry-icon file" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>';
  const pdfIcon = '<svg class="fb-entry-icon file" style="color:#ef4444" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
  const docIcon = '<svg class="fb-entry-icon file" style="color:#3b82f6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
  const defaultIcon = '<svg class="fb-entry-icon file" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';

  switch (ext) {
    case '.md': case '.txt': case '.csv': return mdIcon;
    case '.pdf': return pdfIcon;
    case '.docx': case '.doc': return docIcon;
    default: return defaultIcon;
  }
}

// ==================== CONTEXT MENU ====================

function showFileContextMenu(entry, event) {
  // Remove any existing menu
  const existing = document.querySelector('.fb-context-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.className = 'fb-context-menu';

  const items = [];

  if (entry.type === 'directory') {
    items.push({ label: 'Open', action: () => browseToPath(entry.path) });
    items.push({ label: 'Open in Finder', action: () => window.electronAPI.openInFinder(entry.path) });
    items.push({ divider: true });
    items.push({ label: 'New Folder Inside', action: () => createFolderInside(entry.path) });
    items.push({ divider: true });
    items.push({ label: 'Copy Path', action: () => copyToClipboard(entry.path) });
  } else {
    items.push({ label: 'Open', action: () => openFileFromBrowser(entry) });
    items.push({ label: 'Open in Finder', action: () => window.electronAPI.openInFinder(entry.path) });
    items.push({ divider: true });
    items.push({ label: 'Copy Path', action: () => copyToClipboard(entry.path) });
    items.push({ divider: true });
    items.push({ label: 'Delete', action: () => deleteFileFromBrowser(entry), danger: true });
  }

  items.forEach(item => {
    if (item.divider) {
      const div = document.createElement('div');
      div.className = 'fb-context-divider';
      menu.appendChild(div);
    } else {
      const el = document.createElement('div');
      el.className = 'fb-context-item' + (item.danger ? ' danger' : '');
      el.textContent = item.label;
      el.onclick = () => { menu.remove(); item.action(); };
      menu.appendChild(el);
    }
  });

  // Position the menu
  menu.style.left = event.clientX + 'px';
  menu.style.top = event.clientY + 'px';
  document.body.appendChild(menu);

  // Adjust if off-screen
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 8) + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 8) + 'px';
  });

  // Close on any click outside
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', closeMenu); }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

async function createFolderInside(parentPath) {
  const existing = document.querySelector('.draft-confirm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'draft-confirm-overlay';
  overlay.innerHTML = `
    <div class="draft-confirm-panel">
      <h3>New Folder</h3>
      <input type="text" class="draft-confirm-instructions" placeholder="Folder name..." style="margin-bottom:16px;padding:10px 12px;" autofocus />
      <div class="draft-confirm-actions">
        <button class="draft-confirm-cancel">Cancel</button>
        <button class="draft-confirm-generate">Create</button>
      </div>
    </div>
  `;
  document.querySelector('.main-content').appendChild(overlay);
  const input = overlay.querySelector('input');
  input.focus();

  const submit = async () => {
    const name = input.value.trim();
    overlay.remove();
    if (!name) return;
    try {
      await window.electronAPI.createFolder(parentPath + '/' + name);
      browseToPath(parentPath); // refresh
      showToast(`Folder "${name}" created`);
    } catch (err) {
      showToast('Failed: ' + err.message);
    }
  };

  overlay.querySelector('.draft-confirm-generate').onclick = submit;
  overlay.querySelector('.draft-confirm-cancel').onclick = () => overlay.remove();
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') overlay.remove();
  });
}

async function deleteFileFromBrowser(entry) {
  const overlay = document.createElement('div');
  overlay.className = 'draft-confirm-overlay';
  overlay.innerHTML = `
    <div class="draft-confirm-panel">
      <h3>Delete "${escapeHtml(entry.name)}"?</h3>
      <p style="color:var(--text-secondary);font-size:14px;margin-bottom:16px;">This action cannot be undone.</p>
      <div class="draft-confirm-actions">
        <button class="draft-confirm-cancel">Cancel</button>
        <button class="draft-confirm-generate" style="background:#ef4444;border-color:#ef4444;">Delete</button>
      </div>
    </div>
  `;
  document.querySelector('.main-content').appendChild(overlay);

  overlay.querySelector('.draft-confirm-generate').onclick = async () => {
    overlay.remove();
    try {
      await window.electronAPI.deleteFile(entry.path);
      // Refresh current directory
      const currentPath = fileBrowserPath[fileBrowserPath.length - 1] || '';
      fileBrowserPath.pop();
      browseToPath(currentPath);
      showToast(`Deleted "${entry.name}"`);
    } catch (err) {
      showToast('Failed: ' + err.message);
    }
  };
  overlay.querySelector('.draft-confirm-cancel').onclick = () => overlay.remove();
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Path copied'));
}

// ==================== KEYBOARD NAVIGATION ====================

function initFileBrowserKeyboard() {
  const panel = document.getElementById('fileBrowserPanel');
  if (!panel) return;

  panel.setAttribute('tabindex', '0');
  panel.addEventListener('keydown', (e) => {
    if (!panel.classList.contains('open')) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        fbSelectedIndex = Math.min(fbSelectedIndex + 1, fileBrowserEntries.length - 1);
        highlightEntry(fbSelectedIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        fbSelectedIndex = Math.max(fbSelectedIndex - 1, 0);
        highlightEntry(fbSelectedIndex);
        break;
      case 'Enter':
        if (fbSelectedIndex >= 0 && fbSelectedIndex < fileBrowserEntries.length) {
          const entry = fileBrowserEntries[fbSelectedIndex];
          if (entry.type === 'directory') browseToPath(entry.path);
          else openFileFromBrowser(entry);
        }
        break;
      case 'Backspace':
        e.preventDefault();
        fileBrowserBack();
        break;
      case 'Escape':
        toggleFileBrowser();
        break;
    }
  });
}

function highlightEntry(index) {
  document.querySelectorAll('.fb-entry').forEach(el => el.classList.remove('selected'));
  const target = document.querySelector(`.fb-entry[data-index="${index}"]`);
  if (target) {
    target.classList.add('selected');
    target.scrollIntoView({ block: 'nearest' });
  }
}

/**
 * Open a file from the browser — preview text files.
 */
async function openFileFromBrowser(entry) {
  if (['.md', '.txt', '.json', '.yaml', '.yml'].includes(entry.extension)) {
    try {
      const fileData = await window.electronAPI.browseFiles(entry.path);
      if (fileData.content !== undefined) {
        // Show in draft preview view
        document.getElementById('draftPreviewTitle').textContent = fileData.name;
        document.getElementById('draftPreviewMeta').textContent = `${formatFileSize(fileData.size)} · ${fileData.extension}`;
        const contentDiv = document.getElementById('draftPreviewContent');
        contentDiv.classList.remove('source-mode');
        if (fileData.extension === '.md') {
          renderMarkdownContent(contentDiv, fileData.content);
        } else {
          contentDiv.classList.add('source-mode');
          contentDiv.innerHTML = '';
          const pre = document.createElement('pre');
          pre.textContent = fileData.content;
          contentDiv.appendChild(pre);
        }
        switchToDraftPreview();
      }
    } catch (err) {
      console.error('[FileBrowser] Open file error:', err);
    }
  }
}

/**
 * Update the breadcrumb navigation.
 */
function updateBreadcrumb(relativePath) {
  const bc = document.getElementById('fbBreadcrumb');
  bc.innerHTML = '';

  const root = document.createElement('span');
  root.className = 'fb-breadcrumb-item fb-breadcrumb-root';
  root.textContent = 'EqualScalesVault';
  root.onclick = () => browseToPath('');
  bc.appendChild(root);

  if (relativePath) {
    const parts = relativePath.split('/').filter(Boolean);
    let accumulated = '';
    parts.forEach(part => {
      accumulated += (accumulated ? '/' : '') + part;
      const sep = document.createElement('span');
      sep.className = 'fb-breadcrumb-sep';
      sep.textContent = ' / ';
      bc.appendChild(sep);

      const item = document.createElement('span');
      item.className = 'fb-breadcrumb-item';
      item.textContent = part;
      const pathForClick = accumulated;
      item.onclick = () => browseToPath(pathForClick);
      bc.appendChild(item);
    });
  }
}

/**
 * Toggle file browser view mode (grid/list).
 */
function setFileBrowserView(mode) {
  fileBrowserViewMode = mode;
  localStorage.setItem('fbViewMode', mode);
  document.getElementById('fbGridViewBtn').classList.toggle('active', mode === 'grid');
  document.getElementById('fbListViewBtn').classList.toggle('active', mode === 'list');
  const content = document.getElementById('fileBrowserContent');
  content.classList.toggle('grid-view', mode === 'grid');
}

/**
 * Populate the workspace selector dropdown with available clients.
 */
async function updateWorkspaceSelector() {
  const menu = document.getElementById('workspaceMenu');
  if (!menu) return;

  // Keep the "All clients" option, clear the rest
  const allClientsItem = menu.querySelector('[data-value=""]');
  menu.innerHTML = '';
  if (allClientsItem) {
    allClientsItem.className = 'dropdown-item' + (!currentClientId ? ' selected' : '');
    allClientsItem.onclick = () => {
      currentClientId = null;
      currentMatterId = null;
      updateWorkspaceSelectorLabel();
      loadDrafts();
      menu.closest('.dropdown-container').classList.remove('open');
    };
    menu.appendChild(allClientsItem);
  }

  for (const client of allClients) {
    // Client header item
    const clientItem = document.createElement('div');
    clientItem.className = 'dropdown-item' + (currentClientId === client.id && !currentMatterId ? ' selected' : '');
    clientItem.dataset.value = client.id;
    clientItem.innerHTML = `
      <div class="item-row">
        <span class="item-label">${escapeHtml(client.display_name || client.name)}</span>
        ${currentClientId === client.id && !currentMatterId ? '<svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
      </div>
      <span class="item-desc">Client workspace</span>
    `;
    clientItem.onclick = () => {
      currentClientId = client.id;
      currentMatterId = null;
      updateWorkspaceSelectorLabel();
      loadDrafts();
      menu.closest('.dropdown-container').classList.remove('open');
    };
    menu.appendChild(clientItem);

    // Load and show matters under this client
    if (!client._matters) {
      try { client._matters = await window.electronAPI.listMatters(client.id); } catch { client._matters = []; }
    }
    if (client._matters && client._matters.length > 0) {
      client._matters.forEach(matter => {
        const matterItem = document.createElement('div');
        matterItem.className = 'dropdown-item' + (currentMatterId === matter.id ? ' selected' : '');
        matterItem.style.paddingLeft = '28px';
        matterItem.innerHTML = `
          <div class="item-row">
            <span class="item-label" style="font-size:13px;">${escapeHtml(matter.name)}</span>
            ${currentMatterId === matter.id ? '<svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
          </div>
          <span class="item-desc">${matter.matter_type || 'matter'}</span>
        `;
        matterItem.onclick = () => {
          currentClientId = client.id;
          currentMatterId = matter.id;
          updateWorkspaceSelectorLabel();
          loadDrafts();
          menu.closest('.dropdown-container').classList.remove('open');
        };
        menu.appendChild(matterItem);
      });
    }

    // Add matter creation option under this client
    const addMatterItem = document.createElement('div');
    addMatterItem.className = 'dropdown-item';
    addMatterItem.style.paddingLeft = '28px';
    addMatterItem.innerHTML = `<div class="item-row"><span class="item-label" style="color:var(--accent-coral);font-size:13px;">+ New matter</span></div>`;
    addMatterItem.onclick = () => {
      menu.closest('.dropdown-container').classList.remove('open');
      createMatterFlowModal(client.id, client.display_name || client.name);
    };
    menu.appendChild(addMatterItem);
  }

  // Divider + create new client
  const divider = document.createElement('div');
  divider.className = 'dropdown-divider';
  menu.appendChild(divider);

  const createItem = document.createElement('div');
  createItem.className = 'dropdown-item';
  createItem.innerHTML = `<div class="item-row"><span class="item-label" style="color: var(--accent-coral);">+ New client</span></div>`;
  createItem.onclick = () => {
    menu.closest('.dropdown-container').classList.remove('open');
    createClientFlow();
  };
  menu.appendChild(createItem);
}

/**
 * Modal-based matter creation (works without the old sidebar).
 */
async function createMatterFlowModal(clientId, clientName) {
  const existing = document.querySelector('.draft-confirm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'draft-confirm-overlay';
  overlay.innerHTML = `
    <div class="draft-confirm-panel">
      <h3>New Matter for ${escapeHtml(clientName)}</h3>
      <input type="text" class="draft-confirm-instructions" placeholder="Matter name..." style="margin-bottom:8px;padding:10px 12px;" autofocus />
      <select class="draft-confirm-instructions" style="margin-bottom:16px;padding:8px 12px;">
        <option value="">Matter type...</option>
        <option value="estate">Estate</option>
        <option value="litigation">Litigation</option>
        <option value="contracts">Contracts</option>
        <option value="intake">Intake</option>
        <option value="general">General</option>
      </select>
      <div class="draft-confirm-actions">
        <button class="draft-confirm-cancel">Cancel</button>
        <button class="draft-confirm-generate">Create Matter</button>
      </div>
    </div>
  `;
  document.querySelector('.main-content').appendChild(overlay);
  const input = overlay.querySelector('input');
  const select = overlay.querySelector('select');
  input.focus();

  const submit = async () => {
    const name = input.value.trim();
    const matterType = select.value || null;
    overlay.remove();
    if (!name) return;
    try {
      const matter = await window.electronAPI.createMatter(clientId, name, matterType);
      currentClientId = clientId;
      currentMatterId = matter.id;
      // Refresh cached matters
      const client = allClients.find(c => c.id === clientId);
      if (client) client._matters = await window.electronAPI.listMatters(clientId);
      updateWorkspaceSelectorLabel();
      loadDrafts();
      showToast(`Matter "${name}" created`);
    } catch (err) {
      showToast('Failed: ' + err.message);
    }
  };

  overlay.querySelector('.draft-confirm-generate').onclick = submit;
  overlay.querySelector('.draft-confirm-cancel').onclick = () => overlay.remove();
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') overlay.remove();
  });
}

function updateWorkspaceSelectorLabel() {
  const label = document.getElementById('workspaceSelectorLabel');
  if (!label) return;

  if (currentMatterId && currentClientId) {
    const client = allClients.find(c => c.id === currentClientId);
    const matter = client?._matters?.find(m => m.id === currentMatterId);
    const clientName = client ? (client.display_name || client.name) : '';
    const matterName = matter ? matter.name : '';
    label.textContent = matterName ? `${clientName} / ${matterName}` : clientName;
  } else if (currentClientId) {
    const client = allClients.find(c => c.id === currentClientId);
    label.textContent = client ? (client.display_name || client.name) : 'Client';
  } else {
    label.textContent = 'Work in a client';
  }
}

/**
 * Render recent activity on the home screen.
 */
function renderHomeActivity() {
  const list = document.getElementById('homeActivityList');
  if (!list) return;
  list.innerHTML = '';

  const sortedChats = [...allChats].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const showAll = list.dataset.showAll === 'true';
  const chatsToShow = showAll ? sortedChats : sortedChats.slice(0, 10);

  if (sortedChats.length === 0) {
    list.innerHTML = '<div class="home-activity-empty">No recent chats</div>';
    return;
  }

  chatsToShow.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'home-activity-item';
    const timeAgo = getTimeAgo(chat.updatedAt);
    item.innerHTML = `
      <div class="home-activity-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div class="home-activity-info">
        <div class="home-activity-title">${escapeHtml(chat.title || 'New chat')}</div>
        <div class="home-activity-meta">${timeAgo}</div>
      </div>
    `;
    item.onclick = () => switchToChat(chat.id);
    list.appendChild(item);
  });

  if (sortedChats.length > 10 && !showAll) {
    const showMore = document.createElement('div');
    showMore.className = 'home-activity-item';
    showMore.style.justifyContent = 'center';
    showMore.style.color = 'var(--accent-coral)';
    showMore.style.fontSize = '13px';
    showMore.textContent = `Show all ${sortedChats.length} chats`;
    showMore.onclick = () => { list.dataset.showAll = 'true'; renderHomeActivity(); };
    list.appendChild(showMore);
  }
}

function getTimeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ==================== WORKSPACE NAVIGATION (Phase 2) ====================

/**
 * Load clients from backend and render the workspace nav.
 */
async function loadClients() {
  try {
    allClients = await window.electronAPI.listClients();
    renderWorkspaceNav();
  } catch (err) {
    console.error('[Workspace] Failed to load clients:', err);
    allClients = [];
    renderWorkspaceNav();
  }
}

/**
 * Render the clients/matters sidebar navigator.
 */
function renderWorkspaceNav() {
  const nav = document.getElementById('workspaceNav');
  if (!nav) return;

  nav.innerHTML = '';

  if (allClients.length === 0) {
    nav.innerHTML = '<div class="workspace-empty">No clients yet</div>';
    return;
  }

  allClients.forEach(client => {
    const clientDiv = document.createElement('div');
    clientDiv.className = 'client-item' + (expandedClients.has(client.id) ? ' expanded' : '');
    clientDiv.dataset.clientId = client.id;

    const header = document.createElement('div');
    header.className = 'client-item-header' + (currentClientId === client.id && !currentMatterId ? ' active' : '');
    header.innerHTML = `
      <svg class="expand-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <svg class="client-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      <span class="client-name">${escapeHtml(client.display_name || client.name)}</span>
      <button class="client-add-matter-btn" title="Add matter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    `;

    // Click header to select client scope and expand/collapse
    header.onclick = (e) => {
      if (e.target.closest('.client-add-matter-btn')) {
        e.stopPropagation();
        createMatterFlow(client.id);
        return;
      }
      // Set client as active workspace scope, clear matter scope
      currentClientId = client.id;
      currentMatterId = null;

      if (expandedClients.has(client.id)) {
        expandedClients.delete(client.id);
      } else {
        expandedClients.add(client.id);
        loadMattersForClient(client.id);
      }
      renderWorkspaceNav();
      loadDrafts(); // refresh drafts for client scope
    };

    clientDiv.appendChild(header);

    // Matter list (shown when expanded)
    const matterList = document.createElement('div');
    matterList.className = 'matter-list';
    matterList.id = `matters-${client.id}`;

    // If expanded and we have cached matters, render them
    if (client._matters && client._matters.length > 0) {
      client._matters.forEach(matter => {
        const matterItem = document.createElement('div');
        matterItem.className = 'matter-item' + (currentMatterId === matter.id ? ' active' : '');
        matterItem.innerHTML = `
          <svg class="matter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span class="matter-name">${escapeHtml(matter.name)}</span>
          ${matter.matter_type ? `<span class="matter-type-badge">${escapeHtml(matter.matter_type)}</span>` : ''}
        `;
        matterItem.onclick = () => selectMatter(client, matter);
        matterList.appendChild(matterItem);
      });
    } else if (expandedClients.has(client.id)) {
      matterList.innerHTML = '<div class="workspace-empty">No matters</div>';
    }

    clientDiv.appendChild(matterList);
    nav.appendChild(clientDiv);
  });
}

/**
 * Load matters for a client and cache them on the client object.
 */
async function loadMattersForClient(clientId) {
  try {
    const matters = await window.electronAPI.listMatters(clientId);
    const client = allClients.find(c => c.id === clientId);
    if (client) {
      client._matters = matters;
      renderWorkspaceNav();
    }
  } catch (err) {
    console.error('[Workspace] Failed to load matters for', clientId, err);
  }
}

/**
 * Select a matter as the current workspace context.
 * For now, this just sets state and updates the UI highlight.
 * Chat-to-matter linking will come in a later phase.
 */
function selectMatter(client, matter) {
  currentClientId = client.id;
  currentMatterId = matter.id;
  expandedClients.add(client.id);
  renderWorkspaceNav();
  loadDrafts(); // refresh drafts for new scope
  console.log('[Workspace] Selected matter:', matter.name, 'for client:', client.name);
}

/**
 * Prompt user to create a new client, then refresh nav.
 */
async function createClientFlow() {
  // Use overlay modal for client creation (works regardless of sidebar state)
  const existing = document.querySelector('.draft-confirm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'draft-confirm-overlay';
  overlay.innerHTML = `
    <div class="draft-confirm-panel">
      <h3>New Client</h3>
      <input type="text" class="draft-confirm-instructions" placeholder="Client name..." style="margin-bottom: 16px; padding: 10px 12px;" autofocus />
      <div class="draft-confirm-actions">
        <button class="draft-confirm-cancel">Cancel</button>
        <button class="draft-confirm-generate">Create Client</button>
      </div>
    </div>
  `;
  document.querySelector('.main-content').appendChild(overlay);

  const input = overlay.querySelector('input');
  input.focus();

  const submit = async () => {
    const name = input.value.trim();
    overlay.remove();
    if (!name) return;
    try {
      const client = await window.electronAPI.createClient(name);
      console.log('[Workspace] Created client:', client.name);
      currentClientId = client.id;
      currentMatterId = null;
      await loadClients();
      updateWorkspaceSelector();
      updateWorkspaceSelectorLabel();
      renderHomeActivity();
      showToast(`Client "${client.name}" created`);
    } catch (err) {
      console.error('[Workspace] Failed to create client:', err);
      showToast('Failed to create client: ' + err.message);
    }
  };

  overlay.querySelector('.draft-confirm-generate').onclick = submit;
  overlay.querySelector('.draft-confirm-cancel').onclick = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') overlay.remove();
  });
}

/**
 * Show inline form to create a new matter under a client.
 */
async function createMatterFlow(clientId) {
  const matterList = document.getElementById(`matters-${clientId}`);
  if (!matterList || matterList.querySelector('.inline-create-form')) return;

  const form = document.createElement('div');
  form.className = 'inline-create-form';
  form.innerHTML = `
    <input type="text" class="inline-create-input" placeholder="Matter name..." autofocus />
    <select class="inline-create-select">
      <option value="">Type...</option>
      <option value="estate">Estate</option>
      <option value="litigation">Litigation</option>
      <option value="contracts">Contracts</option>
      <option value="intake">Intake</option>
      <option value="general">General</option>
    </select>
    <div class="inline-create-actions">
      <button class="inline-create-submit" title="Create">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </button>
      <button class="inline-create-cancel" title="Cancel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `;
  matterList.prepend(form);

  const input = form.querySelector('input');
  const select = form.querySelector('select');
  input.focus();

  const submitMatter = async () => {
    const name = input.value.trim();
    if (!name) { form.remove(); return; }
    const matterType = select.value || null;
    try {
      await window.electronAPI.createMatter(clientId, name, matterType);
      console.log('[Workspace] Created matter:', name);
      expandedClients.add(clientId);
      await loadMattersForClient(clientId);
    } catch (err) {
      console.error('[Workspace] Failed to create matter:', err);
    }
    form.remove();
  };

  form.querySelector('.inline-create-submit').onclick = submitMatter;
  form.querySelector('.inline-create-cancel').onclick = () => form.remove();
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitMatter();
    if (e.key === 'Escape') form.remove();
  });
}

// ==================== TEMPLATE LIBRARY (Phase 3) ====================

let allTemplates = [];

/**
 * Load templates from backend and render the template list.
 */
async function loadTemplates() {
  try {
    allTemplates = await window.electronAPI.listTemplates();
    renderTemplateList();
  } catch (err) {
    console.error('[Templates] Failed to load templates:', err);
    allTemplates = [];
    renderTemplateList();
  }
}

/**
 * Render the templates sidebar list, grouped by type.
 */
function renderTemplateList() {
  const list = document.getElementById('templatesList');
  if (!list) return;

  list.innerHTML = '';

  if (allTemplates.length === 0) {
    list.innerHTML = '<div class="workspace-empty">No templates</div>';
    return;
  }

  // Group templates by type
  const grouped = {};
  allTemplates.forEach(t => {
    const type = t.template_type || 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(t);
  });

  // Render each group
  for (const [type, templates] of Object.entries(grouped)) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'template-group';

    const groupLabel = document.createElement('div');
    groupLabel.className = 'template-group-label';
    groupLabel.textContent = type.replace(/-/g, ' ');
    groupDiv.appendChild(groupLabel);

    templates.forEach(tmpl => {
      const item = document.createElement('div');
      item.className = 'template-item';
      item.innerHTML = `
        <svg class="template-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <div class="template-info">
          <span class="template-name">${escapeHtml(tmpl.name)}</span>
          ${tmpl.description ? `<span class="template-desc">${escapeHtml(tmpl.description)}</span>` : ''}
        </div>
      `;
      item.title = tmpl.description || tmpl.name;
      item.onclick = () => previewTemplate(tmpl);
      groupDiv.appendChild(item);
    });

    list.appendChild(groupDiv);
  }
}

/**
 * Handle template click — if a client is selected, show a draft generation
 * confirmation panel. Otherwise, notify the user to select a client first.
 */
async function previewTemplate(tmpl) {
  if (!currentClientId) {
    // Show a brief notification in the home view area
    showToast('Select a client first, then click a template to generate a draft.');
    return;
  }

  const client = allClients.find(c => c.id === currentClientId);
  const clientName = client ? (client.display_name || client.name) : currentClientId;
  const matterName = currentMatterId
    ? (client?._matters?.find(m => m.id === currentMatterId)?.name || currentMatterId)
    : 'Client-level (no matter selected)';

  // Show inline confirmation in the main content area
  showDraftConfirmation(tmpl, clientName, matterName);
}

/**
 * Show an inline draft generation confirmation panel.
 */
function showDraftConfirmation(tmpl, clientName, matterName) {
  // Remove any existing confirmation
  const existing = document.querySelector('.draft-confirm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'draft-confirm-overlay';
  overlay.innerHTML = `
    <div class="draft-confirm-panel">
      <h3>Generate Draft</h3>
      <div class="draft-confirm-details">
        <div class="draft-confirm-row"><span class="draft-confirm-label">Template:</span> <span>${escapeHtml(tmpl.name)}</span></div>
        <div class="draft-confirm-row"><span class="draft-confirm-label">Client:</span> <span>${escapeHtml(clientName)}</span></div>
        <div class="draft-confirm-row"><span class="draft-confirm-label">Matter:</span> <span>${escapeHtml(matterName)}</span></div>
      </div>
      <textarea class="draft-confirm-instructions" placeholder="Additional instructions for the agent (optional)..." rows="3"></textarea>
      <div class="draft-confirm-actions">
        <button class="draft-confirm-cancel">Cancel</button>
        <button class="draft-confirm-generate">Generate Draft</button>
      </div>
    </div>
  `;

  document.querySelector('.main-content').appendChild(overlay);

  const textarea = overlay.querySelector('textarea');
  textarea.focus();

  overlay.querySelector('.draft-confirm-cancel').onclick = () => overlay.remove();
  overlay.querySelector('.draft-confirm-generate').onclick = () => {
    const instructions = textarea.value.trim();
    overlay.remove();
    generateDraftFromTemplate(tmpl.id, instructions);
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });
}

/**
 * Show a brief toast notification.
 */
function showToast(message) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Generate a draft: get the drafting prompt from the backend, send it through
 * the chat pipeline, then save the agent's response as a draft file.
 */
async function generateDraftFromTemplate(templateId, instructions = '') {
  try {
    // Step 1: Get the assembled drafting prompt from the backend
    const { prompt: draftPrompt, templateName, clientName, matterName } =
      await window.electronAPI.generateDraftPrompt(templateId, currentClientId, currentMatterId, instructions);

    // Step 2: Always start a fresh chat session for template drafting
    // (avoids inheriting unrelated conversation history from prior sessions)
    if (currentChatId && chatMessages.children.length > 0) {
      saveState(); // save any current chat first
    }
    currentChatId = generateId();
    chatMessages.innerHTML = '';
    todos = [];
    toolCalls = [];
    stepsList.innerHTML = '';
    emptySteps.style.display = 'block';
    stepsCount.textContent = '0 steps';
    toolCallsList.innerHTML = '';
    emptyTools.style.display = 'block';
    switchToChatView();
    isFirstMessage = false;
    chatTitle.textContent = `Draft: ${templateName}`;

    // Show a user message indicating what's being generated
    const displayMsg = `Generate "${templateName}" for ${clientName}` +
      (matterName ? ` / ${matterName}` : '') +
      (instructions ? `\n\nInstructions: ${instructions}` : '');
    addUserMessage(displayMsg);

    // Step 3: Send through the existing chat/SSE pipeline
    isWaitingForResponse = true;
    updateSendButton(homeInput, homeSendBtn);
    updateSendButton(messageInput, chatSendBtn);

    const assistantMessage = createAssistantMessage();
    const contentDiv = assistantMessage.querySelector('.message-content');

    let fullResponse = '';
    let heartbeatChecker = null;

    const response = await window.electronAPI.sendMessage(draftPrompt, currentChatId, selectedProvider, selectedModel);
    const reader = await response.getReader();
    let buffer = '';
    let hasContent = false;
    let lastHeartbeat = Date.now();

    heartbeatChecker = setInterval(() => {
      if (Date.now() - lastHeartbeat > 300000) {
        console.warn('[Draft] No data for 5 minutes');
      }
    }, 30000);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          clearInterval(heartbeatChecker);
          const loadingIndicator = contentDiv.querySelector('.loading-indicator');
          if (loadingIndicator && hasContent) loadingIndicator.remove();
          const actionsDiv = assistantMessage.querySelector('.message-actions');
          if (actionsDiv) actionsDiv.classList.remove('hidden');
          break;
        }

        lastHeartbeat = Date.now();
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const chunk = JSON.parse(jsonStr);
            if (chunk.type === 'text' && chunk.content) {
              fullResponse += chunk.content;
              hasContent = true;
              const loadingIndicator = contentDiv.querySelector('.loading-indicator');
              if (loadingIndicator) loadingIndicator.remove();
              renderMarkdownContent(contentDiv, fullResponse);
              scrollToBottom();
            }
          } catch (e) { /* skip non-JSON lines */ }
        }
      }
    } catch (streamErr) {
      console.error('[Draft] Stream error:', streamErr);
      clearInterval(heartbeatChecker);
    }

    // Step 4: Save the generated content as a draft
    if (fullResponse.trim()) {
      try {
        const draft = await window.electronAPI.saveDraft(
          fullResponse.trim(),
          currentClientId,
          { templateId, matterId: currentMatterId, title: templateName }
        );
        console.log('[Draft] Saved:', draft.id, draft.title, 'v' + draft.version);

        // Show save confirmation in chat
        const saveNote = document.createElement('div');
        saveNote.style.cssText = 'margin-top: 12px; padding: 8px 12px; background: var(--tool-output-bg); color: var(--tool-output-text); border-radius: 6px; font-size: 13px; border-left: 3px solid var(--tool-output-border);';
        saveNote.textContent = `Draft saved: ${draft.title} v${draft.version} → ${draft.file_path}`;
        contentDiv.appendChild(saveNote);
        scrollToBottom();
      } catch (saveErr) {
        console.error('[Draft] Save error:', saveErr);
        const errNote = document.createElement('div');
        errNote.style.cssText = 'margin-top: 12px; padding: 8px 12px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 6px; font-size: 13px;';
        errNote.textContent = `Failed to save draft: ${saveErr.message}`;
        contentDiv.appendChild(errNote);
      }
    }

    isWaitingForResponse = false;
    updateSendButton(homeInput, homeSendBtn);
    updateSendButton(messageInput, chatSendBtn);
    saveState();

  } catch (err) {
    console.error('[Draft] Generation error:', err);
    alert('Failed to generate draft: ' + err.message);
    isWaitingForResponse = false;
    updateSendButton(homeInput, homeSendBtn);
    updateSendButton(messageInput, chatSendBtn);
  }
}

/**
 * Render markdown content into a div (reused for draft streaming).
 */
function renderMarkdownContent(div, markdown) {
  if (typeof marked !== 'undefined' && marked.parse) {
    div.innerHTML = marked.parse(markdown);
    div.dataset.rawContent = markdown;
  } else {
    div.textContent = markdown;
  }
}

// ==================== DRAFT MANAGEMENT (Phase 5) ====================

let allDrafts = [];
let currentDraft = null; // full draft object with content
let draftSourceMode = false;

/**
 * Load drafts for the current client from backend.
 */
async function loadDrafts() {
  const list = document.getElementById('draftsList');
  if (!currentClientId) {
    if (list) list.innerHTML = '<div class="workspace-empty">Select a client</div>';
    allDrafts = [];
    return;
  }

  try {
    allDrafts = await window.electronAPI.listDrafts(currentClientId, currentMatterId);
    renderDraftList();
  } catch (err) {
    console.error('[Drafts] Failed to load:', err);
    allDrafts = [];
    renderDraftList();
  }
}

/**
 * Render the drafts sidebar list.
 */
function renderDraftList() {
  const list = document.getElementById('draftsList');
  if (!list) return;

  list.innerHTML = '';

  if (allDrafts.length === 0) {
    list.innerHTML = '<div class="workspace-empty">No drafts yet</div>';
    return;
  }

  allDrafts.forEach(draft => {
    const item = document.createElement('div');
    item.className = 'draft-item' + (currentDraft && currentDraft.id === draft.id ? ' active' : '');
    item.innerHTML = `
      <svg class="draft-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <div class="draft-info">
        <span class="draft-name">${escapeHtml(draft.title)}</span>
        <span class="draft-meta">${draft.created_at?.split(' ')[0] || ''}</span>
      </div>
      <span class="draft-version-badge">v${draft.version}</span>
      <span class="draft-status-badge status-${draft.status}">${draft.status}</span>
    `;
    item.onclick = () => openDraftPreview(draft.id);
    list.appendChild(item);
  });
}

/**
 * Open a draft in the preview view.
 */
async function openDraftPreview(draftId) {
  try {
    const draft = await window.electronAPI.getDraft(draftId);
    if (!draft) {
      alert('Draft not found');
      return;
    }

    currentDraft = draft;
    draftSourceMode = false;

    // Update preview header
    document.getElementById('draftPreviewTitle').textContent = draft.title;
    document.getElementById('draftPreviewMeta').textContent =
      `v${draft.version} · ${draft.status}${draft.draft_type ? ' · ' + draft.draft_type : ''}`;

    // Render content
    const contentDiv = document.getElementById('draftPreviewContent');
    contentDiv.classList.remove('source-mode');
    if (draft.content) {
      renderMarkdownContent(contentDiv, draft.content);
    } else {
      contentDiv.innerHTML = '<p style="color: var(--text-tertiary);">Draft file not found on disk.</p>';
    }

    // Switch to preview view
    switchToDraftPreview();
    renderDraftList(); // update active state
  } catch (err) {
    console.error('[Drafts] Failed to open:', err);
    alert('Failed to open draft: ' + err.message);
  }
}

/**
 * Toggle between rendered preview and raw markdown source.
 */
function toggleDraftSource() {
  if (!currentDraft || !currentDraft.content) return;

  draftSourceMode = !draftSourceMode;
  const contentDiv = document.getElementById('draftPreviewContent');
  const toggleBtn = document.getElementById('draftSourceToggle');

  if (draftSourceMode) {
    contentDiv.classList.add('source-mode');
    contentDiv.innerHTML = '';
    const pre = document.createElement('pre');
    pre.textContent = currentDraft.content;
    contentDiv.appendChild(pre);
    toggleBtn.classList.add('active');
  } else {
    contentDiv.classList.remove('source-mode');
    renderMarkdownContent(contentDiv, currentDraft.content);
    toggleBtn.classList.remove('active');
  }
}

/**
 * Revise the current draft — sends it back through the agent to create a new version.
 */
async function reviseDraft() {
  if (!currentDraft) return;

  // Show inline revision input overlay
  const existing = document.querySelector('.draft-confirm-overlay');
  if (existing) existing.remove();

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'draft-confirm-overlay';
    overlay.innerHTML = `
      <div class="draft-confirm-panel">
        <h3>Revise: ${escapeHtml(currentDraft.title)} v${currentDraft.version}</h3>
        <textarea class="draft-confirm-instructions" placeholder="What should be changed?..." rows="4" autofocus></textarea>
        <div class="draft-confirm-actions">
          <button class="draft-confirm-cancel">Cancel</button>
          <button class="draft-confirm-generate">Revise Draft</button>
        </div>
      </div>
    `;
    document.querySelector('.main-content').appendChild(overlay);
    const textarea = overlay.querySelector('textarea');
    textarea.focus();

    const cancel = () => { overlay.remove(); resolve(); };
    const submit = () => {
      const instructions = textarea.value.trim();
      overlay.remove();
      if (!instructions) { resolve(); return; }
      executeRevision(instructions).then(resolve);
    };

    overlay.querySelector('.draft-confirm-cancel').onclick = cancel;
    overlay.querySelector('.draft-confirm-generate').onclick = submit;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cancel(); });
    textarea.addEventListener('keydown', (e) => { if (e.key === 'Escape') cancel(); });
  });
}

async function executeRevision(instructions) {
  const revisePrompt = `You are revising an Equal Scales legal draft.

## Current Draft

Title: ${currentDraft.title}
Version: ${currentDraft.version}
Status: ${currentDraft.status}

## Current Content

\`\`\`
${currentDraft.content}
\`\`\`

## Revision Instructions

${instructions.trim()}

## Rules

1. Apply the requested revisions to the draft.
2. Preserve the overall structure and formatting.
3. Do not change sections that are not affected by the revision instructions.
4. If the revision creates legal uncertainty, mark it as **[REVIEW REQUIRED]**.
5. Keep the output professional and ready for attorney review.

## Output

Return ONLY the revised draft content. Do not include explanations or code fences.`;

  // Save current preview state, switch to chat for the revision
  if (currentChatId && chatMessages.children.length > 0) {
    saveState();
  }
  currentChatId = generateId();
  chatMessages.innerHTML = '';
  todos = [];
  toolCalls = [];
  stepsList.innerHTML = '';
  emptySteps.style.display = 'block';
  stepsCount.textContent = '0 steps';
  toolCallsList.innerHTML = '';
  emptyTools.style.display = 'block';
  switchToChatView();
  isFirstMessage = false;
  chatTitle.textContent = `Revise: ${currentDraft.title} v${currentDraft.version}`;

  addUserMessage(`Revise "${currentDraft.title}" v${currentDraft.version}\n\nInstructions: ${instructions.trim()}`);

  isWaitingForResponse = true;
  updateSendButton(homeInput, homeSendBtn);
  updateSendButton(messageInput, chatSendBtn);

  const assistantMessage = createAssistantMessage();
  const contentDiv = assistantMessage.querySelector('.message-content');
  let fullResponse = '';

  try {
    const response = await window.electronAPI.sendMessage(revisePrompt, currentChatId, selectedProvider, selectedModel);
    const reader = await response.getReader();
    let buffer = '';
    let hasContent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        const loading = contentDiv.querySelector('.loading-indicator');
        if (loading && hasContent) loading.remove();
        const actions = assistantMessage.querySelector('.message-actions');
        if (actions) actions.classList.remove('hidden');
        break;
      }

      buffer += value;
      const lines = buffer.split('\n');
      buffer = lines[lines.length - 1];

      for (let i = 0; i < lines.length - 1; i++) {
        if (!lines[i].startsWith('data: ')) continue;
        const jsonStr = lines[i].slice(6).trim();
        if (!jsonStr) continue;
        try {
          const chunk = JSON.parse(jsonStr);
          if (chunk.type === 'text' && chunk.content) {
            fullResponse += chunk.content;
            hasContent = true;
            const loading = contentDiv.querySelector('.loading-indicator');
            if (loading) loading.remove();
            renderMarkdownContent(contentDiv, fullResponse);
            scrollToBottom();
          }
        } catch (e) { /* skip */ }
      }
    }

    // Save as new version
    if (fullResponse.trim()) {
      try {
        const newDraft = await window.electronAPI.saveDraft(
          fullResponse.trim(),
          currentDraft.client_id,
          {
            templateId: currentDraft.template_id,
            matterId: currentDraft.matter_id,
            title: currentDraft.title
          }
        );

        const saveNote = document.createElement('div');
        saveNote.style.cssText = 'margin-top: 12px; padding: 8px 12px; background: var(--tool-output-bg); color: var(--tool-output-text); border-radius: 6px; font-size: 13px; border-left: 3px solid var(--tool-output-border);';
        saveNote.textContent = `Revised draft saved: ${newDraft.title} v${newDraft.version} → ${newDraft.file_path}`;
        contentDiv.appendChild(saveNote);
        scrollToBottom();

        // Refresh drafts list
        await loadDrafts();
      } catch (saveErr) {
        console.error('[Drafts] Save revision error:', saveErr);
      }
    }
  } catch (err) {
    console.error('[Drafts] Revision error:', err);
  }

  isWaitingForResponse = false;
  updateSendButton(homeInput, homeSendBtn);
  updateSendButton(messageInput, chatSendBtn);
  saveState();
}

/**
 * Switch to draft preview view (hide home + chat views).
 */
function switchToDraftPreview() {
  document.getElementById('homeView').classList.add('hidden');
  document.getElementById('chatView').classList.add('hidden');
  document.getElementById('draftPreviewView').classList.remove('hidden');
}

/**
 * Leave draft preview and return to home view.
 */
function closeDraftPreview() {
  document.getElementById('draftPreviewView').classList.add('hidden');
  currentDraft = null;
  renderDraftList();
  // Go back to home or last chat
  if (currentChatId) {
    const chat = allChats.find(c => c.id === currentChatId);
    if (chat) {
      document.getElementById('chatView').classList.remove('hidden');
      return;
    }
  }
  document.getElementById('homeView').classList.remove('hidden');
}

// Switch to a different chat
function switchToChat(chatId) {
  // Abort any ongoing request when switching chats
  if (isWaitingForResponse) {
    window.electronAPI.abortCurrentRequest();
    isWaitingForResponse = false;
  }

  if (currentChatId) {
    saveState();
  }

  const chat = allChats.find(c => c.id === chatId);
  if (chat) {
    loadChat(chat);
  }

  // Update send button states
  updateSendButton(homeInput, homeSendBtn);
  updateSendButton(messageInput, chatSendBtn);
}

// Delete a chat
window.deleteChat = function(chatId, event) {
  event.stopPropagation();

  allChats = allChats.filter(c => c.id !== chatId);
  localStorage.setItem('allChats', JSON.stringify(allChats));

  if (currentChatId === chatId) {
    // If deleting current chat, go to home or load another chat
    if (allChats.length > 0) {
      loadChat(allChats[0]);
    } else {
      currentChatId = null;
      localStorage.removeItem('currentChatId');
      homeView.classList.remove('hidden');
      chatView.classList.add('hidden');
      isFirstMessage = true;
    }
  }

  renderChatHistory();
}

// Update greeting based on time of day
function updateGreeting() {
  // Greeting is now static, no need to update
}

// Setup all event listeners
function setupEventListeners() {
  // Home form
  homeForm.addEventListener('submit', handleSendMessage);
  homeInput.addEventListener('input', () => {
    updateSendButton(homeInput, homeSendBtn);
    autoResizeTextarea(homeInput);
  });
  homeInput.addEventListener('keydown', (e) => handleKeyPress(e, homeForm));

  // Chat form
  chatForm.addEventListener('submit', handleSendMessage);
  messageInput.addEventListener('input', () => {
    updateSendButton(messageInput, chatSendBtn);
    autoResizeTextarea(messageInput);
  });
  messageInput.addEventListener('keydown', (e) => handleKeyPress(e, chatForm));

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  // Add client button
  const addClientBtn = document.getElementById('addClientBtn');
  if (addClientBtn) addClientBtn.addEventListener('click', createClientFlow);

  // Voice input widgets
  const homeVoiceWidget = document.getElementById('homeVoiceWidget');
  if (homeVoiceWidget) setupVoiceWidget(homeVoiceWidget, homeInput);
  const chatVoiceWidget = document.getElementById('chatVoiceWidget');
  if (chatVoiceWidget) setupVoiceWidget(chatVoiceWidget, messageInput);

  // Finder-first file actions
  const openFinderBtn = document.getElementById('openInFinderBtn');
  if (openFinderBtn) openFinderBtn.addEventListener('click', openContextualFinder);
  const chatFinderBtn = document.getElementById('chatOpenInFinderBtn');
  if (chatFinderBtn) chatFinderBtn.addEventListener('click', openContextualFinder);

  // Workspace selector dropdown
  const wsBtn = document.getElementById('workspaceSelectorBtn');
  if (wsBtn) {
    wsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById('workspaceDropdown');
      closeOtherDropdowns(dropdown);
      dropdown.classList.toggle('open');
      updateWorkspaceSelector();
    });
  }

  // Collapsible sidebar sections
  document.querySelectorAll('.workspace-section-header[data-section]').forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', (e) => {
      // Don't collapse if clicking the + button
      if (e.target.closest('.workspace-add-btn')) return;
      const sectionId = header.dataset.section;
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.toggle('collapsed');
        // Persist state
        const collapsed = JSON.parse(localStorage.getItem('collapsedSections') || '[]');
        if (section.classList.contains('collapsed')) {
          if (!collapsed.includes(sectionId)) collapsed.push(sectionId);
        } else {
          const idx = collapsed.indexOf(sectionId);
          if (idx > -1) collapsed.splice(idx, 1);
        }
        localStorage.setItem('collapsedSections', JSON.stringify(collapsed));
      }
    });
  });

  // Restore collapsed section state from localStorage
  const collapsedSections = JSON.parse(localStorage.getItem('collapsedSections') || '[]');
  collapsedSections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('collapsed');
  });

  // Draft preview controls
  const draftBackBtn = document.getElementById('draftBackBtn');
  if (draftBackBtn) draftBackBtn.addEventListener('click', closeDraftPreview);
  const draftSourceToggle = document.getElementById('draftSourceToggle');
  if (draftSourceToggle) draftSourceToggle.addEventListener('click', toggleDraftSource);
  const draftReviseBtn = document.getElementById('draftReviseBtn');
  if (draftReviseBtn) draftReviseBtn.addEventListener('click', reviseDraft);

  // Right sidebar toggle
  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
  if (rightSidebarExpand) rightSidebarExpand.addEventListener('click', toggleSidebar);

  // Left sidebar toggle (chat history) — may not exist in new layout
  if (leftSidebarToggle) leftSidebarToggle.addEventListener('click', toggleLeftSidebar);
  if (leftSidebarExpand) leftSidebarExpand.addEventListener('click', toggleLeftSidebar);

  // File attachment buttons
  const homeAttachBtn = document.getElementById('homeAttachBtn');
  const chatAttachBtn = document.getElementById('chatAttachBtn');
  const homeFileInput = document.getElementById('homeFileInput');
  const chatFileInput = document.getElementById('chatFileInput');

  homeAttachBtn.addEventListener('click', () => homeFileInput.click());
  chatAttachBtn.addEventListener('click', () => chatFileInput.click());
  homeFileInput.addEventListener('change', (e) => handleFileSelect(e, 'home'));
  chatFileInput.addEventListener('change', (e) => handleFileSelect(e, 'chat'));

  // Setup dropdowns
  setupDropdowns();

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-container')) {
      document.querySelectorAll('.dropdown-container.open').forEach(d => d.classList.remove('open'));
    }
  });
}

// Setup dropdown functionality
function setupDropdowns() {
  // Thinking mode toggle buttons
  ['homeThinkingBtn', 'chatThinkingBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      thinkingMode = thinkingMode === 'normal' ? 'extended' : 'normal';

      // Update all thinking buttons
      document.querySelectorAll('.thinking-btn').forEach(b => {
        b.classList.toggle('active', thinkingMode === 'extended');
      });
    });
  });

  ['homeProviderDropdown', 'chatProviderDropdown'].forEach(id => {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;

    const btn = dropdown.querySelector('.provider-selector');
    const items = dropdown.querySelectorAll('.dropdown-item');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeOtherDropdowns(dropdown);
      dropdown.classList.toggle('open');
    });

    items.forEach(item => {
      item.addEventListener('click', () => {
        const value = item.dataset.value;
        if (!value) return;

        const label = item.querySelector('.item-label').textContent;
        selectedProvider = value;

        // Update all provider selectors
        document.querySelectorAll('.provider-selector .provider-label').forEach(l => {
          l.textContent = label;
        });

        // Update selected state and checkmarks for provider dropdowns
        document.querySelectorAll('.provider-menu .dropdown-item').forEach(i => {
          const isSelected = i.dataset.value === value;
          i.classList.toggle('selected', isSelected);

          // Update checkmark visibility
          let checkIcon = i.querySelector('.check-icon');
          if (isSelected && !checkIcon) {
            // Add checkmark if selected and doesn't have one
            const itemRow = i.querySelector('.item-row');
            if (itemRow) {
              checkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              checkIcon.setAttribute('class', 'check-icon');
              checkIcon.setAttribute('viewBox', '0 0 24 24');
              checkIcon.setAttribute('fill', 'none');
              checkIcon.setAttribute('stroke', 'currentColor');
              checkIcon.setAttribute('stroke-width', '2');
              checkIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
              itemRow.appendChild(checkIcon);
            }
          }
          if (checkIcon) {
            checkIcon.style.display = isSelected ? 'block' : 'none';
          }
        });

        // Update model dropdown for new provider
        updateModelDropdowns(value);

        // Save to localStorage immediately
        localStorage.setItem('selectedProvider', value);
        localStorage.setItem('selectedModel', selectedModel);

        dropdown.classList.remove('open');
      });
    });
  });

  // Model selector dropdowns
  ['homeModelDropdown', 'chatModelDropdown'].forEach(id => {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;

    const btn = dropdown.querySelector('.model-selector');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeOtherDropdowns(dropdown);
      dropdown.classList.toggle('open');
    });

    // Event delegation for model items (since they're dynamically updated)
    dropdown.querySelector('.model-menu').addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item) return;

      const value = item.dataset.value;
      if (!value) return;

      const label = item.querySelector('.item-label').textContent;
      selectedModel = value;

      // Update all model selectors
      document.querySelectorAll('.model-selector .model-label').forEach(l => {
        l.textContent = label;
      });

      // Update selected state and checkmarks
      document.querySelectorAll('.model-menu .dropdown-item').forEach(i => {
        const isSelected = i.dataset.value === value;
        i.classList.toggle('selected', isSelected);

        // Update checkmark visibility
        const checkIcon = i.querySelector('.check-icon');
        if (checkIcon) {
          checkIcon.style.display = isSelected ? 'block' : 'none';
        }
      });

      // Save to localStorage immediately
      localStorage.setItem('selectedModel', value);

      dropdown.classList.remove('open');
    });
  });
}

// Update model dropdowns based on selected provider
function updateModelDropdowns(provider) {
  const models = providerModels[provider] || providerModels.claude;

  // Find default model for this provider
  const defaultModel = models.find(m => m.default) || models[0];
  selectedModel = defaultModel.value;

  // Save to localStorage
  localStorage.setItem('selectedModel', selectedModel);

  // Generate HTML for model items
  const modelItemsHtml = models.map(model => `
    <div class="dropdown-item${model.default ? ' selected' : ''}" data-value="${model.value}">
      <div class="item-row">
        <span class="item-label">${model.label}</span>
        ${model.default ? `<svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>` : ''}
      </div>
      <span class="item-desc">${model.desc}</span>
    </div>
  `).join('');

  // Update both model menus
  document.querySelectorAll('.model-menu').forEach(menu => {
    menu.innerHTML = modelItemsHtml;
    menu.dataset.provider = provider;
  });

  // Update model label in selectors
  document.querySelectorAll('.model-selector .model-label').forEach(l => {
    l.textContent = defaultModel.label;
  });
}

// Close other dropdowns
function closeOtherDropdowns(currentDropdown) {
  document.querySelectorAll('.dropdown-container.open').forEach(d => {
    if (d !== currentDropdown) d.classList.remove('open');
  });
}

// Handle file selection
function handleFileSelect(event, context) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    if (attachedFiles.length >= 5) {
      alert('Maximum 5 files allowed');
      return;
    }

    // Read file contents
    const reader = new FileReader();
    reader.onload = (e) => {
      attachedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result
      });
      renderAttachedFiles(context);
    };

    // Determine read strategy based on file type
    const textTypes = ['text/', 'application/json', 'application/xml', 'application/javascript',
      'application/typescript', 'application/x-yaml', 'application/x-sh'];
    const textExtensions = ['.txt', '.md', '.csv', '.json', '.xml', '.yaml', '.yml', '.js', '.ts',
      '.py', '.html', '.css', '.sh', '.env', '.log', '.sql', '.rb', '.go', '.rs', '.java', '.c',
      '.h', '.cpp', '.swift', '.kt', '.toml', '.ini', '.cfg', '.conf'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isTextFile = textTypes.some(t => file.type.startsWith(t)) || textExtensions.includes(ext);

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else if (isTextFile) {
      reader.readAsText(file);
    } else {
      // Binary files (docx, pdf, etc.) — read as base64
      reader.readAsDataURL(file);
    }
  });

  // Reset input
  event.target.value = '';
}

// Render attached files preview
function renderAttachedFiles(context) {
  const inputWrapper = context === 'home'
    ? document.querySelector('#homeForm .input-wrapper')
    : document.querySelector('#chatForm .input-wrapper');

  let filesContainer = inputWrapper.querySelector('.attached-files');
  if (!filesContainer) {
    filesContainer = document.createElement('div');
    filesContainer.className = 'attached-files';
    inputWrapper.insertBefore(filesContainer, inputWrapper.firstChild);
  }

  filesContainer.innerHTML = attachedFiles.map((file, index) => `
    <div class="attached-file">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <span>${file.name}</span>
      <svg class="remove-file" onclick="removeAttachedFile(${index}, '${context}')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  `).join('');

  if (attachedFiles.length === 0) {
    filesContainer.remove();
  }

  // Update send button state based on files
  if (context === 'home') {
    updateSendButton(homeInput, homeSendBtn);
  } else {
    updateSendButton(messageInput, chatSendBtn);
  }
}

// Remove attached file
window.removeAttachedFile = function(index, context) {
  attachedFiles.splice(index, 1);
  renderAttachedFiles(context);
}

// Toggle sidebar (right sidebar)
function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');

  rightSidebarExpand.classList.toggle('visible', isCollapsed);

  const icon = sidebarToggle.querySelector('svg');
  if (isCollapsed) {
    icon.innerHTML = '<polyline points="15 18 9 12 15 6"></polyline>';
    sidebarToggle.title = 'Expand sidebar';
  } else {
    icon.innerHTML = '<polyline points="9 18 15 12 9 6"></polyline>';
    sidebarToggle.title = 'Collapse sidebar';
  }
}

// Toggle left sidebar (chat history)
function toggleLeftSidebar() {
  leftSidebar.classList.toggle('collapsed');
  const isCollapsed = leftSidebar.classList.contains('collapsed');

  leftSidebarExpand.classList.toggle('visible', isCollapsed);

  // Update toggle button icon direction
  const icon = leftSidebarToggle.querySelector('svg');
  if (isCollapsed) {
    icon.innerHTML = '<polyline points="9 18 15 12 9 6"></polyline>';
    leftSidebarToggle.title = 'Expand sidebar';
  } else {
    icon.innerHTML = '<polyline points="15 18 9 12 15 6"></polyline>';
    leftSidebarToggle.title = 'Collapse sidebar';
  }
}

// Update send button state
function updateSendButton(input, button) {
  if (isWaitingForResponse) {
    // In streaming mode - show stop icon and enable button
    button.disabled = false;
    button.classList.add('streaming');
    const sendIcon = button.querySelector('.send-icon');
    const stopIcon = button.querySelector('.stop-icon');
    if (sendIcon) sendIcon.classList.add('hidden');
    if (stopIcon) stopIcon.classList.remove('hidden');
  } else {
    // Normal mode - show send icon, enable if text or files present
    button.disabled = !input.value.trim() && attachedFiles.length === 0;
    button.classList.remove('streaming');
    const sendIcon = button.querySelector('.send-icon');
    const stopIcon = button.querySelector('.stop-icon');
    if (sendIcon) sendIcon.classList.remove('hidden');
    if (stopIcon) stopIcon.classList.add('hidden');
  }
}

// Stop the current streaming query
async function stopCurrentQuery() {
  if (!isWaitingForResponse || !currentChatId) return;

  console.log('[Chat] Stopping query for chatId:', currentChatId);

  // Abort the client-side fetch
  window.electronAPI.abortCurrentRequest();

  // Tell the backend to stop processing
  await window.electronAPI.stopQuery(currentChatId, selectedProvider);

  // Reset state
  isWaitingForResponse = false;
  updateSendButton(messageInput, chatSendBtn);
  updateSendButton(homeInput, homeSendBtn);

  // Remove loading indicator from last assistant message
  const lastMessage = chatMessages.lastElementChild;
  if (lastMessage && lastMessage.classList.contains('assistant')) {
    const loadingIndicator = lastMessage.querySelector('.loading-indicator');
    if (loadingIndicator) loadingIndicator.remove();

    // Add a note that the response was stopped
    const contentDiv = lastMessage.querySelector('.message-content');
    if (contentDiv) {
      const stoppedNote = document.createElement('p');
      stoppedNote.style.color = '#888';
      stoppedNote.style.fontStyle = 'italic';
      stoppedNote.textContent = '[Response stopped]';
      contentDiv.appendChild(stoppedNote);
    }
  }

  saveState();
}

// Handle key press
function handleKeyPress(e, form) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
}


function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

// Reset textarea height after sending
function resetTextareaHeight(textarea) {
  textarea.style.height = 'auto';
}

// Switch to chat view
function switchToChatView() {
  homeView.classList.add('hidden');
  chatView.classList.remove('hidden');
  document.getElementById('draftPreviewView').classList.add('hidden');
  messageInput.focus();
}

// Handle form submission
async function handleSendMessage(e) {
  e.preventDefault();

  // If currently streaming, stop the query instead
  if (isWaitingForResponse) {
    await stopCurrentQuery();
    return;
  }

  const input = isFirstMessage ? homeInput : messageInput;
  const message = input.value.trim();
  const filesToSend = [...attachedFiles];

  if (!message && filesToSend.length === 0) {
    return;
  }

  if (isFirstMessage) {
    // Always generate a new ID for a new conversation
    currentChatId = generateId();
    switchToChatView();
    isFirstMessage = false;
    const titleText = message || filesToSend.map(f => f.name).join(', ');
    chatTitle.textContent = titleText.length > 30 ? titleText.substring(0, 30) + '...' : titleText;
  } else if (!currentChatId) {
    currentChatId = generateId();
    const titleText = message || filesToSend.map(f => f.name).join(', ');
    chatTitle.textContent = titleText.length > 30 ? titleText.substring(0, 30) + '...' : titleText;
  }

  // Build the prompt: include file contents in the message sent to the agent
  let prompt = message;
  if (filesToSend.length > 0) {
    const fileParts = filesToSend.map(f => {
      if (f.type.startsWith('image/')) {
        return `[Attached image: ${f.name} (${formatFileSize(f.size)})]`;
      }
      // If data is a data URL (base64), it's a binary file
      if (typeof f.data === 'string' && f.data.startsWith('data:')) {
        return `[Attached file: ${f.name} (${formatFileSize(f.size)}) — binary file, content not directly readable as text]`;
      }
      // Text-based file — include contents
      return `--- File: ${f.name} ---\n${f.data}`;
    }).join('\n\n');

    if (message) {
      prompt = `${message}\n\n${fileParts}`;
    } else {
      prompt = `Please review the following attached file(s):\n\n${fileParts}`;
    }
  }

  // Add user message to chat (display version)
  addUserMessage(message, filesToSend);

  // Clear input and files
  input.value = '';
  resetTextareaHeight(input);
  attachedFiles = [];
  const context = isFirstMessage || input === homeInput ? 'home' : 'chat';
  renderAttachedFiles(context);

  // Set loading state
  isWaitingForResponse = true;

  // Update buttons to show stop icon
  updateSendButton(homeInput, homeSendBtn);
  updateSendButton(messageInput, chatSendBtn);

  // Create assistant message with loading state
  const assistantMessage = createAssistantMessage();
  const contentDiv = assistantMessage.querySelector('.message-content');

  // Declare heartbeatChecker outside try block so it's accessible in finally
  let heartbeatChecker = null;

  try {
    console.log('[Chat] Sending message to API...');
    // Pass chatId, provider, and model for session management
    const response = await window.electronAPI.sendMessage(prompt, currentChatId, selectedProvider, selectedModel, currentClientId, currentMatterId);
    console.log('[Chat] Response received');

    const reader = await response.getReader();
    let buffer = '';
    let hasContent = false;
    let receivedStreamingText = false;
    const pendingToolCalls = new Map();

    let lastHeartbeat = Date.now();
    const heartbeatTimeout = 300000;
    let connectionLost = false;

    heartbeatChecker = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;
      if (timeSinceLastHeartbeat > heartbeatTimeout) {
        console.warn('[Chat] No data received for 5 minutes - connection may be lost');
      }
    }, 30000); 

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[Chat] Stream complete');
          clearInterval(heartbeatChecker);
          const loadingIndicator = contentDiv.querySelector('.loading-indicator');
          if (loadingIndicator && hasContent) {
            loadingIndicator.remove();
          }
          const actionsDiv = assistantMessage.querySelector('.message-actions');
          if (actionsDiv) {
            actionsDiv.classList.remove('hidden');
          }
          for (const [apiId, localId] of pendingToolCalls) {
            updateToolCallStatus(localId, 'success');
          }
          break;
        }

        lastHeartbeat = Date.now();

        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];

          // Detect heartbeat comments from server
          if (line.startsWith(':')) {
            continue; // Skip SSE comments (heartbeats)
          }

          if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6);
            const data = JSON.parse(jsonStr);

            // Debug: log all received events
            console.log('[Frontend] Received event:', data.type, data.name || '');

            if (data.type === 'done') {
              break;
            } else if (data.type === 'text' && data.content) {
              if (!hasContent) {
                const loadingIndicator = contentDiv.querySelector('.loading-indicator');
                if (loadingIndicator) loadingIndicator.remove();
              }
              hasContent = true;
              receivedStreamingText = true;
              if (data.isReasoning) {
                appendToThinking(contentDiv, data.content);
              } else {
                appendToContent(contentDiv, data.content);
              }
            } else if (data.type === 'tool_use') {
              const toolName = data.name || data.tool || 'Tool';
              const toolInput = data.input || {};
              const apiId = data.id; // API's tool ID
              const toolCall = addToolCall(toolName, toolInput, 'running');
              addInlineToolCall(contentDiv, toolName, toolInput, toolCall.id);
              if (apiId) {
                pendingToolCalls.set(apiId, toolCall.id);
              }

              if (toolName === 'TodoWrite' && toolInput.todos) {
                updateTodos(toolInput.todos);
              }

              hasContent = true;
            } else if (data.type === 'tool_result' || data.type === 'result') {
              const result = data.result || data.content || data;
              const apiId = data.tool_use_id;

              // Find the matching tool call by API ID
              const localId = apiId ? pendingToolCalls.get(apiId) : null;
              if (localId) {
                updateToolCallResult(localId, result);
                updateToolCallStatus(localId, 'success');
                updateInlineToolResult(localId, result);
                pendingToolCalls.delete(apiId);
              }

              if (!hasContent) {
                const loadingIndicator = contentDiv.querySelector('.loading-indicator');
                if (loadingIndicator) loadingIndicator.remove();
              }
              hasContent = true;
            } else if (data.type === 'assistant' && data.message) {
              if (data.message.content && Array.isArray(data.message.content)) {
                for (const block of data.message.content) {
                  if (block.type === 'tool_use') {
                    const toolName = block.name || 'Tool';
                    const toolInput = block.input || {};
                    const apiId = block.id; // API's tool ID
                    const toolCall = addToolCall(toolName, toolInput, 'running');
                    addInlineToolCall(contentDiv, toolName, toolInput, toolCall.id);
                    if (apiId) {
                      pendingToolCalls.set(apiId, toolCall.id);
                    }
                    hasContent = true;
                  } else if (block.type === 'text' && block.text) {
                    if (!receivedStreamingText) {
                      if (!hasContent) {
                        const loadingIndicator = contentDiv.querySelector('.loading-indicator');
                        if (loadingIndicator) loadingIndicator.remove();
                      }
                      hasContent = true;
                      appendToContent(contentDiv, block.text);
                    }
                  }
                }
              }

              if (data.message.content && Array.isArray(data.message.content)) {
                for (const block of data.message.content) {
                  if (block.type === 'tool_use' && block.name === 'TodoWrite') {
                    updateTodos(block.input.todos);
                  }
                }
              }
            }

            scrollToBottom();
          } catch (parseError) {
            // Silent fail on parse errors
          }
        }
      }
      }
    } catch (readerError) {
      console.error('[Chat] Reader error:', readerError);
      clearInterval(heartbeatChecker);
      throw readerError; // Re-throw to outer catch
    }
  } catch (error) {
    clearInterval(heartbeatChecker);

    // Don't show error for aborted requests (user clicked stop or switched chats)
    if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('abort')) {
      console.log('[Chat] Request was aborted');
      return;
    }

    // Skip showing error if message is undefined or empty (likely an abort)
    if (!error?.message) {
      console.log('[Chat] Request ended without error message (likely aborted)');
      return;
    }

    console.error('[Chat] Error sending message:', error);
    const loadingIndicator = contentDiv.querySelector('.loading-indicator');
    if (loadingIndicator) loadingIndicator.remove();

    const paragraph = document.createElement('p');
    paragraph.textContent = `Error: ${error.message}`;
    paragraph.style.color = '#c0392b';
    contentDiv.appendChild(paragraph);
  } finally {
    if (heartbeatChecker) {
      clearInterval(heartbeatChecker);
    }
    isWaitingForResponse = false;
    saveState();
    updateSendButton(messageInput, chatSendBtn);
    updateSendButton(homeInput, homeSendBtn);
    messageInput.focus();
  }
}

// Add user message to chat
function addUserMessage(text, files = []) {
  // Handle browser transition before adding message
  handleBrowserTransitionOnMessage();

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  // Show attached file names
  if (files.length > 0) {
    const filesDiv = document.createElement('div');
    filesDiv.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;';
    files.forEach(f => {
      const badge = document.createElement('span');
      badge.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: var(--hover-overlay-strong); border-radius: 6px; font-size: 12px;';
      badge.textContent = f.name;
      filesDiv.appendChild(badge);
    });
    contentDiv.appendChild(filesDiv);
  }

  if (text) {
    const textNode = document.createTextNode(text);
    contentDiv.appendChild(textNode);
  }

  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
  saveState();
}

// Create assistant message with loading state
function createAssistantMessage() {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-indicator';
  loadingDiv.innerHTML = `
    <svg class="loading-asterisk" viewBox="0 0 24 24" fill="none">
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  contentDiv.appendChild(loadingDiv);

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'message-actions hidden';
  actionsDiv.innerHTML = `
    <button class="action-btn" title="Copy" onclick="copyMessage(this)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>
  `;

  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(actionsDiv);
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
  saveState();

  return messageDiv;
}

function appendToContent(contentDiv, content) {
  if (!contentDiv.dataset.rawContent) {
    contentDiv.dataset.rawContent = '';
  }
  contentDiv.dataset.rawContent += content;

  // Get current chunk container and append to it
  const container = getCurrentMarkdownContainer(contentDiv);
  container.dataset.rawContent += content;
  renderMarkdownContainer(container);

  // Check for Anchor Browser live URL in content
  const browserInfo = extractBrowserUrl(contentDiv.dataset.rawContent);
  if (browserInfo && !activeBrowserSession) {
    addInlineBrowserEmbed(contentDiv, browserInfo.url, browserInfo.sessionId);
  }

  saveState();
}

function appendToThinking(contentDiv, content) {
  // Find or create thinking section (collapsible, above main content)
  let thinkingSection = contentDiv.querySelector('.thinking-section');

  if (!thinkingSection) {
    thinkingSection = document.createElement('details');
    thinkingSection.className = 'thinking-section';
    thinkingSection.open = false; // Collapsed by default

    const summary = document.createElement('summary');
    summary.className = 'thinking-header';
    summary.innerHTML = '<span class="thinking-icon">&#x1F4AD;</span> Thinking...';
    thinkingSection.appendChild(summary);

    const thinkingContent = document.createElement('div');
    thinkingContent.className = 'thinking-content';
    thinkingContent.dataset.rawContent = '';
    thinkingSection.appendChild(thinkingContent);

    // Insert at the beginning of contentDiv
    contentDiv.insertBefore(thinkingSection, contentDiv.firstChild);
  }

  const thinkingContent = thinkingSection.querySelector('.thinking-content');
  thinkingContent.dataset.rawContent += content;

  // Render as plain text (no markdown for thinking)
  thinkingContent.textContent = thinkingContent.dataset.rawContent;

  // Update header to show it's still thinking
  const summary = thinkingSection.querySelector('.thinking-header');
  const thinkingLength = thinkingContent.dataset.rawContent.length;
  summary.innerHTML = `<span class="thinking-icon">&#x1F4AD;</span> Thinking (${thinkingLength} chars)`;
}

// Start a new chat
window.startNewChat = function() {
  // Abort any ongoing request from the previous chat
  if (isWaitingForResponse) {
    window.electronAPI.abortCurrentRequest();
    isWaitingForResponse = false;
  }

  if (currentChatId && chatMessages.children.length > 0) {
    saveState();
  }

  currentChatId = null;

  // Clear all state
  chatMessages.innerHTML = '';
  messageInput.value = '';
  homeInput.value = '';
  chatTitle.textContent = 'New chat';
  isFirstMessage = true;
  todos = [];
  toolCalls = [];
  attachedFiles = [];

  // Reset sidebar
  stepsList.innerHTML = '';
  emptySteps.style.display = 'block';
  stepsCount.textContent = '0 steps';
  toolCallsList.innerHTML = '';
  emptyTools.style.display = 'block';

  // Switch back to home view
  homeView.classList.remove('hidden');
  chatView.classList.add('hidden');
  document.getElementById('draftPreviewView').classList.add('hidden');
  homeInput.focus();

  // Clear currentChatId from localStorage
  localStorage.removeItem('currentChatId');

  // Update chat history display
  renderChatHistory();
  renderHomeActivity();

  // Update send button states to ensure they're enabled
  updateSendButton(homeInput, homeSendBtn);
  updateSendButton(messageInput, chatSendBtn);
}

// Get or create the current markdown container for streaming
function getCurrentMarkdownContainer(contentDiv) {
  const chunkIndex = parseInt(contentDiv.dataset.currentChunk || '0');
  let container = contentDiv.querySelector(`.markdown-content[data-chunk="${chunkIndex}"]`);

  if (!container) {
    container = document.createElement('div');
    container.className = 'markdown-content';
    container.dataset.chunk = chunkIndex;
    container.dataset.rawContent = '';
    contentDiv.appendChild(container);
  }

  return container;
}

// Render markdown content for a specific container
function renderMarkdownContainer(container) {
  const rawContent = container.dataset.rawContent || '';

  marked.setOptions({
    breaks: true,
    gfm: true
  });

  container.innerHTML = marked.parse(rawContent);
}

// Legacy function for restoring saved messages
function renderMarkdown(contentDiv) {
  const rawContent = contentDiv.dataset.rawContent || '';

  marked.setOptions({
    breaks: true,
    gfm: true
  });

  let markdownContainer = contentDiv.querySelector('.markdown-content');
  if (!markdownContainer) {
    markdownContainer = document.createElement('div');
    markdownContainer.className = 'markdown-content';
    contentDiv.appendChild(markdownContainer);
  }

  markdownContainer.innerHTML = marked.parse(rawContent);
}

function formatToolPreview(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') {
    return String(toolInput || '').substring(0, 50);
  }

  const keys = Object.keys(toolInput);
  if (keys.length === 0) return '';

  const previewKeys = ['pattern', 'command', 'file_path', 'path', 'query', 'content', 'description'];
  const key = previewKeys.find(k => toolInput[k]) || keys[0];
  const value = toolInput[key];

  if (typeof value === 'string') {
    return `${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`;
  } else if (Array.isArray(value)) {
    return `${key}: [${value.length} items]`;
  } else if (typeof value === 'object') {
    return `${key}: {...}`;
  }
  return `${key}: ${String(value).substring(0, 30)}`;
}

// Add inline tool call to message (maintains correct order in stream)
function addInlineToolCall(contentDiv, toolName, toolInput, toolId) {
  const toolDiv = document.createElement('div');
  toolDiv.className = 'inline-tool-call expanded'; // Show expanded by default
  toolDiv.dataset.toolId = toolId;

  const inputPreview = formatToolPreview(toolInput);
  const inputStr = JSON.stringify(toolInput, null, 2);

  toolDiv.innerHTML = `
    <div class="inline-tool-header" onclick="toggleInlineToolCall(this)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
      <span class="tool-name">${toolName}</span>
      <span class="tool-preview">${inputPreview}</span>
      <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
    <div class="inline-tool-result">
      <div class="tool-section">
        <div class="tool-section-label">Input</div>
        <pre>${escapeHtml(inputStr)}</pre>
      </div>
      <div class="tool-section tool-output-section" style="display: none;">
        <div class="tool-section-label">Output</div>
        <pre class="tool-output-content"></pre>
      </div>
    </div>
  `;

  // Append tool call at end (in stream order)
  contentDiv.appendChild(toolDiv);

  // Increment chunk counter so next text creates a new markdown container
  const currentChunk = parseInt(contentDiv.dataset.currentChunk || '0');
  contentDiv.dataset.currentChunk = currentChunk + 1;
}

// Update inline tool result
function updateInlineToolResult(toolId, result) {
  const toolDiv = document.querySelector(`.inline-tool-call[data-tool-id="${toolId}"]`);
  if (toolDiv) {
    const outputSection = toolDiv.querySelector('.tool-output-section');
    const outputContent = toolDiv.querySelector('.tool-output-content');
    if (outputSection && outputContent) {
      const resultStr = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      outputContent.textContent = resultStr.substring(0, 2000) + (resultStr.length > 2000 ? '...' : '');
      outputSection.style.display = 'block';

      // Check for Anchor Browser live URL in tool result
      const browserInfo = extractBrowserUrl(resultStr);
      if (browserInfo) {
        // Find the parent content div and add browser embed
        const contentDiv = toolDiv.closest('.message-content');
        if (contentDiv) {
          addInlineBrowserEmbed(contentDiv, browserInfo.url, browserInfo.sessionId);
        }
      }
    }
  }
}

// Toggle inline tool call expansion
window.toggleInlineToolCall = function(header) {
  const toolDiv = header.closest('.inline-tool-call');
  toolDiv.classList.toggle('expanded');
};

// Add tool call to sidebar
function addToolCall(name, input, status = 'running') {
  const id = 'tool_' + Date.now();
  const toolCall = { id, name, input, status, result: null };
  toolCalls.push(toolCall);

  emptyTools.style.display = 'none';

  const toolDiv = document.createElement('div');
  toolDiv.className = 'tool-call-item expanded'; // Show expanded by default
  toolDiv.dataset.toolId = id;

  toolDiv.innerHTML = `
    <div class="tool-call-header" onclick="toggleToolCall(this)">
      <div class="tool-call-icon ${status}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      </div>
      <div class="tool-call-info">
        <div class="tool-call-name">${name}</div>
        <div class="tool-call-status">${status === 'running' ? 'Running...' : 'Completed'}</div>
      </div>
      <div class="tool-call-expand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
    <div class="tool-call-details">
      <div class="tool-detail-section">
        <div class="tool-detail-label">Input</div>
        <pre>${escapeHtml(JSON.stringify(input, null, 2))}</pre>
      </div>
      <div class="tool-detail-section tool-output-section" style="display: none;">
        <div class="tool-detail-label">Output</div>
        <pre class="sidebar-tool-output"></pre>
      </div>
    </div>
  `;

  toolCallsList.appendChild(toolDiv);
  return toolCall;
}

// Update tool call status
function updateToolCallStatus(toolId, status) {
  const toolDiv = document.querySelector(`.tool-call-item[data-tool-id="${toolId}"]`);
  if (toolDiv) {
    const icon = toolDiv.querySelector('.tool-call-icon');
    const statusText = toolDiv.querySelector('.tool-call-status');

    icon.className = `tool-call-icon ${status}`;
    statusText.textContent = status === 'success' ? 'Completed' : status === 'error' ? 'Failed' : 'Running...';
  }

  // Update in state
  const toolCall = toolCalls.find(t => t.id === toolId);
  if (toolCall) {
    toolCall.status = status;
  }
}

// Update tool call result
function updateToolCallResult(toolId, result) {
  const toolCall = toolCalls.find(t => t.id === toolId);
  if (toolCall) {
    toolCall.result = result;
  }

  // Update sidebar tool output
  const toolDiv = document.querySelector(`.tool-call-item[data-tool-id="${toolId}"]`);
  if (toolDiv) {
    const outputSection = toolDiv.querySelector('.tool-output-section');
    const outputContent = toolDiv.querySelector('.sidebar-tool-output');
    if (outputSection && outputContent) {
      const resultStr = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      outputContent.textContent = resultStr.substring(0, 2000) + (resultStr.length > 2000 ? '...' : '');
      outputSection.style.display = 'block';
    }
  }
}

// Toggle tool call expansion in sidebar
window.toggleToolCall = function(header) {
  const toolDiv = header.closest('.tool-call-item');
  toolDiv.classList.toggle('expanded');
};

// Update todos from TodoWrite
function updateTodos(newTodos) {
  todos = newTodos;
  renderTodos();
}

// Render todos in sidebar
function renderTodos() {
  stepsList.innerHTML = '';

  if (todos.length === 0) {
    emptySteps.style.display = 'block';
    stepsCount.textContent = '0 steps';
    return;
  }

  emptySteps.style.display = 'none';
  stepsCount.textContent = `${todos.length} steps`;

  todos.forEach((todo) => {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-item';

    const statusIcon = todo.status === 'completed'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : todo.status === 'in_progress'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>'
      : '';

    const displayText = todo.status === 'in_progress' ? (todo.activeForm || todo.content) : todo.content;

    stepDiv.innerHTML = `
      <div class="step-status ${todo.status}">${statusIcon}</div>
      <div class="step-content">
        <div class="step-text">${escapeHtml(displayText)}</div>
      </div>
    `;

    stepsList.appendChild(stepDiv);
  });
}

// Escape HTML for safe display
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Copy message to clipboard
function copyMessage(button) {
  const messageDiv = button.closest('.message');
  const contentDiv = messageDiv.querySelector('.message-content');
  const text = contentDiv.dataset.rawContent || contentDiv.textContent;

  navigator.clipboard.writeText(text).then(() => {
    button.style.color = '#27ae60';
    setTimeout(() => {
      button.style.color = '';
    }, 1000);
  });
}

window.copyMessage = copyMessage;

// Get conversation history for context
function getConversationHistory() {
  const messages = Array.from(chatMessages.children);
  const history = [];

  // Skip the last message (current assistant loading state)
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    const contentDiv = msg.querySelector('.message-content');
    if (!contentDiv) continue;

    const content = contentDiv.dataset.rawContent || contentDiv.textContent || '';
    if (!content.trim()) continue;

    if (msg.classList.contains('user')) {
      history.push({ role: 'user', content });
    } else if (msg.classList.contains('assistant')) {
      history.push({ role: 'assistant', content });
    }
  }

  return history;
}

// Scroll to bottom of messages
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==================== BROWSER EMBED FUNCTIONS ====================

// Check if a string contains an Anchor Browser live URL
function extractBrowserUrl(text) {
  const regex = /https:\/\/live\.anchorbrowser\.io\?sessionId=([a-f0-9-]+)/i;
  const match = text.match(regex);
  if (match) {
    return { url: match[0], sessionId: match[1] };
  }
  return null;
}

// Create inline browser embed in chat
function addInlineBrowserEmbed(contentDiv, url, sessionId) {
  // Remove any existing inline browser embeds (only one at a time)
  const existingEmbed = document.querySelector('.inline-browser-embed');
  if (existingEmbed) {
    existingEmbed.remove();
  }

  const browserDiv = document.createElement('div');
  browserDiv.className = 'inline-browser-embed';
  browserDiv.dataset.sessionId = sessionId;
  browserDiv.dataset.url = url;

  browserDiv.innerHTML = `
    <div class="browser-embed-header">
      <div class="browser-header-left">
        <svg class="browser-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span class="browser-title">Live Browser</span>
        <span class="browser-session-badge">Session Active</span>
      </div>
      <div class="browser-header-actions">
        <button class="browser-action-btn" onclick="openBrowserInNewWindow('${url}')" title="Open in new window">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
        <button class="browser-action-btn" onclick="moveBrowserToSidebar()" title="Move to sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="15" y1="3" x2="15" y2="21"></line>
          </svg>
        </button>
        <button class="browser-action-btn browser-fullscreen-btn" onclick="toggleBrowserFullscreen(this)" title="Fullscreen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
      </div>
    </div>
    <div class="browser-embed-content">
      <iframe
        src="${url}"
        class="browser-iframe"
        allow="clipboard-read; clipboard-write; camera; microphone"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      ></iframe>
    </div>
    <div class="browser-embed-footer">
      <span class="browser-url">${url}</span>
      <button class="browser-copy-url" onclick="copyBrowserUrl('${url}')" title="Copy URL">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  `;

  // Store active session
  activeBrowserSession = {
    url: url,
    sessionId: sessionId,
    inlineElement: browserDiv
  };
  browserDisplayMode = 'inline';

  // Append to content
  contentDiv.appendChild(browserDiv);

  // Increment chunk counter
  const currentChunk = parseInt(contentDiv.dataset.currentChunk || '0');
  contentDiv.dataset.currentChunk = currentChunk + 1;

  scrollToBottom();
}

// Move browser from inline to sidebar
function moveBrowserToSidebar() {
  if (!activeBrowserSession) return;

  // Remove inline embed
  if (activeBrowserSession.inlineElement) {
    activeBrowserSession.inlineElement.remove();
  }

  // Show browser in sidebar
  showBrowserInSidebar(activeBrowserSession.url, activeBrowserSession.sessionId);
  browserDisplayMode = 'sidebar';
}

// Show browser in sidebar panel
function showBrowserInSidebar(url, sessionId) {
  // Check if browser section already exists
  let browserSection = document.getElementById('browserSection');

  if (!browserSection) {
    // Create browser section in sidebar
    browserSection = document.createElement('div');
    browserSection.id = 'browserSection';
    browserSection.className = 'sidebar-section browser-section';
    browserSection.innerHTML = `
      <div class="section-header browser-section-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>Live Browser</span>
        <div class="browser-sidebar-actions">
          <button class="browser-sidebar-btn" onclick="moveBrowserToInline()" title="Show inline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
          <button class="browser-sidebar-btn" onclick="closeBrowserSession()" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="browser-sidebar-content">
        <iframe
          src="${url}"
          class="browser-sidebar-iframe"
          allow="clipboard-read; clipboard-write; camera; microphone"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        ></iframe>
      </div>
    `;

    // Insert before tool calls section
    const toolCallsSection = sidebar.querySelector('.sidebar-section:last-child');
    sidebar.insertBefore(browserSection, toolCallsSection);
  } else {
    // Update existing iframe
    const iframe = browserSection.querySelector('.browser-sidebar-iframe');
    if (iframe) {
      iframe.src = url;
    }
  }

  // Ensure sidebar is visible
  sidebar.classList.remove('collapsed');

  // Update session reference
  activeBrowserSession = {
    ...activeBrowserSession,
    url: url,
    sessionId: sessionId,
    sidebarElement: browserSection
  };
}

// Move browser back to inline (in the last assistant message)
window.moveBrowserToInline = function() {
  if (!activeBrowserSession) return;

  // Remove from sidebar
  const browserSection = document.getElementById('browserSection');
  if (browserSection) {
    browserSection.remove();
  }

  // Find the last assistant message content div
  const lastAssistantMessage = chatMessages.querySelector('.message.assistant:last-child .message-content');
  if (lastAssistantMessage && activeBrowserSession.url) {
    addInlineBrowserEmbed(lastAssistantMessage, activeBrowserSession.url, activeBrowserSession.sessionId);
  }

  browserDisplayMode = 'inline';
}

// Close browser session
window.closeBrowserSession = function() {
  // Remove inline embed
  const inlineEmbed = document.querySelector('.inline-browser-embed');
  if (inlineEmbed) {
    inlineEmbed.remove();
  }

  // Remove sidebar section
  const browserSection = document.getElementById('browserSection');
  if (browserSection) {
    browserSection.remove();
  }

  activeBrowserSession = null;
  browserDisplayMode = 'hidden';
}

// Open browser in new window
window.openBrowserInNewWindow = function(url) {
  window.open(url, '_blank', 'width=1200,height=800');
}

// Toggle browser fullscreen
window.toggleBrowserFullscreen = function(button) {
  const embedDiv = button.closest('.inline-browser-embed');
  if (embedDiv) {
    embedDiv.classList.toggle('fullscreen');

    // Update icon
    const svg = button.querySelector('svg');
    if (embedDiv.classList.contains('fullscreen')) {
      svg.innerHTML = `
        <polyline points="4 14 10 14 10 20"></polyline>
        <polyline points="20 10 14 10 14 4"></polyline>
        <line x1="14" y1="10" x2="21" y2="3"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      `;
    } else {
      svg.innerHTML = `
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      `;
    }
  }
}

// Copy browser URL
window.copyBrowserUrl = function(url) {
  navigator.clipboard.writeText(url).then(() => {
    // Show brief feedback
    const btn = document.querySelector('.browser-copy-url');
    if (btn) {
      btn.style.color = '#4ade80';
      setTimeout(() => {
        btn.style.color = '';
      }, 1000);
    }
  });
}

// Handle transition when user sends a new message while browser is inline
function handleBrowserTransitionOnMessage() {
  if (activeBrowserSession && browserDisplayMode === 'inline') {
    // Move browser to sidebar when user sends a new message
    moveBrowserToSidebar();
  }
}

// Initialize on load
window.addEventListener('load', init);
