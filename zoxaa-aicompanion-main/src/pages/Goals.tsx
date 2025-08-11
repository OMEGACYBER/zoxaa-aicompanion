import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, ArrowLeft, Target, Clock, CheckCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface Plan {
  id: string;
  title: string;
  description: string;
  goals: string[];
  status: string;
  completion_percentage: number;
  created_at: string;
}

const Goals = () => {
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState(['']);
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
      await loadPlans();
    };

    checkAuth();
  }, [navigate]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast({
        title: "Error",
        description: "Failed to load your plans",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addGoal = () => {
    setGoals([...goals, '']);
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  const removeGoal = (index: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index));
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const filteredGoals = goals.filter(goal => goal.trim() !== '');
      
      const { error } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          title,
          description,
          goals: filteredGoals,
          status: 'active',
          completion_percentage: 0
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your goal has been created successfully"
      });

      // Reset form
      setTitle('');
      setDescription('');
      setGoals(['']);
      setIsCreating(false);
      
      // Reload plans
      await loadPlans();
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast({
        title: "Error",
        description: "Failed to create your goal",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'paused':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading && plans.length === 0) {
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
                Goals & Plans
              </h1>
              <p className="text-muted-foreground">Create and track your life goals with Zoxaa</p>
            </div>
          </div>
          
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Goal</span>
            </Button>
          )}
        </div>

        {isCreating && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePlan} className="space-y-6">
                <div>
                  <Input
                    placeholder="Goal title (e.g., 'Learn to code', 'Get fit')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Textarea
                    placeholder="Describe your goal in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Specific objectives:</label>
                  {goals.map((goal, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        placeholder={`Objective ${index + 1}`}
                        value={goal}
                        onChange={(e) => updateGoal(index, e.target.value)}
                        required={index === 0}
                      />
                      {goals.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeGoal(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addGoal}
                    className="w-full"
                  >
                    Add Another Objective
                  </Button>
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Goal'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {plans.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first goal and let Zoxaa help you achieve it
                </p>
                {!isCreating && (
                  <Button onClick={() => setIsCreating(true)}>
                    Create Your First Goal
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getStatusIcon(plan.status)}
                        <span>{plan.title}</span>
                      </CardTitle>
                      <p className="text-muted-foreground mt-2">{plan.description}</p>
                    </div>
                    <Badge variant={plan.status === 'completed' ? 'default' : 'secondary'}>
                      {plan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Objectives:</h4>
                      <ul className="space-y-1">
                        {plan.goals.map((goal, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center space-x-2">
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Progress: {plan.completion_percentage}%</span>
                      <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${plan.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Goals;