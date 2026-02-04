import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface TrialStatus {
  isApproved: boolean;
  questionsAllowed: number;
  questionsUsed: number;
  questionsRemaining: number;
  canPractice: boolean;
}

export function useTrialStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TrialStatus>({
    isApproved: false,
    questionsAllowed: 0,
    questionsUsed: 0,
    questionsRemaining: 0,
    canPractice: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function checkAccess() {
      // Check if user is approved
      const { data: approvedUser, error } = await supabase
        .from('approved_users')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error || !approvedUser) {
        // User not approved - show waitlist message
        setStatus({
          isApproved: false,
          questionsAllowed: 0,
          questionsUsed: 0,
          questionsRemaining: 0,
          canPractice: false
        });
        setLoading(false);
        return;
      }

      // User is approved
      const questionsRemaining = approvedUser.questions_allowed - approvedUser.questions_used;
      
      setStatus({
        isApproved: true,
        questionsAllowed: approvedUser.questions_allowed,
        questionsUsed: approvedUser.questions_used,
        questionsRemaining: Math.max(0, questionsRemaining),
        canPractice: questionsRemaining > 0
      });
      setLoading(false);
    }

    checkAccess();
  }, [user]);

  return { ...status, loading };
}