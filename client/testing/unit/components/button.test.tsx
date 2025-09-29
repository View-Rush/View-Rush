import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing/utils/test-helpers';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render button with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('should render different button variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    
    let button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button', { name: /outline/i });
    expect(button).toHaveClass('border', 'border-input');

    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button', { name: /ghost/i });
    expect(button).toHaveClass('hover:bg-accent');

    rerender(<Button variant="hero">Hero</Button>);
    button = screen.getByRole('button', { name: /hero/i });
    expect(button).toHaveClass('bg-gradient-primary');

    rerender(<Button variant="youtube">YouTube</Button>);
    button = screen.getByRole('button', { name: /youtube/i });
    expect(button).toHaveClass('bg-youtube-red');
  });

  it('should render different button sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    let button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveClass('h-11');

    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole('button', { name: /icon/i });
    expect(button).toHaveClass('h-10', 'w-10');
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button', { name: /custom/i });
    expect(button).toHaveClass('custom-class');
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    
    render(<Button ref={ref}>Button with ref</Button>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe('Button with ref');
  });

  it('should render with default variant and size when not specified', () => {
    render(<Button>Default</Button>);
    
    const button = screen.getByRole('button', { name: /default/i });
    expect(button).toHaveClass('bg-primary'); // default variant
    expect(button).toHaveClass('h-10'); // default size
  });

  it('should handle multiple class variants together', () => {
    render(
      <Button variant="secondary" size="lg" className="rounded-full">
        Multi-variant
      </Button>
    );
    
    const button = screen.getByRole('button', { name: /multi-variant/i });
    expect(button).toHaveClass('bg-secondary', 'h-11', 'rounded-full');
  });

  it('should render with proper accessibility attributes', () => {
    render(<Button aria-label="Custom aria label">Button</Button>);
    
    const button = screen.getByRole('button', { name: /custom aria label/i });
    expect(button).toHaveAttribute('aria-label', 'Custom aria label');
  });

  it('should handle keyboard events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Keyboard Test</Button>);
    
    const button = screen.getByRole('button', { name: /keyboard test/i });
    button.focus();
    
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('should render with different button variants and maintain accessibility', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
    
    variants.forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>{variant} button</Button>);
      
      const button = screen.getByRole('button', { name: new RegExp(`${variant} button`, 'i') });
      expect(button).toBeInTheDocument();
      // Button components don't automatically get type="button" unless explicitly set
      
      unmount();
    });
  });
});