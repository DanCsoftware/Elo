import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import QuestionCard from '@/components/QuestionCard';
import AnswerTextarea from '@/components/AnswerTextarea';
import HintSection from '@/components/HintSection';
import { Button } from '@/components/ui/button';
import { supabase, Question } from '@/lib/supabase';
import { evaluateAnswer } from '@/lib/gemini';
import { useUserStats } from '@/hooks/useUserStats';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { Loader2, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

type DifficultyPreference = 'easier' | 'matched' | 'harder';

const Practice = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const { stats } = useUserStats();
  const { isApproved, canPractice, questionsUsed, questionsRemaining, loading: trialLoading } = useTrialStatus();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentPerformance, setRecentPerformance] = useState<number[]>([]);
  const [difficultyPreference, setDifficultyPreference] = useState<DifficultyPreference>('matched');
  
  const hasFetchedRef = useRef(false);

  // Load saved state from localStorage
  useEffect(() => {
    const savedQuestion = localStorage.getItem('elo_current_question');
    const savedAnswer = localStorage.getItem('elo_current_answer');
    
    if (savedQuestion) {
      try {
        setQuestion(JSON.parse(savedQuestion));
        setAnswer(savedAnswer || '');
        setLoading(false);
        console.log('📦 Loaded saved question from localStorage');
        return;
      } catch (err) {
        console.error('Failed to load saved question:', err);
        localStorage.removeItem('elo_current_question');
        localStorage.removeItem('elo_current_answer');
      }
    }
  }, []);

  // Save answer to localStorage whenever it changes
  useEffect(() => {
    if (answer && question) {
      localStorage.setItem('elo_current_answer', answer);
    }
  }, [answer, question]);

  // Fetch new question ONLY on initial mount (if no saved question)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (question || hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    fetchAdaptiveQuestion();
  }, [user]);

  const fetchAdaptiveQuestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRating = stats?.eloRating || 1200;
      
      const avgRecentScore = recentPerformance.length > 0
        ? recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length
        : 5;
      
      let performanceAdjustment = 0;
      if (recentPerformance.length >= 3) {
        if (avgRecentScore > 7.5) {
          performanceAdjustment = 100;
        } else if (avgRecentScore < 4.5) {
          performanceAdjustment = -100;
        }
      }
      
      let preferenceAdjustment = 0;
      if (difficultyPreference === 'easier') {
        preferenceAdjustment = -150;
      } else if (difficultyPreference === 'harder') {
        preferenceAdjustment = 150;
      }
      
      const totalAdjustment = performanceAdjustment + preferenceAdjustment;
      
      const minDifficulty = Math.max(800, userRating - 150 + totalAdjustment);
      const maxDifficulty = Math.min(2200, userRating + 150 + totalAdjustment);

      console.log(`🎯 Fetching questions: User=${userRating}, Range=${minDifficulty}-${maxDifficulty}`);

      const { data, error: fetchError } = await supabase
        .from('questions')
        .select('id, text, category, difficulty, hint, skills, elo_difficulty')
        .gte('elo_difficulty', minDifficulty)
        .lte('elo_difficulty', maxDifficulty);

      if (fetchError) throw fetchError;
      
      if (!data || data.length === 0) {
        console.log('⚠️ No questions in adaptive range, falling back to wider range');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('questions')
          .select('id, text, category, difficulty, hint, skills, elo_difficulty')
          .gte('elo_difficulty', userRating - 300)
          .lte('elo_difficulty', userRating + 300);
        
        if (fallbackError) throw fallbackError;
        
        if (!fallbackData || fallbackData.length === 0) {
          const { data: anyData, error: anyError } = await supabase
            .from('questions')
            .select('id, text, category, difficulty, hint, skills, elo_difficulty')
            .limit(50);
          
          if (anyError) throw anyError;
          const randomIndex = Math.floor(Math.random() * (anyData?.length || 1));
          const newQuestion = anyData?.[randomIndex] as Question;
          setQuestion(newQuestion);
          localStorage.setItem('elo_current_question', JSON.stringify(newQuestion));
        } else {
          const randomIndex = Math.floor(Math.random() * fallbackData.length);
          const newQuestion = fallbackData[randomIndex] as Question;
          setQuestion(newQuestion);
          localStorage.setItem('elo_current_question', JSON.stringify(newQuestion));
        }
      } else {
        const randomIndex = Math.floor(Math.random() * data.length);
        const newQuestion = data[randomIndex] as Question;
        setQuestion(newQuestion);
        localStorage.setItem('elo_current_question', JSON.stringify(newQuestion));
        console.log(`✅ Selected question: ${newQuestion.elo_difficulty} rated`);
      }
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('Failed to load question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('current_streak, last_active_date, longest_streak')
        .eq('user_id', user.id)
        .single();
      
      if (userStats?.last_active_date === today) {
        console.log('✅ Already answered today, streak unchanged');
        return;
      }
      
      let newStreak = 1;
      if (userStats?.last_active_date) {
        const lastDate = new Date(userStats.last_active_date);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastDateStr = lastDate.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastDateStr === yesterdayStr) {
          newStreak = (userStats.current_streak || 0) + 1;
          console.log(`🔥 Streak continued: ${newStreak} days`);
        } else {
          console.log(`💔 Streak broken, starting fresh at 1 day`);
        }
      } else {
        console.log(`🆕 First streak day!`);
      }
      
      await supabase
        .from('user_stats')
        .update({
          current_streak: newStreak,
          last_active_date: today,
          longest_streak: Math.max(newStreak, userStats?.longest_streak || 0)
        })
        .eq('user_id', user.id);
        
      console.log(`✅ Streak updated: ${newStreak} days`);
    } catch (error) {
      console.error('❌ Failed to update streak:', error);
    }
  };

  const canSubmit = answer.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !question || !user) return;

    setSubmitting(true);
    try {
      const feedback = await evaluateAnswer(
        question.text,
        answer,
        question.category,
        question.difficulty,
        stats?.eloRating || 1200,
        question.elo_difficulty || 1400
      );

      setRecentPerformance(prev => [...prev.slice(-4), feedback.score]);

      const { error: saveError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          question_id: question.id,
          answer_text: answer,
          score: feedback.score,
          strengths: feedback.strengths,
          weaknesses: feedback.weaknesses,
          detailed_feedback: feedback.detailedFeedback,
          category_scores: feedback.categoryScores,
          skill_scores: feedback.skillScores,
          elo_before: stats?.eloRating || 1200,
          elo_after: feedback.newEloRating,
          elo_change: feedback.eloChange,
          category: question.category,
          difficulty: question.difficulty,
          created_at: new Date().toISOString(),
        });

      if (saveError) {
        console.error('Error saving session:', saveError);
        toast.error('Failed to save session, but showing feedback.');
      } else {
        if (feedback.newEloRating) {
          await supabase
            .from('user_stats')
            .update({ elo_rating: feedback.newEloRating })
            .eq('user_id', user.id);
        }
      }

      // Update streak after successful submission
      await updateStreak();

      // Increment trial question counter
      if (isApproved) {
        const { error: incrementError } = await supabase
          .from('approved_users')
          .update({ 
            questions_used: questionsUsed + 1 
          })
          .eq('email', user.email);

        if (incrementError) {
          console.error('Error updating question count:', incrementError);
        } else {
          console.log(`✅ Question count updated: ${questionsUsed + 1}`);
        }
      }

      // Clear saved state after successful submit
      localStorage.removeItem('elo_current_question');
      localStorage.removeItem('elo_current_answer');

      navigate('/feedback', {
        state: {
          feedback,
          question,
          answer,
        },
      });
    } catch (err) {
      console.error('Evaluation error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to evaluate answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('elo_current_question');
    localStorage.removeItem('elo_current_answer');
    
    setAnswer('');
    setQuestion(null);
    hasFetchedRef.current = false;
    fetchAdaptiveQuestion();
  };

  const handleDifficultyChange = (newDifficulty: DifficultyPreference) => {
    setDifficultyPreference(newDifficulty);
    
    localStorage.removeItem('elo_current_question');
    localStorage.removeItem('elo_current_answer');
    setAnswer('');
    setQuestion(null);
    hasFetchedRef.current = false;
    
    setTimeout(() => fetchAdaptiveQuestion(), 100);
  };

  // Sign-in prompt
  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-3">Sign In to Practice</h1>
            <p className="text-muted-foreground text-lg">
              Track your Elo rating and get personalized feedback
            </p>
          </div>
          <Button onClick={signInWithGoogle} size="lg">
            Sign In with Email
          </Button>
        </div>
      </Layout>
    );
  }

  // Waitlist message (user not approved)
  if (!trialLoading && !isApproved) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 max-w-md mx-auto">
          <div>
            <h1 className="text-3xl font-bold mb-3">Access Required</h1>
            <p className="text-muted-foreground text-lg mb-6">
              Elo is currently in private beta.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              To get access, DM me on LinkedIn and I'll send you an invite to check it out!
            </p>
            <a 
              href="https://www.linkedin.com/in/ddotc/" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-primary underline text-sm hover:text-primary/80"
            >
              Connect on LinkedIn →
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // Beta complete message (approved but out of questions)
  if (!trialLoading && isApproved && !canPractice) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 max-w-md mx-auto">
          <div>
            <h1 className="text-3xl font-bold mb-3">Beta Access Complete</h1>
            <p className="text-muted-foreground text-lg mb-6">
              You've completed your beta trial questions. Thanks for testing Elo!
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              I'd love to hear your feedback. DM me on LinkedIn to share your thoughts or request more access.
            </p>
            <a 
              href="https://linkedin.com/in/YOUR_LINKEDIN" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-primary underline text-sm hover:text-primary/80"
            >
              Share Feedback on LinkedIn →
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading state
  if (loading || trialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !question) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-destructive">{error || 'No questions available'}</p>
          <Button onClick={fetchAdaptiveQuestion}>Try Again</Button>
        </div>
      </Layout>
    );
  }

  const userRating = stats?.eloRating || 1200;
  const questionRating = question.elo_difficulty || 1400;
  const ratingDiff = questionRating - userRating;

  // Normal practice UI (EXACT SAME AS BEFORE - NO CHANGES)
  return (
    <Layout>
      <div className="space-y-4 max-w-3xl mx-auto">
        {/* Adaptive Difficulty Info */}
        <div className="bg-card border border-border p-3 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Your Rating:</span>
                <span className="font-mono font-semibold text-primary">{userRating}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Question:</span>
                <span className="font-mono font-semibold">{questionRating}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1">
                {ratingDiff > 50 && (
                  <>
                    <TrendingUp className="w-3 h-3 text-destructive" />
                    <span className="text-destructive font-medium">Challenging</span>
                  </>
                )}
                {ratingDiff < -50 && (
                  <>
                    <TrendingDown className="w-3 h-3 text-success" />
                    <span className="text-success font-medium">Easier</span>
                  </>
                )}
                {Math.abs(ratingDiff) <= 50 && (
                  <>
                    <Minus className="w-3 h-3 text-warning" />
                    <span className="text-warning font-medium">Matched</span>
                  </>
                )}
              </div>
            </div>

            {/* Difficulty Controls */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={difficultyPreference === 'easier' ? 'default' : 'ghost'}
                onClick={() => handleDifficultyChange('easier')}
                className="h-7 px-2 text-xs"
              >
                <TrendingDown className="w-3 h-3 mr-1" />
                Easier
              </Button>
              <Button
                size="sm"
                variant={difficultyPreference === 'matched' ? 'default' : 'ghost'}
                onClick={() => handleDifficultyChange('matched')}
                className="h-7 px-2 text-xs"
              >
                <Minus className="w-3 h-3 mr-1" />
                Match
              </Button>
              <Button
                size="sm"
                variant={difficultyPreference === 'harder' ? 'default' : 'ghost'}
                onClick={() => handleDifficultyChange('harder')}
                className="h-7 px-2 text-xs"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Harder
              </Button>
            </div>
          </div>
        </div>

        <QuestionCard
          question={question}
          currentIndex={1}
          totalQuestions={50}
        />

        <AnswerTextarea
          value={answer}
          onChange={setAnswer}
          placeholder="Type your answer here..."
        />

        <div className="text-xs text-muted-foreground text-right">
          {answer.length} / 2000
        </div>

        <HintSection hint={question.hint} />

        <div className="flex gap-3 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Evaluating...
              </>
            ) : (
              'Submit Answer'
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSkip}
            disabled={submitting}
          >
            Skip
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Practice;