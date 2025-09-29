import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing/utils/test-helpers';
import { Features } from '@/components/sections/Features';

describe('Features Component', () => {
  it('should render features section', () => {
    render(<Features />);
    
    // Look for the main heading
    const mainHeading = screen.getByText(/everything you need to/i);
    expect(mainHeading).toBeInTheDocument();
    
    // Look for the subtitle with gradient
    const subtitle = screen.getByText(/dominate youtube/i);
    expect(subtitle).toBeInTheDocument();
    
    // Verify section structure
    const section = document.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('py-24', 'bg-gradient-card');
  });

  it('should render feature items', () => {
    render(<Features />);
    
    // Look for specific feature titles
    expect(screen.getByText(/global trending analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/ai-powered predictions/i)).toBeInTheDocument();
    expect(screen.getByText(/multi-country insights/i)).toBeInTheDocument();
    
    // Check for feature descriptions
    expect(screen.getByText(/track trending videos/i)).toBeInTheDocument();
    expect(screen.getByText(/machine learning algorithms/i)).toBeInTheDocument();
  });

  it('should have descriptive content', () => {
    render(<Features />);
    
    // Check for main description
    const description = screen.getByText(/view rush combines cutting-edge analytics/i);
    expect(description).toBeInTheDocument();
    
    // Look for badge text
    expect(screen.getByText(/powerful features/i)).toBeInTheDocument();
    
    // Look for stats or metrics
    expect(screen.getByText(/2m\+ videos analyzed daily/i)).toBeInTheDocument();
    expect(screen.getByText(/97% accuracy rate/i)).toBeInTheDocument();
  });

  it('should be responsive and accessible', () => {
    render(<Features />);
    
    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toBeInTheDocument();
    
    // Check for interactive elements
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Verify grid structure exists
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });
});