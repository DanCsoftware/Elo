import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookMarked } from 'lucide-react';

interface SaveToPondProps {
  question: string;
  advice: string;
}

export function SaveToPond({ question, advice }: SaveToPondProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      const note = `**${new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })}**

**Question:** ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}

**Actionable Advice:**
${advice}

---`;

      // Append to pond notes
      const { data: existingNotes } = await supabase
        .from('pond_notes')
        .select('content')
        .eq('user_id', user.id)
        .single();

      const newContent = existingNotes 
        ? `${existingNotes.content}\n\n${note}`
        : note;

      const { error } = await supabase
        .from('pond_notes')
        .upsert({
          user_id: user.id,
          content: newContent,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Saved to Pond!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save to Pond');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      onClick={handleSave}
      disabled={saving}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      <BookMarked className="w-4 h-4" />
      {saving ? 'Saving...' : 'Save to Pond'}
    </Button>
  );
}