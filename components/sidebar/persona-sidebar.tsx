"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Mic, Send, User, Building2, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface Persona {
  id: string;
  name: string;
  role: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const PERSONAS: Persona[] = [
  {
    id: "cyclist",
    name: "Marcus Chen",
    role: "Cyclist & Accident Survivor",
    icon: <User className="h-5 w-5" />,
    color: "bg-green-500",
    description: "Involved in a collision at this intersection. Shares personal safety concerns.",
  },
  {
    id: "mp",
    name: "Sarah Williams",
    role: "Member of Parliament",
    icon: <Building2 className="h-5 w-5" />,
    color: "bg-blue-500",
    description: "Focuses on policy implications and funding for safety improvements.",
  },
  {
    id: "engineer",
    name: "James Okonkwo",
    role: "Civil Engineer",
    icon: <HardHat className="h-5 w-5" />,
    color: "bg-amber-500",
    description: "Specializes in urban traffic safety and infrastructure feasibility.",
  },
];

interface Message {
  id: string;
  role: "user" | "persona";
  content: string;
}

const welcomeMessages: Record<string, string> = {
  cyclist: "Hi, I'm Marcus Chen. I was hit by a car at this intersection last year. What would you like to know about safety here?",
  mp: "Hello, I'm Sarah Williams. As a Member of Parliament, I'm focused on improving infrastructure funding for safer intersections. How can I help?",
  engineer: "Hi there, I'm James Okonkwo, a civil engineer specializing in traffic safety. What questions do you have about this intersection's design?",
};

export function PersonaSidebar() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "persona",
      content: welcomeMessages[PERSONAS[0].id],
    },
  ]);
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Animate chat when switching personas
  const handlePersonaChange = (persona: Persona) => {
    setSelectedPersona(persona);
    // Clear messages and show new welcome message with animation
    setMessages([
      {
        id: Date.now().toString(),
        role: "persona",
        content: welcomeMessages[persona.id],
      },
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    
    setTimeout(() => {
      const responses: Record<string, string> = {
        cyclist: "I understand your concern. As someone who's actually been through this, I can tell you the visibility here is terrible. Cars come around the corner too fast, and there's no protected space for cyclists.",
        mp: "That's an important question. From a policy perspective, we've allocated $2M for intersection improvements this year, but we need data-driven evidence to prioritize specific locations like this one.",
        engineer: "From a technical standpoint, this intersection doesn't meet current MUTCD standards. The sight lines are obstructed, and the crosswalk markings have faded significantly. A redesign would require curb extensions and improved lighting.",
      };
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "persona",
          content: responses[selectedPersona.id],
        },
      ]);
    }, 1000);
  };

  const toggleVoice = () => {
    setIsSpeaking(!isSpeaking);
    if (!isSpeaking) {
      const utterance = new SpeechSynthesisUtterance(
        messages[messages.length - 1]?.content || "Hello, I'm ready to talk about this intersection."
      );
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
      utterance.onend = () => setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <motion.aside
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      className="fixed left-16 top-0 z-40 h-screen w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden"
    >
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-lg font-semibold text-white mb-1">Voice Chat</h2>
        <p className="text-xs text-zinc-400">Talk to stakeholders about this intersection</p>
      </div>

      <div className="border-b border-zinc-800 p-4 space-y-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Select Persona</p>
        <div className="space-y-2">
          {PERSONAS.map((persona) => (
            <motion.button
              key={persona.id}
              onClick={() => handlePersonaChange(persona)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                selectedPersona.id === persona.id
                  ? "bg-zinc-800 border border-zinc-700"
                  : "hover:bg-zinc-900"
              )}
            >
              <motion.div
                className={cn("p-2 rounded-full", persona.color + "/20")}
                animate={{
                  scale: selectedPersona.id === persona.id ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <div className={cn("p-1 rounded-full", persona.color)}>
                  {persona.icon}
                </div>
              </motion.div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-white">{persona.name}</p>
                <p className="text-xs text-zinc-400">{persona.role}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPersona.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-b border-zinc-800 p-4 bg-zinc-900/50"
            style={{ willChange: "transform, opacity" }}
          >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className={cn("p-2 rounded-full", selectedPersona.color + "/20")}
              initial={{ scale: 0.8, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.4, ease: "backOut" }}
            >
              <div className={cn("p-1 rounded-full", selectedPersona.color)}>
                {selectedPersona.icon}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <p className="text-sm font-medium text-white">{selectedPersona.name}</p>
              <p className="text-xs text-zinc-400">{selectedPersona.role}</p>
            </motion.div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-xs text-zinc-500"
          >
            {selectedPersona.description}
          </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ 
                opacity: 0, 
                y: -20, 
                scale: 0.95,
                transition: { duration: 0.2 }
              }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                ease: "easeOut"
              }}
              className={cn(
                "flex flex-col",
                message.role === "user" ? "items-end" : "items-start"
              )}
            >
              <motion.div
                className={cn(
                  "max-w-[85%] rounded-lg p-3",
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-200"
                )}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm">{message.content}</p>
              </motion.div>
              {message.role === "persona" && (
                <motion.button
                  onClick={toggleVoice}
                  className="mt-1 p-1 hover:bg-zinc-800 rounded"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Volume2 className={cn("h-4 w-4", isSpeaking ? "text-green-400" : "text-zinc-500")} />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t border-zinc-800 p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => setIsListening(!isListening)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors",
              isListening ? "bg-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            )}
          >
            <Mic className="h-4 w-4" />
            {isListening ? "Listening..." : "Hold to speak"}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
