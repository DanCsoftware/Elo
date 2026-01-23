import { useNavigate, useLocation, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { FeedbackResult } from '@/lib/gemini';
import { Question } from '@/lib/supabase';

interface LocationState {
  feedback: FeedbackResult;
  question: Question;
  answer: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 8) return 'text-success';
  if (score >= 6) return 'text-warning';
  return 'text-destructive';
};

const Feedback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  // Handle case where page is accessed directly without state
  if (!state?.feedback) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground">No feedback data available.</p>
          <Button onClick={() => navigate('/practice')}>Go to Practice</Button>
        </div>
      </Layout>
    );
  }

  const { feedback, question } = state;

  const handleNextQuestion = () => {
    navigate('/practice');
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Question Reference */}
        <section className="bg-card border border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Question</p>
          <p className="text-sm text-foreground leading-relaxed">{question.text}</p>
        </section>

        {/* Score Section */}
        <section className="bg-card border border-border p-6 flex flex-col items-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Your Score</p>
          <span className={`text-5xl font-mono font-bold ${getScoreColor(feedback.score)}`}>
            {feedback.score.toFixed(1)}
          </span>
          <span className="text-muted-foreground font-mono text-lg">/10</span>
        </section>

        {/* Feedback Cards - Two Column */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* What You Did Well */}
          <div className="bg-card border border-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              What You Did Well
            </h3>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Where to Improve */}
          <div className="bg-card border border-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Where to Improve
            </h3>
            <ul className="space-y-2">
              {feedback.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Detailed Feedback */}
        <section className="bg-card border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Detailed Feedback
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feedback.detailedFeedback}
          </p>
        </section>

        {/* Category Scores */}
        <section className="bg-card border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Category Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(feedback.categoryScores).map(([category, score]) => (
              <div key={category} className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {category}
                </p>
                <span className={`text-xl font-mono font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="flex gap-3">
          <Button variant="default" size="sm" onClick={handleNextQuestion}>
            Next Question
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/">
              Back to Dashboard
            </Link>
          </Button>
        </section>
      </div>
    </Layout>
  );
};

export default Feedback;
