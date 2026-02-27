import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";

// Groq API - free tier available at https://console.groq.com/
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "llama-3.1-8b-instant"; // Free model with good performance

export default function ChatBot() {
  const { user } = useAuth();
  const businessName = user?.businessName || "WareHub";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "model"; text: string }[]
  >([
    {
      role: "model",
      text: `Hello! I am your "${businessName}" AI assistant. How can I help you manage your business today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      // Using Groq API - free tier with fast inference
      // Get your free API key: https://console.groq.com/
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: "Sorry, the AI is not configured. Please set VITE_GROQ_API_KEY in your .env file. Get it free at https://console.groq.com/",
          },
        ]);
        setIsLoading(false);
        return;
      }

      const systemInstruction = `You are an AI assistant for StockConnect, a large-scale business management application. 
      The app helps users manage inventory, track stock movements, handle customer loyalty points, and run marketing campaigns.
      Be professional, helpful, and concise. If you don't know something about the specific data of the user, explain that you are an AI assistant and suggest where they can find that information in the app (e.g., "Check the Inventory page for current stock levels").`;

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: "system", content: systemInstruction },
            ...messages.map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.text,
            })),
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Groq error: ${errorData.error?.message || response.status}`,
        );
      }

      const data = await response.json();
      const aiText =
        data.choices?.[0]?.message?.content ||
        "I'm sorry, I couldn't process that request.";

      setMessages((prev) => [...prev, { role: "model", text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I encountered an error. Please check your Groq API key and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all z-50 group"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        <span className="absolute right-16 bg-white text-gray-900 px-3 py-1 rounded-lg text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
          Ask WareHub AI
        </span>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-bold">WareHub AI</h3>
                <p className="text-xs text-indigo-100">
                  Powered by Groq (Free Tier)
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        m.role === "user"
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-white text-gray-600 border border-gray-200"
                      }`}
                    >
                      {m.role === "user" ? (
                        <User size={16} />
                      ) : (
                        <Bot size={16} />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-sm ${
                        m.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                      <Bot size={16} className="text-gray-400" />
                    </div>
                    <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <Loader2
                        size={16}
                        className="animate-spin text-indigo-600"
                      />
                      <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t border-gray-100 flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask a question..."
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
