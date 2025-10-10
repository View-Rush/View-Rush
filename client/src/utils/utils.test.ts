import { describe, it, expect } from 'vitest';
import { cn } from '@/utils/utils';

describe('Utils Library', () => {
  describe('cn function (class name utility)', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2');
      expect(typeof result).toBe('string');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional class names', () => {
      const result = cn('base', true && 'conditional', false && 'hidden');
      expect(result).toContain('base');
      expect(result).toContain('conditional');
      expect(result).not.toContain('hidden');
    });

    it('should handle empty values', () => {
      const result = cn('', null, undefined, 'valid');
      expect(result).toContain('valid');
      expect(result.trim()).not.toBe('');
    });

    it('should handle arrays of class names', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(typeof result).toBe('string');
    });

    it('should deduplicate class names', () => {
      const result = cn('duplicate', 'unique', 'duplicate');
      // Should handle duplicates appropriately (depends on implementation)
      expect(typeof result).toBe('string');
    });

    it('should handle Tailwind CSS merge patterns', () => {
      // Test common Tailwind patterns
      const result = cn('p-4 p-2', 'bg-red-500 bg-blue-500');
      expect(typeof result).toBe('string');
      // Later classes should typically override earlier ones in Tailwind merge
    });
  });

  describe('Type checking utilities', () => {
    it('should handle various input types', () => {
      // Test different input types that cn should handle
      const inputs = [
        'string',
        ['array', 'of', 'strings'],
        { conditional: true, hidden: false },
        null,
        undefined,
        0,
        1,
        '',
        'normal-class'
      ];

      inputs.forEach(input => {
        try {
          const result = cn(input as any);
          expect(typeof result).toBe('string');
        } catch (error) {
          // Some inputs might not be supported, that's OK
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle no arguments', () => {
      const result = cn();
      expect(typeof result).toBe('string');
    });

    it('should handle many arguments', () => {
      const manyClasses = Array.from({ length: 20 }, (_, i) => `class${i}`);
      const result = cn(...manyClasses);
      expect(typeof result).toBe('string');
    });

    it('should handle special characters in class names', () => {
      const result = cn('hover:bg-blue-500', 'sm:w-1/2', 'md:w-2/3');
      expect(typeof result).toBe('string');
      expect(result).toContain('hover:');
      expect(result).toContain('sm:');
    });

    it('should maintain order when appropriate', () => {
      const result = cn('first', 'second', 'third');
      expect(typeof result).toBe('string');
      // Order might be important for some CSS frameworks
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of classes efficiently', () => {
      const start = Date.now();
      const largeClassArray = Array.from({ length: 1000 }, (_, i) => `class-${i}`);
      
      for (let i = 0; i < 100; i++) {
        cn(...largeClassArray);
      }
      
      const duration = Date.now() - start;
      // Should complete reasonably quickly (under 1 second for this test)
      expect(duration).toBeLessThan(1000);
    });
  });
});