import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface HintSectionProps {
  hint: string;
}

const HintSection = ({ hint }: HintSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-secondary rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          <span className="font-medium text-foreground">Need a hint?</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 animate-slide-up">
          <p className="text-sm text-muted-foreground leading-relaxed">
            💡 {hint}
          </p>
        </div>
      )}
    </div>
  );
};

export default HintSection;
