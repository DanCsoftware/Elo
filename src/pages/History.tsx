import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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

    fetchSessions();
  }, [user]);

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

  if (loading) {
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
        {/* Category Filter */}
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