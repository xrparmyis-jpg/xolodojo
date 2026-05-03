import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold,
  faFaceSmile,
  faItalic,
  faLink,
  faListOl,
  faListUl,
  faUnderline,
} from '@fortawesome/free-solid-svg-icons';
import 'emoji-picker-element';
import { PIN_NOTE_EDITOR_TEXT_LIMIT } from '../constants/pinNote';

interface PinNoteEditorProps {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function PinNoteEditor({
  id,
  value,
  onChange,
  disabled = false,
  placeholder =
    'Describe your pin — bold, italic, lists, links, and emojis are ok. Images are not supported yet.',
  className = '',
}: PinNoteEditorProps) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiWrapRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({
        limit: PIN_NOTE_EDITOR_TEXT_LIMIT,
      }),
    ],
    content: value || '<p></p>',
    editable: !disabled,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class:
          'pin-note-editor__surface focus:outline-none min-h-[120px] max-h-[280px] overflow-y-auto px-3 py-2 text-sm text-white/90',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    const next = value || '<p></p>';
    if (editor.getHTML() === next) {
      return;
    }
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!emojiPickerOpen) {
      return;
    }
    const onDocMouseDown = (e: MouseEvent) => {
      const root = emojiWrapRef.current;
      if (root && !root.contains(e.target as Node)) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [emojiPickerOpen]);

  useEffect(() => {
    const picker = emojiPickerRef.current;
    if (!picker || !emojiPickerOpen || !editor) {
      return;
    }
    const onEmojiClick = (e: Event) => {
      const detail = (e as CustomEvent<{ unicode?: string }>).detail;
      const unicode = detail?.unicode;
      if (typeof unicode === 'string' && unicode.length > 0) {
        editor.chain().focus().insertContent(unicode).run();
      }
      setEmojiPickerOpen(false);
    };
    picker.addEventListener('emoji-click', onEmojiClick);
    return () => picker.removeEventListener('emoji-click', onEmojiClick);
  }, [emojiPickerOpen, editor]);

  if (!editor) {
    return null;
  }

  const runLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev || 'https://');
    if (url === null) {
      return;
    }
    const trimmed = url.trim();
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: trimmed })
      .run();
  };

  const iconBtn =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/25 bg-black/35 text-sm text-white/90 hover:bg-white/10 disabled:opacity-40';
  const active = (name: 'bold' | 'italic' | 'underline' | 'bulletList' | 'orderedList') => {
    if (name === 'bold') {
      return editor.isActive('bold');
    }
    if (name === 'italic') {
      return editor.isActive('italic');
    }
    if (name === 'underline') {
      return editor.isActive('underline');
    }
    if (name === 'bulletList') {
      return editor.isActive('bulletList');
    }
    return editor.isActive('orderedList');
  };

  return (
    <div
      className={`pin-note-editor rounded-lg border border-white/20 bg-black/40 transition-colors duration-200 focus-within:border-blue-500 ${className}`}
    >
      <div
        className="flex flex-wrap gap-1 border-b border-white/10 px-2 py-1.5"
        aria-label="Pin note formatting"
      >
        <button
          type="button"
          className={`${iconBtn} ${active('bold') ? 'bg-white/15' : ''}`}
          disabled={disabled}
          title="Bold"
          aria-label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FontAwesomeIcon icon={faBold} className="text-[15px]" aria-hidden />
        </button>
        <button
          type="button"
          className={`${iconBtn} ${active('italic') ? 'bg-white/15' : ''}`}
          disabled={disabled}
          title="Italic"
          aria-label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <FontAwesomeIcon icon={faItalic} className="text-[15px]" aria-hidden />
        </button>
        <button
          type="button"
          className={`${iconBtn} ${active('underline') ? 'bg-white/15' : ''}`}
          disabled={disabled}
          title="Underline"
          aria-label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <FontAwesomeIcon icon={faUnderline} className="text-[15px]" aria-hidden />
        </button>
        <button
          type="button"
          className={`${iconBtn} ${editor.isActive('link') ? 'bg-white/15' : ''}`}
          disabled={disabled}
          title="Link"
          aria-label="Link"
          onClick={runLink}
        >
          <FontAwesomeIcon icon={faLink} className="text-[15px]" aria-hidden />
        </button>
        <div className="relative" ref={emojiWrapRef}>
          <button
            type="button"
            className={`${iconBtn} ${emojiPickerOpen ? 'bg-white/15' : ''}`}
            disabled={disabled}
            aria-expanded={emojiPickerOpen}
            aria-haspopup="dialog"
            title="Insert emoji"
            aria-label="Insert emoji"
            onClick={() => setEmojiPickerOpen(open => !open)}
          >
            <FontAwesomeIcon icon={faFaceSmile} className="text-[15px]" aria-hidden />
          </button>
          {emojiPickerOpen && (
            <div
              className="emoji-picker-popover absolute right-0 left-auto top-[calc(100%+6px)] z-[200] max-h-[min(52vh,380px)] w-[min(calc(100vw-2rem),320px)] overflow-hidden rounded-lg border border-white/20 bg-[#1a1d24] shadow-xl md:left-0 md:right-auto"
              role="dialog"
              aria-label="Emoji picker"
            >
              <emoji-picker
                ref={emojiPickerRef}
                className="dark"
                style={{ width: '100%', height: '340px' }}
              />
            </div>
          )}
        </div>
        <button
          type="button"
          className={`${iconBtn} ${active('bulletList') ? 'bg-white/15' : ''}`}
          disabled={disabled}
          title="Bulleted list"
          aria-label="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FontAwesomeIcon icon={faListUl} className="text-[15px]" aria-hidden />
        </button>
        <button
          type="button"
          className={`${iconBtn} ${active('orderedList') ? 'bg-white/15' : ''}`}
          disabled={disabled}
          title="Numbered list"
          aria-label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <FontAwesomeIcon icon={faListOl} className="text-[15px]" aria-hidden />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
