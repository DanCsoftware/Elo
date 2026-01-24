import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import SkillBar from '@/components/SkillBar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, signInWithGoogle } = useAuth();
  const { stats, loading } = useUserStats();

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-3">Welcome to Alpa</h1>
            <p className="text-muted-foreground text-lg">
              Practice PM interviews with AI-powered feedback
            </p>
          </div>
          <Button onClick={signInWithGoogle} size="lg">
            Sign In with Google to Start
          </Button>
        </div>
      </Layout>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  // Map category names for display
  const categoryDisplayNames: { [key: string]: string } = {
    'strategy': 'Product Strategy',
    'metrics': 'Metrics & Analytics',
    'prioritization': 'Prioritization',
    'design': 'Product Design',
  };

  // Convert category scores to SkillBar format
  const skillProgress = Object.entries(stats?.categoryScores || {}).map(([category, score]) => ({
    name: categoryDisplayNames[category] || category,
    percentage: Math.round(score * 100),
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
          <StatCard
            label="Solved"
            value={`${stats?.totalSolved || 0}/200`}
          />
          <StatCard
            label="Streak"
            value={stats?.streak || 0}
            suffix=" days"
          />
          <StatCard
            label="Avg Score"
            value={stats?.avgScore.toFixed(1) || '0.0'}
          />
          <StatCard
            label="This Week"
            value={`${stats?.thisWeekChange > 0 ? '+' : ''}${stats?.thisWeekChange.toFixed(0)}%`}
          />
          <div className="bg-card border border-border p-4 col-span-2 md:col-span-1 lg:col-span-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Difficulty</p>
            <div className="flex items-center gap-4 font-mono text-sm">
              <span className="text-success">E: {stats?.difficultyBreakdown.easy || 0}</span>
              <span className="text-warning">M: {stats?.difficultyBreakdown.medium || 0}</span>
              <span className="text-destructive">H: {stats?.difficultyBreakdown.hard || 0}</span>
            </div>
          </div>
        </section>

        {/* Category Performance */}
        <section className="bg-card border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Category Performance</h2>
          </div>
          {skillProgress.length > 0 ? (
            <div className="space-y-3">
              {skillProgress.map((skill) => (
                <SkillBar
                  key={skill.name}
                  name={skill.name}
                  percentage={skill.percentage}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No data yet. Start practicing to see your category performance!
            </p>
          )}
        </section>

        {/* Action Button */}
        <section className="flex gap-3">
          <Button variant="default" size="sm" asChild>
            <Link to="/practice">
              Practice
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/history">
              History
            </Link>
          </Button>
        </section>
      </div>
    </Layout>
  );
};

export default Index;