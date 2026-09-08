interface PasscodeModalProps {
  name: string;
  password: string;
  errorMessage: string;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function PasscodeModal({
  name,
  password,
  errorMessage,
  isSubmitting,
  onNameChange,
  onPasswordChange,
  onSubmit,
  onCancel,
}: PasscodeModalProps) {
  return (
    <div
      className="auth-modal fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="auth-panel w-full max-w-sm rounded-xl border p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="security-check-title"
      >
        <h2 className="text-sm font-semibold mb-3 text-neutral-300">
          <span id="security-check-title">Security Check</span>
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-xs text-neutral-400">
            User
            <input
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Nama anda"
              autoComplete="username"
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
              autoFocus
              required
            />
          </label>
          <label className="block text-xs text-neutral-400">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="4-6 angka"
              inputMode="numeric"
              autoComplete="current-password"
              minLength={4}
              maxLength={6}
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
              required
            />
          </label>
          {errorMessage && (
            <p className="text-xs text-red-400" role="alert">
              {errorMessage}
            </p>
          )}
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
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs bg-neutral-700 text-white rounded hover:bg-neutral-600"
            >
              {isSubmitting ? "Checking..." : "Access"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
