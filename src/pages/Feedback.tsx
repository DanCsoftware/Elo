import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Loader2, ChevronUp } from 'lucide-react';
import { FeedbackResult } from '@/lib/gemini';
import { Question } from '@/lib/supabase';
import { FrameworkTerm } from '@/components/FrameworkTerm';
import { toast } from 'sonner';
import { CompanySelector } from '@/components/CompanySelector';

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
  
  const [showExample, setShowExample] = useState(false);
  const [exampleAnswer, setExampleAnswer] = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);
  
  // 🆕 NEW: Company selection state
  const [selectedCompany, setSelectedCompany] = useState('google');
  const [companySelectorExpanded, setCompanySelectorExpanded] = useState(false);

  // Highlight framework terms with clickable components
  const highlightFrameworks = (text: string) => {
    const frameworks = [
      "HEART", "5 Whys", "CIRCLES", "RICE", "Impact/Effort",
      "NPS", "DAU/MAU", "activation", "retention", "cohort",
      "funnel", "A/B test", "MVP", "product-market fit",
      "user segmentation", "churn"
    ];

    let result = text;
    frameworks.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      result = result.replace(regex, `<framework>${term}</framework>`);
    });

    return result.split('<framework>').map((part, i) => {
      if (i === 0) return part;
      const [term, ...rest] = part.split('</framework>');
      return (
        <span key={i}>
          <FrameworkTerm term={term} />
          {rest.join('')}
        </span>
      );
    });
  };

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

  const handleGenerateExample = async () => {
    setLoadingExample(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // 🆕 UPDATED: Add company parameter to URL
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evaluate-answer?type=example&company=${selectedCompany}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            question: question.text,
            answer: '',
            category: question.category,
            difficulty: question.difficulty,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate example');
      }

      const data = await response.json();
      setExampleAnswer(data.exampleAnswer);
      setShowExample(true);
      toast.success('Example answer generated!');
    } catch (error) {
      console.error('Error generating example:', error);
      toast.error('Failed to generate example answer. Please try again.');
    } finally {
      setLoadingExample(false);
    }
  };

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
                  <span className="text-muted-foreground">
                    {highlightFrameworks(strength)}
                  </span>
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
                  <span className="text-muted-foreground">
                    {highlightFrameworks(weakness)}
                  </span>
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
            {highlightFrameworks(feedback.detailedFeedback)}
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

        {/* Example Answer Section */}
        <section className="bg-card border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Example 9/10 Answer
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                See how a senior PM would answer this
              </p>
            </div>
            {!showExample && (
              <Button
                onClick={handleGenerateExample}
                disabled={loadingExample}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {loadingExample ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Show Example
                  </>
                )}
              </Button>
            )}
          </div>

          {/* 🆕 NEW: Company Selector (only show before example is generated) */}
          {!showExample && (
            <CompanySelector
              selected={selectedCompany}
              onSelect={setSelectedCompany}
              expanded={companySelectorExpanded}
              onToggle={() => setCompanySelectorExpanded(!companySelectorExpanded)}
            />
          )}

          {/* Example Answer Display */}
          {showExample && exampleAnswer && (
            <div className="space-y-3">
              <div className="bg-secondary/30 border border-border rounded-md p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {highlightFrameworks(exampleAnswer)}
                </p>
              </div>
              <Button
                onClick={() => setShowExample(false)}
                size="sm"
                variant="ghost"
                className="gap-2"
              >
                <ChevronUp className="w-4 h-4" />
                Hide Example
              </Button>
            </div>
          )}
        </section>

        {/* Learning Tip */}
        <section className="bg-secondary/20 border border-border p-5">
          <p className="text-sm text-muted-foreground">
            💡 <strong className="text-foreground">Tip:</strong> Click any underlined PM term above (like HEART, RICE, or NPS) to learn what it means!
          </p>
        </section>

        {/* Action Buttons */}
        <section className="flex gap-3 pb-6">
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