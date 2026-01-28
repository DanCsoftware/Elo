import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRatingPercentile(userRating: number) {
  const [percentile, setPercentile] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function calculatePercentile() {
      try {
        // Get all user ratings
        const { data: allStats, error } = await supabase
          .from('user_stats')
          .select('elo_rating')
          .not('elo_rating', 'is', null);

        if (error || !allStats || allStats.length === 0) {
          setLoading(false);
          return;
        }

        const totalCount = allStats.length;
        
        // Count users ABOVE your rating
        const aboveCount = allStats.filter(s => s.elo_rating > userRating).length;
        
        // Calculate what % are ABOVE you (so you're in "top X%")
        const topPercent = Math.ceil((aboveCount / totalCount) * 100);
        
        setPercentile(topPercent);
        setTotalUsers(totalCount);
      } catch (err) {
        console.error('Error calculating percentile:', err);
      } finally {
        setLoading(false);
      }
    }

    if (userRating) {
      calculatePercentile();
    }
  }, [userRating]);

  return { percentile, totalUsers, loading };
}