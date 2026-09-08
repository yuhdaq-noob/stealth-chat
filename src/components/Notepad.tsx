"use client";

import { useEffect, useRef, useState } from "react";
import {
  FilePlus,
  Menu,
  Minus,
  Plus,
  Redo2,
  Search,
  Trash2,
  Undo2,
  WrapText,
  X,
} from "lucide-react";

interface NotepadProps {
  value: string;
  onChange: (value: string) => void;
  isSaved: boolean;
  onUnlockRequest: () => void;
}

const UNLOCK_TRIGGER = "kangen.kepin";

export function Notepad({
  value,
  onChange,
  isSaved,
  onUnlockRequest,
}: NotepadProps) {
  const [documentTitle, setDocumentTitle] = useState("Untitled");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [isWrapped, setIsWrapped] = useState(true);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const savedTitle = localStorage.getItem("stealth_note_title");
      if (savedTitle) setDocumentTitle(savedTitle);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    localStorage.setItem("stealth_note_title", documentTitle);
  }, [documentTitle]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        localStorage.setItem("stealth_note", value);
      }
      if (event.ctrlKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [value]);

  const updateValue = (nextValue: string) => {
    undoStack.current.push(value);
    redoStack.current = [];
    setUndoCount(undoStack.current.length);
    setRedoCount(0);
    if (nextValue.includes(UNLOCK_TRIGGER)) {
      onChange(nextValue.replaceAll(UNLOCK_TRIGGER, ""));
      onUnlockRequest();
      return;
    }
    onChange(nextValue);
  };

  const undo = () => {
    const previousValue = undoStack.current.pop();
    if (previousValue === undefined) return;
    redoStack.current.push(value);
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
    onChange(previousValue);
  };

  const redo = () => {
    const nextValue = redoStack.current.pop();
    if (nextValue === undefined) return;
    undoStack.current.push(value);
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
    onChange(nextValue);
  };

  function createDocument() {
    undoStack.current.push(value);
    redoStack.current = [];
    setUndoCount(undoStack.current.length);
    setRedoCount(0);
    setDocumentTitle("Untitled");
    onChange("");
    editorRef.current?.focus();
  }

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const characterCount = value.length;
  const matchCount = searchQuery
    ? value.toLowerCase().split(searchQuery.toLowerCase()).length - 1
    : 0;

  return (
    <div className="notepad-shell min-h-screen text-slate-800">
      <header className="notepad-header border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((open) => !open)}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Toggle notes panel"
              aria-label="Toggle notes panel"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <input
                value={documentTitle}
                onChange={(event) =>
                  setDocumentTitle(event.target.value || "Untitled")
                }
                className="w-full max-w-52 truncate bg-transparent text-sm font-semibold outline-none"
                aria-label="Document title"
              />
              <p className="text-xs text-slate-400">
                {isSaved ? "Saved locally" : "Saving changes..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <button
              type="button"
              onClick={undo}
              disabled={!undoCount}
              className="rounded-md p-2 hover:bg-slate-100 disabled:opacity-30"
              title="Undo"
              aria-label="Undo"
            >
              <Undo2 size={17} />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!redoCount}
              className="rounded-md p-2 hover:bg-slate-100 disabled:opacity-30"
              title="Redo"
              aria-label="Redo"
            >
              <Redo2 size={17} />
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen((open) => !open)}
              className="rounded-md p-2 hover:bg-slate-100"
              title="Find"
              aria-label="Find"
            >
              <Search size={17} />
            </button>
            <button
              type="button"
              onClick={createDocument}
              className="rounded-md p-2 hover:bg-slate-100"
              title="New note"
              aria-label="New note"
            >
              <FilePlus size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl">
        {isSidebarOpen && (
          <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-4 sm:block">
            <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>Notes</span>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                title="Close notes panel"
                aria-label="Close notes panel"
              >
                <X size={15} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => editorRef.current?.focus()}
              className="w-full rounded-md bg-slate-100 px-3 py-2 text-left text-sm font-medium text-slate-700"
            >
              {documentTitle}
            </button>
          </aside>
        )}

        <section className="min-w-0 flex-1 px-4 py-6 sm:px-10 sm:py-10">
          {isSearchOpen && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Find in note..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <span className="text-xs text-slate-400">
                {matchCount} match{matchCount === 1 ? "" : "es"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                title="Close search"
                aria-label="Close search"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>
          )}
          <div className="notepad-page overflow-hidden rounded-xl border bg-white">
            <textarea
              ref={editorRef}
              value={value}
              onChange={(event) => updateValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.ctrlKey && event.key.toLowerCase() === "n") {
                  event.preventDefault();
                  createDocument();
                }
              }}
              spellCheck
              placeholder="Start writing..."
              style={{ fontSize: `${fontSize}px` }}
              className={`min-h-[60vh] w-full resize-none bg-white px-5 py-5 leading-7 text-slate-700 outline-none sm:min-h-[68vh] sm:px-8 sm:py-7 ${isWrapped ? "whitespace-pre-wrap" : "whitespace-pre"}`}
              aria-label="Note content"
            />
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2 text-xs text-slate-400 sm:px-6">
              <span>
                {wordCount} words · {characterCount} characters
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFontSize((size) => Math.max(12, size - 1))}
                  title="Decrease text size"
                  aria-label="Decrease text size"
                  className="rounded p-1.5 hover:bg-slate-100"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center">{fontSize}px</span>
                <button
                  type="button"
                  onClick={() => setFontSize((size) => Math.min(24, size + 1))}
                  title="Increase text size"
                  aria-label="Increase text size"
                  className="rounded p-1.5 hover:bg-slate-100"
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsWrapped((wrapped) => !wrapped)}
                  title="Toggle word wrap"
                  aria-label="Toggle word wrap"
                  className={`ml-2 rounded p-1.5 hover:bg-slate-100 ${isWrapped ? "text-slate-800" : "text-slate-400"}`}
                >
                  <WrapText size={14} />
                </button>
                <button
                  type="button"
                  onClick={createDocument}
                  title="Clear note"
                  aria-label="Clear note"
                  className="ml-1 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
