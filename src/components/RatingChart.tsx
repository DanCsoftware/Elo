import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RatingDataPoint {
  date: string;
  rating: number;
  change: number;
}

interface RatingChartProps {
  sessions: Array<{
    created_at: string;
    elo_after?: number;
    elo_change?: number;
  }>;
  currentRating: number;
}

export function RatingChart({ sessions, currentRating }: RatingChartProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Process session data into chart points
  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return [{ date: 'Now', rating: currentRating, change: 0 }];
    }

    // Filter by time range
    const now = new Date();
    const cutoffDate = new Date();
    if (timeRange === '7d') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      cutoffDate.setDate(now.getDate() - 30);
    } else {
      cutoffDate.setTime(0); // All time
    }

    const filteredSessions = sessions
      .filter(s => s.elo_after !== undefined && new Date(s.created_at) >= cutoffDate)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (filteredSessions.length === 0) {
      return [{ date: 'Now', rating: currentRating, change: 0 }];
    }

    // Create data points
    const points: RatingDataPoint[] = filteredSessions.map(session => ({
      date: new Date(session.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      rating: session.elo_after!,
      change: session.elo_change || 0,
    }));

    return points;
  }, [sessions, currentRating, timeRange]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length < 2) {
      return { change: 0, percentChange: 0, peak: currentRating, low: currentRating };
    }

    const firstRating = chartData[0].rating;
    const lastRating = chartData[chartData.length - 1].rating;
    const change = lastRating - firstRating;


  // Prevent division by zero and infinity
  let percentChange = 0;
  if (firstRating > 0 && change !== 0) {
    percentChange = ((change / firstRating) * 100);
  }
  
  const peak = Math.max(...chartData.map(d => d.rating));
  const low = Math.min(...chartData.map(d => d.rating));

  return { change, percentChange, peak, low };
}, [chartData, currentRating]);

  const getRatingTier = (rating: number) => {
    if (rating < 1000) return 'Entry Level';
    if (rating < 1200) return 'Associate';
    if (rating < 1400) return 'PM';
    if (rating < 1600) return 'Senior PM';
    if (rating < 1800) return 'Staff PM';
    if (rating < 2000) return 'Principal';
    return 'Legendary';
  };

  return (
    <div className="space-y-4">
      {/* Header with time range filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">Rating Journey</h2>
          <div className="flex items-center gap-2 mt-1">
            {stats.change !== 0 && (
              <>
                {stats.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <span className={`text-sm font-semibold ${stats.change > 0 ? 'text-success' : 'text-destructive'}`}>
                  {stats.change > 0 ? '+' : ''}{stats.change.toFixed(0)} ({stats.percentChange > 0 ? '+' : ''}{stats.percentChange.toFixed(1)}%)
                </span>
              </>
            )}
            <span className="text-xs text-muted-foreground">
              {timeRange === '7d' && 'past 7 days'}
              {timeRange === '30d' && 'past 30 days'}
              {timeRange === 'all' && 'all time'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={timeRange === '7d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('7d')}
          >
            7D
          </Button>
          <Button
            size="sm"
            variant={timeRange === '30d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('30d')}
          >
            30D
          </Button>
          <Button
            size="sm"
            variant={timeRange === 'all' ? 'default' : 'outline'}
            onClick={() => setTimeRange('all')}
          >
            All
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              stroke="#888"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#888"
              style={{ fontSize: '12px' }}
              domain={['dataMin - 50', 'dataMax + 50']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#888' }}
              formatter={(value: number) => [value.toFixed(0), 'Rating']}
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#6366f1', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Current</p>
          <p className="text-2xl font-bold text-primary">{currentRating}</p>
          <p className="text-xs text-muted-foreground">{getRatingTier(currentRating)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Peak</p>
          <p className="text-2xl font-bold">{stats.peak}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Low</p>
          <p className="text-2xl font-bold">{stats.low}</p>
        </div>
      </div>
    </div>
  );
}