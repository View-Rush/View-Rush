import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll } from 'vitest';
import React from 'react';

// Mock crypto for secure token service tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      generateKey: vi.fn(),
      importKey: vi.fn(),
      exportKey: vi.fn(),
    }
  },
  writable: true,
});

// Global mock for react-router-dom - this needs to be at the top level
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ 
      pathname: '/', 
      search: '', 
      hash: '', 
      state: null,
      key: 'default'
    })),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    useRouterState: vi.fn(() => ({
      location: { pathname: '/', search: '', hash: '', state: null, key: 'default' },
      matches: [],
    })),
    Link: vi.fn(({ children, to, ...props }: any) => 
      React.createElement('a', { href: to, ...props }, children)
    ),
    MemoryRouter: vi.fn(({ children, initialEntries }: any) =>
      React.createElement('div', { 'data-testid': 'memory-router' }, children)
    ),
    BrowserRouter: vi.fn(({ children }: any) =>
      React.createElement('div', { 'data-testid': 'browser-router' }, children)
    ),
  };
});

// Global mock for Supabase client 
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
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
  }
}));

// Global mock for useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    updateProfile: vi.fn(),
  })),
  AuthProvider: vi.fn(({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'auth-provider' }, children)
  )
}));

// Global mock for useChannelConnections hook
vi.mock('@/hooks/useChannelConnections', () => ({
  useChannelConnections: vi.fn(() => ({
    connections: [],
    loading: false,
    hasConnections: false,
    hasActiveConnections: false,
    connectChannel: vi.fn(),
    disconnectChannel: vi.fn(),
    refreshConnections: vi.fn(),
    loadConnections: vi.fn(),
  }))
}));

// Global mock for services
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('@/services/authHelper', () => ({
  default: {
    getUser: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}));

vi.mock('@/services/secureTokenService', () => ({
  default: {
    store: vi.fn(),
    retrieve: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    generateToken: vi.fn(),
    validateToken: vi.fn(),
  }
}));

vi.mock('@/services/connectionStateManager', () => ({
  default: {
    initializeFromSupabase: vi.fn(),
    updateConnectionStatus: vi.fn(),
    getConnectionState: vi.fn(),
  }
}));

vi.mock('@/services/youtube/youtubeService', () => ({
  default: {
    getAnalytics: vi.fn(),
    getChannelInfo: vi.fn(),
    getVideoStats: vi.fn(),
  }
}));

// Global mock for toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
  }))
}));

// Mock utilities
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

vi.mock('@/hooks/use-mobile', () => ({
  useMobile: vi.fn(() => false)
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ChevronDown: vi.fn(() => React.createElement('div', { 'data-testid': 'chevron-down-icon' })),
  User: vi.fn(() => React.createElement('div', { 'data-testid': 'user-icon' })),
  Settings: vi.fn(() => React.createElement('div', { 'data-testid': 'settings-icon' })),
  LogOut: vi.fn(() => React.createElement('div', { 'data-testid': 'logout-icon' })),
  Youtube: vi.fn(() => React.createElement('div', { 'data-testid': 'youtube-icon' })),
  BarChart3: vi.fn(() => React.createElement('div', { 'data-testid': 'bar-chart-icon' })),
  TrendingUp: vi.fn(() => React.createElement('div', { 'data-testid': 'trending-up-icon' })),
  Users: vi.fn(() => React.createElement('div', { 'data-testid': 'users-icon' })),
  PlayCircle: vi.fn(() => React.createElement('div', { 'data-testid': 'play-circle-icon' })),
  Eye: vi.fn(() => React.createElement('div', { 'data-testid': 'eye-icon' })),
  ThumbsUp: vi.fn(() => React.createElement('div', { 'data-testid': 'thumbs-up-icon' })),
  MessageCircle: vi.fn(() => React.createElement('div', { 'data-testid': 'message-circle-icon' }))
}));

// Mock environment variables for testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLElement methods that might not be available in jsdom
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

// Suppress console errors during tests unless needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: React.createFactory() is deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});