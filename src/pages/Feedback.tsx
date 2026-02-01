import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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
  const { user, signInWithGoogle } = useAuth();
  
  const [showExample, setShowExample] = useState(false);
  const [exampleAnswer, setExampleAnswer] = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('google');
  const [companySelectorExpanded, setCompanySelectorExpanded] = useState(false);
  
  const [showPushback, setShowPushback] = useState(false);
  const [pushbackText, setPushbackText] = useState('');
  const [pushbackLoading, setPushbackLoading] = useState(false);
  const [pushbackResult, setPushbackResult] = useState<{
    verdict: 'UPHELD' | 'PARTIALLY_ADJUSTED' | 'FULLY_ADJUSTED';
    newScore: number;
    reasoning: string;
    counterpoints: string[];
    finalThoughts: string;
  } | null>(null);

  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const [showYourAnswer, setShowYourAnswer] = useState(false);

  const highlightFrameworks = (text: string) => {
    const frameworks = [
      "HEART", "5 Whys", "CIRCLES", "RICE", "Impact/Effort",
      "NPS", "DAU/MAU", "activation", "retention", "cohort",
      "funnel", "A/B test", "MVP", "product-market fit",
      "user segmentation", "churn", "BLUF", "OKRs", "LTV/CAC",
      "North Star Metric", "PMF", "TAM", "Moat", "Sprint",
      "Backlog", "Tech Debt", "KPI", "Freemium", "SaaS",
      "ARR", "NRR", "Persona", "Jobs to be Done"
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

  const handlePushback = async () => {
    if (pushbackText.length > 500) {
      toast.error('Please defend your position in under 500 characters');
      return;
    }

    setPushbackLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evaluate-answer?type=pushback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            question: question.text,
            originalAnswer: answer,
            originalScore: feedback.score,
            originalFeedback: feedback,
            pushbackText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to evaluate pushback');
      }

      const result = await response.json();
      setPushbackResult(result);
      toast.success('Pushback evaluated!');
    } catch (error) {
      console.error('Error with pushback:', error);
      toast.error('Failed to evaluate pushback. Please try again.');
    } finally {
      setPushbackLoading(false);
    }
  };

  const handleGenerateExample = async () => {
    console.log('🚀 Starting example generation for company:', selectedCompany);
    setLoadingExample(true);
    
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Create AbortController for 60 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
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
            category: question.category,
            difficulty: question.difficulty,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Example generation failed:', errorText);
        throw new Error('Failed to generate example');
      }

      const data = await response.json();
      console.log('📦 Received response:', data);
      
      if (!data.exampleAnswer) {
        throw new Error('No example answer returned');
      }
      
      setExampleAnswer(data.exampleAnswer);
      setShowExample(true);
      toast.success('Example answer generated!');
    } catch (error) {
      console.error('❌ Generation failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Request timed out after 60 seconds. Please try again.');
      } else {
        toast.error('Failed to generate example answer. Please try again.');
      }
    } finally {
      setLoadingExample(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-3">Sign In to View Feedback</h1>
            <p className="text-muted-foreground text-lg">
              Track your progress and get detailed feedback
            </p>
          </div>
          <Button onClick={signInWithGoogle} size="lg">
            Sign In with Google
          </Button>
        </div>
      </Layout>
    );
  }

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

  const { feedback, question, answer } = state;

  return (
    <Layout>
      {/* ✅ LOADING OVERLAY - NEW */}
      {loadingExample && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-lg border border-border shadow-2xl max-w-md">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold text-lg">Generating 9/10 Answer...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  AI is crafting a {selectedCompany.charAt(0).toUpperCase() + selectedCompany.slice(1)}-style reference answer
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may take 20-30 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 max-w-3xl mx-auto pb-6">
        
        {/* Question */}
        <section className="bg-card border border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Question</p>
          <p className="text-sm text-foreground leading-relaxed">{question.text}</p>
        </section>

        {/* Elo Rating + Score + Actions */}
        <section className="bg-card border border-border p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {feedback.eloChange !== undefined && feedback.newEloRating && (
                <>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Elo Rating</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-primary">
                        {feedback.newEloRating}
                      </span>
                      <div className="flex flex-col items-start">
                        <span className={`text-lg font-bold ${
                          feedback.eloChange > 0 ? 'text-success' : 
                          feedback.eloChange < 0 ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {feedback.eloChange > 0 && '+'}{feedback.eloChange}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {feedback.newEloRating < 1000 && 'Entry'}
                          {feedback.newEloRating >= 1000 && feedback.newEloRating < 1200 && 'Associate'}
                          {feedback.newEloRating >= 1200 && feedback.newEloRating < 1400 && 'PM'}
                          {feedback.newEloRating >= 1400 && feedback.newEloRating < 1600 && 'Senior PM'}
                          {feedback.newEloRating >= 1600 && feedback.newEloRating < 1800 && 'Staff PM'}
                          {feedback.newEloRating >= 1800 && feedback.newEloRating < 2000 && 'Principal PM'}
                          {feedback.newEloRating >= 2000 && 'Legendary'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-16 w-px bg-border" />
                </>
              )}

              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Answer Score</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${getScoreColor(feedback.score)}`}>
                    {feedback.score.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground text-lg">/10</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!showPushback && !pushbackResult && feedback.score < 9 && (
                <Button onClick={() => setShowPushback(true)} size="sm" variant="outline">
                  Push Back
                </Button>
              )}
              <Button onClick={() => navigate('/practice')} size="sm">
                Next Question
              </Button>
            </div>
          </div>
        </section>

        {/* Your Answer - Collapsible */}
        <section className="bg-card border border-border p-5">
          <button
            onClick={() => setShowYourAnswer(!showYourAnswer)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Your Answer
            </h3>
            {showYourAnswer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showYourAnswer && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          )}
        </section>

        {/* Pushback Section */}
        {(showPushback || pushbackResult) && (
          <section className="bg-card border border-border p-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              {pushbackResult ? 'Pushback Result' : 'Push Back on Score'}
            </h3>

            {showPushback && !pushbackResult && (
              <div className="space-y-3">
                <textarea
                  value={pushbackText}
                  onChange={(e) => setPushbackText(e.target.value)}
                  placeholder="Explain why you disagree. What did the evaluator miss? Be specific. (Max 500 characters)"
                  className="w-full min-h-[120px] p-3 bg-background border border-border rounded-md text-sm resize-none"
                  disabled={pushbackLoading}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {pushbackText.length} / 500 characters
                  </span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => { setShowPushback(false); setPushbackText(''); }}
                      size="sm"
                      variant="ghost"
                      disabled={pushbackLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePushback}
                      size="sm"
                      disabled={pushbackText.length > 500 || pushbackLoading}
                    >
                      {pushbackLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Evaluating...</>
                      ) : (
                        'Submit Pushback'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {pushbackResult && (
              <div className={`p-4 rounded-md border ${
                pushbackResult.verdict === 'FULLY_ADJUSTED' ? 'bg-success/10 border-success/30' :
                pushbackResult.verdict === 'PARTIALLY_ADJUSTED' ? 'bg-warning/10 border-warning/30' :
                'bg-destructive/10 border-destructive/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">
                    {pushbackResult.verdict === 'FULLY_ADJUSTED' && '✅ Score Fully Adjusted'}
                    {pushbackResult.verdict === 'PARTIALLY_ADJUSTED' && '⚠️ Partially Adjusted'}
                    {pushbackResult.verdict === 'UPHELD' && '❌ Score Upheld'}
                  </p>
                  {pushbackResult.newScore !== feedback.score && (
                    <p className="text-lg font-bold">
                      {feedback.score} → {pushbackResult.newScore}
                    </p>
                  )}
                </div>
                <p className="text-sm mb-2">{pushbackResult.reasoning}</p>
                {pushbackResult.counterpoints.length > 0 && (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {pushbackResult.counterpoints.map((point, i) => (
                      <li key={i}>• {point}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}

        {/* Strengths & Weaknesses */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-card border border-border p-5 space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-muted-foreground pl-6 relative">
                  <span className="absolute left-0 text-success">✓</span>
                  {highlightFrameworks(strength)}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border border-border p-5 space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
              <X className="w-4 h-4 text-destructive" />
              Areas to Improve
            </h3>
            <ul className="space-y-2">
              {feedback.weaknesses.map((weakness, i) => (
                <li key={i} className="text-sm text-muted-foreground pl-6 relative">
                  <span className="absolute left-0 text-destructive">✗</span>
                  {highlightFrameworks(weakness)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Detailed Feedback */}
        <section className="bg-card border border-border p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-2">
            Actionable Advice
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {highlightFrameworks(feedback.detailedFeedback)}
          </p>
        </section>

        {/* Category Breakdown */}
        <section className="bg-card border border-border p-5">
          <button
            onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Category Breakdown
            </h3>
            {showCategoryBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showCategoryBreakdown && (
            <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-border">
              {Object.entries(feedback.categoryScores).map(([category, score]) => (
                <div key={category} className="text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-1">{category}</p>
                  <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Example Answer */}
        <section className="bg-card border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide">Example 9/10 Answer</h3>
              <p className="text-xs text-muted-foreground mt-1">See how a senior PM would answer</p>
            </div>
            {!showExample && (
              <Button onClick={handleGenerateExample} disabled={loadingExample} size="sm" variant="outline">
                {loadingExample ? (
                  <>
                    <Loader2 className="w-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Answer'
                )}
              </Button>
            )}
          </div>

          {!showExample && (
            <CompanySelector
              selected={selectedCompany}
              onSelect={setSelectedCompany}
              expanded={companySelectorExpanded}
              onToggle={() => setCompanySelectorExpanded(!companySelectorExpanded)}
            />
          )}

          {showExample && exampleAnswer && (
            <div className="bg-secondary/30 border border-border rounded-md p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {highlightFrameworks(exampleAnswer)}
              </p>
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={() => navigate('/practice')} size="sm">Next Question</Button>
          <Button variant="secondary" size="sm" asChild><Link to="/">Dashboard</Link></Button>
        </div>
      </div>
    </Layout>
  );
};

export default Feedback;