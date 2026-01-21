import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Layout from '@/components/Layout';
import ScoreDisplay from '@/components/ScoreDisplay';
import FeedbackCard from '@/components/FeedbackCard';
import { Button } from '@/components/ui/button';
import { sampleFeedback } from '@/lib/mockData';

const Feedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const feedback = sampleFeedback; // In a real app, this would come from an API

  const getTrendIcon = () => {
    const scores = feedback.recentScores;
    if (scores.length < 2) return null;
    
    const lastScore = scores[scores.length - 1];
    const prevScore = scores[scores.length - 2];
    
    if (lastScore > prevScore) {
      return <TrendingUp className="w-4 h-4 text-success" />;
    } else if (lastScore < prevScore) {
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const handleNextQuestion = () => {
    navigate('/practice');
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Score Section */}
        <section className="bg-card rounded-2xl shadow-card p-8 flex flex-col items-center animate-scale-in">
          <h1 className="text-lg font-semibold text-muted-foreground mb-4">Your Score</h1>
          <ScoreDisplay score={feedback.score} />
          
          {/* Trend */}
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Your last 3 scores:</span>
            <div className="flex items-center gap-1">
              {feedback.recentScores.map((score, index) => (
                <span key={index} className="font-semibold text-foreground">
                  {score.toFixed(1)}
                  {index < feedback.recentScores.length - 1 && (
                    <ArrowRight className="inline w-3 h-3 mx-1 text-muted-foreground" />
                  )}
                </span>
              ))}
              {getTrendIcon()}
            </div>
          </div>
        </section>

        {/* Feedback Cards */}
        <section className="grid sm:grid-cols-2 gap-4">
          <FeedbackCard
            title="What You Did Well"
            items={feedback.strengths}
            type="success"
          />
          <FeedbackCard
            title="Where to Improve"
            items={feedback.improvements}
            type="improvement"
          />
        </section>

        {/* Detailed Feedback */}
        <section className="bg-card rounded-xl shadow-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Detailed Feedback</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feedback.detailedFeedback}
          </p>
        </section>

        {/* Action Buttons */}
        <section className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button variant="gradient" size="lg" className="flex-1" onClick={handleNextQuestion}>
            Next Question →
          </Button>
          <Button variant="outline" size="lg" className="flex-1" asChild>
            <Link to="/history">
              Review Answer
            </Link>
          </Button>
        </section>
      </div>
    </Layout>
  );
};

export default Feedback;
