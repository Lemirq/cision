"use client";

import { useState, useRef, useEffect } from "react";
import { RotateCw, Maximize2, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface StreetViewPanelProps {
  lat: number;
  lng: number;
}

export function StreetViewPanel({ lat, lng }: StreetViewPanelProps) {
  const [heading, setHeading] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Use maximum quality (640x640) for thumbnail and preview
  // Google Street View Static API maximum is 640x640 pixels
  const thumbnailUrl = `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=640x640`;
  const previewUrl = `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=640x640`;
  
  // Get the current image URL (edited or original)
  const currentImageUrl = editedImageUrl || previewUrl;

  // Use AI SDK's useChat hook for agent integration
  // Use prepareSendMessagesRequest to ensure imageUrl is always current
  const { messages, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agent/chat",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages,
          imageUrl: previewUrl,
        },
      }),
    }),
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Check if agent is loading by checking if last message is from assistant and incomplete
  const isAgentLoading = messages.length > 0 && 
    messages[messages.length - 1]?.role === "assistant" &&
    (messages[messages.length - 1] as any).status === "in-progress";

  const rotateView = () => {
    setIsLoading(true);
    setHasError(false);
    setHeading((prev) => (prev + 90) % 360);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  const handleSendPrompt = (prompt: string) => {
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: prompt }],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isModalOpen]);

  // Extract edited images from messages as they stream
  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === "assistant") {
        // Check message parts for tool invocations
        if (message.parts) {
          for (const part of message.parts) {
            // Tool invocations in AI SDK 6
            if (part.type === "tool-invocation") {
              const toolInvocation = (part as any).toolInvocation;
              if (toolInvocation?.toolName === "edit_image" && toolInvocation.result) {
                const result = toolInvocation.result as { editedImageBase64?: string };
                if (result.editedImageBase64) {
                  setEditedImageUrl(result.editedImageBase64);
                }
              }
            }
            // Check for tool result directly
            if ((part as any).result?.editedImageBase64) {
              setEditedImageUrl((part as any).result.editedImageBase64);
            }
          }
        }
        // Fallback: check message data directly
        const msgData = message as any;
        if (msgData.toolInvocations) {
          msgData.toolInvocations.forEach((tool: any) => {
            if (tool.toolName === "edit_image" && tool.result?.editedImageBase64) {
              setEditedImageUrl(tool.result.editedImageBase64);
            }
          });
        }
      }
    });
  }, [messages]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  return (
    <>
      <div className="relative overflow-hidden rounded-lg">
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse z-10" />
        )}

        {hasError ? (
          <div className="flex items-center justify-center bg-zinc-800 text-zinc-400 h-48">
            <div className="text-center p-4">
              <p className="text-sm">Street View not available</p>
              <p className="text-xs text-zinc-500 mt-1">for this location</p>
            </div>
          </div>
        ) : (
          <img
            ref={imageRef}
            src={thumbnailUrl}
            alt="Street View"
            className="w-full h-64 object-cover cursor-pointer"
            onLoad={() => setIsLoading(false)}
            onError={handleImageError}
            onClick={handleImageClick}
          />
        )}

        <div className="absolute bottom-3 right-3 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={rotateView}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          {!hasError && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={handleExpand}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-[95vw] h-[90vh] bg-zinc-950 border border-zinc-800 rounded-lg flex overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Section - Left Side */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex-1 bg-zinc-900 overflow-hidden relative"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageUrl}
                    src={currentImageUrl}
                    alt={editedImageUrl ? "Edited Street View" : "Street View"}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                </AnimatePresence>
                {isAgentLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-zinc-200 text-sm">Editing image...</div>
                  </div>
                )}
                {editedImageUrl && (
                  <button
                    onClick={() => setEditedImageUrl(null)}
                    className="absolute top-4 left-4 px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                  >
                    Show Original
                  </button>
                )}
              </motion.div>

              {/* Chatbot Section - Right Side */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="w-[400px] border-l border-zinc-800 flex flex-col bg-zinc-950"
              >
                {/* Chat Header */}
                <div className="border-b border-zinc-800 p-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zinc-200">Re-Define this Intersection</h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-400"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sample Prompts */}
                <div className="border-b border-zinc-800 p-4 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Add protected bike lanes",
                      "Improve pedestrian safety",
                      "Add traffic calming measures",
                      "Redesign for accessibility"
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSendPrompt(prompt);
                        }}
                        disabled={isAgentLoading}
                        className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col ${
                        message.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-800 text-zinc-200"
                        }`}
                      >
                        {message.parts?.map((part, idx) => {
                          if (part.type === "text") {
                            return (
                              <p key={idx} className="text-sm leading-relaxed whitespace-pre-wrap">
                                {part.text}
                              </p>
                            );
                          }
                          return null;
                        }) || (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {(message as any).content || ""}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAgentLoading && (
                    <div className="flex items-start">
                      <div className="bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
                          <span className="text-sm text-zinc-400">Agent is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-start">
                      <div className="bg-red-900/50 border border-red-800 text-red-200 rounded-lg px-3 py-2 max-w-[85%]">
                        <p className="text-sm font-medium">Error</p>
                        <p className="text-xs mt-1 text-red-300">
                          {error.message || "Failed to communicate with agent. Check console for details."}
                        </p>
                        <p className="text-xs mt-1 text-red-400">
                          Check server logs and ensure GOOGLE_GENERATIVE_AI_API_KEY is set.
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-zinc-800 p-4">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask to edit this intersection..."
                      disabled={isAgentLoading}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9"
                      disabled={!input.trim() || isAgentLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
