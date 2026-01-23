import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import QuestionCard from '@/components/QuestionCard';
import AnswerTextarea from '@/components/AnswerTextarea';
import HintSection from '@/components/HintSection';
import { Button } from '@/components/ui/button';
import { supabase, Question } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const Practice = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
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

  const canSubmit = answer.trim().length > 0;

  const handleSubmit = () => {
    if (canSubmit && question) {
      navigate('/feedback', { state: { answer, question } });
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
            Submit Answer
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSkip}
          >
            Skip
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Practice;
