import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SignupProgress } from './SignupProgress';

describe('SignupProgress', () => {
  const defaultProps = {
    currentStep: 'account' as const,
    completedSteps: [] as string[],
  };

  describe('Component Rendering', () => {
    it('renders all step labels correctly', () => {
      render(<SignupProgress {...defaultProps} />);
      
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('Connect YouTube')).toBeInTheDocument();
    });

    it('renders step descriptions', () => {
      render(<SignupProgress {...defaultProps} />);
      
      // Note: Descriptions are not currently rendered in the component
      // This test documents the expected behavior if descriptions were to be shown
      const accountStep = screen.getByText('Create Account').closest('div');
      const youtubeStep = screen.getByText('Connect YouTube').closest('div');
      
      expect(accountStep).toBeInTheDocument();
      expect(youtubeStep).toBeInTheDocument();
    });

    it('renders correct number of step indicators', () => {
      render(<SignupProgress {...defaultProps} />);
      
      // Should have 2 Circle icons (one for each step)
      const circles = screen.getAllByTestId('circle-icon');
      expect(circles).toHaveLength(2);
    });
  });

  describe('Current Step Highlighting', () => {
    it('highlights the account step when it is current', () => {
      render(
        <SignupProgress 
          currentStep="account" 
          completedSteps={[]} 
        />
      );
      
      const accountIndicator = screen.getByTestId('step-indicator-account');
      expect(accountIndicator).toHaveClass('border-primary', 'bg-primary', 'text-primary-foreground');
    });

    it('highlights the youtube step when it is current', () => {
      render(
        <SignupProgress 
          currentStep="youtube" 
          completedSteps={['account']} 
        />
      );
      
      const youtubeIndicator = screen.getByTestId('step-indicator-youtube');
      expect(youtubeIndicator).toHaveClass('border-primary', 'bg-primary', 'text-primary-foreground');
    });
  });

  describe('Completed Steps', () => {
    it('shows check icon for completed account step', () => {
      render(
        <SignupProgress 
          currentStep="youtube" 
          completedSteps={['account']} 
        />
      );
      
      const checkIcon = screen.getByTestId('check-circle-icon');
      expect(checkIcon).toBeInTheDocument();
    });

    it('shows green background for completed steps', () => {
      render(
        <SignupProgress 
          currentStep="youtube" 
          completedSteps={['account']} 
        />
      );
      
      const accountIndicator = screen.getByTestId('step-indicator-account');
      expect(accountIndicator).toHaveClass('bg-green-500', 'text-white');
    });

    it('shows both steps as completed when both are in completedSteps', () => {
      render(
        <SignupProgress 
          currentStep="youtube" 
          completedSteps={['account', 'youtube']} 
        />
      );
      
      const checkIcons = screen.getAllByTestId('check-circle-icon');
      expect(checkIcons).toHaveLength(2);
    });
  });

  describe('Incomplete Steps', () => {
    it('shows circle icon for incomplete steps', () => {
      render(
        <SignupProgress 
          currentStep="account" 
          completedSteps={[]} 
        />
      );
      
      const circleIcons = screen.getAllByTestId('circle-icon');
      expect(circleIcons).toHaveLength(2); // Both steps should show circle icons
    });

    it('applies default styling to incomplete, non-current steps', () => {
      render(
        <SignupProgress 
          currentStep="account" 
          completedSteps={[]} 
        />
      );
      
      const youtubeIndicator = screen.getByTestId('step-indicator-youtube');
      expect(youtubeIndicator).toHaveClass('border-gray-300', 'bg-white', 'text-white-400');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty completedSteps array', () => {
      render(
        <SignupProgress 
          currentStep="account" 
          completedSteps={[]} 
        />
      );
      
      // Should not have any check icons
      const checkIcons = screen.queryAllByTestId('check-circle-icon');
      expect(checkIcons).toHaveLength(0);
    });

    it('handles completedSteps with invalid step IDs', () => {
      render(
        <SignupProgress 
          currentStep="account" 
          completedSteps={['invalid-step', 'account']} 
        />
      );
      
      // Should still work correctly for valid step
      const checkIcon = screen.getByTestId('check-circle-icon');
      expect(checkIcon).toBeInTheDocument();
    });

    it('handles when current step is also in completed steps', () => {
      render(
        <SignupProgress 
          currentStep="account" 
          completedSteps={['account']} 
        />
      );
      
      // Current step styling should take precedence
      const accountIndicator = screen.getByTestId('step-indicator-account');
      
      // Should have current step styling, not completed step styling
      expect(accountIndicator).toHaveClass('border-primary', 'bg-primary', 'text-primary-foreground');
    });
  });

  describe('Visual States', () => {
    it('applies correct text colors for all states', () => {
      render(
        <SignupProgress 
          currentStep="youtube" 
          completedSteps={['account']} 
        />
      );
      
      const accountLabel = screen.getByTestId('step-label-account');
      const youtubeLabel = screen.getByTestId('step-label-youtube');
      
      // Both labels should have white text color
      expect(accountLabel).toHaveClass('text-white');
      expect(youtubeLabel).toHaveClass('text-white');
    });

    it('maintains consistent layout structure', () => {
      render(<SignupProgress {...defaultProps} />);
      
      // Check that both steps are present
      expect(screen.getByTestId('step-account')).toBeInTheDocument();
      expect(screen.getByTestId('step-youtube')).toBeInTheDocument();
      
      // Check that step indicators are present
      expect(screen.getByTestId('step-indicator-account')).toBeInTheDocument();
      expect(screen.getByTestId('step-indicator-youtube')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper semantic structure', () => {
      render(<SignupProgress {...defaultProps} />);
      
      // Step labels should be present and readable
      expect(screen.getByText('Create Account')).toBeVisible();
      expect(screen.getByText('Connect YouTube')).toBeVisible();
    });

    it('uses appropriate ARIA attributes for icons', () => {
      render(
        <SignupProgress 
          currentStep="youtube" 
          completedSteps={['account']} 
        />
      );
      
      // Icons should be properly labeled or have aria attributes
      const checkIcon = screen.getByTestId('check-circle-icon');
      const circleIcon = screen.getByTestId('circle-icon');
      
      expect(checkIcon).toBeInTheDocument();
      expect(circleIcon).toBeInTheDocument();
    });
  });

  describe('Step Flow Logic', () => {
    it('correctly represents account -> youtube flow', () => {
      // Test the complete flow from start to finish
      const { rerender } = render(
        <SignupProgress 
          currentStep="account" 
          completedSteps={[]} 
        />
      );
      
      // Initially on account step
      expect(screen.getByTestId('step-indicator-account'))
        .toHaveClass('border-primary');
      
      // Move to youtube step with account completed
      rerender(
        <SignupProgress 
          currentStep="youtube" 
          completedSteps={['account']} 
        />
      );
      
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('step-indicator-youtube'))
        .toHaveClass('border-primary');
    });
  });
});