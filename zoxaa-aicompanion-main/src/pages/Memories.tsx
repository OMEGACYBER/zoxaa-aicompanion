import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Brain, Search, Calendar, Hash, AlertCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface Memory {
  id: string;
  content: string;
  context: string;
  importance: string;
  tags: string[];
  emotion_context: any;
  created_at: string;
  updated_at: string;
}

const Memories = () => {
  const [user, setUser] = useState<User | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      await loadMemories();
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    filterMemories();
  }, [memories, searchTerm, selectedImportance]);

  const loadMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Failed to load memories:', error);
      toast({
        title: "Error",
        description: "Failed to load your memories",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterMemories = () => {
    let filtered = memories;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(memory => 
        memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by importance
    if (selectedImportance !== 'all') {
      filtered = filtered.filter(memory => memory.importance === selectedImportance);
    }

    setFilteredMemories(filtered);
  };

  const deleteMemory = async (memoryId: string) => {
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;

      setMemories(memories.filter(m => m.id !== memoryId));
      toast({
        title: "Memory Deleted",
        description: "The memory has been removed"
      });
    } catch (error) {
      console.error('Failed to delete memory:', error);
      toast({
        title: "Error",
        description: "Failed to delete memory",
        variant: "destructive"
      });
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEmotionIcon = (emotion: any) => {
    if (!emotion) return null;
    
    const emotions = ['😊', '😢', '😠', '😰', '😴', '🤔', '😍', '😎'];
    return emotions[Math.floor(Math.random() * emotions.length)];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/chat')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Chat</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Memories
              </h1>
              <p className="text-muted-foreground">Your conversations and moments with Zoxaa</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span>{memories.length} memories stored</span>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search memories, tags, or context..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                {['all', 'high', 'medium', 'low'].map((importance) => (
                  <Button
                    key={importance}
                    variant={selectedImportance === importance ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedImportance(importance)}
                    className="capitalize"
                  >
                    {importance === 'all' ? 'All' : importance}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memories List */}
        <div className="space-y-4">
          {filteredMemories.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {memories.length === 0 ? 'No memories yet' : 'No matching memories'}
                </h3>
                <p className="text-muted-foreground">
                  {memories.length === 0 
                    ? 'Start chatting with Zoxaa to create your first memories'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMemories.map((memory) => (
              <Card key={memory.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getImportanceColor(memory.importance)}>
                          {memory.importance} importance
                        </Badge>
                        {memory.emotion_context && (
                          <span className="text-lg">
                            {getEmotionIcon(memory.emotion_context)}
                          </span>
                        )}
                      </div>
                      
                      <CardTitle className="text-base font-medium mb-2">
                        {memory.content}
                      </CardTitle>
                      
                      {memory.context && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Context: {memory.context}
                        </p>
                      )}
                      
                      {memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {memory.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(memory.created_at).toLocaleDateString()}</span>
                          <span>at {new Date(memory.created_at).toLocaleTimeString()}</span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMemory(memory.id)}
                          className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        {/* Memory Stats */}
        {memories.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-sm">Memory Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {memories.filter(m => m.importance === 'high').length}
                  </div>
                  <div className="text-xs text-muted-foreground">High Priority</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {memories.filter(m => m.importance === 'medium').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Medium Priority</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {memories.filter(m => m.importance === 'low').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Low Priority</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {memories.reduce((acc, m) => acc + m.tags.length, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Tags</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Memories;