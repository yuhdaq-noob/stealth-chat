"use client";

import { useEffect, useRef, useState } from "react";
import { ChatRoom } from "@/components/ChatRoom";
import { Notepad } from "@/components/Notepad";
import { PasscodeModal } from "@/components/PasscodeModal";
import type { Message } from "@/types/message";

const DEFAULT_NOTE =
  "Daftar Website/Platform Web Dev:\n1. GitHub\n2. GitLab\n3. Vercel\n4. Netlify\n5. Cloudflare\n6. CodePen\n7. StackBlitz\n8. JSFiddle\n9. MDN Web Docs\n10. freeCodeCamp\n11. shadcn/ui\n12. Tailwind CSS\n13. Bootstrap\n14. Lucide\n15. Google Fonts\n16. Unsplash\n17. Postman\n18. Docker\n19. npm\n20. Can I Use";

export default function Home() {
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [isChatMode, setIsChatMode] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeName, setPasscodeName] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [noteText, setNoteText] = useState(DEFAULT_NOTE);
  const [isNoteSaved, setIsNoteSaved] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatError, setChatError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageRefreshKey, setMessageRefreshKey] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const exitChatMode = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsChatMode(false);
    setShowPasscodeModal(false);
    setCurrentUserId("");
    setCurrentUserName("");
  };

  useEffect(() => {
    const restoreSession = async () => {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const { user } = await response.json();
        setCurrentUserId(user.id);
        setCurrentUserName(user.displayName);
        setIsChatMode(true);
      }
      const savedNote = localStorage.getItem("stealth_note");
      if (savedNote !== null) setNoteText(savedNote);
      setIsAuthLoading(false);
    };

    void restoreSession();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowPasscodeModal(true);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        exitChatMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      localStorage.setItem("stealth_note", noteText);
      setIsNoteSaved(true);
    }, 500);
    return () => window.clearTimeout(saveTimer);
  }, [noteText]);

  const handleNoteChange = (value: string) => {
    setIsNoteSaved(false);
    setNoteText(value);
  };

  useEffect(() => {
    if (!isChatMode || !currentUserId) return;
    let isActive = true;

    const fetchMessages = async (showLoading = false) => {
      if (showLoading) setIsLoadingMessages(true);
      setChatError("");
      const response = await fetch("/api/messages");
      if (!isActive) return;
      if (!response.ok) setChatError("Pesan tidak dapat dimuat.");
      else setMessages((await response.json()).messages ?? []);
      if (showLoading) setIsLoadingMessages(false);
    };
    const fetchPresence = async () => {
      const response = await fetch("/api/presence");
      if (isActive && response.ok)
        setIsPartnerOnline((await response.json()).isPartnerOnline);
    };
    void fetchMessages(true);
    void fetchPresence();
    const messageTimer = window.setInterval(() => {
      void fetchMessages();
    }, 5000);
    const presenceTimer = window.setInterval(async () => {
      await fetch("/api/presence/heartbeat", { method: "POST" });
      await fetchPresence();
    }, 15000);

    return () => {
      isActive = false;
      window.clearInterval(messageTimer);
      window.clearInterval(presenceTimer);
      setMessages([]);
      setSelectedMessageIds([]);
      setIsPartnerOnline(false);
      setIsLoadingMessages(false);
    };
  }, [currentUserId, isChatMode, messageRefreshKey]);

  const handleUnlock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAuthenticating(true);
    setAuthError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: passcodeName, password }),
    });
    const result = await response.json();
    if (!response.ok) {
      setAuthError(result.error ?? "Login tidak berhasil.");
      setIsAuthenticating(false);
      return;
    }
    setCurrentUserId(result.user.id);
    setCurrentUserName(result.user.displayName);
    setIsChatMode(true);
    setShowPasscodeModal(false);
    setPassword("");
    setIsAuthenticating(false);
  };

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = newMessage.trim();
    if (!content) return;
    setIsSending(true);
    setPendingMessage(content);
    setChatError("");
    setNewMessage("");

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      setChatError("Pesan tidak dapat dikirim.");
      setNewMessage(content);
    } else {
      const result = await response.json();
      if (result.message)
        setMessages((current) => [...current, result.message]);
    }
    setPendingMessage("");
    setIsSending(false);
  };

  const deleteMessages = async (ids: string[]) => {
    if (ids.length === 0) return;
    const confirmed = window.confirm(
      `Hapus ${ids.length} ${ids.length === 1 ? "pesan" : "pesan yang dipilih"}?`,
    );
    if (!confirmed) return;
    setIsDeleting(true);
    setChatError("");
    const response = await fetch("/api/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setChatError(result?.error ?? "Pesan tidak dapat dihapus.");
    } else {
      const deletedIds = new Set<string>(result?.deletedIds ?? []);
      setMessages((current) =>
        current.filter((message) => !deletedIds.has(message.id)),
      );
      setSelectedMessageIds((current) =>
        current.filter((id) => !deletedIds.has(id)),
      );
    }
    setIsDeleting(false);
  };

  if (isAuthLoading) return null;

  return (
    <main className="min-h-screen text-neutral-100">
      {isChatMode ? (
        <ChatRoom
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          messages={messages}
          newMessage={newMessage}
          isPartnerOnline={isPartnerOnline}
          isLoading={isLoadingMessages}
          errorMessage={chatError}
          isSending={isSending}
          pendingMessage={pendingMessage}
          selectedMessageIds={selectedMessageIds}
          isDeleting={isDeleting}
          chatBottomRef={chatBottomRef}
          onNewMessageChange={setNewMessage}
          onSendMessage={sendMessage}
          onRetryLoad={() => setMessageRefreshKey((key) => key + 1)}
          onSelectionChange={setSelectedMessageIds}
          onDeleteMessages={deleteMessages}
          onExit={exitChatMode}
        />
      ) : (
        <Notepad
          value={noteText}
          onChange={handleNoteChange}
          isSaved={isNoteSaved}
          onUnlockRequest={() => setShowPasscodeModal(true)}
        />
      )}
      {showPasscodeModal && (
        <PasscodeModal
          name={passcodeName}
          password={password}
          errorMessage={authError}
          isSubmitting={isAuthenticating}
          onNameChange={setPasscodeName}
          onPasswordChange={setPassword}
          onSubmit={handleUnlock}
          onCancel={() => setShowPasscodeModal(false)}
        />
      )}
    </main>
  );
}
