import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  isLoggedIn?: boolean;
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

const Navigation = ({ isLoggedIn = false, onSignIn, onGetStarted }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Zoxaa
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/70 hover:text-foreground transition-smooth">
              Features
            </a>
            <a href="#pricing" className="text-foreground/70 hover:text-foreground transition-smooth">
              Pricing
            </a>
            <a href="#about" className="text-foreground/70 hover:text-foreground transition-smooth">
              About
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <Button variant="hero" onClick={onGetStarted}>
                Open Zoxaa
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={onSignIn}>
                  Sign In
                </Button>
                <Button variant="hero" onClick={onGetStarted}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden transition-all duration-300 ease-in-out",
          isMobileMenuOpen 
            ? "max-h-64 opacity-100" 
            : "max-h-0 opacity-0 overflow-hidden"
        )}>
          <div className="py-4 space-y-4">
            <a href="#features" className="block text-foreground/70 hover:text-foreground transition-smooth">
              Features
            </a>
            <a href="#pricing" className="block text-foreground/70 hover:text-foreground transition-smooth">
              Pricing
            </a>
            <a href="#about" className="block text-foreground/70 hover:text-foreground transition-smooth">
              About
            </a>
            <div className="pt-4 space-y-2">
              {isLoggedIn ? (
                <Button variant="hero" className="w-full" onClick={onGetStarted}>
                  Open Zoxaa
                </Button>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" onClick={onSignIn}>
                    Sign In
                  </Button>
                  <Button variant="hero" className="w-full" onClick={onGetStarted}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;