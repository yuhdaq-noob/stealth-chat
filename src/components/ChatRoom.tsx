import { format } from "date-fns";
import Image from "next/image";
import type { Message, MessageAttachment } from "@/types/message";

interface ChatRoomProps {
  currentUserId: string;
  messages: Message[];
  newMessage: string;
  isPartnerOnline: boolean;
  isLoading: boolean;
  errorMessage: string;
  attachment: MessageAttachment | null;
  isSending: boolean;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  onNewMessageChange: (value: string) => void;
  onSendMessage: (event: React.FormEvent<HTMLFormElement>) => void;
  onAttachmentChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: () => void;
  onExit: () => void;
}

export function ChatRoom({
  currentUserId,
  messages,
  newMessage,
  isPartnerOnline,
  isLoading,
  errorMessage,
  attachment,
  isSending,
  chatBottomRef,
  onNewMessageChange,
  onSendMessage,
  onAttachmentChange,
  onRemoveAttachment,
  onExit,
}: ChatRoomProps) {
  return (
    <div className="p-4 max-w-2xl mx-auto flex flex-col h-screen">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-2 shrink-0">
        <div>
          <h1 className="font-bold text-sm text-neutral-200">
            Private Room ({currentUserId === "user_1" ? "User A" : "User B"})
          </h1>
          <span
            className={`text-xs ${isPartnerOnline ? "text-emerald-400" : "text-neutral-500"}`}
          >
            {isPartnerOnline ? "● Partner Online" : "● Partner Offline"}
          </span>
        </div>
        <button
          onClick={onExit}
          className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 text-xs rounded hover:bg-red-600/30"
        >
          Exit (Esc)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-2 my-2">
        {isLoading ? (
          <div className="text-center text-xs text-neutral-500 my-10">
            Memuat pesan...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-neutral-600 my-10">
            Belum ada pesan.
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded text-sm ${isCurrentUser ? "bg-neutral-700 text-neutral-100 rounded-br-none" : "bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none"}`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  {message.media_url && message.media_type?.startsWith("image/") && (
                    <Image
                      src={message.media_url}
                      alt="Lampiran pesan"
                      width={640}
                      height={480}
                      unoptimized
                      className="mt-2 max-h-64 max-w-full rounded object-contain"
                    />
                  )}
                  {message.media_url && !message.media_type?.startsWith("image/") && (
                    <a
                      href={message.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-xs text-sky-300 underline"
                    >
                      Buka lampiran
                    </a>
                  )}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 px-1">
                  {format(new Date(message.created_at), "HH:mm")}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {errorMessage && (
        <p className="text-xs text-red-400 pb-2" role="alert">
          {errorMessage}
        </p>
      )}
      {attachment && (
        <div className="flex items-center justify-between text-xs text-neutral-400 pb-2">
          <span className="truncate">Lampiran: {attachment.file.name}</span>
          <button type="button" onClick={onRemoveAttachment} className="text-red-400">
            Hapus
          </button>
        </div>
      )}
      <form
        onSubmit={onSendMessage}
        className="flex gap-2 pt-2 border-t border-neutral-800 shrink-0"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(event) => onNewMessageChange(event.target.value)}
          placeholder="Tulis pesan..."
          aria-label="Pesan baru"
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500"
        />
        <label className="px-3 py-2 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded text-sm cursor-pointer">
          File
          <input type="file" onChange={onAttachmentChange} className="sr-only" accept="image/*,.pdf,.txt" />
        </label>
        <button type="submit" disabled={isSending} className="px-4 py-2 bg-neutral-200 text-neutral-900 font-semibold rounded text-sm hover:bg-white disabled:opacity-50">
          {isSending ? "Mengirim..." : "Kirim"}
        </button>
      </form>
    </div>
  );
}
