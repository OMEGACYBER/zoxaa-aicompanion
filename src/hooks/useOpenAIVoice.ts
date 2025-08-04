import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OpenAIVoiceHookReturn {
  isRecording: boolean;
  isPlaying: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

const useOpenAIVoice = (): OpenAIVoiceHookReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

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

  const startRecording = useCallback(async () => {
    try {
      // Check for microphone permission first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Listening to your voice..."
      });
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert to wav for better OpenAI compatibility
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          formData.append('model', 'whisper-1');
          formData.append('language', 'en');

          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getOpenAIKey()}`,
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
          }

          const result = await response.json();
          setIsRecording(false);
          
          // Stop all tracks
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          
          toast({
            title: "Voice Processed",
            description: "Your message has been transcribed"
          });
          
          resolve(result.text || '');
        } catch (error) {
          setIsRecording(false);
          toast({
            title: "Transcription Error",
            description: "Failed to process your voice. Please try again.",
            variant: "destructive"
          });
          reject(error);
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording, toast]);

  const speak = useCallback(async (text: string) => {
    try {
      setIsPlaying(true);
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getOpenAIKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy', // You can change this to: alloy, echo, fable, onyx, nova, shimmer
          speed: 1.0
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS error: ${response.statusText}`);
      }

      const audioData = await response.arrayBuffer();
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
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
      setIsPlaying(false);
      toast({
        title: "Speech Error",
        description: "Failed to generate speech. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return {
    isRecording,
    isPlaying,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking
  };
};

export default useOpenAIVoice;