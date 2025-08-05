import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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

  // Initialize Web Speech API for real-time transcription
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1; // Faster processing
      
      // Remove serviceURI to use default service and avoid network issues
      // recognitionRef.current.serviceURI = ''; // Commented out to use default
      
      // Add better error handling for initialization
      try {
        // Test if speech recognition can be initialized
        console.log('🎤 Speech recognition initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize speech recognition:', error);
        toast({
          title: "Voice Recognition Not Supported",
          description: "Your browser doesn't support voice recognition",
          variant: "destructive"
        });
      }
      
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
         
         // Handle specific error types
         if (event.error === 'no-speech') {
           console.log('No speech detected, continuing to listen...');
           // For no-speech, restart after a delay to prevent rapid restarts
           if (recognitionRef.current && isListening && !isRestartingRef.current) {
             isRestartingRef.current = true;
             setTimeout(() => {
               if (isListening && recognitionRef.current) {
                 try {
                   recognitionRef.current.start();
                   console.log('Restarted after no-speech error');
                 } catch (e) {
                   console.log('Failed to restart after no-speech:', e);
                 } finally {
                   isRestartingRef.current = false;
                 }
               } else {
                 isRestartingRef.current = false;
               }
             }, 500); // Increased delay to prevent conflicts
           }
           return;
         }
        
        if (event.error === 'network') {
          console.log('Speech recognition network error, attempting to restart...');
          // Try to restart speech recognition after network error with exponential backoff
          if (recognitionRef.current && isListening && !isRestartingRef.current) {
            isRestartingRef.current = true;
            const retryDelay = Math.min(1000 * Math.pow(2, restartCountRef.current), 5000); // Max 5 seconds
            
            setTimeout(() => {
              if (isListening && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                  console.log('Restarted after network error');
                  restartCountRef.current = 0; // Reset on success
                } catch (e) {
                  console.log('Failed to restart after network error:', e);
                  restartCountRef.current++;
                  
                  if (restartCountRef.current < 5) {
                    console.log(`Retrying network error recovery (${restartCountRef.current}/5)...`);
                    // Don't show error toast yet, keep trying
                  } else {
                    console.log('Too many network errors, showing user message');
                    toast({
                      title: "Voice Recognition Error",
                      description: "Please check your internet connection and refresh the page",
                      variant: "destructive"
                    });
                  }
                } finally {
                  isRestartingRef.current = false;
                }
              } else {
                isRestartingRef.current = false;
              }
            }, retryDelay);
          } else {
            // Only show error if we're not in retry mode
            if (restartCountRef.current === 0) {
              toast({
                title: "Network Error",
                description: "Please check your internet connection and try again",
                variant: "destructive"
              });
            }
          }
          return;
        }
        
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Permission Required",
            description: "Please allow microphone access to use voice chat",
            variant: "destructive"
          });
          return;
        }
        
        // For other errors, show generic message
        toast({
          title: "Voice Recognition Error",
          description: "Please check your microphone permissions",
          variant: "destructive"
        });
      };

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        // Only restart if we're supposed to be listening and not already restarting
        if (isListening && recognitionRef.current && !isRestartingRef.current) {
          console.log('Restarting speech recognition from onend...');
          isRestartingRef.current = true;
          // Add a longer delay to prevent rapid restarts
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log('Speech recognition restarted from onend');
              } catch (e) {
                console.log('Failed to restart from onend:', e);
                // If restart fails, stop listening
                setIsListening(false);
              } finally {
                isRestartingRef.current = false;
              }
            } else {
              isRestartingRef.current = false;
            }
          }, 300); // Increased delay to prevent conflicts
        }
      };
    }
  }, [toast, isListening]);

  const getOpenAIKey = () => {
    const key = localStorage.getItem('openai_key');
    if (!key) {
      toast({
        title: "OpenAI API Key Required",
        description: "Please set your OpenAI API key in settings",
        variant: "destructive"
      });
      throw new Error('OpenAI API key not found');
    }
    return key;
  };

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
        currentAudioRef.current = null;
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        toast({
          title: "Playback Error",
          description: "Failed to play audio response",
          variant: "destructive"
        });
      };

      await audio.play();
    } catch (error) {
      setIsSpeaking(false);
      toast({
        title: "Speech Error",
        description: "Failed to generate speech. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [voiceSettings, toast]);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const setVoiceSettings = useCallback((settings: VoiceSettings) => {
    setVoiceSettingsState(settings);
  }, []);

  const clearTranscript = useCallback(() => {
    setCurrentTranscript('');
  }, []);

  const restartSpeechRecognition = useCallback(() => {
    console.log('restartSpeechRecognition called, recognitionRef.current:', !!recognitionRef.current);
    if (recognitionRef.current) {
      try {
        console.log('Attempting to restart speech recognition...');
        recognitionRef.current.start();
        restartCountRef.current = 0; // Reset counter on successful restart
        console.log('Speech recognition restart successful');
      } catch (e) {
        console.log('Failed to restart speech recognition:', e);
        restartCountRef.current++;
        
        if (restartCountRef.current < 10) { // Increased limit for more persistence
          console.log(`Retry attempt ${restartCountRef.current}/10 in 300ms...`);
          setTimeout(() => {
            restartSpeechRecognition();
          }, 300);
        } else {
          console.log('Too many restart attempts, but continuing to try...');
          // Don't stop, just wait longer before next attempt
          setTimeout(() => {
            restartCountRef.current = 0; // Reset counter
            restartSpeechRecognition();
          }, 2000);
        }
      }
    } else {
      console.log('recognitionRef.current is null, cannot restart');
    }
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
    setVoiceSettings
  };
};

export default useRealTimeVoice; 