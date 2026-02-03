import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage, AuditEvent } from '../types';
import { sendMessageToCoFiduciary } from '../services/geminiService';

interface AICoFiduciaryProps {
  addAuditEvent?: (event: Omit<AuditEvent, 'hash' | 'previousHash' | 'timestamp'>) => void;
}

export const AICoFiduciary: React.FC<AICoFiduciaryProps> = ({ addAuditEvent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Identity verified. I am your E24 Co-Fiduciary. The Lattice is secure, and the Strike protocols are active. How shall we proceed with asset administration today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // AUDIT LOGGING: User Input
    if (addAuditEvent) {
        addAuditEvent({
            id: `CHAT-${userMessage.id}`,
            actor: 'USER',
            action: 'CHAT_INTERACTION',
            details: `User Query: ${userMessage.text.substring(0, 50)}...`,
            rationale: 'Fiduciary Consultation',
            metadata: { 
                schema: '1.0.0',
                sourceType: 'USER_INPUT',
                sourceIdentity: `MSG-${userMessage.id}`,
                context: { fullLength: userMessage.text.length, sessionState: 'ACTIVE' }
            }
        });
    }

    // Prepare history for API (last 10 messages max context)
    const history = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));
    
    const responseText = await sendMessageToCoFiduciary(userMessage.text, history);

    const modelMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    // AUDIT LOGGING: AI Response
    if (addAuditEvent) {
        addAuditEvent({
            id: `CHAT-${modelMessage.id}`,
            actor: 'AI_CO_FIDUCIARY',
            action: 'CHAT_INTERACTION',
            details: `System Response: ${modelMessage.text.substring(0, 50)}...`,
            rationale: 'Deterministic Output Generation',
            metadata: { 
                schema: '1.0.0',
                sourceType: 'AI_GENERATED',
                processTool: 'Ollama-Llama3.2',
                context: { temperature: 0.3 }
            }
        });
    }

    setMessages(prev => [...prev, modelMessage]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-e24-void text-gray-300">
      <div className="p-6 border-b border-e24-border flex justify-between items-center bg-e24-lattice/50 backdrop-blur">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Bot className="text-e24-node" /> E24 Co-Fiduciary
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Automated Administrative Interface</p>
        </div>
        <div className="text-xs font-mono text-e24-success border border-e24-success/30 bg-e24-success/10 px-2 py-1 rounded">
          LINK ESTABLISHED
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-e24-node/20 text-e24-node' : 'bg-e24-flux/20 text-e24-flux'}`}>
              {msg.role === 'model' ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className={`max-w-[80%] rounded-lg p-4 text-sm leading-relaxed ${
              msg.role === 'model' 
                ? 'bg-e24-lattice border border-e24-border text-gray-300' 
                : 'bg-e24-flux/10 border border-e24-flux/20 text-white'
            }`}>
              {msg.text}
              <div className="mt-2 text-[10px] text-gray-600 font-mono uppercase text-right opacity-70 flex items-center justify-end gap-2">
                <span>{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <span className="text-gray-700 mx-1">//</span>
                <span>{msg.role === 'model' ? 'DETERMINISTIC' : 'HUMAN INPUT'}</span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-e24-node/20 text-e24-node flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles size={18} />
            </div>
            <div className="bg-e24-lattice border border-e24-border rounded-lg p-4 text-sm text-gray-400">
              <span className="animate-pulse">Processing Fiduciary Logic...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-e24-border bg-e24-lattice/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Issue a command to the Co-Fiduciary..."
            className="flex-1 bg-e24-void border border-e24-border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-e24-node transition-colors font-mono text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="bg-e24-node text-black font-bold px-6 py-3 rounded-lg hover:bg-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 text-center font-mono">
          CAUTION: All interactions are cryptographically signed and logged to the Vault Ledger.
        </p>
      </div>
    </div>
  );
};