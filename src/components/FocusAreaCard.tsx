import { useState } from 'react';
import { TrendingUp, Target, BarChart3, Users, Lightbulb, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusAreaCardProps {
  area: string;
  severity: 'critical' | 'improving' | 'strength';
  recentTrend: 'up' | 'down' | 'stable';
  recommendations: string[];
  examples?: {
    questionId: string;
    questionText: string;
    whatYouSaid: string;
    whatWasMissing: string;
    score: number;
  }[];
}

const areaIcons: { [key: string]: JSX.Element } = {
  'Metrics & Analytics': <BarChart3 className="w-4 h-4" />,
  'Product Strategy': <Target className="w-4 h-4" />,
  'Prioritization': <Lightbulb className="w-4 h-4" />,
  'Product Design': <Users className="w-4 h-4" />,
};

const areaColors: { [key: string]: string } = {
  'Metrics & Analytics': 'from-blue-500 to-blue-600',
  'Product Strategy': 'from-purple-500 to-purple-600',
  'Prioritization': 'from-orange-500 to-orange-600',
  'Product Design': 'from-green-500 to-green-600',
};

export function FocusAreaCard({ 
  area, 
  severity, 
  recentTrend, 
  recommendations,
  examples = []
}: FocusAreaCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Filter out "Question not available" examples
  const validExamples = examples.filter(e => e.questionText !== 'Question not available');

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* Icon + Info */}
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${areaColors[area]} flex items-center justify-center text-white flex-shrink-0`}>
            {areaIcons[area]}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold">{area}</h3>
              {recentTrend === 'up' && (
                <span className="text-xs text-success flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                </span>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              {recommendations[0]}
            </p>

            {/* Show count of examples */}
            {validExamples.length > 0 && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
              >
                View {validExamples.length} example{validExamples.length !== 1 ? 's' : ''} <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
          severity === 'critical' ? 'bg-destructive/20 text-destructive' :
          severity === 'improving' ? 'bg-warning/20 text-warning' :
          'bg-success/20 text-success'
        }`}>
          {severity === 'critical' && 'Focus'}
          {severity === 'improving' && 'Improving'}
          {severity === 'strength' && 'Strong'}
        </span>
      </div>

      {/* Expanded: Show examples compactly */}
      {expanded && validExamples.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          {validExamples.slice(0, 3).map((example, i) => (
            <div key={i} className="text-xs bg-secondary/20 rounded p-2">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium line-clamp-1">{example.questionText}</span>
                <span className="text-destructive font-mono flex-shrink-0">{example.score}/10</span>
              </div>
              <p className="text-muted-foreground italic">"{example.whatWasMissing}"</p>
            </div>
          ))}
          
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Hide examples
          </button>
        </div>
      )}
    </div>
  );
}