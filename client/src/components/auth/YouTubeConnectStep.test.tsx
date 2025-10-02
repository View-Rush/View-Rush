import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { YouTubeConnectStep } from './YouTubeConnectStep';
import { youtubeService } from '@/services/youtube';
import { toast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/services/youtube', () => ({
  youtubeService: {
    connectAccount: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast');
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={className} data-testid="card-title">{children}</h3>
  ),
  CardDescription: ({ children, className }: any) => (
    <p className={className} data-testid="card-description">{children}</p>
  ),
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className }: any) => (
    <div className={className} data-testid="alert">{children}</div>
  ),
  AlertDescription: ({ children, className }: any) => (
    <div className={className} data-testid="alert-description">{children}</div>
  ),
}));

vi.mock('lucide-react', () => ({
  Youtube: () => <svg data-testid="youtube-icon" />,
  Info: () => <svg data-testid="info-icon" />,
}));

describe('YouTubeConnectStep', () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();
  const mockOnBack = vi.fn();
  
  const defaultProps = {
    onComplete: mockOnComplete,
    onSkip: mockOnSkip,
    onBack: mockOnBack,
    isVisible: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to default state
    vi.mocked(youtubeService.connectAccount).mockReset();
  });

  describe('Visibility', () => {
    it('should not render when isVisible is false', () => {
      const { container } = render(
        <YouTubeConnectStep {...defaultProps} isVisible={false} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('should render when isVisible is true', () => {
      render(<YouTubeConnectStep {...defaultProps} />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Connect YouTube')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render all main elements', () => {
      render(<YouTubeConnectStep {...defaultProps} />);

      expect(screen.getByText('Connect YouTube')).toBeInTheDocument();
      expect(screen.getByText(/Connect your YouTube channel to unlock powerful analytics and insights/)).toBeInTheDocument();
      const youtubeIcons = screen.getAllByTestId('youtube-icon');
      expect(youtubeIcons).toHaveLength(2); // One in header, one in button
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
      expect(screen.getByText(/This step is optional/)).toBeInTheDocument();
      expect(screen.getByText("Connect YouTube Channel")).toBeInTheDocument();
      expect(screen.getByText("Skip for now")).toBeInTheDocument();
      expect(screen.getByText("Back to Account Details")).toBeInTheDocument();
    });

    it('should render features list', () => {
      render(<YouTubeConnectStep {...defaultProps} />);

      expect(screen.getByText("What you'll get:")).toBeInTheDocument();
      expect(screen.getByText("Real-time analytics for your YouTube channel")).toBeInTheDocument();
      expect(screen.getByText("Subscriber growth tracking")).toBeInTheDocument();
      expect(screen.getByText("Video performance insights")).toBeInTheDocument();
    });

    it('should render terms text', () => {
      render(<YouTubeConnectStep {...defaultProps} />);

      expect(screen.getByText(/By connecting your YouTube channel/)).toBeInTheDocument();
      expect(screen.getByText(/you agree to YouTube's Terms of Service/)).toBeInTheDocument();
    });

    it('should not render back button when onBack is not provided', () => {
      const propsWithoutBack = { ...defaultProps, onBack: undefined };
      render(<YouTubeConnectStep {...propsWithoutBack} />);

      expect(screen.queryByText("Back to Account Details")).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    describe('Connect Button', () => {
      it('should call youtubeService.connectAccount when connect button is clicked', async () => {
        vi.mocked(youtubeService.connectAccount).mockResolvedValue(true);
        
        render(<YouTubeConnectStep {...defaultProps} />);
        
        const connectButton = screen.getByText("Connect YouTube Channel").closest('button');
        fireEvent.click(connectButton!);

        expect(vi.mocked(youtubeService.connectAccount)).toHaveBeenCalledOnce();
      });

      it('should show loading state when connecting', async () => {
        vi.mocked(youtubeService.connectAccount).mockImplementation(() => new Promise(() => {})); // Never resolves
        
        render(<YouTubeConnectStep {...defaultProps} />);
        
        const connectButton = screen.getByText("Connect YouTube Channel").closest('button');
        fireEvent.click(connectButton!);

        await waitFor(() => {
          expect(screen.getByText("Connecting...")).toBeInTheDocument();
        });
        
        expect(connectButton).toBeDisabled();
      });

      it('should show error toast when connection fails', async () => {
        const mockError = new Error('Connection failed');
        vi.mocked(youtubeService.connectAccount).mockRejectedValue(mockError);
        
        render(<YouTubeConnectStep {...defaultProps} />);
        
        const connectButton = screen.getByText("Connect YouTube Channel").closest('button');
        fireEvent.click(connectButton!);

        await waitFor(() => {
          expect(toast).toHaveBeenCalledWith({
            title: "Connection Failed",
            description: "Failed to start YouTube connection. Please try again.",
            variant: "destructive",
          });
        });
      });
    });

    describe('Skip Button', () => {
      it('should call onComplete with false and onSkip when skip button is clicked', () => {
        render(<YouTubeConnectStep {...defaultProps} />);
        
        const skipButton = screen.getByText("Skip for now").closest('button');
        fireEvent.click(skipButton!);

        expect(mockOnComplete).toHaveBeenCalledWith(false);
        expect(mockOnSkip).toHaveBeenCalledOnce();
      });
    });

    describe('Back Button', () => {
      it('should call onBack when back button is clicked', () => {
        render(<YouTubeConnectStep {...defaultProps} />);
        
        const backButton = screen.getByText("Back to Account Details").closest('button');
        fireEvent.click(backButton!);

        expect(mockOnBack).toHaveBeenCalledOnce();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button states', async () => {
      vi.mocked(youtubeService.connectAccount).mockImplementation(() => new Promise(() => {}));
      
      render(<YouTubeConnectStep {...defaultProps} />);
      
      const connectButton = screen.getByText("Connect YouTube Channel").closest('button');
      expect(connectButton).not.toBeDisabled();

      fireEvent.click(connectButton!);

      await waitFor(() => {
        expect(connectButton).toBeDisabled();
      });
    });

    it('should maintain button focus after interactions', () => {
      render(<YouTubeConnectStep {...defaultProps} />);
      
      const skipButton = screen.getByText("Skip for now").closest('button');
      skipButton?.focus();
      
      expect(skipButton).toHaveFocus();
    });
  });
});