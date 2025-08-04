import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ZoxaaMemory {
  id: string;
  content: string;
  context: string;
  importance: 'low' | 'medium' | 'high';
  tags: string[];
  timestamp: Date;
  embedding?: number[];
}

export interface ZoxaaConversation {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  summary?: string;
  memories: string[]; // Memory IDs
  createdAt: Date;
  updatedAt: Date;
}

const useZoxaaMemory = () => {
  const [memories, setMemories] = useState<ZoxaaMemory[]>([]);
  const [conversations, setConversations] = useState<ZoxaaConversation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Load data from localStorage on mount
  useEffect(() => {
    const savedMemories = localStorage.getItem('zoxaa_memories');
    const savedConversations = localStorage.getItem('zoxaa_conversations');
    
    if (savedMemories) {
      try {
        const parsed = JSON.parse(savedMemories);
        setMemories(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load memories:', error);
      }
    }
    
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        setConversations(parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        })));
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('zoxaa_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('zoxaa_conversations', JSON.stringify(conversations));
  }, [conversations]);

  const getOpenAIKey = () => {
    const key = localStorage.getItem('openai_key');
    if (!key) {
      throw new Error('OpenAI API key not found');
    }
    return key;
  };

  // Generate embedding for similarity search
  const generateEmbedding = useCallback(async (text: string): Promise<number[]> => {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getOpenAIKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      return [];
    }
  }, []);

  // Extract important information and create memories
  const processConversationForMemories = useCallback(async (conversationText: string, context: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getOpenAIKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are Zoxaa's memory extraction system. Analyze the conversation and extract important memories that should be stored for future reference.

Extract information about:
- User preferences, goals, and aspirations
- Important life events or plans
- Skills, interests, and hobbies
- Relationships and social connections
- Professional background and career goals
- Personal challenges or concerns
- Decision-making patterns
- Values and beliefs

For each memory, provide:
1. A clear, concise description
2. Importance level (low, medium, high)
3. Relevant tags (max 5)

Return a JSON array of memories in this format:
[{
  "content": "User is interested in transitioning from marketing to product management",
  "importance": "high",
  "tags": ["career", "transition", "product-management", "goals"]
}]`
            },
            {
              role: 'user',
              content: `Context: ${context}\n\nConversation:\n${conversationText}`
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle the case where the API returns a string that's not valid JSON
      let extractedMemories = [];
      try {
        const content = result.choices[0].message.content;
        if (content && content.trim()) {
          extractedMemories = JSON.parse(content);
        }
      } catch (e) {
        console.warn('Failed to parse memory extraction response:', e);
        extractedMemories = [];
      }
      
      // Create and store memories
      const newMemories: ZoxaaMemory[] = [];
      for (const memory of extractedMemories) {
        const embedding = await generateEmbedding(memory.content);
        const newMemory: ZoxaaMemory = {
          id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          content: memory.content,
          context,
          importance: memory.importance,
          tags: memory.tags,
          timestamp: new Date(),
          embedding
        };
        newMemories.push(newMemory);
      }
      
      setMemories(prev => [...prev, ...newMemories]);
      return newMemories;
    } catch (error) {
      console.error('Failed to process memories:', error);
      toast({
        title: "Memory Processing Error",
        description: "Failed to extract memories from conversation",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [generateEmbedding, toast]);

  // Find relevant memories using similarity search
  const getRelevantMemories = useCallback(async (query: string, limit: number = 5): Promise<ZoxaaMemory[]> => {
    try {
      const queryEmbedding = await generateEmbedding(query);
      
      if (queryEmbedding.length === 0) {
        // Fallback to keyword search
        const keywords = query.toLowerCase().split(' ');
        return memories
          .filter(memory => 
            keywords.some(keyword => 
              memory.content.toLowerCase().includes(keyword) ||
              memory.tags.some(tag => tag.toLowerCase().includes(keyword))
            )
          )
          .sort((a, b) => {
            const importanceOrder = { high: 3, medium: 2, low: 1 };
            return importanceOrder[b.importance] - importanceOrder[a.importance];
          })
          .slice(0, limit);
      }

      // Calculate cosine similarity
      const memoriesWithSimilarity = memories
        .filter(memory => memory.embedding && memory.embedding.length > 0)
        .map(memory => {
          const similarity = cosineSimilarity(queryEmbedding, memory.embedding!);
          return { memory, similarity };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => item.memory);

      return memoriesWithSimilarity;
    } catch (error) {
      console.error('Failed to get relevant memories:', error);
      return [];
    }
  }, [memories, generateEmbedding]);

  // Create or update conversation
  const saveConversation = useCallback(async (
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>,
    conversationId?: string
  ): Promise<string> => {
    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    const context = `Conversation on ${new Date().toLocaleDateString()}`;
    
    // Extract memories from conversation
    const extractedMemories = await processConversationForMemories(conversationText, context);
    
    const conversation: ZoxaaConversation = {
      id: conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      messages,
      memories: extractedMemories.map(m => m.id),
      createdAt: conversationId ? conversations.find(c => c.id === conversationId)?.createdAt || new Date() : new Date(),
      updatedAt: new Date()
    };

    if (conversationId) {
      setConversations(prev => prev.map(c => c.id === conversationId ? conversation : c));
    } else {
      setConversations(prev => [...prev, conversation]);
    }

    return conversation.id;
  }, [conversations, processConversationForMemories]);

  const clearAllMemories = useCallback(() => {
    setMemories([]);
    setConversations([]);
    localStorage.removeItem('zoxaa_memories');
    localStorage.removeItem('zoxaa_conversations');
    toast({
      title: "Memory Cleared",
      description: "All memories and conversations have been deleted",
      variant: "destructive"
    });
  }, [toast]);

  const deleteMemory = useCallback((memoryId: string) => {
    setMemories(prev => prev.filter(m => m.id !== memoryId));
    toast({
      title: "Memory Deleted",
      description: "Memory has been removed"
    });
  }, [toast]);

  return {
    memories,
    conversations,
    isProcessing,
    getRelevantMemories,
    saveConversation,
    clearAllMemories,
    deleteMemory,
    processConversationForMemories
  };
};

// Helper function for cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  const dotProduct = a.reduce((sum, a_i, i) => sum + a_i * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, a_i) => sum + a_i * a_i, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, b_i) => sum + b_i * b_i, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
}

export default useZoxaaMemory;