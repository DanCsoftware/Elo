import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import QuestionCard from '@/components/QuestionCard';
import AnswerTextarea from '@/components/AnswerTextarea';
import HintSection from '@/components/HintSection';
import { Button } from '@/components/ui/button';
import { supabase, Question } from '@/lib/supabase';
import { evaluateAnswer } from '@/lib/gemini';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Practice = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomQuestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('questions')
        .select('*')
        .order('random()')
        .limit(1)
        .single();

      if (fetchError) throw fetchError;
      setQuestion(data as Question);
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('Failed to load question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const canSubmit = answer.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !question) return;

    setSubmitting(true);
    try {
      // Evaluate the answer using Gemini AI
      const feedback = await evaluateAnswer(
        question.text,
        answer,
        question.category,
        question.difficulty
      );

      // Save to user_sessions table (user_id will be added later with auth)
      const { error: saveError } = await supabase
        .from('user_sessions')
        .insert({
          question_id: question.id,
          answer_text: answer,
          score: feedback.score,
          strengths: feedback.strengths,
          weaknesses: feedback.weaknesses,
          detailed_feedback: feedback.detailedFeedback,
          category_scores: feedback.categoryScores,
        });

      if (saveError) {
        console.error('Error saving session:', saveError);
        // Continue to feedback page even if save fails
        toast.error('Failed to save your session, but showing feedback.');
      }

      // Navigate to feedback page with data
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
    setAnswer('');
    fetchRandomQuestion();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !question) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-destructive">{error || 'No questions available'}</p>
          <Button onClick={fetchRandomQuestion}>Try Again</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 max-w-3xl mx-auto">
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
