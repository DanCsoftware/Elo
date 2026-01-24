import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import alpacaMascot from '@/assets/alpaca-mascot.png';

const NavigationBar = () => {
  const location = useLocation();
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  const links = [
    { to: '/', label: 'Overview' },
    { to: '/practice', label: 'Practice' },
    { to: '/history', label: 'History' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Left side - Logo and Nav */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 mr-8">
              <img 
                src={alpacaMascot} 
                alt="Alpa mascot" 
                className="w-7 h-7 object-contain transition-transform duration-300 hover:rotate-12 hover:scale-110" 
              />
              <span className="text-sm font-semibold text-foreground">Alpa</span>
            </Link>
            
            <nav className="flex items-center gap-1">
              {links.map((link) => {
                const isActive = location.pathname === link.to || 
                  (link.to === '/practice' && location.pathname === '/feedback');
                
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'text-foreground bg-secondary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side - Auth */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : user ? (
              <>
                <div className="flex items-center gap-2">
                  <img 
                    src={user.user_metadata?.avatar_url} 
                    alt={user.user_metadata?.name || 'User'} 
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-xs text-muted-foreground">
                    {user.user_metadata?.name || user.email}
                  </span>
                </div>
                <Button 
                  onClick={signOut} 
                  variant="ghost" 
                  size="sm"
                  className="h-7 text-xs"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                onClick={signInWithGoogle}
                variant="default"
                size="sm"
                className="h-7 text-xs"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavigationBar;