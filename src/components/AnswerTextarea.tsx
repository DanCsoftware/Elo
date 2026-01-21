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
  const isNearLimit = characterCount > maxLength * 0.8;
  const isAtLimit = characterCount >= maxLength;

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full min-h-[200px] p-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
        aria-label="Your answer"
      />
      <div className="flex justify-end">
        <span
          className={`text-sm font-medium transition-colors ${
            isAtLimit
              ? 'text-destructive'
              : isNearLimit
              ? 'text-warning'
              : 'text-muted-foreground'
          }`}
        >
          {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default AnswerTextarea;
