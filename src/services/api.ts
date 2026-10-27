export type AuthUser = {
  id: number;
  login: string;
  role: 'admin' | 'member';
  status: 'active' | 'suspended' | 'archived';
  displayName: string;
};
export type Plan = {
  id: string; name: string; revision: number; priceUsd: string;
  dailyUsd: string; bonusUsd: string; bonusSatoshis: number;
  durationDays: number; hashrate: string; serverModel: string;
  available: boolean;
};
export type MemberData = {
  user: AuthUser;
  profile: { displayName: string; email: string; phone: string; walletAddress: string };
  mining: { running: boolean; balanceUnits: number; balanceUsd: string;
    sessionEndsAt: number | null; cooldownUntil: number | null };
  plan: { id: string; revision: number; dailyUsd: string; bonusUsd: string;
    bonusSatoshis: number; expiresAt: number | null };
};

let csrfToken = '';
export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
export async function api<T>(action: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/index.php?action=' + encodeURIComponent(action), {
    credentials: 'same-origin',
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(body === undefined ? {} : {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  let data: any;
  try { data = await response.json(); } catch { throw new ApiError('Resposta inválida do servidor.', response.status); }
  if (!response.ok) throw new ApiError(data.error || 'Falha na solicitação', response.status);
  return data as T;
}
export async function session(): Promise<AuthUser> {
  const data = await api<{user: AuthUser; csrfToken: string}>('session');
  csrfToken = data.csrfToken;
  return data.user;
}
export async function login(loginValue: string, password: string): Promise<AuthUser> {
  const data = await api<{user: AuthUser; csrfToken: string}>('login', {login: loginValue, password});
  csrfToken = data.csrfToken;
  return data.user;
}
export async function register(loginValue: string, password: string, displayName: string) {
  return api<{id: number; role: 'member'}>('register', {login: loginValue, password, displayName});
}
export async function logout(): Promise<void> {
  try { await api('logout', {}); } finally { csrfToken = ''; }
}
