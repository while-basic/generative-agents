import React, { useState, useRef, useEffect } from "react";
import { Agent } from "generative-agents";
import { XCircle, Trash2, Send, Settings } from "lucide-react";
import AgentEditor from "./components/AgentEditor";
import { AgentDetails } from "./types/Agent";
import { agentService } from "./services/agentService";

type AgentChatProps = {
  agent: Agent | undefined;
  closeChat: () => void;
  onUpdateAgent?: (agentDetails: AgentDetails) => void;
  initialAgentDetails?: AgentDetails;
};

type Message = {
  sender: "user" | "agent";
  content: string;
  timestamp: Date;
  status: "sending" | "sent" | "error";
};

const MAX_MESSAGE_LENGTH = 500;

const AgentChat: React.FC<AgentChatProps> = ({ agent, closeChat, onUpdateAgent, initialAgentDetails }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      sender: "agent", 
      content: "Welcome! How can I help you today?",
      timestamp: new Date(),
      status: "sent" as const
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAgentReplying, setIsAgentReplying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const defaultAgentDetails: AgentDetails = {
    id: "lucy_miller",
    name: "Lucy Miller",
    age: 16,
    currentLocation: "miller_dinning",
    visualRange: 8,
    attention: 8,
    retention: 8,
    background: "High school student, helps out at the restaurant after school. Has a younger brother Mike. Parents are Thomas and Susan Miller, the owners of Taiki seafood restaurant.",
    currentGoal: "To get accepted into a top college.",
    lifestyle: "attends school, studies, helps at the restaurant, spends time with friends",
    innateTendencies: ["Intelligent", "Curious", "Kind"],
    learnedTendencies: ["Studious", "Responsible", "Helpful"],
    values: ["Education", "Family", "Friendship"],
    emoji: "🥙"
  };

  // Initialize agent details from storage or props
  const [agentDetails, setAgentDetails] = useState<AgentDetails>(() => {
    if (initialAgentDetails) {
      // If we have initial details from props, use those
      const storedAgent = agentService.getAgent(initialAgentDetails.id);
      return storedAgent || initialAgentDetails;
    }
    // Fallback to default agent if no initial details provided
    const storedAgent = agentService.getAgent(defaultAgentDetails.id);
    return storedAgent || defaultAgentDetails;
  });

  // Update agent details when initialAgentDetails prop changes
  useEffect(() => {
    if (initialAgentDetails) {
      const storedAgent = agentService.getAgent(initialAgentDetails.id);
      setAgentDetails(storedAgent || initialAgentDetails);
      // Reset messages for new agent
      setMessages([{ 
        sender: "agent", 
        content: `Hello! I'm ${initialAgentDetails.name}. How can I help you today?`,
        timestamp: new Date(),
        status: "sent" as const
      }]);
    }
  }, [initialAgentDetails?.id]);

  const handleSaveAgentDetails = (updatedAgent: AgentDetails) => {
    agentService.saveAgent(updatedAgent);
    setAgentDetails(updatedAgent);
    setIsEditing(false);
    if (onUpdateAgent) {
      onUpdateAgent(updatedAgent);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      const newMessage: Message = {
        sender: "user",
        content: inputMessage.trim(),
        timestamp: new Date(),
        status: "sending" as const
      };

      setMessages(prev => [...prev, newMessage]);
      setInputMessage("");

      if (agent) {
        setIsAgentReplying(true);
        try {
          const agentReply = await agent.replyWithContext(inputMessage.trim(), ["user"]);
          setMessages(prev => [
            ...prev.map(m => m === newMessage ? { ...m, status: "sent" as const } : m),
            {
              sender: "agent",
              content: agentReply,
              timestamp: new Date(),
              status: "sent" as const
            }
          ]);
        } catch (error) {
          setMessages(prev => 
            prev.map(m => m === newMessage ? { ...m, status: "error" as const } : m)
          );
        } finally {
          setIsAgentReplying(false);
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      sender: "agent",
      content: "Chat history cleared. How can I help you?",
      timestamp: new Date(),
      status: "sent" as const
    }]);
    setShowClearConfirm(false);
  };

  return (
    <div className='fixed top-0 right-0 m-4 w-1/3 h-[calc(100vh-2rem)] bg-white z-[1] rounded-lg shadow-md flex flex-col'>
      <div className='px-4 py-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <p className='text-2xl font-bold'>{agentDetails.emoji} {agentDetails.name}</p>
            <span className='inline-block ml-2 bg-green-500 rounded-full w-2 h-2'></span>
          </div>
          <div className='flex items-center gap-2'>
            <Settings
              className='cursor-pointer text-gray-400 hover:text-gray-600 transition duration-300'
              onClick={() => setShowSettings(!showSettings)}
            />
            <Trash2
              className='cursor-pointer text-gray-400 hover:text-red-500 transition duration-300'
              onClick={() => setShowClearConfirm(true)}
            />
            <XCircle
              className='cursor-pointer text-gray-400 hover:text-gray-500 transition duration-300'
              onClick={closeChat}
            />
          </div>
        </div>
        <p className='text-sm text-gray-500'>This is your conversation with {agentDetails.name}</p>
      </div>

      {showSettings && (
        <div className='absolute top-0 left-[-100%] w-full h-full bg-white rounded-lg shadow-lg overflow-y-auto'>
          <AgentEditor
            agent={agentDetails}
            onSave={handleSaveAgentDetails}
            onCancel={() => setIsEditing(false)}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
          />
        </div>
      )}

      {showClearConfirm && (
        <div className='absolute top-16 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200'>
          <p className='text-sm mb-3'>Clear chat history?</p>
          <div className='flex gap-2'>
            <button
              className='px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600'
              onClick={clearChat}
            >
              Clear
            </button>
            <button
              className='px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300'
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className='flex-1 overflow-y-auto px-4 py-4 space-y-4'>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[70%] ${message.sender === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.sender === "user"
                    ? "bg-[#F9E4CB] text-[#5F472B]"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className='whitespace-pre-wrap break-words'>{message.content}</p>
              </div>
              <div className='flex items-center gap-1 mt-1 text-xs text-gray-500'>
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.sender === "user" && (
                  <span>
                    {message.status === "sending" && "•••"}
                    {message.status === "sent" && "✓"}
                    {message.status === "error" && "⚠️"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {isAgentReplying && (
          <div className='flex justify-start'>
            <div className='bg-gray-100 rounded-lg px-4 py-2'>
              <div className='flex gap-1'>
                <span className='dot bg-gray-500 w-2 h-2 rounded-full'></span>
                <span className='dot bg-gray-500 w-2 h-2 rounded-full'></span>
                <span className='dot bg-gray-500 w-2 h-2 rounded-full'></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className='px-4 py-4 border-t border-gray-200'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-2'>
              <textarea
                className='flex-1 border border-gray-300 rounded-lg p-2 resize-none'
                placeholder='Type your message...'
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
              <button
                type='submit'
                className='bg-[#F9E4CB] text-[#5F472B] font-medium rounded-lg p-2 h-[42px] w-[42px] flex items-center justify-center hover:bg-[#f5d4b1] transition-colors disabled:opacity-50'
                disabled={!inputMessage.trim() || isAgentReplying}
              >
                <Send size={20} />
              </button>
            </div>
            <div className='flex justify-between text-xs text-gray-500'>
              <span>{inputMessage.length}/{MAX_MESSAGE_LENGTH}</span>
              <span>{isAgentReplying ? 'Agent is typing...' : 'Press Enter to send, Shift + Enter for new line'}</span>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .dot {
          animation: blink 1.4s linear infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default AgentChat;
