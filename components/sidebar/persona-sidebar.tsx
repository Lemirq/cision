"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  User,
  PhoneOff,
  Loader2,
  Pause,
  Play,
  Phone,
  Building2,
  HardHat,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useConversation } from "@elevenlabs/react";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";
import { getClusterData, getClusterContext, getFullSafetyAuditContext } from "@/lib/cluster-storage";

// Agent IDs
const AGENTS = {
  harsh: "agent_5201kemqecb1efr8c3wg3efbqgk3",
  olivia: "agent_3201kemvc2vwfazb7hep6d1twse6",
  marcus: "agent_2101kemwd4hcftvr6thmw1dy78jw",
} as const;

interface Persona {
  id: keyof typeof AGENTS;
  name: string;
  role: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const PERSONAS: Persona[] = [
  {
    id: "harsh",
    name: "Harsh Mehta",
    role: "DoorDash Courier & Collision Survivor",
    description:
      "International student hit by a car while delivering. Shares the human cost of unsafe roads.",
    icon: <User className="h-5 w-5 text-white" />,
    color: "green",
  },
  {
    id: "olivia",
    name: "Olivia Chow",
    role: "Mayor of Toronto",
    description:
      "Passionate advocate for road safety. Brings the city's perspective on Vision Zero and policy change.",
    icon: <Building2 className="h-5 w-5 text-white" />,
    color: "blue",
  },
  {
    id: "marcus",
    name: "Marcus Chen",
    role: "Traffic Engineer, P.Eng.",
    description:
      "Technical expert who analyzes intersection design flaws and proposes engineering solutions.",
    icon: <HardHat className="h-5 w-5 text-white" />,
    color: "amber",
  },
];

interface TranscriptMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

// Get color classes based on persona
const getColorClasses = (color: string, type: "bg" | "text" | "bg-light") => {
  const colors: Record<string, Record<string, string>> = {
    green: {
      bg: "bg-green-500",
      text: "text-green-400",
      "bg-light": "bg-green-500/20",
    },
    blue: {
      bg: "bg-blue-500",
      text: "text-blue-400",
      "bg-light": "bg-blue-500/20",
    },
    amber: {
      bg: "bg-amber-500",
      text: "text-amber-400",
      "bg-light": "bg-amber-500/20",
    },
  };
  return colors[color]?.[type] || colors.green[type];
};

interface PersonaSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PersonaSidebar({ isOpen = false, onClose }: PersonaSidebarProps) {
  const [currentView, setCurrentView] = useState<"list" | "conversation">(
    "list"
  );
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [transcriptMessages, setTranscriptMessages] = useState<
    TranscriptMessage[]
  >([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "ringing" | "connecting" | "connected"
  >("disconnected");
  const [conversationMode, setConversationMode] = useState<
    "listening" | "speaking" | "idle"
  >("idle");
  const [isPaused, setIsPaused] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);
  const selectedHotspot = useMapStore((state) => state.selectedHotspot);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcriptMessages]);

  const conversation = useConversation({
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

  const stopRinging = useCallback(() => {
    if (ringAudioRef.current) {
      ringAudioRef.current.pause();
      ringAudioRef.current.currentTime = 0;
    }
  }, []);

  const selectPersona = useCallback((persona: Persona) => {
    setSelectedPersona(persona);
    setCurrentView("conversation");
    setTranscriptMessages([]);
  }, []);

  const goBack = useCallback(async () => {
    // End any active conversation first
    if (connectionStatus !== "disconnected") {
      stopRinging();
      try {
        await conversation.endSession();
      } catch (e) {
        console.error("Error ending session:", e);
      }
    }
    setConnectionStatus("disconnected");
    setConversationMode("idle");
    setTranscriptMessages([]);
    setCurrentView("list");
    setSelectedPersona(null);
  }, [connectionStatus, conversation, stopRinging]);

  const startConversation = useCallback(async () => {
    if (!selectedPersona) return;

    try {
      setTranscriptMessages([]);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setConnectionStatus("ringing");

      ringAudioRef.current = new Audio("/ring.wav");
      ringAudioRef.current.loop = true;
      ringAudioRef.current.volume = 1.0;
      try {
        await ringAudioRef.current.play();
      } catch (err) {
        console.error("Failed to play ring audio:", err);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      stopRinging();
      setConnectionStatus("connecting");

      // Load comprehensive cluster and safety audit context for voice agents
      let dynamicVariables: Record<string, string> | undefined = undefined;
      if (selectedHotspot) {
        const clusterData = getClusterData(selectedHotspot.id);
        // Use comprehensive safety audit context instead of basic context
        const fullContext = getFullSafetyAuditContext(selectedHotspot.id);

        // Basic cluster metadata (for quick reference)
        dynamicVariables = {
          intersection_name:
            selectedHotspot.intersection || selectedHotspot.address,
          collision_count: selectedHotspot.total_count.toString(),
          fatal_count: selectedHotspot.fatal_count.toString(),
          cyclist_count: selectedHotspot.cyclist_count.toString(),
          pedestrian_count: selectedHotspot.pedestrian_count.toString(),
        };

        // Add detailed safety audit information if available
        if (clusterData?.safetyAudit) {
          const audit = clusterData.safetyAudit;
          
          // Calculate average safety score
          const safetyScore = Math.floor(
            (audit.metrics.signage +
              audit.metrics.lighting +
              audit.metrics.crosswalkVisibility +
              audit.metrics.bikeInfrastructure +
              audit.metrics.pedestrianInfrastructure +
              audit.metrics.trafficCalming) /
              6
          );

          dynamicVariables.safety_score = safetyScore.toString();
          dynamicVariables.walkability_score = audit.walkabilityScore.toString();
          
          // Individual metric scores
          dynamicVariables.signage_score = audit.metrics.signage.toString();
          dynamicVariables.lighting_score = audit.metrics.lighting.toString();
          dynamicVariables.crosswalk_visibility_score = audit.metrics.crosswalkVisibility.toString();
          dynamicVariables.bike_infrastructure_score = audit.metrics.bikeInfrastructure.toString();
          dynamicVariables.pedestrian_infrastructure_score = audit.metrics.pedestrianInfrastructure.toString();
          dynamicVariables.traffic_calming_score = audit.metrics.trafficCalming.toString();
          
          // Safety flaws summary
          if (audit.flaws.length > 0) {
            const highSeverityFlaws = audit.flaws.filter(f => f.severity === "high");
            const mediumSeverityFlaws = audit.flaws.filter(f => f.severity === "medium");
            const lowSeverityFlaws = audit.flaws.filter(f => f.severity === "low");
            
            dynamicVariables.total_flaws = audit.flaws.length.toString();
            dynamicVariables.high_severity_flaws = highSeverityFlaws.length.toString();
            dynamicVariables.medium_severity_flaws = mediumSeverityFlaws.length.toString();
            dynamicVariables.low_severity_flaws = lowSeverityFlaws.length.toString();
            
            // List of flaw titles
            dynamicVariables.flaw_titles = audit.flaws.map(f => f.title).join("; ");
          }
          
          // Improvement suggestions summary
          if (audit.suggestions.length > 0) {
            const highPrioritySuggestions = audit.suggestions.filter(s => s.priority === "high");
            dynamicVariables.total_suggestions = audit.suggestions.length.toString();
            dynamicVariables.high_priority_suggestions = highPrioritySuggestions.length.toString();
            dynamicVariables.suggestion_titles = audit.suggestions.map(s => s.title).join("; ");
          }
          
          // Infrastructure gaps
          if (audit.infrastructureGaps.length > 0) {
            dynamicVariables.missing_infrastructure = audit.infrastructureGaps.join(", ");
            dynamicVariables.infrastructure_gap_count = audit.infrastructureGaps.length.toString();
          }
        }

        // Add recent improvements if any
        if (clusterData && clusterData.images.history && clusterData.images.history.length > 0) {
          const recentImprovementsList = clusterData.images.history
            .slice(-5)
            .reverse()
            .map((v) => v.prompt || v.description || "Image improvement")
            .join("; ");
          dynamicVariables.recent_improvements = recentImprovementsList;
          dynamicVariables.has_recent_improvements = "true";
        } else {
          dynamicVariables.has_recent_improvements = "false";
        }

        // Include comprehensive full context
        // Note: ElevenLabs may have limits on dynamic variable values, but we'll include as much as possible
        if (fullContext) {
          // For ElevenLabs, we'll include the full context but also provide a summary
          // The full context might be truncated by ElevenLabs if too long
          dynamicVariables.full_safety_audit_context = fullContext;
          
          // Also provide a condensed version for quick reference
          const condensedContext = fullContext.length > 2000 
            ? fullContext.substring(0, 2000) + "...\n[Full context truncated - see full_safety_audit_context for complete data]"
            : fullContext;
          dynamicVariables.safety_audit_summary = condensedContext;
        }
      }

      await conversation.startSession({
        agentId: AGENTS[selectedPersona.id],
        connectionType: "websocket",
        dynamicVariables,
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      stopRinging();
      setConnectionStatus("disconnected");
    }
  }, [conversation, selectedHotspot, selectedPersona, stopRinging]);

  const endConversation = useCallback(async () => {
    try {
      stopRinging();
      await conversation.endSession();
      setConnectionStatus("disconnected");
      setConversationMode("idle");
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  }, [conversation, stopRinging]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isConnected = connectionStatus === "connected";
  const isRinging = connectionStatus === "ringing";
  const isConnecting = connectionStatus === "connecting";
  const isCallInProgress = isRinging || isConnecting || isConnected;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 200,
          }}
          className="fixed left-16 top-0 z-40 h-screen w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col"
        >
      <AnimatePresence mode="wait">
        {currentView === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="border-b border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    Voice Agents
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Select a stakeholder to talk about intersections
                  </p>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="ml-2 p-2 hover:bg-zinc-800 rounded-lg transition-colors flex items-center"
                    title="Close"
                  >
                    <ChevronLeft className="h-5 w-5 text-zinc-400" />
                    <ChevronLeft className="h-5 w-5 text-zinc-400 -ml-2" />
                  </button>
                )}
              </div>
            </div>

            {/* Agent List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {PERSONAS.map((persona) => (
                <motion.button
                  key={persona.id}
                  onClick={() => selectPersona(persona)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        getColorClasses(persona.color, "bg-light")
                      )}
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded-full",
                          getColorClasses(persona.color, "bg")
                        )}
                      >
                        {persona.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">
                          {persona.name}
                        </p>
                        <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                      </div>
                      <p
                        className={cn(
                          "text-xs mb-2",
                          getColorClasses(persona.color, "text")
                        )}
                      >
                        {persona.role}
                      </p>
                      <p className="text-xs text-zinc-500 line-clamp-2">
                        {persona.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Context indicator */}
            {selectedHotspot && (
              <div className="border-t border-zinc-800 p-4">
                <p className="text-xs text-zinc-500">
                  <span className="text-zinc-400">Current context:</span>{" "}
                  {selectedHotspot.intersection || selectedHotspot.address}
                </p>
              </div>
            )}
          </motion.div>
        ) : selectedPersona ? (
          <motion.div
            key="conversation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full"
          >
            {/* Header with Back Button */}
            <div className="border-b border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={goBack}
                  className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-zinc-400" />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">
                    {selectedPersona.name}
                  </h2>
                  <p
                    className={cn(
                      "text-xs",
                      getColorClasses(selectedPersona.color, "text")
                    )}
                  >
                    {selectedPersona.role}
                  </p>
                </div>
                {/* Status indicator */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected
                      ? "bg-green-500 animate-pulse"
                      : isRinging
                        ? "bg-amber-500 animate-pulse"
                        : isConnecting
                          ? "bg-blue-500 animate-pulse"
                          : "bg-zinc-600"
                  )}
                />
              </div>
            </div>

            {/* Transcript Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcriptMessages.length === 0 && !isCallInProgress && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div
                    className={cn(
                      "p-4 rounded-full mb-4",
                      getColorClasses(selectedPersona.color, "bg-light")
                    )}
                  >
                    <Phone
                      className={cn(
                        "h-8 w-8",
                        getColorClasses(selectedPersona.color, "text")
                      )}
                    />
                  </div>
                  <p className="text-sm text-zinc-400 mb-2">
                    Press the button below to call
                  </p>
                  <p className="text-xs text-zinc-600">
                    {selectedPersona.name.split(" ")[0]} is ready to talk
                  </p>
                </div>
              )}

              {transcriptMessages.length === 0 && isRinging && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <motion.div
                    className="p-4 rounded-full bg-amber-500/10 mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Phone className="h-8 w-8 text-amber-500" />
                  </motion.div>
                  <p className="text-sm text-amber-300 mb-2">
                    Calling {selectedPersona.name.split(" ")[0]}...
                  </p>
                  <p className="text-xs text-zinc-500">Ring ring...</p>
                </div>
              )}

              {transcriptMessages.length === 0 && isConnecting && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="p-4 rounded-full bg-blue-500/10 mb-4">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                  <p className="text-sm text-blue-300 mb-2">
                    {selectedPersona.name.split(" ")[0]} is picking up...
                  </p>
                  <p className="text-xs text-zinc-500">Connecting...</p>
                </div>
              )}

              {transcriptMessages.length === 0 && isConnected && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div
                    className={cn(
                      "p-4 rounded-full mb-4",
                      getColorClasses(selectedPersona.color, "bg-light")
                    )}
                  >
                    <Mic
                      className={cn(
                        "h-8 w-8 animate-pulse",
                        getColorClasses(selectedPersona.color, "text")
                      )}
                    />
                  </div>
                  <p className="text-sm text-zinc-300 mb-2">
                    Connected! Start speaking...
                  </p>
                  <p className="text-xs text-zinc-500">
                    {selectedPersona.name.split(" ")[0]} is listening
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
                      <span
                        className={cn(
                          "text-xs font-medium",
                          message.role === "user"
                            ? "text-blue-400"
                            : getColorClasses(selectedPersona.color, "text")
                        )}
                      >
                        {message.role === "user"
                          ? "You"
                          : selectedPersona.name.split(" ")[0]}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {formatTime(message.timestamp)}
                      </span>
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
                      <span className="text-xs text-amber-400">
                        Paused — tap play to continue
                      </span>
                    </>
                  ) : conversationMode === "speaking" ? (
                    <>
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className={cn(
                              "w-1 rounded-full",
                              getColorClasses(selectedPersona.color, "bg")
                            )}
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
                      <span
                        className={cn(
                          "text-xs",
                          getColorClasses(selectedPersona.color, "text")
                        )}
                      >
                        {selectedPersona.name.split(" ")[0]} is speaking...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-xs text-blue-400">
                        Listening...
                      </span>
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
                  {/* Pause/Play Button */}
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
                    onClick={
                      isCallInProgress ? endConversation : startConversation
                    }
                    disabled={isConnecting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative w-20 h-20 rounded-full flex items-center justify-center transition-all",
                      "focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-zinc-950",
                      isCallInProgress
                        ? "bg-red-600 hover:bg-red-700 focus:ring-red-500/50"
                        : "bg-green-600 hover:bg-green-700 focus:ring-green-500/50"
                    )}
                  >
                    {isRinging ? (
                      <Phone className="h-8 w-8 text-white animate-pulse" />
                    ) : isConnecting ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : isConnected ? (
                      <PhoneOff className="h-8 w-8 text-white" />
                    ) : (
                      <Phone className="h-8 w-8 text-white" />
                    )}

                    {isRinging && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-amber-500"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.6, 0, 0.6],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}

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
                  {isRinging
                    ? "Ringing... tap to cancel"
                    : isConnecting
                      ? "Connecting..."
                      : isConnected
                        ? isPaused
                          ? "Paused — mic & speaker muted"
                          : "Tap pause to mute, end to disconnect"
                        : `Tap to call ${selectedPersona.name.split(" ")[0]}`}
                </p>

                {/* Intersection context */}
                {selectedHotspot && !isCallInProgress && (
                  <div className="text-xs text-zinc-600 text-center mt-2 px-4">
                    <span className="text-zinc-500">Context:</span>{" "}
                    {selectedHotspot.intersection || selectedHotspot.address}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
