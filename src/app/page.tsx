"use client";

import { useEffect, useRef, useState } from "react";
import { ChatRoom } from "@/components/ChatRoom";
import { Notepad } from "@/components/Notepad";
import { PasscodeModal } from "@/components/PasscodeModal";
import { supabase } from "@/lib/supabase";
import type { Message, MessageAttachment } from "@/types/message";

const PASSCODES = { "1234": "user_1", "4321": "user_2" } as const;
const DEFAULT_NOTE =
  "Daftar Belanjaan:\n1. Beras 5kg\n2. Minyak goreng\n3. Telur ayam";

function getSavedUser() {
  if (typeof window === "undefined") return "";
  if (sessionStorage.getItem("stealth_auth") !== "true") return "";
  return sessionStorage.getItem("stealth_user") ?? "";
}

function getSavedNote() {
  if (typeof window === "undefined") return DEFAULT_NOTE;
  return localStorage.getItem("stealth_note") ?? DEFAULT_NOTE;
}

export default function Home() {
  const [currentUserId, setCurrentUserId] = useState(getSavedUser);
  const [isChatMode, setIsChatMode] = useState(Boolean(currentUserId));
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [noteText, setNoteText] = useState(getSavedNote);
  const [isNoteSaved, setIsNoteSaved] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatError, setChatError] = useState("");
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const exitChatMode = () => {
    sessionStorage.removeItem("stealth_auth");
    sessionStorage.removeItem("stealth_user");
    setIsChatMode(false);
    setShowPasscodeModal(false);
    setCurrentUserId("");
  };

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
    const partnerId = currentUserId === "user_1" ? "user_2" : "user_1";

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      setChatError("");
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) setChatError("Pesan tidak dapat dimuat.");
      else if (data) setMessages(data);
      setIsLoadingMessages(false);
    };
    fetchMessages();

    const messageChannel = supabase
      .channel("realtime_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const incomingMessage = payload.new as Message;
          setMessages((currentMessages) =>
            currentMessages.some((message) => message.id === incomingMessage.id)
              ? currentMessages
              : [...currentMessages, incomingMessage],
          );
        },
      )
      .subscribe();

    const presenceChannel = supabase.channel("online_presence", {
      config: { presence: { key: currentUserId } },
    });
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        setIsPartnerOnline(
          Object.keys(presenceChannel.presenceState()).includes(partnerId),
        );
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED")
          await presenceChannel.track({ online_at: new Date().toISOString() });
      });

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(presenceChannel);
      setMessages([]);
      setIsPartnerOnline(false);
      setIsLoadingMessages(false);
    };
  }, [currentUserId, isChatMode]);

  const handleUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const assignedUser = PASSCODES[passcode as keyof typeof PASSCODES];
    if (!assignedUser) {
      alert("Passcode salah");
      setPasscode("");
      return;
    }
    sessionStorage.setItem("stealth_auth", "true");
    sessionStorage.setItem("stealth_user", assignedUser);
    setCurrentUserId(assignedUser);
    setIsChatMode(true);
    setShowPasscodeModal(false);
    setPasscode("");
  };

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = newMessage.trim();
    if (!content && !attachment) return;
    setIsSending(true);
    setChatError("");
    setNewMessage("");
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (attachment) {
      const filePath = `${currentUserId}/${crypto.randomUUID()}-${attachment.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("message-media")
        .upload(filePath, attachment.file, { upsert: false });
      if (uploadError) {
        setChatError("Lampiran tidak dapat diunggah.");
        setNewMessage(content);
        setIsSending(false);
        return;
      }
      const { data } = supabase.storage
        .from("message-media")
        .getPublicUrl(filePath);
      mediaUrl = data.publicUrl;
      mediaType = attachment.file.type;
    }

    const { error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: currentUserId,
          content: content || null,
          media_url: mediaUrl,
          media_type: mediaType,
        },
      ]);
    if (error) {
      console.error("Gagal mengirim pesan:", error);
      setChatError("Pesan tidak dapat dikirim.");
      setNewMessage(content);
    }
    setAttachment(null);
    setIsSending(false);
  };

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setChatError("Ukuran lampiran maksimal 10 MB.");
      return;
    }
    setChatError("");
    setAttachment({ file, previewUrl: URL.createObjectURL(file) });
    event.target.value = "";
  };

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100 font-mono">
      {isChatMode ? (
        <ChatRoom
          currentUserId={currentUserId}
          messages={messages}
          newMessage={newMessage}
          isPartnerOnline={isPartnerOnline}
          isLoading={isLoadingMessages}
          errorMessage={chatError}
          attachment={attachment}
          isSending={isSending}
          chatBottomRef={chatBottomRef}
          onNewMessageChange={setNewMessage}
          onSendMessage={sendMessage}
          onAttachmentChange={handleAttachmentChange}
          onRemoveAttachment={() => setAttachment(null)}
          onExit={exitChatMode}
        />
      ) : (
        <Notepad
          value={noteText}
          onChange={handleNoteChange}
          isSaved={isNoteSaved}
        />
      )}
      {showPasscodeModal && (
        <PasscodeModal
          value={passcode}
          onChange={setPasscode}
          onSubmit={handleUnlock}
          onCancel={() => setShowPasscodeModal(false)}
        />
      )}
    </main>
  );
}
