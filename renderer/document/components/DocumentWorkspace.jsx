import React, { useState, useEffect, useCallback } from 'react';
import DocumentEditor from './DocumentEditor.jsx';

const API_BASE = 'http://localhost:3001';

export default function DocumentWorkspace() {
  const [document, setDocument] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Read document ID from URL params
  const params = new URLSearchParams(window.location.search);
  const docId = params.get('id');

  useEffect(() => {
    if (docId) {
      fetch(`${API_BASE}/api/documents/${docId}`)
        .then(r => r.json())
        .then(doc => setDocument(doc))
        .catch(err => console.error('Failed to load document:', err));
    }
  }, [docId]);

  const handleSave = useCallback(async (contentJson) => {
    if (!document) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentJson })
      });
      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }, [document]);

  if (!docId) {
    return (
      <div style={styles.empty}>
        <h2>No document selected</h2>
        <p>Open a document from the workspace to begin editing.</p>
      </div>
    );
  }

  if (!document) {
    return <div style={styles.loading}>Loading document...</div>;
  }

  return (
    <div style={styles.workspace}>
      <header style={styles.header}>
        <div style={styles.titleRow}>
          <h2 style={styles.title}>{document.title}</h2>
          <span style={styles.status}>{document.status}</span>
        </div>
        <div style={styles.actions}>
          <span style={styles.saveStatus}>
            {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}
          </span>
        </div>
      </header>
      <DocumentEditor
        initialContent={document.content_json ? JSON.parse(document.content_json) : null}
        onSave={handleSave}
      />
    </div>
  );
}

const styles = {
  workspace: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    background: '#1a1a1e',
    color: '#e8e8e8'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderBottom: '1px solid #3a3a3e',
    flexShrink: 0
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0
  },
  status: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px',
    background: 'rgba(196, 145, 123, 0.15)',
    color: '#d4a08a'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  saveStatus: {
    fontSize: '12px',
    color: '#6b6b6b'
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: "'Inter', sans-serif",
    color: '#6b6b6b',
    background: '#1a1a1e'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: "'Inter', sans-serif",
    color: '#6b6b6b',
    background: '#1a1a1e'
  }
};
