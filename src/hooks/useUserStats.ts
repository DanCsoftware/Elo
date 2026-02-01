import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  totalSolved: number;
  avgScore: number;
  streak: number;
  currentStreak: number;
  longestStreak: number;
  thisWeekChange: number;
  categoryScores: {
    [key: string]: number;
  };
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  eloRating: number;
  skillRatings: { [key: string]: number };
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
        // Fetch user_stats (contains ELO, streak, etc.)
        let { data: userStats, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // If no stats exist, create them
        if (statsError && statsError.code === 'PGRST116') {
          const { data: newStats, error: createError } = await supabase
            .from('user_stats')
            .insert({
              user_id: user.id,
              current_streak: 0,
              longest_streak: 0,
              last_active_date: null,
              total_questions: 0,
              average_score: 0,
              skill_levels: {
                strategy: 0,
                metrics: 0,
                prioritization: 0,
                design: 0,
              },
              elo_rating: 1200,
              skill_ratings: {
                problem_framing: 1200,
                user_empathy: 1200,
                metrics_definition: 1200,
                tradeoff_analysis: 1200,
                prioritization: 1200,
                strategic_thinking: 1200,
                stakeholder_mgmt: 1200,
                communication: 1200,
                technical_judgment: 1200,
                ambiguity_navigation: 1200,
                systems_thinking: 1200,
                market_sense: 1200,
                experimentation: 1200,
                risk_assessment: 1200,
              }
            })
            .select()
            .single();

          if (createError) throw createError;
          userStats = newStats;
        }

        // Fetch all sessions for calculations
        const { data: sessions, error: sessionsError } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (sessionsError) throw sessionsError;

        // If no sessions yet, return default stats
        if (!sessions || sessions.length === 0) {
          setStats({
            totalSolved: 0,
            avgScore: 0,
            streak: userStats?.current_streak || 0,
            currentStreak: userStats?.current_streak || 0,
            longestStreak: userStats?.longest_streak || 0,
            thisWeekChange: 0,
            categoryScores: {},
            difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
            eloRating: userStats?.elo_rating || 1200,
            skillRatings: userStats?.skill_ratings || {},
          });
          setLoading(false);
          return;
        }

        // Calculate stats from sessions
        const totalSolved = sessions.length;
        const avgScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSolved;

        // Category scores
        const categoryTotals: { [key: string]: { sum: number; count: number } } = {};
        sessions.forEach(session => {
          const categoryScores = session.category_scores || session.feedback?.categoryScores;
          if (categoryScores) {
            Object.entries(categoryScores).forEach(([category, score]) => {
              if (!categoryTotals[category]) {
                categoryTotals[category] = { sum: 0, count: 0 };
              }
              categoryTotals[category].sum += score as number;
              categoryTotals[category].count += 1;
            });
          }
        });

        const categoryScores: { [key: string]: number } = {};
        Object.entries(categoryTotals).forEach(([category, { sum, count }]) => {
          categoryScores[category] = count > 0 ? (sum / count) : 0;
        });

        // Difficulty breakdown
        const difficultyBreakdown = {
          easy: sessions.filter(s => s.difficulty === 'Easy').length,
          medium: sessions.filter(s => s.difficulty === 'Medium').length,
          hard: sessions.filter(s => s.difficulty === 'Hard').length,
        };

        // Week over week change
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentSessions = sessions.filter(s => new Date(s.created_at) > oneWeekAgo);
        const olderSessions = sessions.filter(s => new Date(s.created_at) <= oneWeekAgo);

        const recentAvg = recentSessions.length > 0
          ? recentSessions.reduce((sum, s) => sum + (s.score || 0), 0) / recentSessions.length
          : 0;
        const olderAvg = olderSessions.length > 0
          ? olderSessions.reduce((sum, s) => sum + (s.score || 0), 0) / olderSessions.length
          : avgScore;

        const thisWeekChange = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

        setStats({
          totalSolved,
          avgScore,
          streak: userStats?.current_streak || 0,
          currentStreak: userStats?.current_streak || 0,
          longestStreak: userStats?.longest_streak || 0,
          thisWeekChange,
          categoryScores,
          difficultyBreakdown,
          eloRating: userStats?.elo_rating || 1200,
          skillRatings: userStats?.skill_ratings || {},
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