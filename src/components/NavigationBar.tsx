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
      <div className="container max-w-5xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Logo - RESPONSIVE: Smaller on mobile */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Walking Duck GIF - RESPONSIVE: Smaller on mobile */}
            <img 
              src="https://media.tenor.com/KuBAp-1E3GgAAAAm/pato-aaa.webp" 
              alt="Duck mascot"
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0"
            />
            {/* ELO Text with Motto - RESPONSIVE */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-lg sm:text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Elo
              </span>
              {/* RESPONSIVE: Hide tagline on mobile */}
              <span className="hidden sm:block text-[10px] font-medium tracking-[0.15em] uppercase text-primary/60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Onwards and Upwards
              </span>
            </div>
          </Link>

          {/* Navigation - RESPONSIVE */}
          {user && (
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Navigation Links - RESPONSIVE: Hide some on mobile */}
              <Link
                to="/"
                className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Overview
              </Link>
              <Link
                to="/practice"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Practice
              </Link>
              <Link
                to="/history"
                className="hidden sm:block text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                History
              </Link>
              <Link
                to="/pond"
                className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                The Pond
              </Link>

              {/* User Menu - RESPONSIVE: More compact on mobile */}
              <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-3 pl-2 sm:pl-3 border-l border-border">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs sm:text-sm font-semibold text-primary">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* RESPONSIVE: Hide email on very small screens */}
                  <span className="hidden sm:block text-xs sm:text-sm text-foreground truncate max-w-[100px] lg:max-w-none">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                {/* RESPONSIVE: Icon-only on mobile, text on desktop */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">↗</span>
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