import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface GrowthArea {
  area: string;
  frequency: number;
  severity: 'critical' | 'improving' | 'strength';
  recentTrend: 'up' | 'down' | 'stable';
  recommendations: string[];
  examples: {
    questionId: string;
    questionText: string;
    whatYouSaid: string;
    whatWasMissing: string;
    score: number;
  }[];
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
  const categorySessionMap: { [key: string]: any[] } = {};
  
  sessions.forEach(session => {
    // Handle both old format (category_scores column) and new format (feedback.categoryScores)
    const categoryScores = session.category_scores || session.feedback?.categoryScores;
    
    if (!categoryScores) return;
    
    Object.entries(categoryScores).forEach(([category, score]) => {
      if (!categoryData[category]) {
        categoryData[category] = [];
        categorySessionMap[category] = [];
      }
      categoryData[category].push(score as number);
      categorySessionMap[category].push(session);
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

      // 🆕 NEW: Get examples of where they struggled in this category
      const examples = getExamplesForCategory(category, categorySessionMap[category] || []);

      return {
        area: formatCategoryName(category),
        frequency: Math.max(0, Math.min(100, frequency)),
        severity,
        recentTrend,
        recommendations: getCategoryRecommendations(category),
        examples, // 🆕 ADD THIS
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

// 🆕 NEW: Function to extract concrete examples
function getExamplesForCategory(category: string, sessions: any[]): any[] {
  // Sort by score (lowest first) and take the worst 5
  const sortedSessions = [...sessions]
    .filter(s => s.score && s.score < 7) // Only include sessions where they struggled
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, 5);

  return sortedSessions.map(session => {
    const weaknesses = session.feedback?.weaknesses || [];
    const answer = session.answer || '';
    
    // Find the most relevant weakness for this category
    const categoryKeywords: { [key: string]: string[] } = {
      'strategy': ['strateg', 'market', 'competit', 'vision'],
      'metrics': ['metric', 'measure', 'KPI', 'quantif'],
      'prioritization': ['priorit', 'trade-off', 'RICE', 'impact'],
      'design': ['user', 'design', 'UX', 'experience'],
    };

    const keywords = categoryKeywords[category] || [];
    const relevantWeakness = weaknesses.find((w: string) => 
      keywords.some(kw => w.toLowerCase().includes(kw))
    ) || weaknesses[0] || 'Missing key elements';

    return {
      questionId: session.id,
      questionText: session.question_text || 'Question not available',
      whatYouSaid: answer.substring(0, 150) + (answer.length > 150 ? '...' : ''),
      whatWasMissing: relevantWeakness,
      score: session.score || 0,
    };
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