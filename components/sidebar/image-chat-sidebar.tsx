"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";

interface ImageChatSidebarProps {
  imageSrc?: string;
  onImageReplaced?: (imageUrl: string | null) => void;
  onClose?: () => void;
}

export function ImageChatSidebar({ imageSrc, onImageReplaced, onClose }: ImageChatSidebarProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Convert imageSrc to absolute URL if needed
  const getAbsoluteImageUrl = (src?: string): string | undefined => {
    if (!src) return undefined;
    if (src.startsWith("data:")) return src; // Data URL - use as is
    if (src.startsWith("http")) return src; // Absolute URL - use as is
    // Relative URL - convert to absolute
    return `${typeof window !== "undefined" ? window.location.origin : ""}${src}`;
  };

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        imageUrl: getAbsoluteImageUrl(imageSrc),
      }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const isLoading = status === "streaming" || status === "submitted";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Track processed image URLs to prevent duplicates
  const processedImagesRef = useRef<Set<string>>(new Set());
  const lastProcessedMessageIdRef = useRef<string | null>(null);

  // Watch for tool completion and trigger image replacement
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.id === lastProcessedMessageIdRef.current) {
      return;
    }

    if (lastMessage?.role === "assistant") {
      for (const part of lastMessage.parts || []) {
        if (part.type === "tool-generateImage" && part.state === "output-available") {
          const output = part.output as { success: boolean; image?: string; error?: string };
          if (output.success && output.image && onImageReplaced) {
            // Check if we've already processed this image
            if (!processedImagesRef.current.has(output.image)) {
              processedImagesRef.current.add(output.image);
              lastProcessedMessageIdRef.current = lastMessage.id;
              onImageReplaced(output.image);
            }
          }
        }
      }
    }
  }, [messages, onImageReplaced]);

  // Reset processed images when imageSrc changes
  useEffect(() => {
    processedImagesRef.current.clear();
    lastProcessedMessageIdRef.current = null;
  }, [imageSrc]);

  const handleSend = () => {
    if (!input.trim() || isLoading || !imageSrc) return;
    const currentInput = input.trim();
    setInput("");
    sendMessage({ text: currentInput });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 200,
      }}
      className="fixed right-0 top-0 h-full w-[400px] bg-zinc-950 border-l border-zinc-800 flex flex-col z-[60] pointer-events-auto"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">AI Agent</h3>
            <p className="text-xs text-zinc-400">Redefine this Intersection</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-zinc-800 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 flex-row"
          >
            <div className="flex-1 max-w-[80%] items-start">
              <div className="rounded-lg px-3 py-2 text-sm bg-zinc-800 text-zinc-200">
                <p className="whitespace-pre-wrap break-words">
                  Hello! I can help you redefine this intersection. Describe how
                  you'd like to improve it, and I'll generate a new image showing
                  your vision.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "flex-1 max-w-[80%]",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary/20 text-white"
                      : "bg-zinc-800 text-zinc-200"
                  )}
                >
                  {message.parts?.length ? (
                    message.parts.map((part, index) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <p
                            key={index}
                            className="whitespace-pre-wrap break-words"
                          >
                            {part.text}
                          </p>
                        );
                      case "tool-generateImage": {
                        const callId = part.toolCallId;
                        switch (part.state) {
                          case "input-streaming":
                            return (
                              <div key={callId} className="text-zinc-400">
                                Preparing to generate image...
                              </div>
                            );
                          case "input-available": {
                            const input = part.input as { prompt: string };
                            return (
                              <div key={callId} className="text-zinc-400">
                                Generating image: {input.prompt}
                              </div>
                            );
                          }
                          case "output-available": {
                            const output = part.output as {
                              success: boolean;
                              message?: string;
                              error?: string;
                            };
                            return (
                              <div key={callId} className="text-zinc-200">
                                {output.success
                                  ? output.message ||
                                    "Image generated successfully! The new image has replaced the street view."
                                  : `Error: ${output.error || "Failed to generate image"}`}
                              </div>
                            );
                          }
                          case "output-error":
                            return (
                              <div key={callId} className="text-red-400">
                                Error: {part.errorText}
                              </div>
                            );
                        }
                        break;
                      }
                    }
                    })
                  ) : (
                    <p className="whitespace-pre-wrap break-words">
                      {message.role === "assistant"
                        ? "Hello! I can help you redefine this intersection. Describe how you'd like to improve it, and I'll generate a new image showing your vision."
                        : ""}
                    </p>
                  )}
                </div>
                <span className="text-xs text-zinc-500 mt-1 block">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="flex-1">
              <div className="bg-zinc-800 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  <span className="text-zinc-400">Thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={imageSrc ? "Describe how to redefine this intersection..." : "No image available"}
            className="flex-1 resize-none rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent max-h-32"
            rows={1}
            style={{
              minHeight: "40px",
              maxHeight: "128px",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !imageSrc}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              input.trim() && !isLoading && imageSrc
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
