"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

export function PersonaSidebar() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "persona",
      content: `Hi, I'm ${PERSONAS[0].name}. I was hit by a car at this intersection last year. What would you like to know about safety here?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

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
      className="fixed left-16 top-0 z-40 h-screen w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col"
    >
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-lg font-semibold text-white mb-1">Voice Chat</h2>
        <p className="text-xs text-zinc-400">Talk to stakeholders about this intersection</p>
      </div>

      <div className="border-b border-zinc-800 p-4 space-y-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Select Persona</p>
        <div className="space-y-2">
          {PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setSelectedPersona(persona)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                selectedPersona.id === persona.id
                  ? "bg-zinc-800 border border-zinc-700"
                  : "hover:bg-zinc-900"
              )}
            >
              <div className={cn("p-2 rounded-full", persona.color + "/20")}>
                <div className={cn("p-1 rounded-full", persona.color)}>
                  {persona.icon}
                </div>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-white">{persona.name}</p>
                <p className="text-xs text-zinc-400">{persona.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn("p-2 rounded-full", selectedPersona.color + "/20")}>
            <div className={cn("p-1 rounded-full", selectedPersona.color)}>
              {selectedPersona.icon}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{selectedPersona.name}</p>
            <p className="text-xs text-zinc-400">{selectedPersona.role}</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500">{selectedPersona.description}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg p-3",
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-200"
              )}
            >
              <p className="text-sm">{message.content}</p>
            </div>
            {message.role === "persona" && (
              <button
                onClick={toggleVoice}
                className="mt-1 p-1 hover:bg-zinc-800 rounded"
              >
                <Volume2 className={cn("h-4 w-4", isSpeaking ? "text-green-400" : "text-zinc-500")} />
              </button>
            )}
          </div>
        ))}
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
