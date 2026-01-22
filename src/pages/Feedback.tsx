import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import ScoreDisplay from '@/components/ScoreDisplay';
import FeedbackCard from '@/components/FeedbackCard';
import { Button } from '@/components/ui/button';
import { sampleFeedback } from '@/lib/mockData';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const Feedback = () => {
  const navigate = useNavigate();
  const feedback = sampleFeedback;

  const chartData = feedback.recentScores.map((score, index) => ({
    name: `${index + 1}`,
    score,
  }));

  const handleNextQuestion = () => {
    navigate('/practice');
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Score Section */}
        <section className="bg-card border border-border p-6 flex flex-col items-center">
          <ScoreDisplay score={feedback.score} />
        </section>

        {/* Feedback Cards - Two Column */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-5">
            <FeedbackCard
              title="Strengths"
              items={feedback.strengths}
              type="success"
            />
          </div>
          <div className="bg-card border border-border p-5">
            <FeedbackCard
              title="Areas to Improve"
              items={feedback.improvements}
              type="improvement"
            />
          </div>
        </section>

        {/* Detailed Feedback */}
        <section className="bg-card border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Detailed Feedback</h3>
          <p className="text-sm font-mono text-muted-foreground leading-relaxed">
            {feedback.detailedFeedback}
          </p>
        </section>

        {/* Score Trend */}
        <section className="bg-card border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Score Trend</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(240 5% 64%)', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 10]} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(240 5% 64%)', fontSize: 12 }}
                  width={30}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(160 84% 39%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(160 84% 39%)', strokeWidth: 0, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="flex gap-3">
          <Button variant="default" size="sm" onClick={handleNextQuestion}>
            Next
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/history">
              Review
            </Link>
          </Button>
        </section>
      </div>
    </Layout>
  );
};

export default Feedback;
