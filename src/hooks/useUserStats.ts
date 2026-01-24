import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  totalSolved: number;
  avgScore: number;
  streak: number;
  thisWeekChange: number;
  categoryScores: {
    [key: string]: number;
  };
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        // Get all user sessions
        const { data: sessions, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!sessions || sessions.length === 0) {
          setStats({
            totalSolved: 0,
            avgScore: 0,
            streak: 0,
            thisWeekChange: 0,
            categoryScores: {},
            difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
          });
          setLoading(false);
          return;
        }

        // Calculate stats
        const totalSolved = sessions.length;
        const avgScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSolved;

        // Calculate streak
        const streak = calculateStreak(sessions);

        // Calculate this week's performance
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekSessions = sessions.filter(
          s => new Date(s.created_at) >= oneWeekAgo
        );
        const thisWeekAvg = thisWeekSessions.length > 0
          ? thisWeekSessions.reduce((sum, s) => sum + (s.score || 0), 0) / thisWeekSessions.length
          : avgScore;
        const thisWeekChange = avgScore > 0 ? ((thisWeekAvg - avgScore) / avgScore) * 100 : 0;

        // Category performance
        const categoryScores: { [key: string]: number } = {};
        const categoryGroups: { [key: string]: number[] } = {};
        
        sessions.forEach(s => {
          if (s.category) {
            if (!categoryGroups[s.category]) {
              categoryGroups[s.category] = [];
            }
            categoryGroups[s.category].push(s.score || 0);
          }
        });

        Object.keys(categoryGroups).forEach(cat => {
          const scores = categoryGroups[cat];
          categoryScores[cat] = (scores.reduce((sum, score) => sum + score, 0) / scores.length) / 10;
        });

        // Difficulty breakdown
        const difficultyBreakdown = {
          easy: sessions.filter(s => s.difficulty === 'easy').length,
          medium: sessions.filter(s => s.difficulty === 'medium').length,
          hard: sessions.filter(s => s.difficulty === 'hard').length,
        };

        setStats({
          totalSolved,
          avgScore,
          streak,
          thisWeekChange,
          categoryScores,
          difficultyBreakdown,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return { stats, loading };
}

function calculateStreak(sessions: any[]): number {
  if (sessions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique dates
  const dates = sessions
    .map(s => {
      const d = new Date(s.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => b - a);

  let streak = 0;
  let checkDate = today.getTime();

  for (const date of dates) {
    const dayDiff = Math.floor((checkDate - date) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0 || dayDiff === 1) {
      streak++;
      checkDate = date;
    } else {
      break;
    }
  }

  return streak;
}