import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface GrowthArea {
  area: string;
  frequency: number;
  severity: 'critical' | 'improving' | 'strength';
  recentTrend: 'up' | 'down' | 'stable';
  recommendations: string[];
}

export function useGrowthAnalysis() {
  const { user } = useAuth();
  const [growthAreas, setGrowthAreas] = useState<GrowthArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function analyzeGrowth() {
      try {
        const { data: sessions, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('📊 Total sessions found:', sessions?.length);
        
        if (!sessions || sessions.length === 0) {
          setLoading(false);
          return;
        }

        // Analyze based on category scores (works with both old and new format)
        const categoryAnalysis = analyzeCategoryScores(sessions);
        console.log('📊 Growth areas found:', categoryAnalysis);
        
        setGrowthAreas(categoryAnalysis);
      } catch (error) {
        console.error('Error analyzing growth:', error);
      } finally {
        setLoading(false);
      }
    }

    analyzeGrowth();
  }, [user]);

  return { growthAreas, loading };
}

function analyzeCategoryScores(sessions: any[]): GrowthArea[] {
  const categoryData: { [key: string]: number[] } = {};
  
  sessions.forEach(session => {
    // Handle both old format (category_scores column) and new format (feedback.categoryScores)
    const categoryScores = session.category_scores || session.feedback?.categoryScores;
    
    if (!categoryScores) return;
    
    Object.entries(categoryScores).forEach(([category, score]) => {
      if (!categoryData[category]) categoryData[category] = [];
      categoryData[category].push(score as number);
    });
  });

  return Object.entries(categoryData)
    .map(([category, scores]) => {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      
      // Get recent sessions (last 5)
      const recent = scores.slice(0, Math.min(5, scores.length));
      const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
      
      let severity: 'critical' | 'improving' | 'strength';
      if (avg < 5) severity = 'critical';
      else if (avg < 7) severity = 'improving';
      else severity = 'strength';
      
      let recentTrend: 'up' | 'down' | 'stable';
      if (recentAvg > avg + 0.5) recentTrend = 'up';
      else if (recentAvg < avg - 0.5) recentTrend = 'down';
      else recentTrend = 'stable';

      // Frequency = how often this is a weak area (inverted from score)
      const frequency = Math.round((10 - avg) * 10);

      return {
        area: formatCategoryName(category),
        frequency: Math.max(0, Math.min(100, frequency)),
        severity,
        recentTrend,
        recommendations: getCategoryRecommendations(category),
      };
    })
    .filter(area => area.severity !== 'strength') // Only show areas needing work
    .sort((a, b) => {
      // Sort: critical first, then by frequency
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return b.frequency - a.frequency;
    });
}

function formatCategoryName(key: string): string {
  const names: { [key: string]: string } = {
    'strategy': 'Product Strategy',
    'metrics': 'Metrics & Analytics',
    'prioritization': 'Prioritization',
    'design': 'Product Design',
  };
  return names[key] || key;
}

function getCategoryRecommendations(category: string): string[] {
  const recs: { [key: string]: string[] } = {
    'strategy': [
      'Practice market analysis and competitive positioning',
      'Think about long-term product vision and roadmap',
      'Connect features to business strategy and goals',
      'Consider market trends and user behavior shifts',
    ],
    'metrics': [
      'Always define success metrics upfront',
      'Learn HEART, AARRR, and North Star frameworks',
      'Practice estimating impact with specific numbers',
      'Think about leading vs lagging indicators',
    ],
    'prioritization': [
      'Use RICE or Impact/Effort matrices explicitly',
      'State trade-offs clearly: "If we do X, we sacrifice Y"',
      'Consider opportunity cost of each decision',
      'Think about sequencing: what enables what?',
    ],
    'design': [
      'Focus on user pain points before solutions',
      'Sketch user flows and edge cases',
      'Consider accessibility and mobile experience',
      'Think about onboarding and first-time user experience',
    ],
  };
  
  return recs[category] || [];
}