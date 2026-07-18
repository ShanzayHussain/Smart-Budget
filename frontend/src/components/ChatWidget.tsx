import { useState, useRef, useEffect } from "react";
import { sendChatMessage, type ChatMessage } from "../lib/api";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: "user", text: trimmed };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput("");
    setError("");
    setLoading(true);

    try {
      // send only prior history (not including this new message twice)
      const reply = await sendChatMessage(trimmed, messages);
      setMessages([...updatedHistory, { role: "model", text: reply }]);
    } catch (err) {
      console.error("Chat send failed:", err);
      setError("Couldn't get a response. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#0B1220] text-white shadow-lg flex items-center justify-center hover:bg-[#16815F] transition-colors"
        aria-label={isOpen ? "Close chat" : "Open budget assistant chat"}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-[#E4E7EC] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#0B1220] text-white px-4 py-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5EEAD4]" />
            <span className="font-medium text-sm">Budget Assistant</span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-[#0B1220]/50 mt-8 px-4">
                Ask me anything about your budget — like "Am I overspending?" or "What should I cut back on?"
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#0B1220] text-white rounded-br-sm"
                      : "bg-[#F5F6F8] text-[#0B1220] rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#F5F6F8] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm text-[#0B1220]/50">
                  Thinking…
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-xs text-red-600 py-2">{error}</div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[#E4E7EC] p-3 flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16815F] max-h-24"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-[#0B1220] text-white px-4 rounded-lg text-sm font-medium hover:bg-[#16815F] transition-colors disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}