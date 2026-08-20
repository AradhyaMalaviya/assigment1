<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { uid } from '$lib/utils/uid';

  const dispatch = createEventDispatcher<{ change: string }>();

  export let value = '';
  export let label = 'Message Body';
  export let placeholder = 'Compose your email content... (placeholders like {{FirstName}} are supported)';
  export let disabled = false;
  export let id = uid('rich-text-editor');

  let element: HTMLDivElement;
  let editor: {
    getHTML: () => string;
    setEditable: (editable: boolean) => void;
    commands: { setContent: (content: string, emitUpdate?: boolean) => void };
    chain: () => {
      focus: () => {
        toggleBold: () => { run: () => void };
        toggleItalic: () => { run: () => void };
        toggleStrike: () => { run: () => void };
        toggleHeading: (opts: { level: number }) => { run: () => void };
        toggleBulletList: () => { run: () => void };
        toggleOrderedList: () => { run: () => void };
        setImage: (opts: { src: string }) => { run: () => void };
        unsetAllMarks: () => { clearNodes: () => { run: () => void } };
        undo: () => { run: () => void };
        redo: () => { run: () => void };
      };
    };
    isActive: (name: string, opts?: Record<string, unknown>) => boolean;
    isEditable: boolean;
    can: () => { undo: () => boolean; redo: () => boolean };
    destroy: () => void;
  } | null = null;

  let mounted = false;
  let showHtmlSource = false;
  let htmlSourceValue = value;

  onMount(async () => {
    try {
      const { Editor } = await import('@tiptap/core');
      const { default: StarterKit } = await import('@tiptap/starter-kit');
      const { default: Image } = await import('@tiptap/extension-image');

      if (!element) return;

      editor = new Editor({
        element,
        extensions: [
          StarterKit,
          Image.configure({
            inline: true,
            allowBase64: true
          })
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor: ed }) => {
          const html = ed.getHTML();
          value = html;
          htmlSourceValue = html;
          dispatch('change', html);
        }
      }) as unknown as typeof editor;
      mounted = true;
    } catch {
      // Fallback gracefully to accessible textarea
      mounted = false;
    }
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  $: if (editor && value !== editor.getHTML()) {
    editor.commands.setContent(value, false);
    htmlSourceValue = value;
  }

  $: if (editor && editor.isEditable !== !disabled) {
    editor.setEditable(!disabled);
  }

  function handleHtmlInput(e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    value = val;
    htmlSourceValue = val;
    if (editor) {
      editor.commands.setContent(val, false);
    }
    dispatch('change', val);
  }

  function addImage() {
    if (!editor || disabled) return;
    const url = window.prompt('Enter Image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  function toggleHtmlView() {
    showHtmlSource = !showHtmlSource;
    if (!showHtmlSource && editor) {
      editor.commands.setContent(value, false);
    }
  }
</script>

<div class="editor-shell">
  <div class="editor-header">
    <label for={id}>{label}</label>
    {#if mounted}
      <button type="button" class="view-toggle-btn" on:click={toggleHtmlView} {disabled}>
        {showHtmlSource ? 'Switch to Visual Editor' : 'Edit HTML Source'}
      </button>
    {/if}
  </div>

  {#if !mounted}
    <div class="fallback-wrapper">
      <textarea
        {id}
        bind:value
        {placeholder}
        {disabled}
        on:input={() => dispatch('change', value)}
        class="fallback-textarea"
      ></textarea>
    </div>
  {:else if showHtmlSource}
    <textarea
      {id}
      value={htmlSourceValue}
      on:input={handleHtmlInput}
      {placeholder}
      {disabled}
      class="source-textarea"
    ></textarea>
  {:else}
    <div class="tiptap-container" class:disabled>
      {#if editor}
        <div class="toolbar" role="toolbar" aria-label="Text formatting toolbar">
          <button
            type="button"
            class="tb-btn"
            class:active={editor.isActive('bold')}
            on:click={() => editor?.chain().focus().toggleBold().run()}
            disabled={disabled}
            title="Bold"
            aria-label="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            class="tb-btn"
            class:active={editor.isActive('italic')}
            on:click={() => editor?.chain().focus().toggleItalic().run()}
            disabled={disabled}
            title="Italic"
            aria-label="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            class="tb-btn"
            class:active={editor.isActive('strike')}
            on:click={() => editor?.chain().focus().toggleStrike().run()}
            disabled={disabled}
            title="Strikethrough"
            aria-label="Strikethrough"
          >
            <s>S</s>
          </button>
          <span class="tb-divider"></span>
          <button
            type="button"
            class="tb-btn"
            class:active={editor.isActive('heading', { level: 1 })}
            on:click={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={disabled}
            title="Heading 1"
            aria-label="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            class="tb-btn"
            class:active={editor.isActive('heading', { level: 2 })}
            on:click={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={disabled}
            title="Heading 2"
            aria-label="Heading 2"
          >
            H2
          </button>
          <span class="tb-divider"></span>
          <button
            type="button"
            class="tb-btn"
            class:active={editor.isActive('bulletList')}
            on:click={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            title="Bullet List"
            aria-label="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            class="tb-btn"
            class:active={editor.isActive('orderedList')}
            on:click={() => editor?.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            title="Numbered List"
            aria-label="Numbered List"
          >
            1. List
          </button>
          <span class="tb-divider"></span>
          <button
            type="button"
            class="tb-btn"
            on:click={addImage}
            disabled={disabled}
            title="Insert Image"
            aria-label="Insert Image"
          >
            🖼️ Image
          </button>
          <button
            type="button"
            class="tb-btn"
            on:click={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            disabled={disabled}
            title="Clear Formatting"
            aria-label="Clear Formatting"
          >
            🧹 Clear
          </button>
          <span class="tb-divider"></span>
          <button
            type="button"
            class="tb-btn"
            on:click={() => editor?.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Undo"
            aria-label="Undo"
          >
            ↩️
          </button>
          <button
            type="button"
            class="tb-btn"
            on:click={() => editor?.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Redo"
            aria-label="Redo"
          >
            ↪️
          </button>
        </div>
      {/if}
      <div bind:this={element} class="editor-content"></div>
    </div>
  {/if}
</div>

<style>
  .editor-shell {
    display: grid;
    gap: var(--space-2, 0.5rem);
  }
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  label {
    font-size: 0.875rem;
    font-weight: 650;
    color: var(--color-foreground, #1e293b);
  }
  .view-toggle-btn {
    background: none;
    border: none;
    color: var(--color-primary, #4f46e5);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
  }
  .view-toggle-btn:disabled {
    color: var(--color-muted, #94a3b8);
    cursor: not-allowed;
  }
  .fallback-textarea,
  .source-textarea {
    width: 100%;
    min-height: 12rem;
    resize: vertical;
    border: 1px solid var(--color-border, #cbd5e1);
    border-radius: var(--radius-md, 0.375rem);
    background: var(--color-surface, #ffffff);
    color: var(--color-foreground, #1e293b);
    padding: var(--space-3, 0.75rem);
    font-family: monospace;
    font-size: 0.875rem;
    line-height: 1.5;
  }
  .tiptap-container {
    border: 1px solid var(--color-border, #cbd5e1);
    border-radius: var(--radius-md, 0.375rem);
    background: var(--color-surface, #ffffff);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .tiptap-container.disabled {
    opacity: 0.7;
    pointer-events: none;
    background: var(--color-background, #f8fafc);
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.5rem;
    background: #f1f5f9;
    border-bottom: 1px solid var(--color-border, #cbd5e1);
  }
  .tb-btn {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.75rem;
    height: 1.75rem;
  }
  .tb-btn:hover:not(:disabled) {
    background: #e2e8f0;
    border-color: #94a3b8;
  }
  .tb-btn.active {
    background: var(--color-primary, #4f46e5);
    color: #ffffff;
    border-color: var(--color-primary, #4f46e5);
  }
  .tb-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .tb-divider {
    width: 1px;
    height: 1.25rem;
    background: #cbd5e1;
    margin: 0 0.25rem;
  }
  .editor-content {
    min-height: 10rem;
    max-height: 25rem;
    overflow-y: auto;
    padding: 0.75rem;
    line-height: 1.5;
  }
  :global(.editor-content .ProseMirror) {
    outline: none;
    min-height: 8rem;
  }
  :global(.editor-content img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.25rem;
  }
</style>
