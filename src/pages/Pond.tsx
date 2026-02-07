import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

interface AIReview {
  grade: string;
  summary: string;
  fullReview: string;
  notesToDelete: string[];
  strongestNotes: string[];
}

const Pond = () => {
  const { user, signInWithGoogle } = useAuth();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [implementing, setImplementing] = useState(false);
  const [aiReview, setAiReview] = useState<AIReview | null>(null);

  useEffect(() => {
    if (user) {
      fetchNotes();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pond_notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const createNewNote = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pond_notes')
        .insert({
          user_id: user.id,
          title: 'Untitled Note',
          content: '',
        })
        .select()
        .single();

      if (error) throw error;
      
      setNotes([data, ...notes]);
      setSelectedNote(data);
      setEditTitle(data.title || '');
      setEditContent(data.content);
      setIsEditing(true);
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    }
  };

  const saveNote = async () => {
    if (!selectedNote) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('pond_notes')
        .update({
          title: editTitle || 'Untitled Note',
          content: editContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedNote.id);

      if (error) throw error;

      const updatedNote = {
        ...selectedNote,
        title: editTitle || 'Untitled Note',
        content: editContent,
        updated_at: new Date().toISOString(),
      };

      setNotes(notes.map(n => n.id === selectedNote.id ? updatedNote : n));
      setSelectedNote(updatedNote);
      setIsEditing(false);
      toast.success('Note saved');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      const { error } = await supabase
        .from('pond_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const analyzeAllNotes = async () => {
    if (notes.length === 0) {
      toast.error('No notes to analyze');
      return;
    }

    setAnalyzingAll(true);
    setAiReview(null);
    
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const allNotesContent = notes.map((n, idx) => 
        `Note ${idx + 1}: ${n.title}\n${n.content}`
      ).join('\n\n---\n\n');
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/evaluate-answer?type=analyze-pond-advanced`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            notesContent: allNotesContent,
            noteCount: notes.length,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze notes');
      }

      const data = await response.json();
      
      // Parse the review
      const reviewText = data.review || '';
      const gradeMatch = reviewText.match(/Grade:\s*([A-F][+-]?)/i);
      const grade = gradeMatch ? gradeMatch[1] : 'B';
      
      setAiReview({
        grade,
        summary: reviewText.substring(0, 150) + '...',
        fullReview: reviewText,
        notesToDelete: [],
        strongestNotes: [],
      });
      
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing notes:', error);
      toast.error('Failed to analyze notes');
    } finally {
      setAnalyzingAll(false);
    }
  };

  const implementRecommendations = async () => {
    if (!aiReview || !user) return;

    setImplementing(true);
    try {
      // For now, just show a success message
      // In the future, this would call an AI endpoint to actually modify notes
      toast.success('Recommendations noted! Consider making these changes manually for now.');
      setAiReview(null);
    } catch (error) {
      console.error('Error implementing recommendations:', error);
      toast.error('Failed to implement changes');
    } finally {
      setImplementing(false);
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title || '');
    setEditContent(note.content);
    setIsEditing(false);
    setAiReview(null);
  };

  const startEditing = () => {
    setIsEditing(true);
    setAiReview(null);
  };

  const cancelEditing = () => {
    if (selectedNote) {
      setEditTitle(selectedNote.title || '');
      setEditContent(selectedNote.content);
    }
    setIsEditing(false);
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-primary';
    if (grade.startsWith('C')) return 'text-warning';
    return 'text-destructive';
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-3">Sign In to Access The Pond</h1>
            <p className="text-muted-foreground text-lg">
              Your personal PM knowledge base
            </p>
          </div>
          <Button onClick={signInWithGoogle} size="lg">
            Sign In with Google
          </Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Sidebar - Notes List */}
        <div className="w-80 bg-card border border-border rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <h2 className="text-lg font-semibold">The Pond</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'} • Synced to cloud
              </p>
            </div>
            <Button onClick={createNewNote} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {notes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No notes yet</p>
                <p className="text-xs mt-1">Click + to create your first note</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-2">
                {notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedNote?.id === note.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-secondary/30 hover:bg-secondary/50 border border-transparent'
                    }`}
                  >
                    <h3 className="text-sm font-medium truncate">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {note.content.substring(0, 50) || 'Empty note'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Review Button */}
              <Button
                onClick={analyzeAllNotes}
                disabled={analyzingAll}
                variant="outline"
                className="mt-4 w-full gap-2"
              >
                {analyzingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Review Note Quality
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Main Editor */}
        <div className="flex-1 bg-card border border-border rounded-lg p-6 flex flex-col">
          {aiReview ? (
            /* AI Review Results */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Note Quality Review</h2>
                <Button variant="ghost" size="sm" onClick={() => setAiReview(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Grade */}
              <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Overall Grade</p>
                  <p className={`text-6xl font-bold ${getGradeColor(aiReview.grade)}`}>
                    {aiReview.grade}
                  </p>
                </div>
                <div className="flex-1 border-l border-border pl-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiReview.summary}
                  </p>
                </div>
              </div>

              {/* AI Feedback */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">AI Analysis</h3>
                <div className="bg-secondary/20 rounded-lg p-4 border border-border">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {aiReview.fullReview}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  onClick={implementRecommendations}
                  disabled={implementing}
                  className="gap-2"
                >
                  {implementing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Implementing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Implement Recommendations
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setAiReview(null)}>
                  Keep As Is
                </Button>
              </div>
            </div>
          ) : !selectedNote ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg">Select a note or create a new one</p>
                <p className="text-sm mt-2">Capture frameworks, insights, and PM thinking here</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-2xl font-bold bg-transparent border-none outline-none w-full"
                      placeholder="Note title..."
                    />
                  ) : (
                    <div>
                      <h1 className="text-2xl font-bold">{selectedNote.title || 'Untitled Note'}</h1>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last saved: {new Date(selectedNote.updated_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button onClick={cancelEditing} variant="ghost" size="sm">
                        Cancel
                      </Button>
                      <Button onClick={saveNote} size="sm" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        ☁️ Saved to cloud
                      </span>
                      <Button onClick={startEditing} variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteNote(selectedNote.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed"
                    placeholder="Start writing..."
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedNote.content || 'Empty note'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Pond;