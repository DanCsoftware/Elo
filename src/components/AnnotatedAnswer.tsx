import { useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface Annotation {
  text: string;
  type: 'strength' | 'weakness';
  feedback: string;
}

interface AnnotatedAnswerProps {
  answer: string;
  strengths: string[];
  weaknesses: string[];
}

export function AnnotatedAnswer({ answer, strengths, weaknesses }: AnnotatedAnswerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    const allAnnotations: Annotation[] = [];
    
    // Extract quotes from strengths - be more aggressive
    strengths.forEach(strength => {
      // Try multiple quote patterns
      const patterns = [
        /Quote their words: ['"]([^'"]+)['"]/i,
        /['"]([^'"]{20,})['"]/i, // At least 20 chars in quotes
        /'([^']{15,})'/i,        // Single quotes, 15+ chars
        /"([^"]{15,})"/i,        // Double quotes, 15+ chars
      ];
      
      for (const pattern of patterns) {
        const match = strength.match(pattern);
        if (match) {
          const quote = match[1].trim();
          // Only use if it's actually in the answer
          if (answer.includes(quote)) {
            const feedback = strength.split(' - ').slice(1).join(' - ') || strength;
            allAnnotations.push({ text: quote, type: 'strength', feedback });
            break;
          }
        }
      }
    });
    
    // Extract quotes from weaknesses - same approach
    weaknesses.forEach(weakness => {
      const patterns = [
        /Quote their words: ['"]([^'"]+)['"]/i,
        /['"]([^'"]{20,})['"]/i,
        /'([^']{15,})'/i,
        /"([^"]{15,})"/i,
      ];
      
      for (const pattern of patterns) {
        const match = weakness.match(pattern);
        if (match) {
          const quote = match[1].trim();
          if (answer.includes(quote)) {
            const feedback = weakness.split(' - ').slice(1).join(' - ') || weakness;
            allAnnotations.push({ text: quote, type: 'weakness', feedback });
            break;
          }
        }
      }
    });
    
    return allAnnotations;
  });

  const renderAnnotatedAnswer = () => {
    if (annotations.length === 0) {
      return <span>{answer}</span>;
    }

    let parts: JSX.Element[] = [];
    let lastIndex = 0;

    // Sort annotations by position in answer
    const sortedAnnotations = [...annotations].sort((a, b) => {
      const aIndex = answer.indexOf(a.text);
      const bIndex = answer.indexOf(b.text);
      return aIndex - bIndex;
    });

    sortedAnnotations.forEach((annotation, i) => {
      const index = answer.indexOf(annotation.text, lastIndex);
      
      if (index === -1) return;
      
      // Add text before annotation
      if (index > lastIndex) {
        parts.push(
          <span key={`text-${i}`}>
            {answer.substring(lastIndex, index)}
          </span>
        );
      }
      
      // Add annotated text with hover
      parts.push(
        <HoverCard key={`annotation-${i}`}>
          <HoverCardTrigger asChild>
            <span
              className={`border-b-2 border-dashed cursor-help ${
                annotation.type === 'strength' 
                  ? 'border-success text-success' 
                  : 'border-destructive text-destructive'
              }`}
            >
              {annotation.text}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className={`text-sm ${
              annotation.type === 'strength' ? 'text-success' : 'text-destructive'
            }`}>
              <p className="font-semibold mb-2">
                {annotation.type === 'strength' ? '✓ Strength' : '✗ Area to Improve'}
              </p>
              <p className="text-foreground">{annotation.feedback}</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
      
      lastIndex = index + annotation.text.length;
    });
    
    // Add remaining text
    if (lastIndex < answer.length) {
      parts.push(
        <span key="text-end">
          {answer.substring(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };

  return (
    <div className="bg-secondary/30 border border-border rounded-md p-4">
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {renderAnnotatedAnswer()}
      </p>
      {annotations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="border-b-2 border-dashed border-success w-6"></span>
            <span>Hover for strength</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="border-b-2 border-dashed border-destructive w-6"></span>
            <span>Hover for improvement</span>
          </div>
        </div>
      )}
    </div>
  );
}