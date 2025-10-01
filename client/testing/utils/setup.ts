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
    NavLink: vi.fn(({ children, to, ...props }: any) => 
      React.createElement('a', { href: to, ...props }, children)
    ),
    MemoryRouter: vi.fn(({ children, initialEntries = ['/'] }: any) => 
      React.createElement('div', { 'data-testid': 'memory-router' }, children)
    ),
    Outlet: vi.fn(() => React.createElement('div', {}, 'Outlet'))
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
  apiService: {
    // User profile methods
    getUserProfile: vi.fn().mockResolvedValue({ id: 'test-user', email: 'test@example.com' }),
    updateUserProfile: vi.fn().mockResolvedValue({ success: true }),
    getUserPreferences: vi.fn().mockResolvedValue({ theme: 'light', notifications: true }),
    updateUserPreferences: vi.fn().mockResolvedValue({ success: true }),
    
    // Analytics methods  
    getYouTubeAnalytics: vi.fn().mockResolvedValue({ views: 1000, likes: 100 }),
    getChannelAnalytics: vi.fn().mockResolvedValue({ subscribers: 5000, views: 10000 }),
    
    // Channel methods
    connectYouTubeChannel: vi.fn().mockResolvedValue({ success: true }),
    getConnectedChannels: vi.fn().mockResolvedValue([]),
    
    // Prediction methods
    getPredictions: vi.fn().mockResolvedValue({ predictedViews: 1500 }),
    getOptimalPublishTimes: vi.fn().mockResolvedValue(['14:00', '18:00', '20:00']),
    
    // ML methods
    getRecommendations: vi.fn().mockResolvedValue(['recommendation1', 'recommendation2']),
    getTrendingTopics: vi.fn().mockResolvedValue(['topic1', 'topic2']),
    getContentSuggestions: vi.fn().mockResolvedValue(['suggestion1', 'suggestion2']),
    
    // Generic HTTP methods
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock('@/services/authHelper', () => ({
  authHelper: {
    getUser: vi.fn(),
    setUserFromContext: vi.fn(),
    clearCache: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}));

vi.mock('@/services/secureTokenService', () => ({
  secureTokenService: {
    store: vi.fn().mockResolvedValue({ success: true }),
    retrieve: vi.fn().mockResolvedValue('mock-token'),
    remove: vi.fn().mockResolvedValue({ success: true }),
    clear: vi.fn().mockResolvedValue({ success: true }),
    encrypt: vi.fn().mockResolvedValue('encrypted-data'),
    decrypt: vi.fn().mockResolvedValue('decrypted-data'),
    generateToken: vi.fn().mockResolvedValue('generated-token'),
    validateToken: vi.fn().mockResolvedValue(true),
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
  cn: vi.fn((...inputs) => {
    // Simple implementation that handles basic cases for testing
    const classes: string[] = [];
    
    inputs.forEach((input) => {
      if (!input) return;
      
      if (typeof input === 'string') {
        classes.push(...input.split(' ').filter(Boolean));
      } else if (typeof input === 'object' && !Array.isArray(input)) {
        // Handle conditional classes like { 'class-name': true/false }
        Object.entries(input).forEach(([className, condition]) => {
          if (condition) {
            classes.push(className);
          }
        });
      } else if (Array.isArray(input)) {
        // Handle arrays of classes
        input.forEach(item => {
          if (typeof item === 'string' && item) {
            classes.push(...item.split(' ').filter(Boolean));
          }
        });
      }
    });
    
    // Basic conflict resolution for common Tailwind patterns
    const resolved: string[] = [];
    const conflicts = new Map<string, string>();
    
    classes.forEach(className => {
      // Extract base class pattern (e.g., 'bg', 'text', 'p', 'm')
      const match = className.match(/^(bg|text|p|m|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr)-/);
      if (match) {
        const base = match[1];
        conflicts.set(base, className); // Keep the last occurrence
      } else {
        resolved.push(className);
      }
    });
    
    // Add resolved conflict classes
    conflicts.forEach(className => resolved.push(className));
    
    return resolved.join(' ');
  })
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
  useMobile: vi.fn(() => false) // Keep both for compatibility
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
  MessageCircle: vi.fn(() => React.createElement('div', { 'data-testid': 'message-circle-icon' })),
  Sparkles: vi.fn(() => React.createElement('div', { 'data-testid': 'sparkles-icon' })),
  Home: vi.fn(() => React.createElement('div', { 'data-testid': 'home-icon' })),
  Bell: vi.fn(() => React.createElement('div', { 'data-testid': 'bell-icon' })),
  Search: vi.fn(() => React.createElement('div', { 'data-testid': 'search-icon' })),
  Menu: vi.fn(() => React.createElement('div', { 'data-testid': 'menu-icon' })),
  X: vi.fn(() => React.createElement('div', { 'data-testid': 'x-icon' })),
  ArrowRight: vi.fn(() => React.createElement('div', { 'data-testid': 'arrow-right-icon' })),
  ArrowLeft: vi.fn(() => React.createElement('div', { 'data-testid': 'arrow-left-icon' })),
  RefreshCw: vi.fn(() => React.createElement('div', { 'data-testid': 'refresh-cw-icon' })),
  Mail: vi.fn(() => React.createElement('div', { 'data-testid': 'mail-icon' })),
  Lock: vi.fn(() => React.createElement('div', { 'data-testid': 'lock-icon' })),
  Star: vi.fn(() => React.createElement('div', { 'data-testid': 'star-icon' })),
  CheckCircle: vi.fn(() => React.createElement('div', { 'data-testid': 'check-circle-icon' })),
  Circle: vi.fn(() => React.createElement('div', { 'data-testid': 'circle-icon' })),
  Save: vi.fn(() => React.createElement('div', { 'data-testid': 'save-icon' })),
  Zap: vi.fn(() => React.createElement('div', { 'data-testid': 'zap-icon' })),
  Target: vi.fn(() => React.createElement('div', { 'data-testid': 'target-icon' })),
  Calendar: vi.fn(() => React.createElement('div', { 'data-testid': 'calendar-icon' })),
  Brain: vi.fn(() => React.createElement('div', { 'data-testid': 'brain-icon' })),
  Globe: vi.fn(() => React.createElement('div', { 'data-testid': 'globe-icon' })),
  Clock: vi.fn(() => React.createElement('div', { 'data-testid': 'clock-icon' })),
  Activity: vi.fn(() => React.createElement('div', { 'data-testid': 'activity-icon' })),
  Play: vi.fn(() => React.createElement('div', { 'data-testid': 'play-icon' }))
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