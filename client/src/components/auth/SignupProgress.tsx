import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignupProgressProps {
  currentStep: 'account' | 'youtube';
  completedSteps: string[];
}

export function SignupProgress({ currentStep, completedSteps }: SignupProgressProps) {
  const steps = [
    { id: 'account', label: 'Create Account', description: 'Basic information' },
    { id: 'youtube', label: 'Connect YouTube', description: 'Optional setup' },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                step.id === currentStep 
                  ? "border-primary bg-primary text-primary-foreground"
                  : completedSteps.includes(step.id)
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-gray-300 bg-white text-gray-400"
              )}>
                {completedSteps.includes(step.id) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              <div className="text-center mt-2">
                <div className={cn(
                  "text-sm font-medium",
                  step.id === currentStep || completedSteps.includes(step.id)
                    ? "text-primary"
                    : "text-gray-400"
                )}>
                  {step.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-0.5 w-16 mx-4 transition-colors",
                completedSteps.includes(step.id)
                  ? "bg-green-500"
                  : "bg-gray-300"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
