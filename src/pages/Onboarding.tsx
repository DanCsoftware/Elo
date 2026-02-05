import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    currentRole: '',
    targetRole: '',
    targetCompanies: [] as string[],
    interviewTimeline: '',
    focusAreas: [] as string[]
  });

  const roles = [
    { value: 'student', label: 'Student / Aspiring PM' },
    { value: 'apm', label: 'Associate PM (0-2 years)' },
    { value: 'pm', label: 'PM (2-5 years)' },
    { value: 'senior', label: 'Senior PM (5-8 years)' },
    { value: 'staff', label: 'Staff+ PM (8+ years)' },
    { value: 'other', label: 'Other Role' }
  ];

  const companies = [
    'FAANG (Google, Meta, Amazon, Apple, Netflix)',
    'Microsoft / LinkedIn',
    'Startup (Seed - Series B)',
    'Growth Stage (Series C+)',
    'Stripe / Shopify / Square',
    'Coinbase / Crypto',
    'AI Companies (OpenAI, Anthropic, etc.)',
    'Not Sure Yet'
  ];

  const timelines = [
    { value: '1month', label: 'Interviewing now (1 month)' },
    { value: '3months', label: 'Interviewing soon (3 months)' },
    { value: '6months', label: 'Preparing (6+ months)' },
    { value: 'practice', label: 'Just practicing / staying sharp' }
  ];

  const focusOptions = [
    'Product Strategy',
    'Metrics & Analytics',
    'Prioritization',
    'Product Design',
    'AI Product Management',
    'Technical PM Skills',
    'Stakeholder Management',
    'Execution & Delivery'
  ];

  const handleSubmit = async () => {
    if (!user) return;

    try {
      // Save onboarding data to user_stats
      const { error } = await supabase
        .from('user_stats')
        .update({
          onboarding_completed: true,
          current_role: formData.currentRole,
          target_role: formData.targetRole,
          target_companies: formData.targetCompanies,
          interview_timeline: formData.interviewTimeline,
          focus_areas: formData.focusAreas
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile saved! Let\'s start practicing.');
      navigate('/practice');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {step} of 4</span>
            <span className="text-sm font-medium">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Current Role */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Where are you now?</h2>
              <p className="text-muted-foreground">This helps us calibrate question difficulty</p>
            </div>

            <div className="space-y-2">
              {roles.map(role => (
                <button
                  key={role.value}
                  onClick={() => setFormData({ ...formData, currentRole: role.value })}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    formData.currentRole === role.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">{role.label}</span>
                </button>
              ))}
            </div>

            <Button 
              onClick={() => setStep(2)} 
              disabled={!formData.currentRole}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Target Role */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Where are you going?</h2>
              <p className="text-muted-foreground">What role are you targeting?</p>
            </div>

            <div className="space-y-2">
              {roles.map(role => (
                <button
                  key={role.value}
                  onClick={() => setFormData({ ...formData, targetRole: role.value })}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    formData.targetRole === role.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">{role.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="w-full">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!formData.targetRole}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Target Companies */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Target companies?</h2>
              <p className="text-muted-foreground">Select all that apply</p>
            </div>

            <div className="space-y-2">
              {companies.map(company => (
                <button
                  key={company}
                  onClick={() => {
                    const newCompanies = formData.targetCompanies.includes(company)
                      ? formData.targetCompanies.filter(c => c !== company)
                      : [...formData.targetCompanies, company];
                    setFormData({ ...formData, targetCompanies: newCompanies });
                  }}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    formData.targetCompanies.includes(company)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{company}</span>
                    {formData.targetCompanies.includes(company) && (
                      <span className="text-primary">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="outline" className="w-full">
                Back
              </Button>
              <Button 
                onClick={() => setStep(4)} 
                disabled={formData.targetCompanies.length === 0}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Timeline & Focus */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Interview timeline?</h2>
              <p className="text-muted-foreground">When are you interviewing?</p>
            </div>

            <div className="space-y-2">
              {timelines.map(timeline => (
                <button
                  key={timeline.value}
                  onClick={() => setFormData({ ...formData, interviewTimeline: timeline.value })}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    formData.interviewTimeline === timeline.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">{timeline.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Focus areas (optional)</h3>
              <p className="text-sm text-muted-foreground mb-4">What do you want to improve?</p>
              
              <div className="grid grid-cols-2 gap-2">
                {focusOptions.map(focus => (
                  <button
                    key={focus}
                    onClick={() => {
                      const newFocus = formData.focusAreas.includes(focus)
                        ? formData.focusAreas.filter(f => f !== focus)
                        : [...formData.focusAreas, focus];
                      setFormData({ ...formData, focusAreas: newFocus });
                    }}
                    className={`p-3 border rounded-lg text-sm text-left transition-colors ${
                      formData.focusAreas.includes(focus)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {focus}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep(3)} variant="outline" className="w-full">
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.interviewTimeline}
                className="w-full"
              >
                Start Practicing
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}