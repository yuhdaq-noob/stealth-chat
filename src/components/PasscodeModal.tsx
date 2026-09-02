interface PasscodeModalProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function PasscodeModal({
  value,
  onChange,
  onSubmit,
  onCancel,
}: PasscodeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700 w-full max-w-sm">
        <h2 className="text-sm font-semibold mb-3 text-neutral-300">
          Security Check
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Enter passcode..."
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:border-neutral-500"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-neutral-700 text-white rounded hover:bg-neutral-600"
            >
              Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
