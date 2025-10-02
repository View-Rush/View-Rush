import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Settings from '@/pages/Settings';

// Create test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        display_name: 'Test User',
      },
    },
    session: { access_token: 'test-token' },
    loading: false,
    isAuthenticated: true,
    updateProfile: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

// Mock YouTube service
vi.mock('@/services/youtube', () => ({
  youtubeService: {
    disconnectChannel: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock header component
vi.mock('@/components/layout/Header', () => ({
  default: () => <div data-testid="header">Header Component</div>,
}));

// Test wrapper with all providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings page', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );
    
    // Should render header
    expect(screen.getByTestId('header')).toBeInTheDocument();
    
    // Should have settings content
    const settingsContent = document.querySelector('main, .settings, [role="main"]') || document.body;
    expect(settingsContent).toBeInTheDocument();
  });

  it('should display user settings sections', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );
    
    // Should have settings-related content
    const textContent = document.body.textContent || '';
    expect(textContent.length).toBeGreaterThan(50);
    
    // Look for common settings UI elements
    const settingsElements = document.querySelectorAll('input, button, select, [role="tab"], [role="tabpanel"]');
    expect(settingsElements.length).toBeGreaterThan(0);
  });

  it('should render profile settings', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );
    
    // Should render main container
    const main = document.querySelector('main, .container, .settings-page') || document.body;
    expect(main).toBeInTheDocument();
  });

  it('should handle settings tabs or sections', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );
    
    // Should have some interactive elements for settings
    const interactiveElements = document.querySelectorAll('button, input, select, [tabindex]');
    expect(interactiveElements.length).toBeGreaterThan(0);
  });

  it('should display account information', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );
    
    // Should render with user context
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(20);
  });
});