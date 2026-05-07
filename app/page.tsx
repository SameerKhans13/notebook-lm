"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  MessageSquare, 
  FileText, 
  Trash2, 
  Plus, 
  Search, 
  Sparkles, 
  ArrowRight,
  Database,
  Brain,
  Shield,
  Layers,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  Loader2,
  Clock,
  Hash,
  Activity,
  CheckCircle2
} from "lucide-react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Avatar from "@radix-ui/react-avatar";
import { Toaster, toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  chunkCount: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: number;
  confidence?: number;
}

const SUGGESTED_QUERIES = [
  "What are the main findings?",
  "Summarize the technical details.",
  "Identify the key stakeholders.",
  "List the core objectives."
];

export default function WhiteBlueBlackNotebook() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDocsLoading, setIsDocsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    // Force scroll to bottom whenever messages change
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const fetchDocuments = async () => {
    setIsDocsLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
        if (data.documents.length > 0 && !selectedDocId) {
          setSelectedDocId(data.documents[0].id);
        }
      }
    } catch (err) {
      toast.error("Library sync failed");
    } finally {
      setIsDocsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading(`Indexing ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Knowledge Unit Added", { id: toastId });
        await fetchDocuments();
        setSelectedDocId(data.documentId);
      } else {
        toast.error(data.error || "Index failed", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (queryOverride?: string) => {
    const query = queryOverride || input;
    if (!query.trim() || !selectedDocId || isLoading) return;

    const userMsg = query.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMsg,
          documentId: selectedDocId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const confidence = data.relevantChunks?.reduce((acc: number, c: any) => acc + c.score, 0) / (data.relevantChunks?.length || 1);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer, sources: data.sources, confidence },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error: " + (data.error || "Failed to process query") },
        ]);
      }
    } catch (err) {
      toast.error("Query service unavailable");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    const toastId = toast.loading("Removing source...");
    try {
      await fetch("/api/documents", {
        method: "DELETE",
        body: JSON.stringify({ documentId: id }),
      });
      toast.success("Source removed", { id: toastId });
      fetchDocuments();
      if (selectedDocId === id) setSelectedDocId(null);
    } catch (err) {
      toast.error("Deletion failed", { id: toastId });
    }
  };

  const createNewSession = () => {
    setMessages([]);
    setInput("");
    toast.success("New session initialized");
  };

  const renderContentWithCitations = (content: string) => {
    // Handle "Synthesis" block specifically
    const isSynthesis = content.startsWith("**Synthesis**");
    const cleanContent = isSynthesis ? content.replace("**Synthesis**", "") : content;

    const parts = cleanContent.split(/(\[Source \d+(?:[+,]?\s*Source \d+)*\]|S\d+[+]?)/g);
    
    return (
      <div className={cn("prose prose-sm", isSynthesis && "prose-synthesis")}>
        {isSynthesis && <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Synthesized Insight</div>}
        {cleanContent.split("\n").map((line, lineIdx) => (
          <p key={lineIdx} className={cn(lineIdx > 0 && "mt-3")}>
            {line.split(/(\[Source \d+(?:[+,]?\s*Source \d+)*\]|S\d+[+]?)/g).map((part, index) => {
              const match = part.match(/\[Source (\d+.*)\]/) || part.match(/S(\d+.*)/);
              if (match) {
                return (
                  <span key={index} className="inline-flex items-center justify-center bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-md ml-1 shadow-sm border border-blue-200">
                    S{match[1].replace('Source ', '')}
                  </span>
                );
              }
              // Handle bold text in parts
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={index}>{part.replace(/\*\*/g, "")}</strong>;
              }
              return <span key={index}>{part}</span>;
            })}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Tooltip.Provider>
      <Toaster position="top-right" richColors />
      <div className="flex h-screen w-screen bg-white overflow-hidden">
        
        {/* Black Sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-black text-white flex flex-col z-40 relative h-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                      <Brain className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">NotebookLM</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/50">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <label className="group block relative cursor-pointer">
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 transition-all duration-300",
                    isUploading ? "bg-white/10" : "hover:bg-white/5 hover:border-white/40"
                  )}>
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <Plus className="w-4 h-4 text-blue-400" />}
                    <span className="text-sm font-semibold">New Source</span>
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
                  </div>
                </label>
              </div>

              <ScrollArea.Root className="flex-1 overflow-hidden px-4">
                <ScrollArea.Viewport className="w-full h-full pb-8">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 px-2">Knowledge Base</h2>
                  <div className="space-y-1">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={cn(
                          "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                          selectedDocId === doc.id ? "bg-blue-600 text-white" : "hover:bg-white/5 text-white/60"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <p className="text-xs font-semibold truncate">{doc.fileName}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea.Viewport>
              </ScrollArea.Root>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area - White & Blue */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative bg-white">
          <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md z-30">
            <div className="flex items-center gap-6">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white border border-slate-100 rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                  <Menu className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-slate-900 leading-none">Neural Retrieval</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status: Operational</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                 onClick={createNewSession}
                 className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-100 rounded-xl"
               >
                 <Plus className="w-3 h-3" /> New Session
               </button>
               <div className="h-8 w-[1px] bg-slate-100" />
            </div>
          </header>

          {/* Scrollable Chat Area */}
          <div className="flex-1 overflow-hidden relative">
            <ScrollArea.Root className="h-full w-full">
              <ScrollArea.Viewport className="h-full w-full custom-scrollbar">
                <div className="max-w-4xl mx-auto px-8 py-10 space-y-10 min-h-full pb-40">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center pt-20 text-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 border border-blue-100">
                        <Sparkles className="w-8 h-8 text-blue-500" />
                      </div>
                      <h1 className="text-2xl font-bold mb-4 text-slate-900">Knowledge Assistant</h1>
                      <p className="text-slate-500 text-sm max-w-sm mx-auto mb-10">
                        Ask questions based on your uploaded documents. I'll provide verified answers with citations.
                      </p>
                      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                        {SUGGESTED_QUERIES.map((q, i) => (
                          <button 
                            key={i} 
                            onClick={() => handleSendMessage(q)}
                            className="p-3 text-[11px] font-bold text-slate-600 bg-white border border-slate-100 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-6 group",
                          msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border",
                          msg.role === "user" ? "bg-slate-900 text-white" : "bg-white border-slate-100 text-blue-600"
                        )}>
                          {msg.role === "user" ? <Plus className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                        </div>
                        <div className={cn(
                          "p-6 rounded-3xl text-sm leading-relaxed max-w-[85%]",
                          msg.role === "user" ? "bg-slate-50 text-slate-800" : "bg-white border border-slate-100 shadow-sm"
                        )}>
                          {msg.role === "assistant" && (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence</span>
                              <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${(msg.confidence || 0.5) * 100}%` }} />
                              </div>
                            </div>
                          )}
                          <div className="prose prose-slate prose-sm font-medium whitespace-pre-wrap">
                            {msg.role === "assistant" ? renderContentWithCitations(msg.content) : msg.content}
                          </div>
                          {msg.sources && (
                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2">
                               <Layers className="w-3.5 h-3.5 text-blue-500" />
                               <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Based on {msg.sources} units</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white border border-slate-100">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      </div>
                      <div className="p-5 px-8 rounded-3xl bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                         Synthesizing Intelligence...
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} className="h-4" />
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className="flex select-none touch-none p-1 bg-transparent transition-colors duration-[160ms] ease-out hover:bg-black/5" orientation="vertical">
                <ScrollArea.Thumb className="flex-1 bg-slate-200 rounded-full relative" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </div>

          {/* Input Footer */}
          <div className="p-8 bg-white border-t border-slate-100">
            <div className="max-w-4xl mx-auto relative group">
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-[2rem] p-2 shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20">
                <div className="pl-6 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={selectedDocId ? "Ask your knowledge base..." : "Add a source to begin"}
                  disabled={!selectedDocId || isLoading}
                  className="flex-1 bg-transparent border-none py-4 px-6 text-sm font-semibold text-slate-900 placeholder-slate-300 focus:ring-0 outline-none"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!selectedDocId || !input.trim() || isLoading}
                  className={cn(
                    "p-4 px-10 rounded-2xl transition-all flex items-center gap-4",
                    input.trim() && !isLoading 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Execute</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-center mt-6 text-[9px] font-black uppercase text-slate-300 tracking-[0.4em]">
              Precision RAG • Gemini Powered
            </p>
          </div>
        </main>
      </div>
    </Tooltip.Provider>
  );
}
