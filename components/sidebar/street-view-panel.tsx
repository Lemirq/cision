"use client";

import { useState, useRef, useEffect } from "react";
import { RotateCw, Maximize2, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface StreetViewPanelProps {
  lat: number;
  lng: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function StreetViewPanel({ lat, lng }: StreetViewPanelProps) {
  const [heading, setHeading] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Use maximum quality (640x640) for thumbnail and preview
  // Google Street View Static API maximum is 640x640 pixels
  const thumbnailUrl = `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=640x640`;
  const previewUrl = `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=640x640`;

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

  const handleSend = (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on the street view, I can see this intersection has several notable features. The visibility appears to be good, and there are clear road markings.",
        "Looking at the infrastructure, I notice the crosswalk placement and traffic signal configuration. This could impact pedestrian safety.",
        "The intersection geometry and sight lines are important factors for collision risk. Would you like me to analyze specific safety aspects?",
      ];
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: responses[Math.floor(Math.random() * responses.length)],
        },
      ]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isModalOpen]);

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
                className="flex-1 bg-zinc-900 overflow-hidden"
              >
                <img
                  src={previewUrl}
                  alt="Street View"
                  className="w-full h-full object-cover"
                />
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
                          handleSend(prompt);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
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
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-zinc-800 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about this intersection..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9"
                      onClick={() => handleSend()}
                      disabled={!input.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
