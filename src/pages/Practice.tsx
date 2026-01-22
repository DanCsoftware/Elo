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
  const totalQuestions = 50;
  const canSubmit = answer.trim().length > 0;

  const handleSubmit = () => {
    if (canSubmit) {
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
      <div className="space-y-4 max-w-3xl mx-auto">
        <QuestionCard
          question={currentQuestion}
          currentIndex={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
        />

        <AnswerTextarea
          value={answer}
          onChange={setAnswer}
          placeholder="Type your answer here..."
        />

        <HintSection hint={currentQuestion.hint} />

        <div className="flex gap-3 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Submit
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
