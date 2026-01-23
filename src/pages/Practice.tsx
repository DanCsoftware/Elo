import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import QuestionCard from '@/components/QuestionCard';
import AnswerTextarea from '@/components/AnswerTextarea';
import HintSection from '@/components/HintSection';
import { Button } from '@/components/ui/button';
import { Question } from '@/lib/supabase';
import { evaluateAnswer } from '@/lib/gemini';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Mock questions until database tables are created
const mockQuestions: Question[] = [
  {
    id: '1',
    text: 'You are the PM for Instagram Stories. Engagement has dropped 15% over the last quarter. How would you diagnose the problem and what solutions would you propose?',
    category: 'strategy',
    difficulty: 'hard',
    hint: 'Consider user segments, competitive analysis, and both qualitative and quantitative data sources.',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    text: 'Define the key metrics you would track for a new food delivery app. How would you prioritize them?',
    category: 'metrics',
    difficulty: 'medium',
    hint: 'Think about the user journey from discovery to repeat orders.',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    text: 'You have limited engineering resources and three features in your backlog: improved search, social sharing, and dark mode. How do you prioritize?',
    category: 'prioritization',
    difficulty: 'medium',
    hint: 'Consider frameworks like RICE or impact vs effort matrices.',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    text: 'Design a notification system for a task management app. What types of notifications would you include and why?',
    category: 'design',
    difficulty: 'easy',
    hint: 'Balance keeping users informed with avoiding notification fatigue.',
    created_at: new Date().toISOString(),
  },
];

const Practice = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomQuestion = () => {
    setLoading(true);
    setError(null);
    // Pick a random question from mock data
    const randomIndex = Math.floor(Math.random() * mockQuestions.length);
    setQuestion(mockQuestions[randomIndex]);
    setLoading(false);
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

      // TODO: Save to database once tables are created
      // For now, just navigate to feedback page

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
