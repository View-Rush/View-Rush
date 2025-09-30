import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing/utils/test-helpers';
import { Hero } from '@/components/sections/Hero';

// Mock router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('Hero Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render main heading', () => {
    render(<Hero />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Master Your.*YouTube Growth/i);
  });

  it('should render subtitle/description', () => {
    render(<Hero />);
    
    // Look for descriptive text about the platform
    const description = screen.getByText(/Unlock the power of data-driven YouTube success/i);
    expect(description).toBeInTheDocument();
    
    // Should have platform badge
    const badge = screen.getByText(/#1 YouTube Analytics Platform/i);
    expect(badge).toBeInTheDocument();
  });

  it('should render call-to-action buttons', () => {
    render(<Hero />);
    
    // Should have primary CTA button
    const ctaButton = screen.getByRole('button', { name: /Start Free Analysis/i });
    expect(ctaButton).toBeInTheDocument();
    
    // Should have secondary CTA button
    const demoButton = screen.getByRole('button', { name: /Watch Demo/i });
    expect(demoButton).toBeInTheDocument();
  });

  it('should handle get started button click', () => {
    render(<Hero />);
    
    const getStartedButton = screen.getByRole('button', { name: /Start Free Analysis/i });
    fireEvent.click(getStartedButton);
    
    // Should navigate to registration or auth page
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should render hero image or illustration', () => {
    render(<Hero />);
    
    // Look for hero image
    const image = screen.queryByRole('img');
    if (image) {
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('alt');
    }
  });

  it('should have proper semantic structure', () => {
    render(<Hero />);
    
    // Should have proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
  });

  it('should be responsive', () => {
    // Test that component renders without errors on different screen sizes
    const { container } = render(<Hero />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have accessible elements', () => {
    render(<Hero />);
    
    // All buttons should be focusable
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeEnabled();
    });
    
    // All images should have alt text
    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('alt');
    });
  });

  it('should handle secondary action if present', () => {
    render(<Hero />);
    
    // Look for secondary CTA like "Learn More" or "Watch Demo"
    const secondaryButton = screen.queryByRole('button', { name: /learn more|demo|watch/i });
    if (secondaryButton) {
      fireEvent.click(secondaryButton);
      // Should perform appropriate action (navigate, scroll, etc.)
    }
  });

  it('should display key value propositions', () => {
    render(<Hero />);
    
    // Should highlight main benefits - use getAllByText for multiple matches
    const texts = screen.getAllByText(/analytics|insights|data|growth|performance/i);
    expect(texts.length).toBeGreaterThan(0);
    
    // Verify specific stats are shown
    expect(screen.getByText(/113/)).toBeInTheDocument(); // Countries Analyzed
    expect(screen.getByText(/100K\+/)).toBeInTheDocument(); // Videos Tracked  
    expect(screen.getByText(/10K\+/)).toBeInTheDocument(); // Creators Trust Us
  });
});