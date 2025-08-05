import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Mic, 
  MicOff, 
  Brain, 
  User, 
  Volume2, 
  VolumeX,
  BarChart3,
  Activity,
  Zap,
  Heart,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import useZoxaaChat from "@/hooks/useZoxaaChat";
import useRealTimeVoice from "@/hooks/useRealTimeVoice";

interface VoiceChatInterfaceProps {
  className?: string;
}

const VoiceChatInterface = ({ className }: VoiceChatInterfaceProps) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [voiceActivity, setVoiceActivity] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  // Custom hooks
  const { messages, isThinking, sendMessage, addMessage } = useZoxaaChat();
  const { 
    isListening, 
    isSpeaking, 
    currentTranscript, 
    startRealTimeListening, 
    stopRealTimeListening, 
    speakWithEmotion, 
    stopSpeaking 
  } = useRealTimeVoice();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-detect emotion from transcript
  useEffect(() => {
    if (currentTranscript) {
      const emotion = detectEmotion(currentTranscript);
      setCurrentEmotion(emotion);
    }
  }, [currentTranscript]);

  // Simulate voice activity visualization
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setVoiceActivity(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setVoiceActivity(0);
    }
  }, [isListening]);

  const detectEmotion = (text: string): string => {
    const emotions = {
      happy: ['happy', 'excited', 'joy', 'great', 'amazing', 'wonderful', 'love', 'fantastic'],
      sad: ['sad', 'depressed', 'down', 'upset', 'terrible', 'awful', 'crying', 'hurt'],
      anxious: ['anxious', 'worried', 'nervous', 'stressed', 'overwhelmed', 'scared', 'fear'],
      angry: ['angry', 'frustrated', 'mad', 'annoyed', 'irritated', 'hate', 'furious'],
      calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'quiet'],
      excited: ['excited', 'thrilled', 'pumped', 'energetic', 'motivated', 'inspired']
    };

    const lowerText = text.toLowerCase();
    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return emotion;
      }
    }
    return 'neutral';
  };

  const handleVoiceToggle = async () => {
    if (isVoiceActive) {
      // Stop voice conversation
      setIsVoiceActive(false);
      stopRealTimeListening();
      stopSpeaking();
      toast({
        title: "Voice Chat Ended",
        description: "Switched back to text mode"
      });
    } else {
      // Start voice conversation with mobile-specific handling
      try {
        if (isMobile) {
          // Show mobile-specific instructions
          toast({
            title: "Mobile Voice Mode",
            description: isIOS 
              ? "Tap and hold the microphone button to speak" 
              : "Tap the microphone button to start voice input",
            variant: "default"
          });
        }
        
        await startRealTimeListening();
        setIsVoiceActive(true);
        
        const message = isMobile 
          ? "Voice mode active on mobile. Tap to speak."
          : "I'm listening to you in real-time...";
          
        toast({
          title: "Voice Chat Active",
          description: message
        });
      } catch (error) {
        console.error('Failed to start voice chat:', error);
        
        // Mobile-specific error handling
        if (isMobile) {
          toast({
            title: "Mobile Voice Issue",
            description: "Voice recognition may not work on mobile. Please use text input.",
            variant: "destructive"
          });
        }
      }
    }
  };

  const handleSendVoiceMessage = async () => {
    if (!currentTranscript.trim()) return;

    const userMessage = currentTranscript;
    setConversationHistory(prev => [...prev, `You: ${userMessage}`]);
    
    try {
      const response = await sendMessage(userMessage);
      setConversationHistory(prev => [...prev, `Zoxaa: ${response}`]);
      
      // Auto-speak the response with detected emotion
      await speakWithEmotion(response, currentEmotion);
    } catch (error) {
      console.error('Failed to process voice message:', error);
    }
  };

  const handleInterrupt = () => {
    stopSpeaking();
    toast({
      title: "Interrupted",
      description: "Stopped Zoxaa's response"
    });
  };

  return (
    <div className={cn("flex flex-col h-full bg-gradient-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 bg-gradient-primary">
            <AvatarFallback className="bg-transparent">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">Zoxaa Voice</h2>
            <p className="text-sm text-muted-foreground">
              {isVoiceActive ? "Real-time voice conversation" : "Voice chat ready"}
            </p>
          </div>
        </div>


      </div>

      {/* Voice Activity Visualization */}
      {isVoiceActive && (
        <div className="p-4 bg-accent/5 border-b border-accent/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Voice Activity</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className={cn(
                "w-4 h-4",
                currentEmotion === 'happy' || currentEmotion === 'excited' ? "text-red-500" : "text-muted-foreground"
              )} />
              <span className="text-xs text-muted-foreground capitalize">{currentEmotion}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 h-8">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 bg-accent/20 rounded-sm transition-all duration-100",
                  isListening && voiceActivity > i * 5 && "bg-accent animate-pulse"
                )}
                style={{
                  height: `${Math.max(10, voiceActivity * 0.3)}%`
                }}
              />
            ))}
          </div>
        </div>
      )}

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
                  <MessageCircle className="w-3 h-3" />
                  <span className="text-xs">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
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
                <span className="text-sm text-muted-foreground">Zoxaa is thinking...</span>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Controls */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        {isVoiceActive ? (
          <div className="space-y-4">
            {/* Current Transcript Display */}
            {currentTranscript && (
              <Card className="p-3 bg-accent/10 border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">You're saying:</span>
                </div>
                <p className="text-sm text-muted-foreground">{currentTranscript}</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleSendVoiceMessage}
                    disabled={!currentTranscript.trim()}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Send
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.speechSynthesis?.cancel()}
                  >
                    Clear
                  </Button>
                </div>
              </Card>
            )}

            {/* Voice Control Buttons */}
            <div className={cn(
              "flex items-center justify-center gap-4",
              isMobile && "flex-col gap-2"
            )}>
              <Button
                variant={isSpeaking ? "destructive" : "secondary"}
                size={isMobile ? "default" : "lg"}
                onClick={isSpeaking ? handleInterrupt : undefined}
                disabled={!isSpeaking}
                className={isMobile ? "w-full" : ""}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className={cn("mr-2", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                    Interrupt
                  </>
                ) : (
                  <>
                    <Volume2 className={cn("mr-2", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                    Zoxaa Speaking
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                size={isMobile ? "default" : "lg"}
                onClick={handleVoiceToggle}
                className={cn(
                  "animate-pulse",
                  isMobile && "w-full"
                )}
              >
                <MicOff className={cn("mr-2", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                End Voice Chat
              </Button>
            </div>

            {/* Status Indicators */}
            <div className={cn(
              "flex items-center justify-center text-xs text-muted-foreground",
              isMobile ? "flex-col gap-2" : "gap-6"
            )}>
              <div className="flex items-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isListening ? "bg-green-500 animate-pulse" : "bg-muted"
                )} />
                <span>Listening</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isSpeaking ? "bg-blue-500 animate-pulse" : "bg-muted"
                )} />
                <span>Speaking</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isThinking ? "bg-yellow-500 animate-pulse" : "bg-muted"
                )} />
                <span>Thinking</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Start Voice Conversation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Have a natural conversation with Zoxaa using your voice
              </p>
            </div>
            
            <Button
              variant="empathy"
              size={isMobile ? "default" : "lg"}
              onClick={handleVoiceToggle}
              className={cn(
                "animate-pulse",
                isMobile && "w-full max-w-xs"
              )}
            >
              <Mic className={cn("mr-2", isMobile ? "w-4 h-4" : "w-5 h-5")} />
              {isMobile ? "Start Voice Chat" : "Start Voice Chat"}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4 text-center">
          {isVoiceActive 
            ? isMobile 
              ? "Mobile voice mode • Tap to speak • Text input available"
              : "Real-time voice conversation • Emotion-aware responses • Natural flow"
            : isMobile
              ? "Tap to start voice conversation with Zoxaa"
              : "Click to start a voice conversation with Zoxaa"
          }
        </p>
      </div>
    </div>
  );
};

export default VoiceChatInterface; 