import { Question, getCategoryColor, getDifficultyColor, categoryLabels } from '@/lib/mockData';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
}

const QuestionCard = ({ question, currentIndex, totalQuestions }: QuestionCardProps) => {
  return (
    <div className="bg-card rounded-2xl shadow-card p-6 sm:p-8 space-y-4 animate-slide-up">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground font-medium">
          Question {currentIndex} of {totalQuestions}
        </span>
        <span className="text-muted-foreground">•</span>
        <span className={`px-3 py-1 rounded-full font-medium ${getCategoryColor(question.category)}`}>
          {categoryLabels[question.category]}
        </span>
        <span className={`px-3 py-1 rounded-full font-medium ${getDifficultyColor(question.difficulty)}`}>
          {question.difficulty}
        </span>
      </div>
      
      <h2 className="text-lg sm:text-xl font-semibold text-foreground leading-relaxed">
        {question.text}
      </h2>
    </div>
  );
};

export default QuestionCard;
