import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const NavigationBar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="border-b border-border bg-card">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo - ELO with Walking Duck */}
          <Link to="/" className="flex items-center gap-3">
            {/* Walking Duck GIF */}
            <img 
              src="https://media.tenor.com/KuBAp-1E3GgAAAAm/pato-aaa.webp" 
              alt="Duck mascot"
              className="w-8 h-8 object-contain"
            />
            {/* ELO Text - Technical Font */}
            <span className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Elo
            </span>
          </Link>

          {/* Navigation */}
          {user && (
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Overview
              </Link>
              <Link
                to="/practice"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Practice
              </Link>
              <Link
                to="/history"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                History
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-3 ml-3 pl-3 border-l border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-foreground">{user.email?.split('@')[0]}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
