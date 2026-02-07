import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RatingDataPoint {
  date: string;
  rating: number;
  change: number;
  isReset?: boolean;
  resetFrom?: number;
  timestamp: number; // Add for sorting
}

interface RatingChartProps {
  sessions: Array<{
    created_at: string;
    elo_after?: number;
    elo_change?: number;
  }>;
  resets?: Array<{
    reset_at: string;
    elo_before: number;
    elo_after: number;
  }>;
  currentRating: number;
}

export function RatingChart({ sessions, resets = [], currentRating }: RatingChartProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Process session data into chart points
  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return [{ date: 'Now', rating: currentRating, change: 0, timestamp: Date.now() }];
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

    // Filter and clean sessions
    const filteredSessions = sessions
      .filter(s => {
        // Only include sessions with valid elo_after
        if (s.elo_after === undefined || s.elo_after === null) return false;
        // Only include sessions within time range
        if (new Date(s.created_at) < cutoffDate) return false;
        // Filter out impossible ratings
        if (s.elo_after < 800 || s.elo_after > 2200) return false;
        return true;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (filteredSessions.length === 0) {
      return [{ date: 'Now', rating: currentRating, change: 0, timestamp: Date.now() }];
    }

    // Create reset lookup map
    const resetMap = new Map(
      resets
        .filter(r => new Date(r.reset_at) >= cutoffDate)
        .map(r => {
          const resetDate = new Date(r.reset_at);
          return [
            resetDate.toISOString().split('T')[0],
            { from: r.elo_before, to: r.elo_after, timestamp: resetDate.getTime() }
          ];
        })
    );

    // Create data points with deduplication
    const pointsMap = new Map<string, RatingDataPoint>();
    
    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.created_at);
      const dateKey = sessionDate.toISOString().split('T')[0];
      const timestamp = sessionDate.getTime();
      
      const resetInfo = resetMap.get(dateKey);
      
      const point: RatingDataPoint = {
        date: sessionDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        rating: session.elo_after!,
        change: session.elo_change || 0,
        timestamp,
        isReset: !!resetInfo,
        resetFrom: resetInfo?.from,
      };

      // Keep only the latest point per day
      const existingPoint = pointsMap.get(dateKey);
      if (!existingPoint || timestamp > existingPoint.timestamp) {
        pointsMap.set(dateKey, point);
      }
    });

    // Convert map to sorted array
    const points = Array.from(pointsMap.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    return points;
  }, [sessions, resets, currentRating, timeRange]);

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

  // Custom tooltip to show reset info
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-popover border border-border rounded-md p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{data.date}</p>
        {data.isReset ? (
          <>
            <p className="text-sm font-semibold text-warning mb-1">🔄 Elo Reset</p>
            <p className="text-xs text-muted-foreground">
              {data.resetFrom} → {data.rating}
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-primary">{data.rating}</p>
            {data.change !== 0 && (
              <p className={`text-xs ${data.change > 0 ? 'text-success' : 'text-destructive'}`}>
                {data.change > 0 ? '+' : ''}{data.change}
              </p>
            )}
          </>
        )}
      </div>
    );
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
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#6366f1"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.isReset) {
                  // Reset point - orange/yellow dot
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  );
                }
                // Normal point - blue dot
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#6366f1"
                  />
                );
              }}
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