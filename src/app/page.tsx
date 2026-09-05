"use client";

import { useEffect, useRef, useState } from "react";
import { ChatRoom } from "@/components/ChatRoom";
import { Notepad } from "@/components/Notepad";
import { PasscodeModal } from "@/components/PasscodeModal";
import { supabase } from "@/lib/supabase";
import type { Message } from "@/types/message";

const PASSCODES = { "1234": "user_1", "4321": "user_2" } as const;
const DEFAULT_NOTE =
  "Daftar Website/Platform Web Dev:\n1. GitHub\n2. GitLab\n3. Vercel\n4. Netlify\n5. Cloudflare\n6. CodePen\n7. StackBlitz\n8. JSFiddle\n9. MDN Web Docs\n10. freeCodeCamp\n11. shadcn/ui\n12. Tailwind CSS\n13. Bootstrap\n14. Lucide\n15. Google Fonts\n16. Unsplash\n17. Postman\n18. Docker\n19. npm\n20. Can I Use";

export default function Home() {
  const [currentUserId, setCurrentUserId] = useState("");
  const [isChatMode, setIsChatMode] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [noteText, setNoteText] = useState(DEFAULT_NOTE);
  const [isNoteSaved, setIsNoteSaved] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatError, setChatError] = useState("");
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
    const restoreTimer = window.setTimeout(() => {
      if (sessionStorage.getItem("stealth_auth") === "true") {
        const savedUser = sessionStorage.getItem("stealth_user") ?? "";
        if (savedUser) {
          setCurrentUserId(savedUser);
          setIsChatMode(true);
        }
      }

      const savedNote = localStorage.getItem("stealth_note");
      if (savedNote !== null) setNoteText(savedNote);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
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
    if (!content) return;
    setIsSending(true);
    setChatError("");
    setNewMessage("");

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: currentUserId,
        content,
      },
    ]);
    if (error) {
      console.error("Gagal mengirim pesan:", error);
      setChatError("Pesan tidak dapat dikirim.");
      setNewMessage(content);
    }
    setIsSending(false);
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
          isSending={isSending}
          chatBottomRef={chatBottomRef}
          onNewMessageChange={setNewMessage}
          onSendMessage={sendMessage}
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
          value={passcode}
          onChange={setPasscode}
          onSubmit={handleUnlock}
          onCancel={() => setShowPasscodeModal(false)}
        />
      )}
    </main>
  );
}
