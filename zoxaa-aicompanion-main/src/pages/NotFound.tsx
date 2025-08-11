import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Looks like this page wandered off. Let's get you back to Zoxaa.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-primary text-primary-foreground rounded-lg hover:shadow-glow transition-smooth"
          >
            Return to Home
          </a>
          <a 
            href="/chat" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-smooth"
          >
            Open Chat
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
