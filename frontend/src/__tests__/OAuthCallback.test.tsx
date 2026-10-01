import { render, waitFor } from '@testing-library/react';

// Browsers that block third-party cookies never send the API-domain cookie
// from the frontend, so the OAuth callback must not depend on it: it trades
// the one-time code in the URL fragment for a token and stores it, exactly
// like an email/password login does.

const replace = vi.fn();
const mockExchange = vi.fn();
const mockLogin = vi.fn();
const mockLoginFromOAuth = vi.fn();
let searchError: string | null = null;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => searchError }),
}));

vi.mock('@/services/authService', () => ({
  exchangeOAuthCode: (...args: unknown[]) => mockExchange(...args),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, loginFromOAuth: mockLoginFromOAuth }),
}));

import OAuthCallbackPage from '../../app/(app)/auth/callback/page';

function setHash(hash: string) {
  window.history.replaceState(null, '', `/auth/callback${hash}`);
}

describe('OAuth callback page', () => {
  beforeEach(() => {
    replace.mockReset();
    mockExchange.mockReset();
    mockLogin.mockReset();
    mockLoginFromOAuth.mockReset();
    searchError = null;
    setHash('');
  });

  it('trades the code from the URL fragment for a token and signs in', async () => {
    setHash('#code=abc.def');
    mockExchange.mockResolvedValue({ user_id: 7, name: 'Ada', token: 'jwt-123' });

    render(<OAuthCallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/session'));
    expect(mockExchange).toHaveBeenCalledWith('abc.def');
    expect(mockLogin).toHaveBeenCalledWith('Ada', 'jwt-123');
    expect(mockLoginFromOAuth).not.toHaveBeenCalled();
  });

  it('removes the code from the address bar once it has been read', async () => {
    setHash('#code=abc.def');
    mockExchange.mockResolvedValue({ user_id: 7, name: 'Ada', token: 'jwt-123' });

    render(<OAuthCallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(window.location.hash).toBe('');
  });

  it('goes back to the login with an error when the code is rejected', async () => {
    setHash('#code=expired');
    mockExchange.mockRejectedValue(new Error('Codigo invalido o caducado'));

    render(<OAuthCallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?error=oauth_failed'));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('falls back to the cookie session when there is no code', async () => {
    mockLoginFromOAuth.mockResolvedValue(undefined);

    render(<OAuthCallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/session'));
    expect(mockExchange).not.toHaveBeenCalled();
    expect(mockLoginFromOAuth).toHaveBeenCalledTimes(1);
  });

  it('does not try to sign in when the provider reported an error', async () => {
    searchError = 'access_denied';

    render(<OAuthCallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?error=oauth_failed'));
    expect(mockExchange).not.toHaveBeenCalled();
    expect(mockLoginFromOAuth).not.toHaveBeenCalled();
  });
});
