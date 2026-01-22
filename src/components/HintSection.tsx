import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface HintSectionProps {
  hint: string;
}

const HintSection = ({ hint }: HintSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary transition-colors"
      >
        <span className="text-sm text-muted-foreground">Hint</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-3 pb-3 border-t border-border">
          <p className="text-sm text-muted-foreground pt-3">
            {hint}
          </p>
        </div>
      )}
    </div>
  );
};

export default HintSection;
