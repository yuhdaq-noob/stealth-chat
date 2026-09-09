"use client";

import { format } from "date-fns";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Clock3,
  FileUp,
  ListChecks,
  LogOut,
  MoreVertical,
  RefreshCw,
  Send,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import type { Message } from "@/types/message";

const FILE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSca0T6Q4sseRNY68H2GvbxR0epODNaSLej71iC4cQwPrsczrw/viewform?usp=dialog";

interface ChatRoomProps {
  currentUserId: string;
  currentUserName: string;
  messages: Message[];
  newMessage: string;
  isPartnerOnline: boolean;
  isLoading: boolean;
  errorMessage: string;
  isSending: boolean;
  pendingMessage: string;
  selectedMessageIds: string[];
  isDeleting: boolean;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  onNewMessageChange: (value: string) => void;
  onSendMessage: (event: React.FormEvent<HTMLFormElement>) => void;
  onRetryLoad: () => void;
  onSelectionChange: (ids: string[]) => void;
  onDeleteMessages: (ids: string[]) => boolean | Promise<boolean>;
  onExit: () => void;
}

export function ChatRoom({
  currentUserId,
  currentUserName,
  messages,
  newMessage,
  isPartnerOnline,
  isLoading,
  errorMessage,
  isSending,
  pendingMessage,
  selectedMessageIds,
  isDeleting,
  chatBottomRef,
  onNewMessageChange,
  onSendMessage,
  onRetryLoad,
  onSelectionChange,
  onDeleteMessages,
  onExit,
}: ChatRoomProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const longPressTimerRef = useRef<number | null>(null);
  const remainingCharacters = 2000 - newMessage.length;
  const ownMessageIds = messages
    .filter((message) => message.sender_id === currentUserId)
    .map((message) => message.id);
  const allOwnMessagesSelected =
    ownMessageIds.length > 0 &&
    ownMessageIds.every((id) => selectedMessageIds.includes(id));

  const toggleMessageSelection = (id: string) => {
    handleSelectionChange(
      selectedMessageIds.includes(id)
        ? selectedMessageIds.filter((selectedId) => selectedId !== id)
        : [...selectedMessageIds, id],
    );
  };

  const toggleSelectAll = () => {
    handleSelectionChange(allOwnMessagesSelected ? [] : ownMessageIds);
  };

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessage, chatBottomRef]);

  const handleMessagesScroll = () => {
    const container = chatMessagesRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 96;
  };

  const activateSelection = (id?: string) => {
    setIsSelectionMode(true);
    if (id && !selectedMessageIds.includes(id)) {
      onSelectionChange([...selectedMessageIds, id]);
    }
  };

  const handleSelectionChange = (ids: string[]) => {
    onSelectionChange(ids);
    if (ids.length === 0) setIsSelectionMode(false);
  };

  const startLongPress = (id: string) => {
    longPressTimerRef.current = window.setTimeout(() => {
      activateSelection(id);
      longPressTimerRef.current = null;
    }, 550);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div className="chat-shell">
      <header className="chat-header">
        <div className="chat-identity">
          <div>
            <p className="eyebrow">Jual Beli Musang</p>
            <h1>{currentUserName}</h1>
            <p className={`presence ${isPartnerOnline ? "is-online" : ""}`}>
              {isPartnerOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              {isPartnerOnline ? "Partner online" : "Partner offline"}
            </p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="button button-quiet button-danger"
          type="button"
        >
          <LogOut size={15} />
          <span>Exit</span>
        </button>
      </header>

      <div className="chat-statusbar">
        <span>
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </span>
        {ownMessageIds.length > 0 && (
          <div className="message-selection-actions">
            {selectedMessageIds.length > 0 ? (
              <>
                <span>{selectedMessageIds.length} dipilih</span>
                <button
                  type="button"
                  className="selection-action selection-delete"
                  onClick={async () => {
                    const deleted = await onDeleteMessages(selectedMessageIds);
                    if (deleted) setIsSelectionMode(false);
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 size={13} />
                  <span>{isDeleting ? "Menghapus..." : "Hapus"}</span>
                </button>
                <button
                  type="button"
                  className="selection-action"
                  onClick={() => handleSelectionChange([])}
                  disabled={isDeleting}
                  aria-label="Batalkan pilihan"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="selection-action"
                onClick={() => {
                  setIsSelectionMode(true);
                  toggleSelectAll();
                }}
                title="Pilih semua pesan saya"
              >
                <ListChecks size={14} />
                Pilih semua pesan saya
              </button>
            )}
          </div>
        )}
      </div>

      <div
        ref={chatMessagesRef}
        className="chat-messages"
        onScroll={handleMessagesScroll}
      >
        {isLoading ? (
          <div className="chat-empty-state">
            <RefreshCw size={18} className="animate-spin" />
            <p>Loading room...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-icon">
              <Send size={18} />
            </div>
            <p>No messages yet</p>
            <span>Start a quiet conversation with your seller or buyer.</span>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === currentUserId;
            return (
              <article
                key={message.id}
                className={`message-row ${isCurrentUser ? "is-mine" : ""} ${selectedMessageIds.includes(message.id) ? "is-selected" : ""}`}
                onPointerDown={
                  isCurrentUser ? () => startLongPress(message.id) : undefined
                }
                onPointerUp={cancelLongPress}
                onPointerCancel={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onContextMenu={
                  isCurrentUser
                    ? (event) => {
                        event.preventDefault();
                        activateSelection(message.id);
                      }
                    : undefined
                }
              >
                <div className="message-meta">
                  <span>{isCurrentUser ? "You" : "Partner"}</span>
                  <time dateTime={message.created_at}>
                    {format(new Date(message.created_at), "HH:mm")}
                  </time>
                </div>
                <div className="message-bubble">
                  {isCurrentUser && !isSelectionMode && (
                    <button
                      type="button"
                      className="message-menu"
                      onClick={() => activateSelection(message.id)}
                      aria-label="Pilih pesan"
                      title="Pilih pesan"
                    >
                      <MoreVertical size={15} />
                    </button>
                  )}
                  {isCurrentUser && isSelectionMode && (
                    <label className="message-select">
                      <input
                        type="checkbox"
                        checked={selectedMessageIds.includes(message.id)}
                        onChange={() => toggleMessageSelection(message.id)}
                        aria-label="Pilih pesan"
                      />
                      <span />
                    </label>
                  )}
                  <p className="message-content">{message.content}</p>
                  {message.media_url &&
                    message.media_type?.startsWith("image/") && (
                      <Image
                        src={message.media_url}
                        alt="Lampiran pesan"
                        width={640}
                        height={480}
                        unoptimized
                        className="message-image"
                      />
                    )}
                  {message.media_url &&
                    !message.media_type?.startsWith("image/") && (
                      <a
                        href={message.media_url}
                        target="_blank"
                        rel="noreferrer"
                        className="message-attachment"
                      >
                        Buka lampiran
                      </a>
                    )}
                  <div className="message-actions">
                    {isCurrentUser &&
                      (message.read_at ? (
                        <CheckCheck
                          size={15}
                          className="message-status is-read"
                          aria-label="Sudah terbaca"
                        />
                      ) : (
                        <Check
                          size={15}
                          className="message-status"
                          aria-label="Terkirim"
                        />
                      ))}
                  </div>
                </div>
              </article>
            );
          })
        )}
        {pendingMessage && (
          <article className="message-row is-mine is-pending">
            <div className="message-meta">
              <span>You</span>
              <span>Mengirim...</span>
            </div>
            <div className="message-bubble">
              <p className="message-content">{pendingMessage}</p>
              <div className="message-actions">
                <Clock3
                  size={15}
                  className="message-status is-pending"
                  aria-label="Belum terkirim"
                />
              </div>
            </div>
          </article>
        )}
        <div ref={chatBottomRef} />
      </div>

      {errorMessage && (
        <div className="chat-error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={onRetryLoad}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}
      <form onSubmit={onSendMessage} className="composer">
        <textarea
          value={newMessage}
          onChange={(event) => onNewMessageChange(event.target.value)}
          placeholder="Tulis pesan..."
          aria-label="Pesan baru"
          maxLength={2000}
          disabled={isSending}
          rows={1}
        />
        <a
          href={FILE_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="button button-secondary"
          title="Open the file sharing form"
        >
          <FileUp size={16} />
          <span>File</span>
        </a>
        <button
          type="submit"
          disabled={isSending || !newMessage.trim()}
          className="button button-primary"
        >
          <Send size={16} />
          <span>{isSending ? "Sending" : "Send"}</span>
        </button>
        <span
          className={`composer-count ${remainingCharacters < 100 ? "is-low" : ""}`}
        >
          {remainingCharacters}
        </span>
      </form>
    </div>
  );
}
