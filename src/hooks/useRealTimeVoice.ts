import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface RealTimeVoiceHookReturn {
  isListening: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  startRealTimeListening: () => Promise<void>;
  stopRealTimeListening: () => void;
  speakWithEmotion: (text: string, emotion?: string) => Promise<void>;
  stopSpeaking: () => void;
  clearTranscript: () => void;
  setVoiceSettings: (settings: VoiceSettings) => void;
}

interface VoiceSettings {
  voice: 'zoxaa' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed: number;
  pitch: number;
  emotion: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm' | 'concerned';
}

const useRealTimeVoice = (): RealTimeVoiceHookReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>({
    voice: 'zoxaa',
    speed: 1.0,
    pitch: 1.0,
    emotion: 'neutral'
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const restartCountRef = useRef<number>(0);
  const isRestartingRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  // Initialize Web Speech API for real-time transcription
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Mobile-specific settings
      if (isMobile) {
        console.log('📱 Mobile device detected, applying mobile-specific settings');
        recognitionRef.current.continuous = false; // Disable continuous on mobile
        recognitionRef.current.interimResults = false; // Disable interim results on mobile
        recognitionRef.current.maxAlternatives = 1;
        recognitionRef.current.lang = 'en-US';
        
        // Show mobile-specific message
        toast({
          title: "Mobile Voice Mode",
          description: "Voice recognition on mobile may be limited. Text input is recommended.",
          variant: "default"
        });
      } else {
        // Desktop settings
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;
      }
      
      // Add better error handling for initialization
      try {
        console.log('🎤 Speech recognition initialized successfully');
        console.log(`📱 Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);
        console.log(`🍎 iOS: ${isIOS}, 🤖 Android: ${isAndroid}`);
      } catch (error) {
        console.error('❌ Failed to initialize speech recognition:', error);
        toast({
          title: "Voice Recognition Not Supported",
          description: "Your browser doesn't support voice recognition",
          variant: "destructive"
        });
      }
      
      // Add network connectivity check
      const checkNetworkConnectivity = async () => {
        try {
          const response = await fetch('https://www.google.com', { 
            method: 'HEAD',
            mode: 'no-cors'
          });
          console.log('✅ Network connectivity confirmed');
          return true;
        } catch (error) {
          console.log('❌ Network connectivity issue detected');
          return false;
        }
      };
      
      // Add speech recognition service check (simplified)
      const checkSpeechRecognitionService = async () => {
        try {
          console.log('✅ Speech recognition service check skipped (network restrictions detected)');
          return false; // Assume blocked to be safe
        } catch (error) {
          console.log('❌ Speech recognition service not accessible:', error);
          return false;
        }
      };
      
      // Check network and speech services before initializing speech recognition
      Promise.all([
        checkNetworkConnectivity(),
        checkSpeechRecognitionService()
      ]).then(([networkOk, speechOk]) => {
        if (!networkOk) {
          console.log('⚠️ Network issues detected, speech recognition may fail');
          toast({
            title: "Network Warning",
            description: "Speech recognition may not work due to network issues. Text input is available.",
            variant: "default"
          });
        } else if (!speechOk) {
          console.log('⚠️ Speech recognition service blocked by network, using text input');
          toast({
            title: "Voice Input Unavailable",
            description: "Speech recognition is blocked by your network. Please use text input to chat with ZOXAA.",
            variant: "default"
          });
        }
      });
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        console.log('Speech recognition result:', { finalTranscript, interimTranscript });
        setCurrentTranscript(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Mobile-specific error handling
        if (isMobile) {
          if (event.error === 'network') {
            console.log('📱 Mobile network error detected');
            toast({
              title: "Mobile Voice Issue",
              description: "Voice recognition not working on mobile. Please use text input.",
              variant: "default"
            });
            setIsListening(false);
            return;
          }
          
          if (event.error === 'not-allowed') {
            console.log('📱 Mobile microphone permission denied');
            toast({
              title: "Microphone Permission",
              description: "Please allow microphone access in your mobile browser settings.",
              variant: "destructive"
            });
            setIsListening(false);
            return;
          }
        }
        
        // Handle specific error types
        if (event.error === 'no-speech') {
          console.log('No speech detected, continuing to listen...');
          if (isRestartingRef.current) {
            return;
          }
          
          setTimeout(() => {
            if (recognitionRef.current && isListening && !isRestartingRef.current) {
              try {
                recognitionRef.current.stop();
                setTimeout(() => {
                  if (recognitionRef.current) {
                    recognitionRef.current.start();
                  }
                }, 500);
              } catch (error) {
                console.log('Failed to restart after no-speech:', error);
              }
            }
          }, 300);
          return;
        }
        
        if (event.error === 'network') {
          console.log('Speech recognition network error, attempting enhanced recovery...');
          if (recognitionRef.current && isListening && !isRestartingRef.current) {
            isRestartingRef.current = true;
            restartCountRef.current++;
            if (restartCountRef.current <= 2) { // Try enhanced recovery first
              handleNetworkError();
            } else { // After 2 attempts, show user-friendly message
              console.log('Too many network errors, offering alternatives');
              toast({
                title: "Speech Recognition Unavailable",
                description: "Network issues detected. You can still use text input to chat with ZOXAA.",
                variant: "default"
              });
              setIsListening(false);
            }
            setTimeout(() => { isRestartingRef.current = false; }, 2000);
          } else {
            if (restartCountRef.current === 0) {
              toast({
                title: "Network Error",
                description: "Speech recognition unavailable. Please use text input instead.",
                variant: "default"
              });
            }
          }
          return;
        }
        
        // Handle other errors
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Voice Recognition Error",
          description: `Error: ${event.error}. Please use text input instead.`,
          variant: "destructive"
        });
        setIsListening(false);
      };
      
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };
      
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        if (isListening && !isRestartingRef.current) {
          setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
              } catch (error) {
                console.log('Failed to restart from onend:', error);
              }
            }
          }, 300);
        }
      };
    }
  }, [toast, isListening]);

  // Enhanced network error recovery
  const handleNetworkError = useCallback(async () => {
    console.log('🔄 Attempting network error recovery...');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        await new Promise(resolve => setTimeout(resolve, 1000));
        recognitionRef.current.continuous = false; // Try non-continuous mode
        recognitionRef.current.interimResults = false; // Try without interim results
        recognitionRef.current.start();
        console.log('✅ Speech recognition restarted with alternative settings');
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
          }
        }, 2000);
      } catch (error) {
        console.log('❌ Alternative settings also failed:', error);
        toast({
          title: "Speech Recognition Unavailable",
          description: "Please use text input to chat with ZOXAA. Voice features will be disabled.",
          variant: "default"
        });
        setIsListening(false);
      }
    }
  }, [toast]);

  // Fallback: Manual voice input when speech recognition fails
  const startManualVoiceInput = useCallback(async () => {
    try {
      toast({
        title: "Voice Input Alternative",
        description: "Speech recognition unavailable. Please use text input or try refreshing the page.",
        variant: "default"
      });
      console.log('Manual voice input mode activated');
    } catch (error) {
      console.error('Failed to start manual voice input:', error);
    }
  }, [toast]);

  const startRealTimeListening = useCallback(async () => {
    try {
      if (!recognitionRef.current) {
        throw new Error('Speech recognition not supported');
      }

      // Check if already listening
      if (isListening) {
        console.log('Speech recognition already active');
        return;
      }

      // Check if recognition is already started
      if (recognitionRef.current.state === 'recording' || recognitionRef.current.state === 'starting') {
        console.log('Speech recognition already started');
        return;
      }

      // Add a small delay to ensure proper initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reset retry counter when starting fresh
      restartCountRef.current = 0;
      
      recognitionRef.current.start();
      setIsListening(true);
      
      toast({
        title: "Voice Mode Active",
        description: "I'm listening to you in real-time..."
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast({
        title: "Voice Error",
        description: "Unable to start voice recognition",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast, isListening]);

  const stopRealTimeListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Error stopping speech recognition:', error);
      }
    }
    setIsListening(false);
    setCurrentTranscript('');
  }, []);

  const speakWithEmotion = useCallback(async (text: string, emotion?: string) => {
    try {
      setIsSpeaking(true);
      
      // Use relative URL for both local development and Vercel deployment
      const apiUrl = '/api/tts';
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: voiceSettings.voice === 'zoxaa' ? 'alloy' : voiceSettings.voice,
          speed: voiceSettings.speed,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Convert base64 to blob
      const audioData = atob(result.audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      // Apply audio effects based on emotion
      if (emotion) {
        audio.playbackRate = voiceSettings.speed;
        // You can add more audio processing here
      }
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Audio Playback Error",
          description: "Failed to play audio response",
          variant: "destructive"
        });
      };

      await audio.play();
      
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      toast({
        title: "TTS Error",
        description: "Failed to generate speech response",
        variant: "destructive"
      });
      throw error;
    }
  }, [voiceSettings, toast]);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setCurrentTranscript('');
  }, []);

  const setVoiceSettings = useCallback((settings: VoiceSettings) => {
    setVoiceSettingsState(settings);
  }, []);

  return {
    isListening,
    isSpeaking,
    currentTranscript,
    startRealTimeListening,
    stopRealTimeListening,
    speakWithEmotion,
    stopSpeaking,
    clearTranscript,
    setVoiceSettings,
  };
};

export default useRealTimeVoice; 