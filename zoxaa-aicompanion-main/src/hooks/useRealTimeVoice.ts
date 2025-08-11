import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface RealTimeVoiceHookReturn {
  isListening: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  voiceSupported: boolean;
  permissionGranted: boolean;
  startRealTimeListening: () => Promise<void>;
  stopRealTimeListening: () => void;
  speakWithEmotion: (text: string, emotion?: string) => Promise<void>;
  stopSpeaking: () => void;
  clearTranscript: () => void;
  setVoiceSettings: (settings: VoiceSettings) => void;
  requestMicrophonePermission: () => Promise<boolean>;
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
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
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
  const maxRestartAttemptsRef = useRef<number>(5);
  const lastRestartTimeRef = useRef<number>(0);
  const { toast } = useToast();

  // Enhanced device detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  const isEdge = /Edg/.test(navigator.userAgent);

  // Check if running on HTTPS
  const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

  // Initialize voice support detection
  useEffect(() => {
    const checkVoiceSupport = () => {
      const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const hasGetUserMedia = 'getUserMedia' in navigator.mediaDevices || 'getUserMedia' in navigator;
      
      console.log('🔍 Voice support check:', {
        hasSpeechRecognition,
        hasGetUserMedia,
        isSecure,
        userAgent: navigator.userAgent.substring(0, 100)
      });

      if (!isSecure && !window.location.hostname.includes('localhost')) {
        console.log('⚠️ Voice requires HTTPS (except localhost)');
        toast({
          title: "Voice Requires HTTPS",
          description: "Voice features require a secure connection. Please use HTTPS or localhost.",
          variant: "destructive"
        });
        setVoiceSupported(false);
        return;
      }

      if (!hasSpeechRecognition) {
        console.log('❌ Speech recognition not supported');
        toast({
          title: "Voice Not Supported",
          description: "Your browser doesn't support voice recognition. Please use text input.",
          variant: "destructive"
        });
        setVoiceSupported(false);
        return;
      }

      if (!hasGetUserMedia) {
        console.log('❌ Microphone access not supported');
        toast({
          title: "Microphone Not Supported",
          description: "Your browser doesn't support microphone access. Please use text input.",
          variant: "destructive"
        });
        setVoiceSupported(false);
        return;
      }

      setVoiceSupported(true);
      console.log('✅ Voice support confirmed');
    };

    checkVoiceSupport();
  }, [toast]);

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🎤 Requesting microphone permission...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      console.log('✅ Microphone permission granted');
      
      toast({
        title: "Microphone Permission Granted",
        description: "Voice features are now available",
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      setPermissionGranted(false);
      
      let errorMessage = "Microphone access denied";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Please allow microphone access in your browser settings";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No microphone found. Please connect a microphone and try again";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Microphone not supported in this browser";
        }
      }
      
      toast({
        title: "Microphone Access Denied",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  }, [toast]);

  // Initialize Web Speech API with enhanced error handling
  useEffect(() => {
    if (!voiceSupported) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Browser-specific settings
      if (isMobile) {
        console.log('📱 Mobile device detected, applying mobile-specific settings');
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.maxAlternatives = 1;
        recognitionRef.current.lang = 'en-US';
        
        // Mobile-specific guidance with better error handling
        toast({
          title: "Mobile Voice Mode",
          description: "Tap and hold the microphone button to speak. Speak clearly and ensure good microphone access.",
          variant: "default"
        });
      } else {
        // Desktop settings
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;
      }
      
      // Enhanced error handling with better recovery
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = "Voice recognition error";
        let shouldShowToast = true;
        let shouldRestart = false;
        
        // Check restart limits
        const now = Date.now();
        const timeSinceLastRestart = now - lastRestartTimeRef.current;
        const maxRestartAttempts = maxRestartAttemptsRef.current;
        
        if (restartCountRef.current >= maxRestartAttempts) {
          console.log('❌ Max restart attempts reached, stopping voice recognition');
          toast({
            title: "Voice Recognition Unavailable",
            description: "Too many restart attempts. Please try again later or use text input.",
            variant: "destructive"
          });
          setIsListening(false);
          return;
        }
        
        // Prevent too frequent restarts - increased to 3 seconds
        if (timeSinceLastRestart < 3000) {
          console.log('⚠️ Restart too frequent, waiting...');
          shouldRestart = false;
        }
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
            setPermissionGranted(false);
            shouldRestart = false;
            break;
          case 'no-speech':
            console.log('No speech detected, attempting to restart...');
            errorMessage = "No speech detected. Please try speaking louder or check your microphone.";
            shouldShowToast = false;
            // Only restart no-speech errors occasionally, not every time
            if (restartCountRef.current < 1) {
              shouldRestart = true;
              restartCountRef.current++;
            } else {
              console.log('Too many no-speech errors, stopping restart attempts');
              shouldRestart = false;
              // Show a helpful message to the user
              toast({
                title: "Voice Recognition",
                description: "No speech detected. Please try speaking clearly or use text input.",
                variant: "default"
              });
            }
            break;
          case 'network':
            errorMessage = "Network error. Please check your internet connection.";
            shouldRestart = true;
            restartCountRef.current++;
            break;
          case 'service-not-allowed':
            errorMessage = "Voice recognition service blocked. Please use text input.";
            setVoiceSupported(false);
            shouldRestart = false;
            break;
          case 'aborted':
            console.log('Speech recognition was interrupted, attempting to restart...');
            errorMessage = "Voice recognition was interrupted.";
            shouldShowToast = false;
            shouldRestart = true;
            restartCountRef.current++;
            break;
          case 'audio-capture':
            errorMessage = "No microphone found. Please connect a microphone and try again.";
            shouldRestart = true;
            restartCountRef.current++;
            break;
          default:
            errorMessage = `Voice recognition error: ${event.error}`;
            shouldRestart = true;
            restartCountRef.current++;
        }
        
        if (shouldShowToast) {
          toast({
            title: "Voice Recognition Error",
            description: errorMessage,
            variant: "destructive"
          });
        }
        
        // Handle restart logic with improved timeout
        if (shouldRestart && isListening && !isRestartingRef.current && timeSinceLastRestart >= 3000) {
          console.log(`🔄 Attempting to restart speech recognition (attempt ${restartCountRef.current}/${maxRestartAttempts})...`);
          isRestartingRef.current = true;
          lastRestartTimeRef.current = now;
          
          setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.stop();
                setTimeout(() => {
                  if (recognitionRef.current && isListening) {
                    try {
                      recognitionRef.current.start();
                      console.log('✅ Speech recognition restarted successfully');
                    } catch (restartError) {
                      console.error('Failed to restart speech recognition:', restartError);
                      setIsListening(false);
                    }
                  }
                }, 1000); // Reduced delay for better responsiveness
              } catch (stopError) {
                console.error('Failed to stop speech recognition for restart:', stopError);
                setIsListening(false);
              }
            }
            isRestartingRef.current = false;
          }, 2000); // Reduced delay before restart
        } else if (!shouldRestart) {
          setIsListening(false);
        }
      };
      
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
        
        console.log('🎤 Speech recognition result:', { finalTranscript, interimTranscript });
        setCurrentTranscript(finalTranscript + interimTranscript);
      };
      
      recognitionRef.current.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
        isRestartingRef.current = false;
      };
      
      recognitionRef.current.onend = () => {
        console.log('🎤 Speech recognition ended');
        if (isListening && !isRestartingRef.current) {
          // Only auto-restart if we haven't had too many errors
          if (restartCountRef.current < 2) {
            console.log('🔄 Speech recognition ended, attempting to restart...');
            setTimeout(() => {
              if (recognitionRef.current && isListening) {
                try {
                  recognitionRef.current.start();
                  console.log('✅ Speech recognition restarted from onend');
                } catch (error) {
                  console.log('Failed to restart from onend:', error);
                  setIsListening(false);
                }
              }
            }, 500); // Reduced delay for better responsiveness
          } else {
            console.log('Too many errors, not auto-restarting');
            setIsListening(false);
          }
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize speech recognition:', error);
      setVoiceSupported(false);
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support voice recognition. Please use text input.",
        variant: "destructive"
      });
    }
  }, [voiceSupported, isMobile, isListening, toast]);

  const startRealTimeListening = useCallback(async () => {
    try {
      // Check if voice is supported
      if (!voiceSupported) {
        throw new Error('Voice recognition not supported');
      }

      // Check if already listening
      if (isListening) {
        console.log('Speech recognition already active');
        return;
      }

      // Request microphone permission if not already granted
      if (!permissionGranted) {
        const permissionGranted = await requestMicrophonePermission();
        if (!permissionGranted) {
          throw new Error('Microphone permission denied');
        }
      }

      // Check if recognition is already started
      if (recognitionRef.current?.state === 'recording' || recognitionRef.current?.state === 'starting') {
        console.log('Speech recognition already started');
        return;
      }

      // Add a small delay to ensure proper initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reset retry counter when starting fresh
      restartCountRef.current = 0;
      lastRestartTimeRef.current = 0;
      isRestartingRef.current = false;
      
      recognitionRef.current?.start();
      setIsListening(true);
      
      toast({
        title: "Voice Mode Active",
        description: "I'm listening to you in real-time..."
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast({
        title: "Voice Error",
        description: "Unable to start voice recognition. Please use text input.",
        variant: "destructive"
      });
      throw error;
    }
  }, [voiceSupported, isListening, permissionGranted, requestMicrophonePermission, toast]);

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
    
    // Reset all counters and state
    restartCountRef.current = 0;
    lastRestartTimeRef.current = 0;
    isRestartingRef.current = false;
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
    voiceSupported,
    permissionGranted,
    startRealTimeListening,
    stopRealTimeListening,
    speakWithEmotion,
    stopSpeaking,
    clearTranscript,
    setVoiceSettings,
    requestMicrophonePermission,
  };
};

export default useRealTimeVoice; 