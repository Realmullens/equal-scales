import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

export default function DocumentEditor({ initialContent, onSave }) {
  const saveTimeoutRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] }
      }),
      Underline
    ],
    content: initialContent || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
    },
    onUpdate: ({ editor }) => {
      // Auto-save after 2 seconds of inactivity
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const json = editor.getJSON();
        onSave(json);
      }, 2000);
    }
  });

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="B"
          style={{ fontWeight: 'bold' }}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="I"
          style={{ fontStyle: 'italic' }}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          label="U"
          style={{ textDecoration: 'underline' }}
        />
        <span style={styles.divider} />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          label="H1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          label="H2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          label="H3"
        />
        <span style={styles.divider} />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="&bull; List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="1. List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          label="&ldquo; Quote"
        />
      </div>
      <div style={styles.editorWrapper}>
        <EditorContent editor={editor} style={styles.editor} />
      </div>
    </div>
  );
}

function ToolbarButton({ onClick, active, label, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.toolbarBtn,
        ...(active ? styles.toolbarBtnActive : {}),
        ...style
      }}
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 24px',
    borderBottom: '1px solid #3a3a3e',
    flexShrink: 0
  },
  toolbarBtn: {
    padding: '4px 8px',
    border: 'none',
    background: 'transparent',
    color: '#a0a0a0',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit',
    transition: 'background 0.15s, color 0.15s'
  },
  toolbarBtnActive: {
    background: 'rgba(196, 145, 123, 0.2)',
    color: '#d4a08a'
  },
  divider: {
    width: '1px',
    height: '18px',
    background: '#3a3a3e',
    margin: '0 4px'
  },
  editorWrapper: {
    flex: 1,
    overflow: 'auto',
    padding: '32px 48px',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%'
  },
  editor: {
    outline: 'none',
    minHeight: '500px',
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#e8e8e8'
  }
};
