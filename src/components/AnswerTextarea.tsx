import { ChangeEvent } from 'react';

interface AnswerTextareaProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}

const AnswerTextarea = ({
  value,
  onChange,
  maxLength = 2000,
  placeholder = 'Type your answer here...',
}: AnswerTextareaProps) => {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= maxLength) {
      onChange(e.target.value);
    }
  };

  const characterCount = value.length;

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full min-h-[240px] p-4 bg-card border border-border text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground resize-none transition-colors"
        aria-label="Your answer"
      />
      <div className="absolute bottom-3 right-3">
        <span className="text-xs font-mono text-muted-foreground">
          {characterCount}/{maxLength}
        </span>
      </div>
    </div>
  );
};

export default AnswerTextarea;
