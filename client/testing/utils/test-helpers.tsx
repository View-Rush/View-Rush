import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MemoryRouter } from 'react-router-dom';
import { vi, expect } from 'vitest';

// Mock Supabase client for tests
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
});

// Create a mock user for tests
export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    display_name: 'Test User',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  email_confirmed_at: '2023-01-01T00:00:00.000Z',
  last_sign_in_at: '2023-01-01T00:00:00.000Z',
});

// Create a mock session
export const createMockSession = (user = createMockUser()) => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user,
});

// Create mock analytics data
export const createMockAnalyticsData = () => ({
  channel_stats: {
    subscriber_count: 1000,
    total_views: 50000,
    total_videos: 25,
    average_views_per_video: 2000,
  },
  recent_videos: [
    {
      id: 'video1',
      title: 'Test Video 1',
      views: 1500,
      likes: 100,
      comments: 25,
      published_at: '2023-01-01T00:00:00.000Z',
    },
  ],
  performance_metrics: {
    best_performing_time: '14:00',
    best_performing_day: 'Monday',
    average_engagement_rate: 0.05,
  },
});

// Mock React Query client with disabled retries for testing
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Wrapper component that provides all necessary context providers
interface AllTheProvidersProps {
  children: React.ReactNode;
  initialEntries?: string[];
  queryClient?: QueryClient;
}

const AllTheProviders = ({ 
  children, 
  initialEntries = ['/'], 
  queryClient = createTestQueryClient() 
}: AllTheProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { initialEntries, queryClient, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialEntries={initialEntries} queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Utility to wait for loading states to complete
export const waitForLoadingToComplete = async () => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(document.querySelector('[data-testid="loading"]')).not.toBeInTheDocument();
  }, { timeout: 3000 });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };