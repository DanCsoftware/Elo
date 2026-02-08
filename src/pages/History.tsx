import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Session {
  id: string;
  question_id: number;
  answer_text: string;
  score: number;
  feedback: any;
  category: string;
  difficulty: string;
  created_at: string;
  question?: {
    text: string;
  };
}

const History = () => {
  const { user } = useAuth();
  const { stats, refreshStats } = useUserStats();
  const { isApproved, loading: trialLoading } = useTrialStatus();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [resetting, setResetting] = useState(false);
  const [canReset, setCanReset] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [nextResetDate, setNextResetDate] = useState<string | null>(null);

  // Show beta access message if not approved
  if (!trialLoading && user && !isApproved) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
          <h1 className="text-3xl font-bold mb-3">Access Required</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Elo is currently in private beta.
          </p>
          <p className="text-muted-foreground mb-6">
            To get access, DM me on LinkedIn and I'll send you an invite to check it out!
          </p>
          <a 
            href="https://www.linkedin.com/in/ddotc/" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            Connect on LinkedIn →
          </a>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchSessions();
    checkResetEligibility();
  }, [user]);

  const checkResetEligibility = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('last_elo_reset')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data?.last_elo_reset) {
        const lastReset = new Date(data.last_elo_reset);
        const now = new Date();
        const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

        console.log('Last reset:', lastReset);
        console.log('Days since reset:', daysSinceReset);

        if (daysSinceReset < 30) {
          setCanReset(false);
          const daysLeft = Math.ceil(30 - daysSinceReset);
          setDaysRemaining(daysLeft);
          
          const nextReset = new Date(lastReset);
          nextReset.setDate(nextReset.getDate() + 30);
          setNextResetDate(nextReset.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          }));
        } else {
          setCanReset(true);
          setDaysRemaining(0);
          setNextResetDate(null);
        }
      } else {
        // Never reset before
        setCanReset(true);
        setDaysRemaining(0);
        setNextResetDate(null);
      }
    } catch (error) {
      console.error('Error checking reset eligibility:', error);
    }
  };

  async function fetchSessions() {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          questions:question_id (text)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleResetElo = async () => {
    if (!user || !canReset) return;

    setResetting(true);
    try {
      const currentElo = stats?.eloRating || 1200;

      // Log the reset in the elo_resets table
      const { error: resetLogError } = await supabase
        .from('elo_resets')
        .insert({
          user_id: user.id,
          elo_before: currentElo,
          elo_after: 1200,
          reset_at: new Date().toISOString()
        });

      if (resetLogError) {
        console.error('Error logging reset:', resetLogError);
      }

      // Update user stats
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({ 
          elo_rating: 1200,
          last_elo_reset: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Elo rating reset to 1200!');
      await refreshStats();
      await checkResetEligibility();
      
    } catch (error) {
      console.error('Error resetting Elo:', error);
      toast.error('Failed to reset Elo. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const categories = ['All', 'Strat', 'Metr', 'Prior', 'Dsgn'];
  const categoryMap: { [key: string]: string } = {
    'Strat': 'strategy',
    'Metr': 'metrics',
    'Prior': 'prioritization',
    'Dsgn': 'design',
  };

  const filteredSessions = selectedCategory === 'All'
    ? sessions
    : sessions.filter(s => s.category === categoryMap[selectedCategory]);

  if (loading || trialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header with Category Filter and Reset Button */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Reset Elo Button */}
          {canReset ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={resetting}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
                  Reset Elo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Reset Your Elo Rating?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3 pt-2">
                    {/* Rating Change Visual */}
                    <div className="flex items-center justify-center gap-4 py-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Current Rating</p>
                        <p className="text-3xl font-bold text-foreground">
                          {stats?.eloRating || 1200}
                        </p>
                      </div>
                      <div className="text-2xl text-muted-foreground">→</div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">After Reset</p>
                        <p className="text-3xl font-bold text-primary">1200</p>
                      </div>
                    </div>

                    {/* Warning Box with Running Duck */}
                    <div className="flex gap-4 bg-warning/10 border border-warning/20 rounded-md p-3">
                      <div className="flex-1 text-sm">
                        <p className="font-semibold text-warning mb-1">⚠️ Warning:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Your practice history will be preserved</li>
                          <li>Reset points will be marked on your chart</li>
                          <li>You can only reset <strong>once every 30 days</strong></li>
                          <li>This action cannot be undone</li>
                        </ul>
                      </div>
                      <div className="flex items-center justify-center">
                        <img 
                          src="https://media.tenor.com/m_QcScBSWeYAAAAm/duck-run.webp" 
                          alt="Running duck"
                          className="w-20 h-20 object-contain"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Use this if you want to recalibrate your skill level or start fresh with more challenging questions.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleResetElo}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={resetting}
                  >
                    {resetting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Resetting...
                      </>
                    ) : (
                      'Reset to 1200'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div className="relative group">
              <Button 
                variant="outline" 
                size="sm"
                disabled={true}
                className="gap-2 cursor-not-allowed opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Elo
              </Button>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md border border-border shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Reset on cooldown</span>
                  <span className="text-muted-foreground">
                    Available in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full right-4 -mt-px">
                  <div className="border-4 border-transparent border-t-border"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cooldown Notice */}
        {!canReset && nextResetDate && (
          <div className="bg-muted/50 border border-border rounded-md p-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Reset on Cooldown</p>
              <p className="text-xs text-muted-foreground mt-1">
                You can reset your Elo again on <strong>{nextResetDate}</strong> ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''})
              </p>
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <div className="bg-card border border-border">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 p-4 border-b border-border text-xs text-muted-foreground font-medium">
            <div>Status</div>
            <div>Problem</div>
            <div>Cat</div>
            <div>Diff</div>
            <div>Score</div>
            <div>Date</div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No sessions yet. Start practicing!
            </div>
          ) : (
            filteredSessions.map(session => (
              <div
                key={session.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 p-4 border-b border-border hover:bg-secondary/50 cursor-pointer items-center"
              >
                <div className="text-success">✓</div>
                <div className="text-sm truncate">
                  {session.question?.text || 'Question'}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  {session.category?.substring(0, 4)}
                </div>
                <div className={`text-xs font-mono ${
                  session.difficulty === 'easy' ? 'text-success' :
                  session.difficulty === 'medium' ? 'text-warning' :
                  'text-destructive'
                }`}>
                  {session.difficulty?.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm font-mono">
                  {session.score.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default History;