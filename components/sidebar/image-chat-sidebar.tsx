"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import {
  getClusterData,
  getFullSafetyAuditContext,
  getInfrastructureGaps,
  saveClusterData,
  addImageVersion,
} from "@/lib/cluster-storage";

interface ImageChatSidebarProps {
  imageSrc?: string;
  clusterId?: string;
  onImageReplaced?: (imageUrl: string | null) => void;
  onClose?: () => void;
}

export function ImageChatSidebar({
  imageSrc,
  clusterId,
  onImageReplaced,
  onClose,
}: ImageChatSidebarProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previousImageRef = useRef<string | undefined>(imageSrc);
  const imageSrcRef = useRef<string | undefined>(imageSrc);

  // Update ref whenever imageSrc changes to ensure we always use the currently active/selected image
  // This ensures that when user selects a different image from the carousel, subsequent generations
  // will use that selected image as reference, not just the last generated one
  useEffect(() => {
    imageSrcRef.current = imageSrc;
  }, [imageSrc]);

  // Get infrastructure gaps from store - use polling to avoid subscription issues
  const [infrastructureGaps, setInfrastructureGaps] = useState<string[]>(() => 
    clusterId ? getInfrastructureGaps(clusterId) : []
  );
  
  useEffect(() => {
    if (!clusterId) {
      return;
    }
    
    // Poll for changes every 500ms
    const interval = setInterval(() => {
      const currentGaps = getInfrastructureGaps(clusterId);
      setInfrastructureGaps((prev) => {
        // Only update if different
        if (currentGaps.length !== prev.length || currentGaps.some((g, i) => g !== prev[i])) {
          return currentGaps;
        }
        return prev;
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, [clusterId]);

  // Load comprehensive cluster context - refresh when clusterId or cluster data changes
  const [clusterContext, setClusterContext] = useState<string>(() => 
    clusterId ? getFullSafetyAuditContext(clusterId) : ""
  );
  
  useEffect(() => {
    if (!clusterId) {
      return;
    }
    
    const loadContext = () => {
      // Use the comprehensive safety audit context function
      const context = getFullSafetyAuditContext(clusterId);
      setClusterContext(context);
    };

    // Refresh context periodically in case cluster data is updated
    const intervalId = setInterval(loadContext, 2000); // Check every 2 seconds

    return () => clearInterval(intervalId);
  }, [clusterId]);

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
        // Always use the currently active/selected image from the ref
        // This ensures that when user selects a different image from carousel,
        // the next generation will use that selected image, not the last generated one
        imageUrl: getAbsoluteImageUrl(imageSrcRef.current),
        clusterId: clusterId,
        context: clusterContext,
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

  // Track processed tool calls to prevent infinite loops
  const processedToolCallsRef = useRef<Set<string>>(new Set());
  const lastProcessedMessageIdRef = useRef<string | null>(null);

  // Watch for tool completion and trigger image replacement + save to storage
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.id === lastProcessedMessageIdRef.current) {
      return;
    }

    if (lastMessage?.role === "assistant") {
      for (const part of lastMessage.parts || []) {
        if (part.type === "tool-generateImage" && part.state === "output-available") {
          // Create a unique ID for this tool call using message ID and part index
          // Using part index as fallback since toolCallId might not be available
          const partIndex = lastMessage.parts?.indexOf(part) ?? -1;
          const toolCallId = `${lastMessage.id}-${partIndex}`;
          
          // Skip if already processed
          if (processedToolCallsRef.current.has(toolCallId)) {
            continue;
          }
          
          const output = part.output as {
            success: boolean;
            image?: string;
            error?: string;
          };
          if (output.success && output.image && onImageReplaced) {
            // Mark as processed IMMEDIATELY before any state updates to prevent loops
            processedToolCallsRef.current.add(toolCallId);
            lastProcessedMessageIdRef.current = lastMessage.id;
            
            // Call onImageReplaced directly - it's now memoized
            onImageReplaced(output.image);

            // Save image version to local storage
            if (clusterId) {
              // Find the user's prompt that triggered this generation
              const userMessage = messages
                .slice()
                .reverse()
                .find((msg) => msg.role === "user");
              // Extract text from message parts
              const prompt = userMessage?.parts?.find((p) => p.type === "text")?.text || "";

              // Get current image as parent
              const clusterData = getClusterData(clusterId);
              const parentVersionId =
                clusterData?.images.history[clusterData.images.history.length - 1]?.id;

              addImageVersion(clusterId, {
                imageUrl: output.image,
                prompt: prompt,
                parentVersionId: parentVersionId,
              });
              // Note: addImageVersion already updates current image
            }
          }
        }
      }
    }
  }, [messages, onImageReplaced, clusterId]);

  // Track image changes to save original
  useEffect(() => {
    if (
      clusterId &&
      imageSrc &&
      imageSrc !== previousImageRef.current &&
      previousImageRef.current === undefined
    ) {
      // This is the first image (original), save it
      const clusterData = getClusterData(clusterId);
      if (clusterData && !clusterData.images.original) {
        const updatedData = {
          ...clusterData,
          images: {
            ...clusterData.images,
            original: imageSrc,
            current: clusterData.images.current || imageSrc,
          },
        };
        saveClusterData(clusterId, updatedData);
      }
    }
    previousImageRef.current = imageSrc;
  }, [imageSrc, clusterId]);

  // Reset processed tool calls when imageSrc changes (when user selects a different active image)
  useEffect(() => {
    processedToolCallsRef.current.clear();
    lastProcessedMessageIdRef.current = null;
    // Also update the ref immediately to ensure it's in sync
    imageSrcRef.current = imageSrc;
  }, [imageSrc]);

  const handleSend = () => {
    if (!input.trim() || isLoading || !imageSrc) return;
    const currentInput = input.trim();
    setInput("");
    sendMessage({ text: currentInput });
  };

  const handlePillClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
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
                  you&apos;d like to improve it, and I&apos;ll generate a new image showing
                  your vision.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            // Separate parts by type
            const textParts = message.parts?.filter((part) => part.type === "text") || [];
            const toolParts = message.parts?.filter((part) => part.type === "tool-generateImage") || [];
            
            // Find completed tool calls (output-available) to display separately
            const completedToolParts = toolParts.filter(
              (part) => part.state === "output-available"
            );
            // Find in-progress tool calls to display in bubble
            const inProgressToolParts = toolParts.filter(
              (part) => part.state !== "output-available" && part.state !== "output-error"
            );
            
            return (
              <div key={message.id}>
                {/* Render completed tool output as plain text (not in bubble) */}
                {completedToolParts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3 flex-row mb-2"
                  >
                    <div className="flex-1 max-w-[80%] items-start">
                      {completedToolParts.map((part, toolIndex) => {
                        if (part.type === "tool-generateImage" && part.state === "output-available") {
                          const output = part.output as {
                            success: boolean;
                            message?: string;
                            error?: string;
                          };
                          if (output.success) {
                            return (
                              <p
                                key={toolIndex}
                                className="text-sm text-zinc-400 italic"
                              >
                                {output.message || "Image generated successfully"}
                              </p>
                            );
                          } else {
                            return (
                              <p
                                key={toolIndex}
                                className="text-sm text-red-400"
                              >
                                Error: {output.error || "Failed to generate image"}
                              </p>
                            );
                          }
                        }
                        return null;
                      })}
                    </div>
                  </motion.div>
                )}
                
                {/* Render the main message (text parts and in-progress tool parts) */}
                {(textParts.length > 0 || inProgressToolParts.length > 0 || (!completedToolParts.length && !textParts.length && !inProgressToolParts.length)) && (
                  <motion.div
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
                        {textParts.length > 0 && textParts.map((part, index) => (
                          <p
                            key={index}
                            className="whitespace-pre-wrap break-words"
                          >
                            {part.text}
                          </p>
                        ))}
                        {inProgressToolParts.length > 0 && inProgressToolParts.map((part, index) => {
                          if (part.type === "tool-generateImage") {
                            const callId = part.toolCallId || `tool-${index}`;
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
                              case "output-error":
                                return (
                                  <div key={callId} className="text-red-400">
                                    Error: {part.errorText}
                                  </div>
                                );
                              default:
                                return null;
                            }
                          }
                          return null;
                        })}
                        {textParts.length === 0 && inProgressToolParts.length === 0 && (
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
                )}
              </div>
            );
          })}
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
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50 space-y-2">
        {/* Pill Suggestions - Show when infrastructure gaps exist and no messages yet */}
        {infrastructureGaps.length > 0 && messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400 font-medium">Suggested improvements:</p>
            <div 
              className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#3f3f46 transparent',
              }}
            >
              {infrastructureGaps.map((gap, index) => (
                <button
                  key={index}
                  onClick={() => handlePillClick(gap)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0",
                    "border border-zinc-700 bg-zinc-900/50 text-zinc-300",
                    "hover:border-zinc-600 hover:bg-zinc-800 hover:text-white",
                    "active:scale-95"
                  )}
                >
                  {gap}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={imageSrc ? "Write your changes..." : "No image available"}
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
