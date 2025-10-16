// Global connection state manager for preventing concurrent database operations
// during YouTube channel connection process

interface ConnectionState {
  isConnecting: boolean;
  connectionInProgress: string | null; // connectionId being processed
}

class ConnectionStateManager {
  private state: ConnectionState = {
    isConnecting: false,
    connectionInProgress: null
  };
  
  private listeners: Set<(state: ConnectionState) => void> = new Set();

  startConnection(connectionId?: string) {
    this.state = {
      isConnecting: true,
      connectionInProgress: connectionId || 'unknown'
    };
    this.notifyListeners();
  }

  endConnection() {
    this.state = {
      isConnecting: false,
      connectionInProgress: null
    };
    this.notifyListeners();
  }

  isConnecting(): boolean {
    return this.state.isConnecting;
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  subscribe(listener: (state: ConnectionState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}

export const connectionStateManager = new ConnectionStateManager();