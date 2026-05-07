"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  sources?: number;
  relevantChunks?: Array<{ text: string; score: number }>;
  synthesis?: {
    mainArgument: string;
    keyPoints: string[];
    citations: Array<{ id: string; text: string }>;
    confidence: number;
  };
}

interface ChatProps {
  documentId: string | null;
  documentName?: string;
}

export default function ChatInterface({ documentId, documentName }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !documentId) {
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          documentId,
          contextLimit: 5,
          temperature: 0.3,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Query failed");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.answer,
        sources: data.sources,
        relevantChunks: data.relevantChunks,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `❌ Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!documentId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            No Document Selected
          </h2>
          <p className="text-muted">
            Upload a document from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Bar */}
      <div className="header-bar">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-lg">
              💬 Chat Session
            </h2>
            <p className="text-sm text-muted mt-1">
              Document: <span className="text-slate-700 font-medium">{documentName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
            <span className="text-2xl">📄</span>
            <span className="text-sm text-slate-700">{documentName}</span>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">🤖</div>
            <p className="text-muted text-lg mb-2">
              Ready to chat about your document
            </p>
            <p className="text-slate-500 text-sm max-w-md">
              Ask any question about the content, and I'll search through the document to provide accurate answers.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={message.type === "user" ? "message-user" : "message-assistant"}>
            {message.type === "assistant" && message.synthesis ? (
              // Structured Synthesis View
              <div className="message-assistant-content w-full max-w-3xl">
                {/* Main Argument / Synthesis */}
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Core Argument</div>
                  <p className="text-sm leading-relaxed text-slate-900">
                    {message.synthesis.mainArgument}
                  </p>
                </div>

                {/* Key Points Section */}
                {message.synthesis.keyPoints && message.synthesis.keyPoints.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Key Arguments</div>
                    <div className="space-y-3">
                      {message.synthesis.keyPoints.map((point, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-600">{idx + 1}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed flex-1">
                            {point}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Citations Section */}
                {message.synthesis.citations && message.synthesis.citations.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Verified Citations</div>
                    <div className="space-y-2">
                      {message.synthesis.citations.map((citation, idx) => (
                        <div key={idx} className="citation-chip">
                          <span className="font-bold">[S{citation.id}]</span>
                          <span className="ml-1.5 text-xs">{citation.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence & Source Count */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-600">Synthesis Confidence</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {(message.synthesis.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="confidence-bar">
                      <div 
                        className={`confidence-bar-fill ${
                          message.synthesis.confidence > 0.75 ? 'confidence-high' :
                          message.synthesis.confidence > 0.5 ? 'confidence-medium' :
                          'confidence-low'
                        }`}
                        style={{ width: `${message.synthesis.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-6">
                    <span className="text-xs font-bold text-slate-500">
                      Synthesized from {message.sources || 5} source units
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Standard Message View
              <div className="message-assistant-content w-full max-w-3xl">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Sources indicator */}
                {message.sources && message.sources > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
                    <span>📚 {message.sources} source{message.sources !== 1 ? "s" : ""}</span>
                    <button
                      onClick={() =>
                        setExpandedMessageId(
                          expandedMessageId === message.id ? null : message.id
                        )
                      }
                      className="ml-auto px-2 py-1 rounded hover:bg-white/10 transition"
                    >
                      {expandedMessageId === message.id ? "Hide" : "View"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Expanded sources */}
            {expandedMessageId === message.id &&
              message.relevantChunks &&
              message.relevantChunks.length > 0 && (
                <div className="mt-3 ml-0 mr-auto max-w-2xl space-y-2 bg-muted border-hairline rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase">
                    Supporting Sources
                  </p>
                  {message.relevantChunks.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded p-2 border-hairline"
                    >
                      <p className="text-xs text-muted mb-1">
                        Relevance: {(chunk.score * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-slate-700 line-clamp-3">
                        {chunk.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ))}

        {loading && (
          <div className="message-assistant">
            <div className="message-assistant-content">
              <div className="flex gap-2 items-center">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-sm text-muted ml-2">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="border-hairline-top bg-surface-1 p-4 backdrop-blur"
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the document..."
            disabled={loading}
            className="query-bar flex-1 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary-lg disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-muted mt-2">
          💡 Tip: Ask specific questions for better answers. Answers are based only on your document.
        </p>
      </form>
    </div>
  );
}
