import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

interface SkillTrend {
  skill: string;
  skillName: string;
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  recentScores: number[];
  priority: 'critical' | 'needs-work' | 'improving' | 'strength';
  commonPattern: string;
  nextStep: string;
  exampleFromYourAnswer?: {
    quote: string;
    questionText: string;
    score: number;
  };
  bestExample?: {
    quote: string;
    questionText: string;
    score: number;
  };
}

const skillPatterns: { [key: string]: { pattern: string; nextStep: string } } = {
  metrics_definition: {
    pattern: "Mentions metrics but lacks baselines, targets, or timelines",
    nextStep: "Specify: baseline → target by timeline (e.g., 'DAU from 10k to 15k by Q2')"
  },
  tradeoff_analysis: {
    pattern: "Identifies what to do, but not what you're NOT doing",
    nextStep: "State explicit trade-offs: 'If we build X, we're not building Y, costing us Z'"
  },
  problem_framing: {
    pattern: "Challenges assumptions before answering",
    nextStep: "Continue questioning premises - this is working well"
  },
  user_empathy: {
    pattern: "Mentions 'users' generically without segmentation",
    nextStep: "Break into segments: power users, creators, consumers, etc."
  },
  prioritization: {
    pattern: "Lists options without explicit ranking or reasoning",
    nextStep: "Use explicit ranking: P0 (reason), P1 (reason), P2 (reason)"
  },
  strategic_thinking: {
    pattern: "Focuses on immediate solution, misses long-term implications",
    nextStep: "Ask: What happens in 6-12 months? What are second-order effects?"
  },
  stakeholder_mgmt: {
    pattern: "Doesn't consider cross-functional dependencies",
    nextStep: "Identify stakeholders: Eng, Design, Legal, Marketing, Sales"
  },
  communication: {
    pattern: "Structure is unclear or jumps between topics",
    nextStep: "Start with TL;DR, use clear section headers"
  },
  technical_judgment: {
    pattern: "Skips technical feasibility considerations",
    nextStep: "Ask: Is this technically possible? What's the complexity?"
  },
  ambiguity_navigation: {
    pattern: "Assumes information without stating it",
    nextStep: "Make assumptions explicit: 'Assuming X, then Y. If not X, then Z'"
  },
  systems_thinking: {
    pattern: "Doesn't identify second-order effects or feedback loops",
    nextStep: "Ask: What happens downstream? Unintended consequences?"
  },
  market_sense: {
    pattern: "Doesn't consider competitive dynamics",
    nextStep: "Consider: What are competitors doing? How does this affect positioning?"
  },
  experimentation: {
    pattern: "Proposes solutions without validation plans",
    nextStep: "End with: How would we test this? What metrics prove it works?"
  },
  risk_assessment: {
    pattern: "Doesn't identify what could go wrong",
    nextStep: "List top 3 risks and mitigation strategies"
  }
};

const skillDisplayNames: { [key: string]: string } = {
  problem_framing: 'Problem Framing',
  user_empathy: 'User Empathy',
  metrics_definition: 'Metrics Definition',
  tradeoff_analysis: 'Trade-off Analysis',
  prioritization: 'Prioritization',
  strategic_thinking: 'Strategic Thinking',
  stakeholder_mgmt: 'Stakeholder Management',
  communication: 'Communication',
  technical_judgment: 'Technical Judgment',
  ambiguity_navigation: 'Ambiguity Navigation',
  systems_thinking: 'Systems Thinking',
  market_sense: 'Market Sense',
  experimentation: 'Experimentation',
  risk_assessment: 'Risk Assessment'
};

export function FocusAreas() {
  const { user } = useAuth();
  const [trends, setTrends] = useState<SkillTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function analyzeTrends() {
      try {
        // Fetch last 30 sessions with skill_scores AND answer text
        const { data: sessions, error } = await supabase
          .from('user_sessions')
          .select(`
            skill_scores, 
            score, 
            created_at,
            answer_text,
            questions (text)
          `)
          .eq('user_id', user.id)
          .not('skill_scores', 'is', null)
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) {
          console.error('Error fetching sessions:', error);
          setLoading(false);
          return;
        }

        if (!sessions || sessions.length < 5) {
          setLoading(false);
          return;
        }

        setSessionCount(sessions.length);

        const skillKeys = Object.keys(skillPatterns);
        const analyzedTrends: SkillTrend[] = [];

        for (const skill of skillKeys) {
          const scores = sessions
            .map((s, index) => ({ 
              score: s.skill_scores?.[skill], 
              session: s,
              index 
            }))
            .filter(item => item.score !== undefined && item.score !== null);

          if (scores.length < 3) continue;

          const avgScore = scores.reduce((a, b) => a + b.score, 0) / scores.length;

          const midpoint = Math.floor(scores.length / 2);
          const recentScores = scores.slice(0, midpoint);
          const olderScores = scores.slice(midpoint);
          
          const recentAvg = recentScores.reduce((a, b) => a + b.score, 0) / recentScores.length;
          const olderAvg = olderScores.reduce((a, b) => a + b.score, 0) / olderScores.length;
          const trendValue = recentAvg - olderAvg;
          
          let trend: 'up' | 'down' | 'stable';
          if (trendValue > 0.5) trend = 'up';
          else if (trendValue < -0.5) trend = 'down';
          else trend = 'stable';

          let priority: 'critical' | 'needs-work' | 'improving' | 'strength';
          if (avgScore < 5 && trend !== 'up') priority = 'critical';
          else if (avgScore < 6) priority = 'needs-work';
          else if (trend === 'up' && avgScore >= 6) priority = 'improving';
          else if (avgScore >= 7.5) priority = 'strength';
          else priority = 'needs-work';

          // Find worst example (lowest score for this skill)
          const worstExample = scores
            .filter(s => s.score < 6)
            .sort((a, b) => a.score - b.score)[0];

          // Find best example (highest score for this skill)
          const bestExample = scores
            .filter(s => s.score >= 7)
            .sort((a, b) => b.score - a.score)[0];

          const trend_data: SkillTrend = {
            skill,
            skillName: skillDisplayNames[skill] || skill,
            avgScore,
            trend,
            trendValue,
            recentScores: scores.slice(0, 5).map(s => s.score),
            priority,
            commonPattern: skillPatterns[skill]?.pattern || 'Analyzing pattern',
            nextStep: skillPatterns[skill]?.nextStep || 'Practice this skill'
          };

          // Add worst example if found
          if (worstExample && worstExample.session.answer_text) {
            const answerSnippet = worstExample.session.answer_text.substring(0, 150);
            trend_data.exampleFromYourAnswer = {
              quote: answerSnippet + (worstExample.session.answer_text.length > 150 ? '...' : ''),
              questionText: worstExample.session.questions?.text || 'Question',
              score: worstExample.score
            };
          }

          // Add best example if found
          if (bestExample && bestExample.session.answer_text) {
            const answerSnippet = bestExample.session.answer_text.substring(0, 150);
            trend_data.bestExample = {
              quote: answerSnippet + (bestExample.session.answer_text.length > 150 ? '...' : ''),
              questionText: bestExample.session.questions?.text || 'Question',
              score: bestExample.score
            };
          }

          analyzedTrends.push(trend_data);
        }

        const priorityOrder = { critical: 0, 'needs-work': 1, improving: 2, strength: 3 };
        analyzedTrends.sort((a, b) => {
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.avgScore - b.avgScore;
        });

        setTrends(analyzedTrends.slice(0, 3));
      } catch (error) {
        console.error('Error analyzing trends:', error);
      } finally {
        setLoading(false);
      }
    }

    analyzeTrends();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">
          Complete 5+ sessions to see skill analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Focus Areas</h3>
        <span className="text-xs text-muted-foreground">{sessionCount} sessions analyzed</span>
      </div>

      <div className="space-y-3">
        {trends.map((trend) => (
          <div 
            key={trend.skill}
            className="border-l-2 pl-4 py-2 space-y-2"
            style={{
              borderColor: 
                trend.priority === 'critical' ? 'hsl(var(--destructive))' :
                trend.priority === 'needs-work' ? 'hsl(var(--warning))' :
                trend.priority === 'improving' ? 'hsl(var(--primary))' :
                'hsl(var(--success))'
            }}
          >
            {/* Skill Name + Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{trend.skillName}</span>
                {trend.trend === 'up' && <TrendingUp className="w-3 h-3 text-success" />}
                {trend.trend === 'down' && <TrendingDown className="w-3 h-3 text-destructive" />}
                {trend.trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
              </div>
              <div className="flex items-baseline gap-1">
                <span 
                  className="text-sm font-mono font-bold"
                  style={{
                    color: trend.avgScore >= 7 ? 'hsl(var(--success))' :
                           trend.avgScore >= 5 ? 'hsl(var(--warning))' :
                           'hsl(var(--destructive))'
                  }}
                >
                  {trend.avgScore.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">/10</span>
              </div>
            </div>

            {/* Pattern */}
            <p className="text-xs text-muted-foreground">
              {trend.commonPattern}
            </p>

            {/* Example from their worst answer */}
            {trend.exampleFromYourAnswer && (
              <div className="bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
                <p className="text-xs font-semibold text-destructive mb-1">
                  Example where you scored {trend.exampleFromYourAnswer.score}/10:
                </p>
                <p className="text-xs text-muted-foreground italic mb-1">
                  "{trend.exampleFromYourAnswer.quote}"
                </p>
                <p className="text-xs text-muted-foreground">
                  From: {trend.exampleFromYourAnswer.questionText.substring(0, 60)}...
                </p>
              </div>
            )}

            {/* Example from their best answer */}
            {trend.bestExample && trend.priority !== 'critical' && (
              <div className="bg-success/10 border border-success/30 rounded px-3 py-2">
                <p className="text-xs font-semibold text-success mb-1">
                  When you did it well ({trend.bestExample.score}/10):
                </p>
                <p className="text-xs text-muted-foreground italic mb-1">
                  "{trend.bestExample.quote}"
                </p>
                <p className="text-xs text-muted-foreground">
                  Do more of this ↑
                </p>
              </div>
            )}

            {/* Next Step */}
            <div className="bg-muted/30 rounded px-3 py-2">
              <p className="text-xs">
                <span className="font-semibold text-foreground">Action: </span>
                <span className="text-muted-foreground">{trend.nextStep}</span>
              </p>
            </div>

            {/* Recent Scores */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Recent:</span>
              <div className="flex gap-1">
                {trend.recentScores.map((score, i) => (
                  <div 
                    key={i}
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono"
                    style={{
                      backgroundColor: score >= 7 ? 'hsl(var(--success) / 0.2)' :
                                     score >= 5 ? 'hsl(var(--warning) / 0.2)' :
                                     'hsl(var(--destructive) / 0.2)',
                      color: score >= 7 ? 'hsl(var(--success))' :
                             score >= 5 ? 'hsl(var(--warning))' :
                             'hsl(var(--destructive))'
                    }}
                  >
                    {score.toFixed(0)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          Address these areas in your next answer for improved scores
        </p>
      </div>
    </div>
  );
}