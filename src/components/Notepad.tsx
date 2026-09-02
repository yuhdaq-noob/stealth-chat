interface NotepadProps {
  value: string;
  onChange: (value: string) => void;
  isSaved: boolean;
}

export function Notepad({ value, onChange, isSaved }: NotepadProps) {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-700 pb-3 mb-4">
        <h1 className="text-sm text-neutral-400">Untitled - Notepad</h1>
        <span className="text-xs text-neutral-500">
          {isSaved ? "Auto-saved" : "Saving..."}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-[80vh] bg-transparent resize-none focus:outline-none text-sm text-neutral-200 leading-relaxed"
        placeholder="Tulis catatan di sini..."
      />
    </div>
  );
}
