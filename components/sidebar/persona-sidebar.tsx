"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, User, PhoneOff, Loader2, Pause, Play } from "lucide-react";
import { useConversation } from "@elevenlabs/react";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";

// Harsh Mehta Agent ID
const HARSH_AGENT_ID = "agent_5201kemqecb1efr8c3wg3efbqgk3";

interface TranscriptMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

export function PersonaSidebar() {
  const [transcriptMessages, setTranscriptMessages] = useState<TranscriptMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [conversationMode, setConversationMode] = useState<"listening" | "speaking" | "idle">("idle");
  const [isPaused, setIsPaused] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const selectedHotspot = useMapStore((state) => state.selectedHotspot);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcriptMessages]);

  const conversation = useConversation({
    // Controlled state for pause functionality
    micMuted: isPaused,
    volume: isPaused ? 0 : 1,
    onConnect: () => {
      setConnectionStatus("connected");
      setConversationMode("listening");
      setIsPaused(false);
    },
    onDisconnect: () => {
      setConnectionStatus("disconnected");
      setConversationMode("idle");
      setIsPaused(false);
    },
    onMessage: (message) => {
      // Handle messages from ElevenLabs - each message is a complete transcript
      if (message.message) {
        const role = message.source === "user" ? "user" : "agent";
        setTranscriptMessages((prev) => [
          ...prev,
          {
            id: `${role}-${Date.now()}`,
            role,
            content: message.message,
            timestamp: new Date(),
          },
        ]);
      }
    },
    onModeChange: (mode) => {
      setConversationMode(mode.mode === "speaking" ? "speaking" : "listening");
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      setConnectionStatus("disconnected");
      setConversationMode("idle");
    },
  });

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const startConversation = useCallback(async () => {
    try {
      setConnectionStatus("connecting");
      // Clear previous transcript
      setTranscriptMessages([]);
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation session with dynamic context based on selected hotspot
      await conversation.startSession({
        agentId: HARSH_AGENT_ID,
        connectionType: "websocket",
        dynamicVariables: selectedHotspot ? {
          intersection_name: selectedHotspot.intersection || selectedHotspot.address,
          collision_count: selectedHotspot.total_count.toString(),
          fatal_count: selectedHotspot.fatal_count.toString(),
          cyclist_count: selectedHotspot.cyclist_count.toString(),
          pedestrian_count: selectedHotspot.pedestrian_count.toString(),
        } : undefined,
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setConnectionStatus("disconnected");
    }
  }, [conversation, selectedHotspot]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setConnectionStatus("disconnected");
      setConversationMode("idle");
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  }, [conversation]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";

  return (
    <motion.aside
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      className="fixed left-16 top-0 z-40 h-screen w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col"
    >
      {/* Header */}
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-lg font-semibold text-white mb-1">Voice Agent</h2>
        <p className="text-xs text-zinc-400">Talk to stakeholders about intersections</p>
      </div>

      {/* Persona Info */}
      <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-green-500/20">
            <div className="p-1 rounded-full bg-green-500">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Harsh Mehta</p>
            <p className="text-xs text-zinc-400">DoorDash Courier & Collision Survivor</p>
          </div>
          {/* Status indicator */}
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500 animate-pulse" : "bg-zinc-600"
          )} />
        </div>
        <p className="text-xs text-zinc-500">
          International student hit by a car while delivering. Shares the human cost of unsafe roads.
        </p>
      </div>

      {/* Transcript Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {transcriptMessages.length === 0 && !isConnected && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="p-4 rounded-full bg-zinc-900 mb-4">
              <Mic className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-400 mb-2">Press the button below to start talking</p>
            <p className="text-xs text-zinc-600">
              Harsh will share his experience about this intersection
            </p>
          </div>
        )}

        {transcriptMessages.length === 0 && isConnected && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="p-4 rounded-full bg-green-500/10 mb-4">
              <Mic className="h-8 w-8 text-green-500 animate-pulse" />
            </div>
            <p className="text-sm text-zinc-300 mb-2">Connected! Start speaking...</p>
            <p className="text-xs text-zinc-500">
              Harsh is listening
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {transcriptMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-medium",
                  message.role === "user" ? "text-blue-400" : "text-green-400"
                )}>
                  {message.role === "user" ? "You" : "Harsh"}
                </span>
                <span className="text-xs text-zinc-600">{formatTime(message.timestamp)}</span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-300">
                {message.content}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div ref={transcriptEndRef} />
      </div>

      {/* Mode Indicator */}
      {isConnected && (
        <div className="px-4 py-2 border-t border-zinc-800/50 bg-zinc-900/30">
          <div className="flex items-center justify-center gap-2">
            {isPaused ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs text-amber-400">Paused — tap play to continue</span>
              </>
            ) : conversationMode === "speaking" ? (
              <>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-green-500 rounded-full"
                      animate={{
                        height: [8, 16, 8],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-green-400">Harsh is speaking...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs text-blue-400">Listening...</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Voice Control Area */}
      <div className="border-t border-zinc-800 p-6">
        <div className="flex flex-col items-center gap-3">
          {/* Button Row */}
          <div className="flex items-center gap-4">
            {/* Pause/Play Button - only show when connected */}
            {isConnected && (
              <motion.button
                onClick={togglePause}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                  "focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-zinc-950",
                  isPaused
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500/50"
                    : "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/50"
                )}
              >
                {isPaused ? (
                  <Play className="h-6 w-6 text-white ml-0.5" />
                ) : (
                  <Pause className="h-6 w-6 text-white" />
                )}
              </motion.button>
            )}

            {/* Main Voice Button */}
            <motion.button
              onClick={isConnected ? endConversation : startConversation}
              disabled={isConnecting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative w-20 h-20 rounded-full flex items-center justify-center transition-all",
                "focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-zinc-950",
                isConnected
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-500/50"
                  : isConnecting
                  ? "bg-zinc-700 cursor-wait"
                  : "bg-green-600 hover:bg-green-700 focus:ring-green-500/50"
              )}
            >
              {isConnecting ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : isConnected ? (
                <PhoneOff className="h-8 w-8 text-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
              
              {/* Pulse animation when connected and not paused */}
              {isConnected && !isPaused && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-500"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </motion.button>
          </div>

          {/* Status Text */}
          <p className="text-sm text-zinc-400 text-center">
            {isConnecting
              ? "Connecting..."
              : isConnected
              ? isPaused
                ? "Paused — mic & speaker muted"
                : "Tap pause to mute, end to disconnect"
              : "Tap to start voice chat"}
          </p>

          {/* Intersection context indicator */}
          {selectedHotspot && !isConnected && (
            <div className="text-xs text-zinc-600 text-center mt-2 px-4">
              <span className="text-zinc-500">Context:</span>{" "}
              {selectedHotspot.intersection || selectedHotspot.address}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
