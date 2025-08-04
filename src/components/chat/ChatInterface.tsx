import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Mic, 
  MicOff, 
  Send, 
  Brain, 
  User, 
  Volume2, 
  VolumeX,
  Sparkles,
  Clock,
  Pin,
  PinOff,
  MessageCircle,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import useZoxaaChat from "@/hooks/useZoxaaChat";
import useOpenAIVoice from "@/hooks/useOpenAIVoice";
import useZoxaaPlans from "@/hooks/useZoxaaPlans";


interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const [input, setInput] = useState("");
  const [conversationMode, setConversationMode] = useState<"text" | "voice">("text");
  const [pinnedMessage, setPinnedMessage] = useState<any>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Custom hooks
  const { messages, isThinking, sendMessage, addMessage } = useZoxaaChat();
  const { isRecording, isPlaying, startRecording, stopRecording, speak, stopSpeaking } = useOpenAIVoice();
  const { createPlan } = useZoxaaPlans();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const messageText = input;
    setInput("");
    
    try {
      await sendMessage(messageText);
      
      // Auto-speak response in voice mode
      if (conversationMode === "voice" && !isPlaying) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          await speak(lastMessage.content);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleVoiceToggle = async () => {
    if (conversationMode === "voice") {
      if (isVoiceMode) {
        setIsVoiceMode(false);
        stopSpeaking();
      } else {
        setIsVoiceMode(true);
      }
    } else {
      // Text mode - temporary voice input
      if (isRecording) {
        try {
          const transcribedText = await stopRecording();
          if (transcribedText.trim()) {
            setInput(transcribedText);
          }
        } catch (error) {
          console.error('Voice recording failed:', error);
        }
      } else {
        try {
          await startRecording();
        } catch (error) {
          console.error('Failed to start recording:', error);
        }
      }
    }
  };

  const handleSpeakerToggle = () => {
    if (isPlaying) {
      stopSpeaking();
    } else {
      // Speak the last assistant message
      const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop();
      if (lastAssistantMessage) {
        speak(lastAssistantMessage.content);
      }
    }
  };

  const toggleConversationMode = () => {
    if (conversationMode === "voice") {
      setIsVoiceMode(false);
      stopSpeaking();
    }
    setConversationMode(prev => prev === "text" ? "voice" : "text");
  };

  const handlePinMessage = (message: any) => {
    if (pinnedMessage?.id === message.id) {
      setPinnedMessage(null);
      toast({
        title: "Message Unpinned",
        description: "Message removed from pin"
      });
    } else {
      setPinnedMessage(message);
      toast({
        title: "Message Pinned",
        description: "Message pinned to top of chat"
      });
    }
  };

  const handleCreatePlan = async () => {
    try {
      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      if (lastUserMessage) {
        await createPlan(
          "New Plan from Conversation",
          `Based on our discussion: "${lastUserMessage.content}"`,
          ["Achieve discussed goals"],
          "Personal"
        );
        toast({
          title: "Plan Created",
          description: "A new plan has been created based on your conversation"
        });
      }
    } catch (error) {
      console.error('Failed to create plan:', error);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-gradient-background", className)}>
      {/* Pinned Message */}
      {pinnedMessage && (
        <div className="bg-accent/10 border-b border-accent/20 p-3">
          <div className="flex items-start gap-3">
            <Pin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-accent font-medium mb-1">Pinned Message</p>
              <p className="text-sm text-muted-foreground truncate">{pinnedMessage.content}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setPinnedMessage(null)}
            >
              <PinOff className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 bg-gradient-primary">
            <AvatarFallback className="bg-transparent">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">Zoxaa</h2>
            <p className="text-sm text-muted-foreground">
              {isThinking ? "Thinking..." : "Ready to help"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Conversation Mode Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button 
              variant={conversationMode === "text" ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleConversationMode}
              className="h-8 px-3"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Text
            </Button>
            <Button 
              variant={conversationMode === "voice" ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleConversationMode}
              className="h-8 px-3"
            >
              <Phone className="w-4 h-4 mr-1" />
              Voice
            </Button>
          </div>

          <Button 
            variant="voice" 
            size="icon"
            onClick={handleSpeakerToggle}
          >
            {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button 
            variant="memory" 
            size="icon"
            onClick={handleCreatePlan}
          >
            <Sparkles className="w-4 h-4" />
          </Button>

        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className="w-8 h-8 bg-gradient-primary">
                <AvatarFallback className="bg-transparent">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
            )}

            <Card className={cn(
              "max-w-[80%] p-4 bg-gradient-card group relative",
              message.role === "user" 
                ? "bg-gradient-primary text-primary-foreground" 
                : "border-primary/20"
            )}>
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 opacity-70">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handlePinMessage(message)}
                >
                  {pinnedMessage?.id === message.id ? 
                    <PinOff className="w-3 h-3" /> : 
                    <Pin className="w-3 h-3" />
                  }
                </Button>
              </div>
            </Card>

            {message.role === "user" && (
              <Avatar className="w-8 h-8 bg-secondary">
                <AvatarFallback className="bg-transparent">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8 bg-gradient-primary">
              <AvatarFallback className="bg-transparent">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            <Card className="p-4 bg-ai-thinking/20 border-primary/20">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-muted-foreground">Zoxaa is thinking deeply...</span>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        {conversationMode === "text" ? (
          <div className="flex items-center gap-2">
          <Button 
            variant={isRecording ? "empathy" : "voice"}
            size="icon"
            onClick={handleVoiceToggle}
            className={cn(
              "transition-all",
              isRecording && "animate-pulse shadow-glow"
            )}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Share your thoughts with Zoxaa..."
                className="pr-12 bg-background/50 border-primary/20 focus:border-primary"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isVoiceMode ? "bg-plan-success animate-pulse" : "bg-muted"
              )} />
              <span className="text-sm text-muted-foreground">
                {isVoiceMode ? "Voice Active" : "Voice Inactive"}
              </span>
            </div>
            
            <Button
              variant={isVoiceMode ? "destructive" : "empathy"}
              size="lg"
              onClick={handleVoiceToggle}
              className={cn(
                "transition-all",
                isVoiceMode && "animate-pulse"
              )}
            >
              {isVoiceMode ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  End Voice Chat
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start Voice Chat
                </>
              )}
            </Button>

            {isPlaying && (
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-accent">Zoxaa is speaking...</span>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2 text-center">
          {conversationMode === "voice" 
            ? "Real-time voice conversation with Zoxaa • Remembers everything"
            : "Zoxaa remembers everything and provides honest, thoughtful responses"
          }
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;