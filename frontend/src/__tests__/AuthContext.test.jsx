import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const mockGetMyStats = vi.fn();
const mockGetMyProfile = vi.fn();
const mockLogoutUser = vi.fn();
const mockSetOnUnauthorized = vi.fn();

vi.mock('@/services/sessionService', () => ({
  getMyStats: (...args) => mockGetMyStats(...args),
}));

vi.mock('@/services/authService', () => ({
  getMyProfile: (...args) => mockGetMyProfile(...args),
  logoutUser: (...args) => mockLogoutUser(...args),
}));

vi.mock('@/services/httpClient', () => ({
  setOnUnauthorized: (cb) => mockSetOnUnauthorized(cb),
}));

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{String(auth.user)}</span>
      <span data-testid="initialized">{String(auth.initialized)}</span>
      <span data-testid="stats-level">{auth.stats.level}</span>
      <span data-testid="stats-xp">{auth.stats.total_xp}</span>
      <button data-testid="login-btn" onClick={() => auth.login('TestUser')}>
        Login
      </button>
      <button data-testid="login-token-btn" onClick={() => auth.login('TokenUser', 'test-jwt-token')}>
        Login with Token
      </button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>
        Logout
      </button>
      <button data-testid="oauth-btn" onClick={() => auth.loginFromOAuth('oauth-jwt-token')}>
        OAuth Login
      </button>
      <button data-testid="update-btn" onClick={() => auth.updateUser('NewName')}>
        Update
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockGetMyStats.mockResolvedValue({
      total_xp: 100,
      level: 2,
      xp_to_next_level: 400,
      progress_in_level: 100,
      xp_per_level: 500,
      results_summary: { correct: 1, partially_correct: 0, incorrect: 0 },
      stacks_stats: [],
      sessions_count: 1,
      recent_sessions: [],
      cards_summary: { total: 0, top_tags: [] },
    });
    mockGetMyProfile.mockResolvedValue({ name: 'OAuthUser', email: 'oauth@test.com' });
    mockLogoutUser.mockResolvedValue({ msg: 'ok' });
  });

  it('starts with null user', () => {
    renderWithProvider();
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('initializes as initialized after mount', () => {
    renderWithProvider();
    expect(screen.getByTestId('initialized').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('initializes from localStorage if user and token exist', async () => {
    window.localStorage.setItem('user', 'StoredUser');
    window.localStorage.setItem('access_token', 'stored-jwt');
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('StoredUser');
    });
    expect(screen.getByTestId('initialized').textContent).toBe('true');
    expect(mockGetMyStats).toHaveBeenCalled();
  });

  it('initializes as null when no user in localStorage', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(mockGetMyStats).not.toHaveBeenCalled();
  });

  it('login() saves user and fetches stats', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    expect(window.localStorage.getItem('user')).toBe('TestUser');
    expect(screen.getByTestId('user').textContent).toBe('TestUser');
    expect(mockGetMyStats).toHaveBeenCalled();
    expect(window.localStorage.getItem('access_token')).toBeNull();
  });

  it('login() stores token when provided', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByTestId('login-token-btn').click();
    });

    expect(window.localStorage.getItem('user')).toBe('TokenUser');
    expect(window.localStorage.getItem('access_token')).toBe('test-jwt-token');
  });

  it('logout() clears user, token, and resets stats', async () => {
    window.localStorage.setItem('user', 'TestUser');
    window.localStorage.setItem('access_token', 'test-jwt-token');
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('TestUser');
    });

    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    expect(window.localStorage.getItem('user')).toBeNull();
    expect(window.localStorage.getItem('access_token')).toBeNull();
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('stats-level').textContent).toBe('1');
    expect(screen.getByTestId('stats-xp').textContent).toBe('0');
    expect(mockLogoutUser).toHaveBeenCalled();
  });

  it('loginFromOAuth() stores token and fetches profile', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByTestId('oauth-btn').click();
    });

    expect(mockGetMyProfile).toHaveBeenCalled();
    expect(window.localStorage.getItem('access_token')).toBe('oauth-jwt-token');
    expect(window.localStorage.getItem('user')).toBe('OAuthUser');
    expect(screen.getByTestId('user').textContent).toBe('OAuthUser');
    expect(mockGetMyStats).toHaveBeenCalled();
  });

  it('loginFromOAuth() falls back when profile.name is empty', async () => {
    mockGetMyProfile.mockResolvedValue({ name: '', email: 'user@test.com' });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByTestId('oauth-btn').click();
    });

    expect(window.localStorage.getItem('user')).toBe('user@test.com');
  });

  it('loginFromOAuth() falls back to "User" when both name and email are empty', async () => {
    mockGetMyProfile.mockResolvedValue({ name: '', email: '' });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByTestId('oauth-btn').click();
    });

    expect(window.localStorage.getItem('user')).toBe('User');
  });

  it('updateUser() changes the user name', async () => {
    window.localStorage.setItem('user', 'OldName');
    window.localStorage.setItem('access_token', 'old-jwt');
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('OldName');
    });

    await act(async () => {
      screen.getByTestId('update-btn').click();
    });

    expect(window.localStorage.getItem('user')).toBe('NewName');
    expect(screen.getByTestId('user').textContent).toBe('NewName');
  });

  it('registers unauthorized callback on mount', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(mockSetOnUnauthorized).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  it('unauthorized callback clears token and user', async () => {
    window.localStorage.setItem('access_token', 'test-token');
    window.localStorage.setItem('user', 'TestUser');

    renderWithProvider();

    const cb = mockSetOnUnauthorized.mock.calls[0][0];
    act(() => { cb(); });

    expect(window.localStorage.getItem('access_token')).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();
  });

  it('logout() handles logoutUser failure gracefully', async () => {
    mockLogoutUser.mockRejectedValue(new Error('Server error'));
    window.localStorage.setItem('user', 'TestUser');
    window.localStorage.setItem('access_token', 'test-jwt');

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('TestUser');
    });

    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    expect(window.localStorage.getItem('user')).toBeNull();
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('refreshStats is called on login', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    expect(mockGetMyStats).toHaveBeenCalled();
    expect(screen.getByTestId('stats-level').textContent).toBe('2');
    expect(screen.getByTestId('stats-xp').textContent).toBe('100');
  });

  it('clears stale user in localStorage when no token is present', async () => {
    window.localStorage.setItem('user', 'StaleUser');
    // sin access_token: estado residual de un login interrumpido

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    expect(window.localStorage.getItem('user')).toBeNull();
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(mockGetMyStats).not.toHaveBeenCalled();
  });

  it('loginFromOAuth() keeps token when 401 fires while login is in progress', async () => {
    // Hacemos que getMyProfile nunca resuelva, asi loginFromOAuth queda
    // suspendido con loggingInRef.current = true mientras llega el 401.
    let resolveProfile;
    mockGetMyProfile.mockReturnValue(new Promise((resolve) => { resolveProfile = resolve; }));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    // Disparamos loginFromOAuth sin await: queda esperando getMyProfile.
    act(() => {
      screen.getByTestId('oauth-btn').click();
    });

    // En este punto el token ya esta en localStorage y loggingInRef es true.
    expect(window.localStorage.getItem('access_token')).toBe('oauth-jwt-token');

    // Simulamos un 401 externo (p. ej. una llamada paralela que falla).
    const cb = mockSetOnUnauthorized.mock.calls[0][0];
    act(() => { cb(); });

    // El callback debe estar suprimido: el token y el user preservados.
    expect(window.localStorage.getItem('access_token')).toBe('oauth-jwt-token');

    // Ahora dejamos que el login termine.
    await act(async () => {
      resolveProfile({ name: 'OAuthUser', email: 'oauth@test.com' });
    });

    expect(window.localStorage.getItem('access_token')).toBe('oauth-jwt-token');
    expect(window.localStorage.getItem('user')).toBe('OAuthUser');
  });

  it('loginFromOAuth() throws when called without token', async () => {
    function BadConsumer() {
      const { loginFromOAuth } = useAuth();
      return (
        <button
          data-testid="bad-oauth-btn"
          onClick={() => { loginFromOAuth().catch(() => {}); }}
        >
          Bad
        </button>
      );
    }

    render(
      <AuthProvider>
        <BadConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByTestId('bad-oauth-btn').click();
    });

    expect(mockGetMyProfile).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('access_token')).toBeNull();
  });
});
