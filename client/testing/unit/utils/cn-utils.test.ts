import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('btn', 'btn-primary');
    expect(result).toContain('btn');
    expect(result).toContain('btn-primary');
  });

  it('should handle conditional class names', () => {
    const isActive = true;
    const result = cn('btn', isActive && 'btn-active');
    expect(result).toContain('btn');
    expect(result).toContain('btn-active');
  });

  it('should handle false conditional class names', () => {
    const isActive = false;
    const result = cn('btn', isActive && 'btn-active');
    expect(result).toContain('btn');
    expect(result).not.toContain('btn-active');
  });

  it('should merge Tailwind classes and resolve conflicts', () => {
    const result = cn('p-2', 'p-4');
    // Should keep only p-4 as it's the last padding class
    expect(result).toContain('p-4');
    expect(result).not.toContain('p-2');
  });

  it('should handle arrays of class names', () => {
    const result = cn(['btn', 'btn-primary'], 'text-white');
    expect(result).toContain('btn');
    expect(result).toContain('btn-primary');
    expect(result).toContain('text-white');
  });

  it('should handle undefined and null values', () => {
    const result = cn('btn', undefined, null, 'text-white');
    expect(result).toContain('btn');
    expect(result).toContain('text-white');
  });

  it('should handle empty string and return empty string', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle objects with boolean values', () => {
    const result = cn('btn', { 'btn-active': true, 'btn-disabled': false });
    expect(result).toContain('btn');
    expect(result).toContain('btn-active');
    expect(result).not.toContain('btn-disabled');
  });

  it('should handle complex combinations', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn(
      'base-class',
      ['array-class-1', 'array-class-2'],
      {
        'conditional-true': isActive,
        'conditional-false': isDisabled,
      },
      isActive && 'active-class',
      !isDisabled && 'enabled-class',
      'final-class'
    );
    
    expect(result).toContain('base-class');
    expect(result).toContain('array-class-1');
    expect(result).toContain('array-class-2');
    expect(result).toContain('conditional-true');
    expect(result).not.toContain('conditional-false');
    expect(result).toContain('active-class');
    expect(result).toContain('enabled-class');
    expect(result).toContain('final-class');
  });

  it('should properly merge conflicting Tailwind classes', () => {
    const result = cn('bg-red-500', 'bg-blue-500', 'text-sm', 'text-lg');
    expect(result).toContain('bg-blue-500');
    expect(result).not.toContain('bg-red-500');
    expect(result).toContain('text-lg');
    expect(result).not.toContain('text-sm');
  });
});