import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import QuestionCard from '@/components/QuestionCard';
import AnswerTextarea from '@/components/AnswerTextarea';
import HintSection from '@/components/HintSection';
import { Button } from '@/components/ui/button';
import { questions } from '@/lib/mockData';

const Practice = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = 50; // Display as 50 even if we have fewer mock questions
  const canSubmit = answer.trim().length > 0;

  const handleSubmit = () => {
    if (canSubmit) {
      // In a real app, this would send the answer to an API for evaluation
      navigate('/feedback', { state: { answer, question: currentQuestion } });
    }
  };

  const handleSkip = () => {
    const nextIndex = (currentQuestionIndex + 1) % questions.length;
    setCurrentQuestionIndex(nextIndex);
    setAnswer('');
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <QuestionCard
          question={currentQuestion}
          currentIndex={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
        />

        <div className="space-y-4">
          <AnswerTextarea
            value={answer}
            onChange={setAnswer}
            placeholder="Type your answer here... Be specific and structure your thoughts clearly."
          />

          <HintSection hint={currentQuestion.hint} />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="gradient"
              size="lg"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Submit Answer
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleSkip}
            >
              Skip Question
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Practice;
