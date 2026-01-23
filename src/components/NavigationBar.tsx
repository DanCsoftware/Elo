import { Link, useLocation } from 'react-router-dom';
import alpacaMascot from '@/assets/alpaca-mascot.png';

const NavigationBar = () => {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Overview' },
    { to: '/practice', label: 'Practice' },
    { to: '/history', label: 'History' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex items-center h-12">
          <Link to="/" className="flex items-center gap-2 mr-8">
            <img src={alpacaMascot} alt="Alpa mascot" className="w-7 h-7 object-contain" />
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
      </div>
    </header>
  );
};

export default NavigationBar;
