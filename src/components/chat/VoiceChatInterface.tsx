import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
  MessageCircle,
  AlertTriangle,
  CheckCircle
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
  const [showBrowserInfo, setShowBrowserInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Enhanced mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  const isPhone = isMobile && !isTablet;
  const isChrome = /Chrome/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  const isEdge = /Edg/.test(navigator.userAgent);
  
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
    voiceSupported,
    permissionGranted,
    startRealTimeListening, 
    stopRealTimeListening, 
    speakWithEmotion, 
    stopSpeaking,
    requestMicrophonePermission
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

  const getBrowserInfo = () => {
    const browser = isChrome ? 'Chrome' : isSafari ? 'Safari' : isFirefox ? 'Firefox' : isEdge ? 'Edge' : 'Unknown';
    const device = isMobile ? (isIOS ? 'iOS' : isAndroid ? 'Android' : 'Mobile') : 'Desktop';
    const secure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    
    return { browser, device, secure };
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
      // Start voice conversation with enhanced error handling
      try {
        // Check if voice is supported
        if (!voiceSupported) {
          toast({
            title: "Voice Not Supported",
            description: "Voice recognition is not supported in your browser. Please use text input.",
            variant: "destructive"
          });
          return;
        }

        // Request microphone permission if needed
        if (!permissionGranted) {
          const permissionGranted = await requestMicrophonePermission();
          if (!permissionGranted) {
            toast({
              title: "Microphone Permission Required",
              description: "Voice features require microphone access. Please allow microphone access and try again.",
              variant: "destructive"
            });
            return;
          }
        }

        // Show device-specific instructions
        if (isMobileView) {
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
        
        // Provide helpful error messages
        if (isMobileView) {
          toast({
            title: "Mobile Voice Issue",
            description: "Voice recognition may not work on mobile. Please use text input.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Voice Error",
            description: "Unable to start voice recognition. Please use text input.",
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
              {!voiceSupported 
                ? "Voice not supported - use text input"
                : !permissionGranted 
                  ? "Microphone permission needed"
                  : isVoiceActive 
                    ? "Real-time voice conversation" 
                    : "Voice chat ready"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Voice Status Indicator */}
      {!voiceSupported && (
        <div className={cn(
          "bg-yellow-500/10 border-yellow-500/20 border-b",
          isMobileView ? "p-3" : "p-4"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "text-yellow-500",
                isMobileView ? "w-4 h-4" : "w-5 h-5"
              )} />
              <span className={cn(
                "text-yellow-700 dark:text-yellow-300",
                isMobileView ? "text-xs" : "text-sm"
              )}>
                Voice not supported in this browser. Text input is available.
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBrowserInfo(!showBrowserInfo)}
              className="text-yellow-600 hover:text-yellow-700"
            >
              {showBrowserInfo ? "Hide" : "Info"}
            </Button>
          </div>
          
          {showBrowserInfo && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium">Browser:</span>
                  <span>{getBrowserInfo().browser}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Device:</span>
                  <span>{getBrowserInfo().device}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Secure Connection:</span>
                  <span className={getBrowserInfo().secure ? "text-green-600" : "text-red-600"}>
                    {getBrowserInfo().secure ? "Yes" : "No"}
                  </span>
                </div>
                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs">
                  <p className="font-medium mb-1">Voice Support Tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Use Chrome, Safari, or Firefox for best voice support</li>
                    <li>• Ensure you're on HTTPS or localhost</li>
                    <li>• Allow microphone permissions when prompted</li>
                    <li>• Text input works on all browsers</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {voiceSupported && !permissionGranted && (
        <div className={cn(
          "bg-blue-500/10 border-blue-500/20 border-b",
          isMobileView ? "p-3" : "p-4"
        )}>
          <div className="flex items-center gap-2">
            <Mic className={cn(
              "text-blue-500",
              isMobileView ? "w-4 h-4" : "w-5 h-5"
            )} />
            <span className={cn(
              "text-blue-700 dark:text-blue-300",
              isMobileView ? "text-xs" : "text-sm"
            )}>
              Microphone permission needed for voice features.
            </span>
          </div>
        </div>
      )}

      {voiceSupported && permissionGranted && (
        <div className={cn(
          "bg-green-500/10 border-green-500/20 border-b",
          isMobileView ? "p-3" : "p-4"
        )}>
          <div className="flex items-center gap-2">
            <CheckCircle className={cn(
              "text-green-500",
              isMobileView ? "w-4 h-4" : "w-5 h-5"
            )} />
            <span className={cn(
              "text-green-700 dark:text-green-300",
              isMobileView ? "text-xs" : "text-sm"
            )}>
              Voice features ready. Click to start voice conversation.
            </span>
          </div>
        </div>
      )}

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
              )}>
                {!voiceSupported 
                  ? "Voice Not Supported"
                  : !permissionGranted 
                    ? "Microphone Permission Needed"
                    : "Start Voice Conversation"
                }
              </h3>
              <p className={cn(
                "text-muted-foreground mb-4",
                isMobileView ? "text-xs" : "text-sm"
              )}>
                {!voiceSupported 
                  ? "Your browser doesn't support voice recognition. Please use text input to chat with Zoxaa."
                  : !permissionGranted 
                    ? "Allow microphone access to use voice features with Zoxaa."
                    : "Have a natural conversation with Zoxaa using your voice"
                }
              </p>
            </div>
            
            {!voiceSupported ? (
              <div className="w-full space-y-3">
                <div className="text-center mb-2">
                  <p className={cn(
                    "text-muted-foreground",
                    isMobileView ? "text-xs" : "text-sm"
                  )}>
                    Use text input to chat with Zoxaa
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        sendMessage(e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        sendMessage(input.value.trim());
                        input.value = '';
                      }
                    }}
                  >
                    Send
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  size={isMobileView ? "default" : "lg"}
                  onClick={() => window.location.href = '/chat'}
                  className={isMobileView && "w-full"}
                >
                  <MessageCircle className={cn("mr-2", isMobileView ? "w-4 h-4" : "w-5 h-5")} />
                  Go to Text Chat
                </Button>
              </div>
            ) : !permissionGranted ? (
              <Button
                variant="empathy"
                size={isMobileView ? "default" : "lg"}
                onClick={requestMicrophonePermission}
                className={isMobileView && "w-full max-w-xs"}
              >
                <Mic className={cn("mr-2", isMobileView ? "w-4 h-4" : "w-5 h-5")} />
                Allow Microphone Access
              </Button>
            ) : (
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
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4 text-center">
          {!voiceSupported 
            ? "Voice features not available • Text input provided as alternative"
            : !permissionGranted 
              ? "Microphone access required for voice features"
              : isVoiceActive 
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