import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Brain,
  User,
  Activity,
  BarChart3,
  MessageCircle,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import useZoxaaChat from "@/hooks/useZoxaaChat";
import useRealTimeVoice from "@/hooks/useRealTimeVoice";
import { useNavigate } from "react-router-dom";

const VoiceChat = () => {
  const [callActive, setCallActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [voiceActivity, setVoiceActivity] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Custom hooks
  const { sendMessage } = useZoxaaChat();
  const { 
    startRealTimeListening, 
    stopRealTimeListening, 
    speakWithEmotion, 
    stopSpeaking,
    currentTranscript,
    isListening,
    isSpeaking,
    clearTranscript
  } = useRealTimeVoice();

  // Call duration timer
  useEffect(() => {
    if (callActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callActive]);

  // Voice activity simulation
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async () => {
    try {
      setCallActive(true);
      
      // Start listening
      await startRealTimeListening();
      
      // ZOXAA starts the conversation
      const welcomeMessage = "Hello! I'm ZOXAA. I'm ready to have a real-time conversation with you. Just start talking whenever you're ready!";
      await speakWithEmotion(welcomeMessage, 'excited');
      
      setConversationHistory(prev => [...prev, `ZOXAA: ${welcomeMessage}`]);
      
      toast({
        title: "Call Started",
        description: "ZOXAA is ready to talk with you!"
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      toast({
        title: "Call Failed",
        description: "Unable to start voice call. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const endCall = () => {
    setCallActive(false);
    stopRealTimeListening();
    stopSpeaking();
    
    toast({
      title: "Call Ended",
      description: "Voice conversation ended."
    });
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return;

    console.log('Processing voice input:', transcript);
    setIsProcessing(true);
    setConversationHistory(prev => [...prev, `You: ${transcript}`]);
    
    try {
      // Send to ZOXAA and get response
      console.log('Sending message to ZOXAA...');
      const response = await sendMessage(transcript);
      console.log('ZOXAA response:', response);
      
      // Speak the response
      console.log('Speaking response...');
      await speakWithEmotion(response, 'neutral');
      
      setConversationHistory(prev => [...prev, `ZOXAA: ${response}`]);
      
      // Clear the transcript after processing
      clearTranscript();
    } catch (error) {
      console.error('Failed to process voice input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-send when user stops speaking
  useEffect(() => {
    if (currentTranscript && currentTranscript.trim() && !isProcessing) {
      console.log('Voice input detected:', currentTranscript);
      
          // Auto-send after 0.1 seconds of silence for ultra-fast response
    const timer = setTimeout(() => {
      console.log('Auto-sending voice input:', currentTranscript);
      handleVoiceInput(currentTranscript);
    }, 100); // 0.1 seconds of silence for ultra-fast response

      return () => clearTimeout(timer);
    }
  }, [currentTranscript, isProcessing]);

  return (
    <div className="h-screen bg-gradient-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/chat')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-10 h-10 bg-gradient-primary">
            <AvatarFallback className="bg-transparent">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">ZOXAA Voice Call</h1>
            <p className="text-sm text-muted-foreground">
              {callActive ? `Call duration: ${formatDuration(callDuration)}` : "Real-time voice conversation"}
            </p>
          </div>
        </div>


      </div>

      {/* Main Call Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {!callActive ? (
          // Call Start Screen
          <div className="text-center space-y-6">
            <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-16 h-16 text-primary-foreground" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Start Voice Call</h2>
              <p className="text-muted-foreground max-w-md">
                Have a natural, real-time conversation with ZOXAA. 
                Just press start and begin talking - no buttons needed!
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                size="lg" 
                onClick={startCall}
                className="bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/90"
              >
                <Phone className="w-5 h-5 mr-2" />
                Start Call with ZOXAA
              </Button>
              
              
            </div>
          </div>
        ) : (
          // Active Call Screen
          <div className="w-full max-w-2xl space-y-6">
            {/* Voice Activity Visualization */}
            <Card className="p-6 bg-accent/10 border-accent/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Voice Activity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isListening ? "bg-green-500 animate-pulse" : "bg-muted"
                  )} />
                  <span className="text-xs text-muted-foreground">
                    {isListening ? "Listening" : "Idle"}
                  </span>
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
            </Card>

                         {/* Current Transcript */}
             {currentTranscript && (
               <Card className="p-4 bg-primary/10 border-primary/20">
                 <div className="flex items-center gap-2 mb-2">
                   <BarChart3 className="w-4 h-4 text-primary" />
                   <span className="text-sm font-medium text-primary">You're saying:</span>
                 </div>
                 <p className="text-sm text-muted-foreground">{currentTranscript}</p>
               </Card>
             )}

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isSpeaking ? "destructive" : "secondary"}
                size="lg"
                onClick={isSpeaking ? stopSpeaking : undefined}
                disabled={!isSpeaking}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-5 h-5 mr-2" />
                    Stop ZOXAA
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 mr-2" />
                    ZOXAA Speaking
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="animate-pulse"
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                End Call
              </Button>
            </div>

                         {/* Status Indicators */}
             <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
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
                   currentTranscript ? "bg-yellow-500 animate-pulse" : "bg-muted"
                 )} />
                 <span>Voice Detected</span>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Conversation History */}
      {callActive && conversationHistory.length > 0 && (
        <div className="h-48 overflow-y-auto p-4 border-t border-border bg-card/50">
          <h3 className="font-semibold mb-2">Conversation</h3>
          <div className="space-y-2">
            {conversationHistory.map((message, index) => (
              <div key={index} className="text-sm">
                <span className="text-muted-foreground">{message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-border bg-card/50">
        <p className="text-xs text-muted-foreground text-center">
          {callActive 
            ? "Real-time voice conversation • Natural interruptions • Continuous flow"
            : "Click to start a real-time voice conversation with ZOXAA"
          }
        </p>
      </div>
    </div>
  );
};

export default VoiceChat; 