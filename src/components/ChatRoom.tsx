"use client";

import { format } from "date-fns";
import Image from "next/image";
import {
  Check,
  FileUp,
  LogOut,
  RefreshCw,
  Send,
  Wifi,
  WifiOff,
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
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  onNewMessageChange: (value: string) => void;
  onSendMessage: (event: React.FormEvent<HTMLFormElement>) => void;
  onRetryLoad: () => void;
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
  chatBottomRef,
  onNewMessageChange,
  onSendMessage,
  onRetryLoad,
  onExit,
}: ChatRoomProps) {
  const remainingCharacters = 2000 - newMessage.length;

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
      </div>

      <div className="chat-messages">
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
                className={`message-row ${isCurrentUser ? "is-mine" : ""}`}
              >
                <div className="message-meta">
                  <span>{isCurrentUser ? "You" : "Partner"}</span>
                  <time dateTime={message.created_at}>
                    {format(new Date(message.created_at), "HH:mm")}
                  </time>
                </div>
                <div className="message-bubble">
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
                    {isCurrentUser && <Check size={13} aria-label="Sent" />}
                  </div>
                </div>
              </article>
            );
          })
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
        <input
          type="text"
          value={newMessage}
          onChange={(event) => onNewMessageChange(event.target.value)}
          placeholder="Write a message..."
          aria-label="Pesan baru"
          maxLength={2000}
          disabled={isSending}
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
