import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing/utils/test-helpers';
import { CTA } from '@/components/sections/CTA';

describe('CTA Component', () => {
  it('should render CTA section with main heading', () => {
    render(<CTA />);

    // Look for the main heading text
    const mainHeading = screen.getByText(/ready to transform your/i);
    expect(mainHeading).toBeInTheDocument();
    
    // Check for YouTube Strategy text
    const strategyText = screen.getByText(/youtube strategy/i);
    expect(strategyText).toBeInTheDocument();
    
    // Verify the section structure
    const section = document.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('py-24', 'bg-gradient-hero');
  });

  it('should render action buttons', () => {
    render(<CTA />);
    
    // Look for Get Started button
    const getStartedButton = screen.getByRole('button', { name: /get started free/i });
    expect(getStartedButton).toBeInTheDocument();
    
    // Look for Demo button
    const demoButton = screen.getByRole('button', { name: /book a demo/i });
    expect(demoButton).toBeInTheDocument();
  });

  it('should have accessible structure', () => {
    render(<CTA />);
    
    // Check for proper heading structure
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    
    // Check for descriptive text
    const description = screen.getByText(/start your free analysis today/i);
    expect(description).toBeInTheDocument();
  });

  it('should render with proper text content', () => {
    render(<CTA />);
    
    // Check for key messaging
    expect(screen.getByText(/join 2,000\+ youtube creators/i)).toBeInTheDocument();
    expect(screen.getByText(/no credit card required/i)).toBeInTheDocument();
    expect(screen.getByText(/trusted by creators islandwide/i)).toBeInTheDocument();
  });
});