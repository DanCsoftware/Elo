interface ScoreDisplayProps {
  score: number;
  size?: 'sm' | 'lg';
}

const ScoreDisplay = ({ score, size = 'lg' }: ScoreDisplayProps) => {
  const getScoreColor = () => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreEmoji = () => {
    if (score >= 8) return '🚀';
    if (score >= 6) return '⚡';
    return '💪';
  };

  const getScoreBgColor = () => {
    if (score >= 8) return 'bg-success/10';
    if (score >= 6) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  if (size === 'sm') {
    return (
      <span className={`font-bold ${getScoreColor()}`}>
        {score.toFixed(1)}
      </span>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center p-8 rounded-2xl ${getScoreBgColor()}`}>
      <span className="text-4xl mb-2">{getScoreEmoji()}</span>
      <div className={`text-5xl font-bold ${getScoreColor()}`}>
        {score.toFixed(1)}
        <span className="text-2xl text-muted-foreground font-medium">/10</span>
      </div>
    </div>
  );
};

export default ScoreDisplay;
