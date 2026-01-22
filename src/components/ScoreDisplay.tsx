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

  if (size === 'sm') {
    return (
      <span className={`font-mono font-semibold ${getScoreColor()}`}>
        {score.toFixed(1)}
      </span>
    );
  }

  return (
    <div className="text-center">
      <div className={`text-5xl font-mono font-bold ${getScoreColor()}`}>
        {score.toFixed(1)}
      </div>
      <div className="text-sm text-muted-foreground mt-1">out of 10</div>
    </div>
  );
};

export default ScoreDisplay;
