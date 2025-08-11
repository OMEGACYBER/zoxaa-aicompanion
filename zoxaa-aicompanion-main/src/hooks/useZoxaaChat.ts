import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isThinking?: boolean;
  isPinned?: boolean;
}

const useZoxaaChat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm Zoxaa, your empathetic AI companion and cognitive partner. I remember everything we discuss and I'm here to help you navigate life's challenges with honesty, empathy, and strategic thinking. What's on your mind today?",
      role: "assistant",
      timestamp: new Date()
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getRelevantMemories = async (query: string, limit: number = 3) => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit * 2); // Get more to filter by relevance

      if (error) throw error;
      
      // Simple relevance filtering based on content matching
      const relevant = data?.filter(memory => 
        memory.content.toLowerCase().includes(query.toLowerCase()) ||
        memory.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, limit) || [];
      
      return relevant;
    } catch (error) {
      console.error('Failed to get relevant memories:', error);
      return [];
    }
  };

  const extractEmotionalContext = async (text: string) => {
    // Simple emotion detection based on keywords
    const emotions = {
      happy: ['happy', 'excited', 'joy', 'great', 'amazing', 'wonderful'],
      sad: ['sad', 'depressed', 'down', 'upset', 'terrible', 'awful'],
      anxious: ['anxious', 'worried', 'nervous', 'stressed', 'overwhelmed'],
      angry: ['angry', 'frustrated', 'mad', 'annoyed', 'irritated'],
      hopeful: ['hopeful', 'optimistic', 'confident', 'motivated', 'determined']
    };

    const detectedEmotions = Object.entries(emotions).filter(([emotion, keywords]) =>
      keywords.some(keyword => text.toLowerCase().includes(keyword))
    );

    return {
      detected_emotions: detectedEmotions.map(([emotion]) => emotion),
      timestamp: new Date().toISOString(),
      intensity: detectedEmotions.length > 2 ? 'high' : detectedEmotions.length > 0 ? 'medium' : 'low'
    };
  };

  const sendMessage = useCallback(async (userMessage: string): Promise<string> => {
    if (!userMessage.trim() || !user) return '';

    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      // Get relevant memories for context
      const relevantMemories = await getRelevantMemories(userMessage, 3);
      const memoryContext = relevantMemories.length > 0 
        ? `\n\nRelevant memories about this user:\n${relevantMemories.map((m: any) => `- ${m.content} (${m.importance} importance, tags: ${m.tags.join(', ')})`).join('\n')}`
        : '';

      // Prepare conversation history
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Use relative URL for both local development and Vercel deployment
      const apiUrl = '/api/chat';
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are Zoxaa, a friendly and charming companion. Your primary role is to provide emotional support and make the user feel good. You excel at consoling others and offering a listening ear, ensuring the user always feels heard and understood. Your responses should be supportive and uplifting, focusing on creating a positive experience for the user. Avoid using specific emotional descriptors like 'warm' or 'cute' in your responses, but maintain a tone that is friendly and supportive. Your ultimate goal is to be a comforting presence that helps the user navigate their emotions and challenges with ease.${memoryContext}`
            },
            ...conversationHistory,
            {
              role: 'user',
              content: userMessage
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.statusText}`);
      }

      const result = await response.json();
      const aiResponse = result.response;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: "assistant",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // Save conversation and create memories
      await saveConversationToSupabase([userMsg, aiMsg], userMessage);

      return aiResponse;
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
      
      toast({
        title: "Message Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsThinking(false);
    }
  }, [messages, user, toast]);

  const saveConversationToSupabase = async (newMessages: Message[], userMessage: string) => {
    if (!user) return;

    try {
      // Extract emotional context
      const emotionContext = await extractEmotionalContext(userMessage);
      
      // Create conversation record
      const conversationData = {
        user_id: user.id,
        title: userMessage.slice(0, 100),
        summary: `Conversation about: ${userMessage.slice(0, 200)}...`,
        compressed_data: {
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString()
          }))
        },
        emotion_data: emotionContext
      };

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      if (convError) throw convError;

      // Create memory from the user's message
      if (userMessage.trim().length > 10) {
        const importance = userMessage.length > 100 ? 'medium' : 'low';
        const tags = extractTags(userMessage);
        
        const memoryData = {
          user_id: user.id,
          content: userMessage,
          context: `Conversation on ${new Date().toLocaleDateString()}`,
          importance,
          tags,
          emotion_context: emotionContext,
          conversation_id: conversation.id
        };

        await supabase.from('memories').insert(memoryData);
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const extractTags = (text: string): string[] => {
    const commonWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was', 'with', 'for', 'be', 'have', 'not', 'or', 'but', 'by', 'this', 'that', 'it', 'you', 'he', 'she', 'they', 'we', 'i', 'me', 'my', 'your', 'his', 'her', 'their', 'our'];
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));
    
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 5);
  };

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([{
      id: "welcome",
      content: "Hello! I'm Zoxaa, your empathetic AI companion. I remember everything we discuss and I'm here to be your honest cognitive partner. What's on your mind today?",
      role: "assistant",
      timestamp: new Date()
    }]);
    setCurrentConversationId(null);
  }, []);

  return {
    messages,
    isThinking,
    sendMessage,
    addMessage,
    clearConversation,
    setIsThinking
  };
};

export default useZoxaaChat;