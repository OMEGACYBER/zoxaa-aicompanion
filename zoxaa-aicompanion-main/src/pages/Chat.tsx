import { useState } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import VoiceChatInterface from "@/components/chat/VoiceChatInterface";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Brain, 
  FileText, 
  Home,
  Plus,
  Target,
  Clock,
  Sparkles,
  Mic,
  MessageCircle,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

const Chat = () => {
  const [activeTab, setActiveTab] = useState<"chat" | "plans" | "memories">("chat");
  const [chatMode, setChatMode] = useState<"text" | "voice">("text");

  const [recentPlans] = useState([
    {
      id: "1",
      title: "Career Transition Plan",
      status: "active",
      progress: 60,
      lastUpdated: "2 hours ago"
    },
    {
      id: "2", 
      title: "Weekend Trip to Rishikesh",
      status: "completed",
      progress: 100,
      lastUpdated: "1 day ago"
    },
    {
      id: "3",
      title: "Learn Advanced React",
      status: "active",
      progress: 30,
      lastUpdated: "3 days ago"
    }
  ]);

  const [recentMemories] = useState([
    {
      id: "1",
      content: "User mentioned wanting to transition from marketing to product management",
      timestamp: "Today, 2:30 PM",
      importance: "high"
    },
    {
      id: "2",
      content: "Prefers adventure travel and yoga retreats for vacations",
      timestamp: "Yesterday, 4:15 PM", 
      importance: "medium"
    },
    {
      id: "3",
      content: "Working on improving technical skills, particularly React and TypeScript",
      timestamp: "3 days ago",
      importance: "medium"
    }
  ]);

  return (
    <div className="h-screen bg-gradient-background flex">
      {/* Sidebar */}
      <div className="w-80 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Zoxaa
              </h1>
              <p className="text-sm text-muted-foreground">Your AI Partner</p>
            </div>
          </div>

          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {[
              { id: "chat", label: "Chat", icon: Brain },
              { id: "plans", label: "Plans", icon: FileText },
              { id: "memories", label: "Memory", icon: Sparkles }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex-1 gap-2"
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Chat Mode Toggle */}
          {activeTab === "chat" && (
            <div className="mt-3">
              <div className="flex bg-muted rounded-lg p-1">
                <Button 
                  variant={chatMode === "text" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setChatMode("text")}
                  className="flex-1 gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Text
                </Button>
                <Button 
                  variant={chatMode === "voice" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setChatMode("voice")}
                  className="flex-1 gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Voice
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "chat" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Plus className="w-4 h-4" />
                    New Plan
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Target className="w-4 h-4" />
                    Set Goal
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Sparkles className="w-4 h-4" />
                    Review Memories
                  </Button>
                  <Button 
                    variant="empathy" 
                    className="w-full justify-start gap-2" 
                    size="sm"
                    onClick={() => window.location.href = '/voice-chat'}
                  >
                    <Phone className="w-4 h-4" />
                    Voice Call
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Recent Conversations</h3>
                <div className="space-y-1">
                  {[
                    "Career transition planning",
                    "Weekend trip ideas",
                    "Learning new skills",
                    "Project feedback session"
                  ].map((topic, index) => (
                    <Button key={index} variant="ghost" className="w-full justify-start text-sm" size="sm">
                      <Clock className="w-3 h-3 mr-2" />
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "plans" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Your Plans</h3>
                <Button variant="hero" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {recentPlans.map((plan) => (
                  <Card key={plan.id} className="p-3 bg-gradient-card hover:shadow-soft transition-smooth cursor-pointer">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{plan.title}</h4>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          plan.status === "active" 
                            ? "bg-plan-success/20 text-plan-success" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {plan.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{plan.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-plan-success h-2 rounded-full transition-all"
                            style={{ width: `${plan.progress}%` }}
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Updated {plan.lastUpdated}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "memories" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Key Memories</h3>
                <Button variant="memory" size="sm">
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {recentMemories.map((memory) => (
                  <Card key={memory.id} className="p-3 bg-gradient-card border-memory-glow/20">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-relaxed">{memory.content}</p>
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0 mt-2",
                          memory.importance === "high" 
                            ? "bg-accent" 
                            : "bg-muted-foreground"
                        )} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {memory.timestamp}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>

        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1">
        {chatMode === "voice" ? (
          <VoiceChatInterface />
        ) : (
          <ChatInterface />
        )}
      </div>


    </div>
  );
};

export default Chat;