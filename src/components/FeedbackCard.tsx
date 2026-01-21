import { Check, X } from 'lucide-react';

interface FeedbackCardProps {
  title: string;
  items: string[];
  type: 'success' | 'improvement';
}

const FeedbackCard = ({ title, items, type }: FeedbackCardProps) => {
  const isSuccess = type === 'success';
  
  return (
    <div className="bg-card rounded-xl shadow-card p-5 space-y-3">
      <h3 className={`font-semibold ${isSuccess ? 'text-success' : 'text-destructive'}`}>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            {isSuccess ? (
              <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            )}
            <span className="text-sm text-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeedbackCard;
