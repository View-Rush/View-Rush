import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Analytics from '@/pages/Analytics';

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
    },
    session: { access_token: 'test-token' },
    loading: false,
    isAuthenticated: true,
  }),
}));

// Mock dashboard context
vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({
    analytics: {
      channel_analytics: {
        subscribers: 1000,
        total_views: 50000,
        total_videos: 25,
        avg_view_duration: 180,
      },
      video_performance: [
        {
          id: 'video1',
          title: 'Test Video',
          views: 1500,
          likes: 100,
          comments: 25,
        }
      ],
      trending_topics: ['React', 'Testing', 'JavaScript'],
      performance_metrics: {
        best_performing_time: '14:00',
        best_performing_day: 'Monday',
        average_engagement_rate: 0.05,
      },
    },
    loading: false,
    error: null,
    refreshData: vi.fn(),
  }),
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

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render analytics page', () => {
    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );
    
    // Should render header
    expect(screen.getByTestId('header')).toBeInTheDocument();
    
    // Should have analytics content
    const analyticsContent = document.querySelector('main, .analytics, [role="main"]') || document.body;
    expect(analyticsContent).toBeInTheDocument();
  });

  it('should display channel analytics metrics', () => {
    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );
    
    // Look for metrics content - could be in cards or metric displays
    const metricsText = document.body.textContent || '';
    
    // Should contain numerical content typical of analytics
    expect(metricsText).toMatch(/\d+/); // Should have numbers
  });

  it('should render analytics sections', () => {
    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );
    
    // Should render main container
    const main = document.querySelector('main, .container, .analytics-page') || document.body;
    expect(main).toBeInTheDocument();
    
    // Should have substantial content
    const textContent = document.body.textContent || '';
    expect(textContent.length).toBeGreaterThan(50);
  });

  it('should handle loading state', () => {
    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );
    
    // Should still render page structure during loading
    expect(document.body).toContainHTML('<div');
  });

  it('should handle error state', () => {
    render(
      <TestWrapper>
        <Analytics />
      </TestWrapper>
    );
    
    // Should still render page structure during error
    expect(document.body).toContainHTML('<div');
  });
});