import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ZoxaaPlanStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface ZoxaaPlan {
  id: string;
  title: string;
  description: string;
  goals: string[];
  steps: ZoxaaPlanStep[];
  status: 'active' | 'completed' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  completionPercentage: number;
  category?: string;
  tags: string[];
}

const useZoxaaPlans = () => {
  const [plans, setPlans] = useState<ZoxaaPlan[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Load plans from localStorage on mount
  useEffect(() => {
    const savedPlans = localStorage.getItem('zoxaa_plans');
    if (savedPlans) {
      try {
        const parsed = JSON.parse(savedPlans);
        setPlans(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          steps: p.steps.map((s: any) => ({
            ...s,
            dueDate: s.dueDate ? new Date(s.dueDate) : undefined
          }))
        })));
      } catch (error) {
        console.error('Failed to load plans:', error);
      }
    }
  }, []);

  // Save plans to localStorage whenever plans change
  useEffect(() => {
    localStorage.setItem('zoxaa_plans', JSON.stringify(plans));
  }, [plans]);

  const getOpenAIKey = () => {
    const key = localStorage.getItem('openai_key');
    if (!key) {
      throw new Error('OpenAI API key not found');
    }
    return key;
  };

  // Calculate completion percentage
  const calculateCompletion = useCallback((steps: ZoxaaPlanStep[]): number => {
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, []);

  // Generate detailed plan using AI
  const generatePlanSteps = useCallback(async (title: string, description: string, goals: string[]): Promise<ZoxaaPlanStep[]> => {
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
              content: `You are Zoxaa's strategic planning system. Create a detailed, actionable plan with specific steps.

For each step, provide:
1. A clear, specific title
2. A detailed description of what needs to be done
3. Estimated priority level (low, medium, high)
4. Logical sequence and dependencies

Make steps:
- Specific and actionable
- Realistic and achievable
- Properly sequenced
- Include both preparation and execution phases
- Consider potential obstacles

Return a JSON array of steps in this format:
[{
  "title": "Research target companies in product management",
  "description": "Create a list of 20 companies you'd like to work for, research their product teams, recent launches, and company culture. Use LinkedIn, company websites, and Glassdoor.",
  "priority": "high"
}]`
            },
            {
              role: 'user',
              content: `Plan Title: ${title}\nDescription: ${description}\nGoals: ${goals.join(', ')}`
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      const generatedSteps = JSON.parse(result.choices[0].message.content);
      
      return generatedSteps.map((step: any, index: number) => ({
        id: `step_${Date.now()}_${index}`,
        title: step.title,
        description: step.description,
        completed: false,
        priority: step.priority as 'low' | 'medium' | 'high'
      }));
    } catch (error) {
      console.error('Failed to generate plan steps:', error);
      return [];
    }
  }, []);

  // Create new plan
  const createPlan = useCallback(async (title: string, description: string, goals: string[], category?: string): Promise<ZoxaaPlan> => {
    setIsCreating(true);
    try {
      const steps = await generatePlanSteps(title, description, goals);
      
      const newPlan: ZoxaaPlan = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title,
        description,
        goals,
        steps,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        completionPercentage: 0,
        category,
        tags: []
      };

      setPlans(prev => [newPlan, ...prev]);
      
      toast({
        title: "Plan Created",
        description: `"${title}" has been created with ${steps.length} steps`
      });
      
      return newPlan;
    } catch (error) {
      toast({
        title: "Plan Creation Error",
        description: "Failed to create plan. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [generatePlanSteps, toast]);

  // Update plan
  const updatePlan = useCallback((planId: string, updates: Partial<ZoxaaPlan>) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const updatedPlan = { ...plan, ...updates, updatedAt: new Date() };
        updatedPlan.completionPercentage = calculateCompletion(updatedPlan.steps);
        return updatedPlan;
      }
      return plan;
    }));
  }, [calculateCompletion]);

  // Update step
  const updateStep = useCallback((planId: string, stepId: string, updates: Partial<ZoxaaPlanStep>) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const updatedSteps = plan.steps.map(step => 
          step.id === stepId ? { ...step, ...updates } : step
        );
        const updatedPlan = {
          ...plan,
          steps: updatedSteps,
          updatedAt: new Date(),
          completionPercentage: calculateCompletion(updatedSteps)
        };
        return updatedPlan;
      }
      return plan;
    }));
    
    toast({
      title: "Step Updated",
      description: "Plan step has been updated"
    });
  }, [calculateCompletion, toast]);

  // Add step to plan
  const addStep = useCallback((planId: string, step: Omit<ZoxaaPlanStep, 'id'>) => {
    const newStep: ZoxaaPlanStep = {
      ...step,
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const updatedSteps = [...plan.steps, newStep];
        return {
          ...plan,
          steps: updatedSteps,
          updatedAt: new Date(),
          completionPercentage: calculateCompletion(updatedSteps)
        };
      }
      return plan;
    }));
    
    toast({
      title: "Step Added",
      description: "New step added to plan"
    });
  }, [calculateCompletion, toast]);

  // Delete plan
  const deletePlan = useCallback((planId: string) => {
    setPlans(prev => prev.filter(plan => plan.id !== planId));
    toast({
      title: "Plan Deleted",
      description: "Plan has been removed"
    });
  }, [toast]);

  // Get plans by status
  const getPlansByStatus = useCallback((status: ZoxaaPlan['status']) => {
    return plans.filter(plan => plan.status === status);
  }, [plans]);

  // Get active plans
  const getActivePlans = useCallback(() => {
    return getPlansByStatus('active');
  }, [getPlansByStatus]);

  return {
    plans,
    isCreating,
    createPlan,
    updatePlan,
    updateStep,
    addStep,
    deletePlan,
    getPlansByStatus,
    getActivePlans
  };
};

export default useZoxaaPlans;