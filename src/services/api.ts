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
  durationDays: number; sessionSeconds: number; restartCooldownSeconds: number; hashrate: string; serverModel: string;
  available: boolean; withdrawMinUsd: string; withdrawAfterDays: number;
};
export type MemberData = {
  asOf: number;
  user: AuthUser;
  profile: { displayName: string; email: string; phone: string; walletAddress: string };
  mining: { running: boolean; balanceUnits: number; balanceUsd: string; bonusSatoshisBalance: number; lastBonusAt: number | null;
    sessionEndsAt: number | null; cooldownUntil: number | null };
  plan: { id: string; revision: number; dailyUsd: string; bonusUsd: string;
    bonusSatoshis: number; hashrate: string; sessionSeconds: number; restartCooldownSeconds: number; expiresAt: number | null; withdrawMinUsd: string; withdrawAfterDays: number };
};

let csrfToken = '';
export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
export async function api<T>(action: string, body?: Record<string, unknown>, query?: Record<string, string | number>): Promise<T> {
  const params = new URLSearchParams({action});
  for (const [key, value] of Object.entries(query || {})) params.set(key, String(value));
  const response = await fetch('/api/index.php?' + params.toString(), {
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
export async function register(loginValue: string, password: string, displayName: string, inviteCode = '') {
  return api<{id: number; role: 'member'}>('register', {login: loginValue, password, displayName, inviteCode});
}
export async function logout(): Promise<void> {
  try { await api('logout', {}); } finally { csrfToken = ''; }
}
