import React from 'react';
import { createRoot } from 'react-dom/client';
import DocumentWorkspace from './components/DocumentWorkspace.jsx';

const root = createRoot(document.getElementById('document-root'));
root.render(<DocumentWorkspace />);
