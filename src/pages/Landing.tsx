import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Brain, 
  MessageSquare, 
  Target, 
  Shield, 
  Zap, 
  Heart,
  CheckCircle,
  Star
} from "lucide-react";

const Landing = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  // Redirect any click on the landing page to auth
  useEffect(() => {
    const handleClick = () => {
      navigate('/auth');
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [navigate]);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleSelectPlan = (plan: string) => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-background cursor-pointer">
      <Navigation onSignIn={handleSignIn} onGetStarted={handleGetStarted} />
      
      <div className="fixed bottom-4 right-4 z-50 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm animate-pulse">
        Click anywhere to get started
      </div>
      


      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Why Zoxaa is{" "}
              <span className="bg-gradient-empathy bg-clip-text text-transparent">
                Different
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Most AI assistants are tools. Zoxaa is a cognitive partner that grows with you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Perfect Memory",
                description: "Zoxaa remembers every conversation, your preferences, goals, and context. No more repeating yourself.",
                color: "memory-glow"
              },
              {
                icon: MessageSquare,
                title: "Honest Feedback",
                description: "Get real, constructive criticism. Zoxaa challenges your ideas to make them better, not just agreeable.",
                color: "accent"
              },
              {
                icon: Target,
                title: "Strategic Planning",
                description: "Create detailed, actionable plans together. Zoxaa helps you think through every detail and potential obstacle.",
                color: "plan-success"
              },
              {
                icon: Zap,
                title: "Voice & Text",
                description: "Switch seamlessly between voice and text. Have natural conversations that sync across all your devices.",
                color: "primary"
              },
              {
                icon: Shield,
                title: "Privacy First",
                description: "Your thoughts and data are sacred. Everything is encrypted and you have full control over your information.",
                color: "secondary"
              },
              {
                icon: Heart,
                title: "Empathetic AI",
                description: "Zoxaa understands context and emotion. It's designed to be supportive while still being honest and helpful.",
                color: "accent"
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="p-6 bg-gradient-card hover:shadow-soft transition-smooth">
                  <div className="space-y-4">
                    <div className={`w-12 h-12 bg-${feature.color}/20 rounded-xl flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 text-${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Trusted by forward-thinking individuals</h3>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-accent text-accent" />
              ))}
              <span className="ml-2 text-muted-foreground">4.9/5 from early users</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Zoxaa remembers details from months ago and connects them to current conversations. It's like having a personal advisor who never forgets.",
                author: "Priya K., Marketing Manager"
              },
              {
                quote: "Unlike other AI, Zoxaa actually challenges my ideas and helps me think deeper. It's become essential for my strategic planning.",
                author: "Aarav S., Architecture Student"
              },
              {
                quote: "The planning feature is incredible. We built my entire career transition strategy together, and Zoxaa keeps me accountable.",
                author: "Sarah M., Product Designer"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6 bg-gradient-card">
                <div className="space-y-4">
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-medium">{testimonial.author}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section id="about" className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold">
            Ready to meet your{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              cognitive partner?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of users who have found their ideal AI companion. Start free, upgrade when you're ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
              <Brain className="w-5 h-5" />
              Start Your Journey with Zoxaa
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Zoxaa
                </span>
              </div>
              <p className="text-muted-foreground">
                Your empathetic AI cognitive partner that remembers, understands, and grows with you.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <div className="space-y-2 text-muted-foreground">
                <p>Features</p>
                <p>Pricing</p>
                <p>API</p>
                <p>Enterprise</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <div className="space-y-2 text-muted-foreground">
                <p>About</p>
                <p>Blog</p>
                <p>Careers</p>
                <p>Contact</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2 text-muted-foreground">
                <p>Privacy Policy</p>
                <p>Terms of Service</p>
                <p>Cookie Policy</p>
                <p>GDPR</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
            <p>&copy; 2025 Zoxaa. All rights reserved. Built with empathy and intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;