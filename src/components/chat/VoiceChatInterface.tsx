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

  // Enhanced mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  const isPhone = isMobile && !isTablet;
  
  // Screen size detection for better responsiveness
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  // Update screen size on resize
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced mobile detection with screen size
  const isMobileView = isMobile || screenSize.width < 768;
  const isSmallScreen = screenSize.width < 480;

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
        if (isMobileView) {
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
        
        const message = isMobileView 
          ? "Voice mode active on mobile. Tap to speak."
          : "I'm listening to you in real-time...";
          
        toast({
          title: "Voice Chat Active",
          description: message
        });
      } catch (error) {
        console.error('Failed to start voice chat:', error);
        
        // Mobile-specific error handling
        if (isMobileView) {
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
    <div className={cn(
      "flex flex-col h-full bg-gradient-background",
      isMobileView && "min-h-screen",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm",
        isMobileView ? "p-3" : "p-4"
      )}>
        <div className="flex items-center gap-3">
          <Avatar className={cn(
            "bg-gradient-primary",
            isMobileView ? "w-8 h-8" : "w-10 h-10"
          )}>
            <AvatarFallback className="bg-transparent">
              <Brain className={cn(
                "text-primary-foreground",
                isMobileView ? "w-4 h-4" : "w-5 h-5"
              )} />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className={cn(
              "font-semibold",
              isMobileView ? "text-sm" : "text-base"
            )}>Zoxaa Voice</h2>
            <p className={cn(
              "text-muted-foreground",
              isMobileView ? "text-xs" : "text-sm"
            )}>
              {isVoiceActive ? "Real-time voice conversation" : "Voice chat ready"}
            </p>
          </div>
        </div>


      </div>

      {/* Voice Activity Visualization */}
      {isVoiceActive && (
        <div className={cn(
          "bg-accent/5 border-b border-accent/20",
          isMobileView ? "p-3" : "p-4"
        )}>
          <div className={cn(
            "flex items-center justify-between mb-2",
            isMobileView && "flex-col gap-2 items-start"
          )}>
            <div className="flex items-center gap-2">
              <Activity className={cn(
                "text-accent",
                isMobileView ? "w-3 h-3" : "w-4 h-4"
              )} />
              <span className={cn(
                "font-medium text-accent",
                isMobileView ? "text-xs" : "text-sm"
              )}>Voice Activity</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className={cn(
                currentEmotion === 'happy' || currentEmotion === 'excited' ? "text-red-500" : "text-muted-foreground",
                isMobileView ? "w-3 h-3" : "w-4 h-4"
              )} />
              <span className={cn(
                "text-muted-foreground capitalize",
                isMobileView ? "text-xs" : "text-xs"
              )}>{currentEmotion}</span>
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
      <div className={cn(
        "flex-1 overflow-y-auto space-y-4",
        isMobileView ? "p-3" : "p-4"
      )}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className={cn(
                "bg-gradient-primary",
                isMobileView ? "w-6 h-6" : "w-8 h-8"
              )}>
                <AvatarFallback className="bg-transparent">
                  <Brain className={cn(
                    "text-primary-foreground",
                    isMobileView ? "w-3 h-3" : "w-4 h-4"
                  )} />
                </AvatarFallback>
              </Avatar>
            )}

            <Card className={cn(
              "bg-gradient-card group relative",
              message.role === "user" 
                ? "bg-gradient-primary text-primary-foreground" 
                : "border-primary/20",
              isMobileView ? "max-w-[90%] p-3" : "max-w-[80%] p-4"
            )}>
              <p className={cn(
                "leading-relaxed",
                isMobileView ? "text-xs" : "text-sm"
              )}>{message.content}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 opacity-70">
                  <MessageCircle className={cn(
                    isMobileView ? "w-2 h-2" : "w-3 h-3"
                  )} />
                  <span className={cn(
                    isMobileView ? "text-xs" : "text-xs"
                  )}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </Card>

            {message.role === "user" && (
              <Avatar className={cn(
                "bg-secondary",
                isMobileView ? "w-6 h-6" : "w-8 h-8"
              )}>
                <AvatarFallback className="bg-transparent">
                  <User className={cn(
                    "text-secondary-foreground",
                    isMobileView ? "w-3 h-3" : "w-4 h-4"
                  )} />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 justify-start">
            <Avatar className={cn(
              "bg-gradient-primary",
              isMobileView ? "w-6 h-6" : "w-8 h-8"
            )}>
              <AvatarFallback className="bg-transparent">
                <Brain className={cn(
                  "text-primary-foreground",
                  isMobileView ? "w-3 h-3" : "w-4 h-4"
                )} />
              </AvatarFallback>
            </Avatar>
            <Card className={cn(
              "bg-ai-thinking/20 border-primary/20",
              isMobileView ? "p-3" : "p-4"
            )}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className={cn(
                    "bg-primary rounded-full animate-bounce [animation-delay:-0.3s]",
                    isMobileView ? "w-1.5 h-1.5" : "w-2 h-2"
                  )}></div>
                  <div className={cn(
                    "bg-primary rounded-full animate-bounce [animation-delay:-0.15s]",
                    isMobileView ? "w-1.5 h-1.5" : "w-2 h-2"
                  )}></div>
                  <div className={cn(
                    "bg-primary rounded-full animate-bounce",
                    isMobileView ? "w-1.5 h-1.5" : "w-2 h-2"
                  )}></div>
                </div>
                <span className={cn(
                  "text-muted-foreground",
                  isMobileView ? "text-xs" : "text-sm"
                )}>Zoxaa is thinking...</span>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Controls */}
      <div className={cn(
        "border-t border-border bg-card/50 backdrop-blur-sm",
        isMobileView ? "p-3" : "p-4"
      )}>
        {isVoiceActive ? (
          <div className="space-y-4">
            {/* Current Transcript Display */}
            {currentTranscript && (
              <Card className={cn(
                "bg-accent/10 border-accent/20",
                isMobileView ? "p-2" : "p-3"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className={cn(
                    "text-accent",
                    isMobileView ? "w-3 h-3" : "w-4 h-4"
                  )} />
                  <span className={cn(
                    "font-medium text-accent",
                    isMobileView ? "text-xs" : "text-sm"
                  )}>You're saying:</span>
                </div>
                <p className={cn(
                  "text-muted-foreground",
                  isMobileView ? "text-xs" : "text-sm"
                )}>{currentTranscript}</p>
                <div className={cn(
                  "flex gap-2 mt-3",
                  isMobileView && "flex-col"
                )}>
                  <Button
                    size={isMobileView ? "sm" : "sm"}
                    onClick={handleSendVoiceMessage}
                    disabled={!currentTranscript.trim()}
                    className={isMobileView ? "w-full" : ""}
                  >
                    <Zap className={cn(
                      "mr-1",
                      isMobileView ? "w-3 h-3" : "w-4 h-4"
                    )} />
                    Send
                  </Button>
                  <Button
                    variant="outline"
                    size={isMobileView ? "sm" : "sm"}
                    onClick={() => window.speechSynthesis?.cancel()}
                    className={isMobileView ? "w-full" : ""}
                  >
                    Clear
                  </Button>
                </div>
              </Card>
            )}

            {/* Voice Control Buttons */}
            <div className={cn(
              "flex items-center justify-center gap-4",
              isMobileView && "flex-col gap-2"
            )}>
              <Button
                variant={isSpeaking ? "destructive" : "secondary"}
                size={isMobileView ? "default" : "lg"}
                onClick={isSpeaking ? handleInterrupt : undefined}
                disabled={!isSpeaking}
                className={isMobileView ? "w-full" : ""}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className={cn("mr-2", isMobileView ? "w-4 h-4" : "w-5 h-5")} />
                    Interrupt
                  </>
                ) : (
                  <>
                    <Volume2 className={cn("mr-2", isMobileView ? "w-4 h-4" : "w-5 h-5")} />
                    Zoxaa Speaking
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                size={isMobileView ? "default" : "lg"}
                onClick={handleVoiceToggle}
                className={cn(
                  "animate-pulse",
                  isMobileView && "w-full"
                )}
              >
                <MicOff className={cn("mr-2", isMobileView ? "w-4 h-4" : "w-5 h-5")} />
                End Voice Chat
              </Button>
            </div>

            {/* Status Indicators */}
            <div className={cn(
              "flex items-center justify-center text-xs text-muted-foreground",
              isMobileView ? "flex-col gap-2" : "gap-6"
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
              <h3 className={cn(
                "font-semibold mb-2",
                isMobileView ? "text-sm" : "text-base"
              )}>Start Voice Conversation</h3>
              <p className={cn(
                "text-muted-foreground mb-4",
                isMobileView ? "text-xs" : "text-sm"
              )}>
                Have a natural conversation with Zoxaa using your voice
              </p>
            </div>
            
            <Button
              variant="empathy"
              size={isMobileView ? "default" : "lg"}
              onClick={handleVoiceToggle}
              className={cn(
                "animate-pulse",
                isMobileView && "w-full max-w-xs"
              )}
            >
              <Mic className={cn("mr-2", isMobileView ? "w-4 h-4" : "w-5 h-5")} />
              Start Voice Chat
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4 text-center">
          {isVoiceActive 
            ? isMobileView 
              ? "Mobile voice mode • Tap to speak • Text input available"
              : "Real-time voice conversation • Emotion-aware responses • Natural flow"
            : isMobileView
              ? "Tap to start voice conversation with Zoxaa"
              : "Click to start a voice conversation with Zoxaa"
          }
        </p>
      </div>
    </div>
  );
};

export default VoiceChatInterface; 