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
  Reply,
  Send,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { getUserAlias } from "@/lib/user-aliases";
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
  replyingTo: Message | null;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  onNewMessageChange: (value: string) => void;
  onSendMessage: (event: React.FormEvent<HTMLFormElement>) => void;
  onRetryLoad: () => void;
  onSelectionChange: (ids: string[]) => void;
  onDeleteMessages: (ids: string[]) => void;
  onReply: (message: Message) => void;
  onCancelReply: () => void;
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
  replyingTo,
  chatBottomRef,
  onNewMessageChange,
  onSendMessage,
  onRetryLoad,
  onSelectionChange,
  onDeleteMessages,
  onReply,
  onCancelReply,
  onExit,
}: ChatRoomProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressOriginRef = useRef({ x: 0, y: 0 });
  const remainingCharacters = 2000 - newMessage.length;
  const currentUserAlias = getUserAlias(currentUserId, currentUserName);
  const isSelectionActive = isSelectionMode && selectedMessageIds.length > 0;
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

  const startLongPress = (event: React.PointerEvent, id: string) => {
    if (event.pointerType !== "touch") return;
    longPressOriginRef.current = { x: event.clientX, y: event.clientY };
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

  const handleLongPressMove = (event: React.PointerEvent) => {
    const distance = Math.hypot(
      event.clientX - longPressOriginRef.current.x,
      event.clientY - longPressOriginRef.current.y,
    );
    if (distance > 10) cancelLongPress();
  };

  const jumpToMessage = (id: string) => {
    document.getElementById(`message-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className="chat-shell" aria-label="Ruang chat">
      <header className="chat-header">
        <div className="chat-identity">
          <div>
            <p className="eyebrow">Jual Beli Musang</p>
            <h1>{currentUserAlias}</h1>
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
          aria-label="Exit chat"
        >
          <LogOut size={15} />
          <span>Exit</span>
        </button>
      </header>

      <div className="chat-statusbar" aria-live="polite">
        <span className="message-total">
          <span className="status-dot" aria-hidden="true" />
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
                  onClick={() => onDeleteMessages(selectedMessageIds)}
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
                id={`message-${message.id}`}
                className={`message-row ${isCurrentUser ? "is-mine" : ""} ${selectedMessageIds.includes(message.id) ? "is-selected" : ""}`}
                onPointerDown={
                  isCurrentUser
                    ? (event) => startLongPress(event, message.id)
                    : undefined
                }
                onPointerMove={isCurrentUser ? handleLongPressMove : undefined}
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
                  <span>
                    {getUserAlias(
                      message.sender_id,
                      isCurrentUser ? currentUserName : "Partner",
                    )}
                  </span>
                  <time dateTime={message.created_at}>
                    {format(new Date(message.created_at), "HH:mm")}
                  </time>
                </div>
                <div
                  className={`message-bubble ${isSelectionActive ? "is-selection-mode" : ""}`}
                >
                  {isCurrentUser && !isSelectionActive && (
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
                  {isCurrentUser && isSelectionActive && (
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
                  {message.reply_to_message && (
                    <button
                      type="button"
                      className="message-reply-preview"
                      onClick={() =>
                        jumpToMessage(message.reply_to_message!.id)
                      }
                    >
                      <span>
                        Membalas{" "}
                        {getUserAlias(
                          message.reply_to_message.sender_id,
                          message.reply_to_message.sender_id === currentUserId
                            ? currentUserName
                            : "Partner",
                        )}
                      </span>
                      <strong>
                        {message.reply_to_message.content || "Lampiran"}
                      </strong>
                    </button>
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
                    <button
                      type="button"
                      onClick={() => onReply(message)}
                      disabled={isSelectionActive}
                      aria-label="Balas pesan"
                      title="Balas pesan"
                    >
                      <Reply size={13} />
                      <span>Balas</span>
                    </button>
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
              <span>{currentUserAlias}</span>
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

      <div className="chat-bottom-panel">
        {errorMessage && (
          <div className="chat-error" role="alert" aria-live="assertive">
            <span>{errorMessage}</span>
            <button type="button" onClick={onRetryLoad}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}
        {replyingTo && (
          <div className="reply-composer-preview">
            <div>
              <span>
                Membalas{" "}
                {getUserAlias(
                  replyingTo.sender_id,
                  replyingTo.sender_id === currentUserId
                    ? currentUserName
                    : "Partner",
                )}
              </span>
              <strong>{replyingTo.content || "Lampiran"}</strong>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              aria-label="Batalkan reply"
              title="Batalkan reply"
            >
              <X size={15} />
            </button>
          </div>
        )}
        <form onSubmit={onSendMessage} className="composer">
          <div className="composer-input">
            <textarea
              value={newMessage}
              onChange={(event) => onNewMessageChange(event.target.value)}
              placeholder="Tulis pesan..."
              aria-label="Pesan baru"
              aria-describedby="composer-count"
              maxLength={2000}
              disabled={isSending}
              rows={1}
            />
            <span
              id="composer-count"
              className={`composer-count ${remainingCharacters < 100 ? "is-low" : ""}`}
            >
              {remainingCharacters}
            </span>
          </div>
          <a
            href={FILE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
            title="Open the file sharing form"
            aria-label="Open the file sharing form"
          >
            <FileUp size={16} />
            <span>File</span>
          </a>
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="button button-primary"
            aria-label={isSending ? "Sending" : "Send"}
          >
            <Send size={16} />
            <span>{isSending ? "Sending" : "Send"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
