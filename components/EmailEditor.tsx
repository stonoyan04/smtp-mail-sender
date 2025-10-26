'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Code,
} from 'lucide-react'

interface EmailEditorProps {
  content: string
  onChange: (html: string) => void
}

export function EmailEditor({ content, onChange }: EmailEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: 'Write your email here...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  const openLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, '')

    setLinkUrl(previousUrl || '')
    setLinkText(selectedText || '')
    setIsLinkModalOpen(true)
  }

  const handleSetLink = () => {
    if (linkUrl === '') {
      editor.chain().focus().unsetLink().run()
      setIsLinkModalOpen(false)
      setLinkUrl('')
      setLinkText('')
      return
    }

    // If there's link text and no selection, insert new link with text
    if (linkText && editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkUrl}">${linkText}</a>`)
        .run()
    } else {
      // Otherwise just add link to selected text
      editor
        .chain()
        .focus()
        .setLink({ href: linkUrl })
        .run()
    }

    setIsLinkModalOpen(false)
    setLinkUrl('')
    setLinkText('')
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <div className="w-px bg-gray-300 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="w-px bg-gray-300 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px bg-gray-300 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="w-px bg-gray-300 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={openLinkModal}
          className={editor.isActive('link') ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="bg-white" />

      {/* Link Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false)
          setLinkUrl('')
          setLinkText('')
        }}
        title="Insert Link"
      >
        <div className="space-y-4">
          <Input
            label="URL"
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            autoFocus
          />
          <Input
            label="Link Text (optional)"
            type="text"
            placeholder="Click here"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            {linkText ? 'Leave blank to use selected text' : 'Select text first or enter link text above'}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsLinkModalOpen(false)
                setLinkUrl('')
                setLinkText('')
              }}
            >
              Cancel
            </Button>
            {editor.isActive('link') && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  editor.chain().focus().unsetLink().run()
                  setIsLinkModalOpen(false)
                  setLinkUrl('')
                  setLinkText('')
                }}
              >
                Remove Link
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSetLink}
              disabled={!linkUrl}
            >
              {editor.isActive('link') ? 'Update Link' : 'Insert Link'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
