import { ReactNode } from 'react';
import NavigationBar from './NavigationBar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
