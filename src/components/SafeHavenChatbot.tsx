import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/services/supabaseClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; category: string }[];
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm the Safe Haven Assistant. I can help you with:\n\n• Tourist places in Bangalore\n• Restaurant recommendations\n• Safety zones and heat map\n• Platform features\n• Emergency procedures\n\nHow can I assist you today?",
  timestamp: new Date(),
};

const SafeHavenChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history for context (excluding welcome message)
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke('rag-chat', {
        body: {
          message: userMessage.content,
          history: [...history, { role: 'user', content: userMessage.content }],
        },
      });

      if (error) {
        throw error;
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || "I apologize, but I couldn't process your request. Please try again.",
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[520px] flex flex-col shadow-xl z-50 overflow-hidden border-border">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Safe Haven Assistant</h3>
                <p className="text-xs opacity-80">Bangalore Tourism Help</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                          <Info className="w-3 h-3" />
                          <span>Sources:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.slice(0, 3).map((source, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded-full bg-background/50"
                            >
                              {formatCategoryLabel(source.category)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Bangalore..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              I can only help with Bangalore tourism & Safe Haven features
            </p>
          </div>
        </Card>
      )}
    </>
  );
};

export default SafeHavenChatbot;
