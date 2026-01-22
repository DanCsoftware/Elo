import { Question, getDifficultyColor, categoryLabels } from '@/lib/mockData';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
}

const categoryAbbrev: Record<string, string> = {
  strategy: 'Strat',
  metrics: 'Metr',
  prioritization: 'Prior',
  design: 'Dsgn',
};

const QuestionCard = ({ question, currentIndex, totalQuestions }: QuestionCardProps) => {
  return (
    <div className="bg-card border border-border p-5 space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground font-mono">
          {currentIndex}/{totalQuestions}
        </span>
        <span className="text-border">|</span>
        <span className="text-muted-foreground">
          {categoryAbbrev[question.category]}
        </span>
        <span className={`font-mono text-xs ${getDifficultyColor(question.difficulty)}`}>
          {question.difficulty.charAt(0)}
        </span>
      </div>
      
      <p className="text-foreground leading-relaxed">
        {question.text}
      </p>
    </div>
  );
};

export default QuestionCard;
