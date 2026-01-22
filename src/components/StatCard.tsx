interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
}

const StatCard = ({ label, value, suffix }: StatCardProps) => {
  return (
    <div className="bg-card border border-border p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-mono font-semibold text-foreground">
        {value}
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
};

export default StatCard;
