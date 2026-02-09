import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import SkillBar from '@/components/SkillBar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { useRatingPercentile } from '@/hooks/useRatingPercentile';
import { RatingChart } from '@/components/RatingChart';
import { FocusAreas } from '@/components/FocusAreas';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const Index = () => {
  const { user, signInWithGoogle } = useAuth();
  const { stats, loading } = useUserStats();
  const { percentile, totalUsers, loading: percentileLoading } = useRatingPercentile(stats?.eloRating || 1200);
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [resets, setResets] = useState<any[]>([]);

  // Fetch sessions and resets for rating chart
  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('created_at, elo_after, elo_change')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!sessionsError && sessionsData) {
        setSessions(sessionsData);
      }

      // Fetch resets
      const { data: resetsData, error: resetsError } = await supabase
        .from('elo_resets')
        .select('reset_at, elo_before, elo_after')
        .eq('user_id', user.id)
        .order('reset_at', { ascending: true });

      if (!resetsError && resetsData) {
        setResets(resetsData);
      }
    }

    fetchData();
  }, [user]);

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 px-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">Welcome to Elo</h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Practice PM interviews with AI-powered feedback
            </p>
          </div>
          <Button onClick={signInWithGoogle} size="lg" className="w-full sm:w-auto">
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
    percentage: Math.round(score * 10),
  }));

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Grid - RESPONSIVE: Stack to 1 column on mobile */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
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
          <div className="bg-card border border-border p-3 sm:p-4 col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Difficulty</p>
            <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs sm:text-sm">
              <span className="text-success">E: {stats?.difficultyBreakdown.easy || 0}</span>
              <span className="text-warning">M: {stats?.difficultyBreakdown.medium || 0}</span>
              <span className="text-destructive">H: {stats?.difficultyBreakdown.hard || 0}</span>
            </div>
          </div>
        </section>

        {/* Rating Journey - RESPONSIVE: Smaller padding, scrollable chart */}
        {stats && stats.totalSolved > 0 && (
          <section className="bg-card border border-border p-3 sm:p-5 space-y-3 sm:space-y-4 overflow-hidden">
            {/* Percentile Badge */}
            {!percentileLoading && percentile !== null && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold text-primary">
                  Top {percentile}% of {totalUsers} users
                </span>
              </div>
            )}

            {/* Rating Chart - RESPONSIVE: Horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
              <div className="min-w-[600px]">
                <RatingChart 
                  sessions={sessions}
                  resets={resets}
                  currentRating={stats.eloRating}
                />
              </div>
            </div>
          </section>
        )}

        {/* Focus Areas - RESPONSIVE: Smaller padding */}
        {stats && stats.totalSolved >= 5 && (
          <section className="bg-card border border-border p-3 sm:p-5">
            <FocusAreas />
          </section>
        )}

        {/* Elo Rating Display - RESPONSIVE: Stack on mobile */}
        {stats && (
          <section className="bg-card border border-border p-3 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide">
                Your PM Rating
              </h2>
              <span className="text-xs text-muted-foreground">
                Elo System
              </span>
            </div>
            
            {/* RESPONSIVE: Stack rating and description on mobile */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="text-4xl sm:text-5xl font-bold text-primary">
                {stats.eloRating}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {stats.eloRating < 1000 && 'Entry Level PM'}
                  {stats.eloRating >= 1000 && stats.eloRating < 1200 && 'Associate PM'}
                  {stats.eloRating >= 1200 && stats.eloRating < 1400 && 'PM'}
                  {stats.eloRating >= 1400 && stats.eloRating < 1600 && 'Senior PM'}
                  {stats.eloRating >= 1600 && stats.eloRating < 1800 && 'Staff PM'}
                  {stats.eloRating >= 1800 && stats.eloRating < 2000 && 'Principal PM'}
                  {stats.eloRating >= 2000 && 'Legendary PM'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Practice to increase your rating
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Category Performance - RESPONSIVE: Smaller padding */}
        <section className="bg-card border border-border p-3 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide">
              Category Performance
            </h2>
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
            <p className="text-muted-foreground text-xs sm:text-sm">
              No data yet. Start practicing to see your category performance!
            </p>
          )}
        </section>

        {/* Action Buttons - RESPONSIVE: Stack on mobile, full width */}
        <section className="flex flex-col sm:flex-row gap-3">
          <Button variant="default" size="sm" asChild className="w-full sm:w-auto">
            <Link to="/practice">
              Practice
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild className="w-full sm:w-auto">
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