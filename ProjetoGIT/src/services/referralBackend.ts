import { ReferralRecord } from '../types';

export const OFFICIAL_INVITE_CODE = '8ZPTC';
export const REFERRAL_REWARD_USD = 1.0;

/**
 * Aplica a máscara de e-mail estritamente na camada de backend/serviço,
 * garantindo que o e-mail completo nunca seja enviado ou exposto ao front-end.
 * Exemplo: "joao.silva@dominio.com" -> "jo***@dominio.com"
 */
export function maskEmailInBackend(rawEmail: string): string {
  const cleaned = String(rawEmail || '').trim().toLowerCase();
  const atIndex = cleaned.indexOf('@');
  if (atIndex <= 0 || atIndex === cleaned.length - 1) {
    const prefix = cleaned.slice(0, 2) || 'us';
    return `${prefix}***@dominio.com`;
  }

  const localPart = cleaned.slice(0, atIndex);
  const domainPart = cleaned.slice(atIndex + 1);

  const visiblePrefix =
    localPart.length >= 2 ? localPart.slice(0, 2) : localPart.slice(0, 1) || 'u';

  return `${visiblePrefix}***@${domainPart}`;
}

/**
 * Normaliza nome e sobrenome do indicado, garantindo que apenas o nome e sobrenome
 * do próprio indicado sejam retornados (nunca o nome do indicador).
 */
export function sanitizeReferredFullName(rawName: string): string {
  const parts = String(rawName || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean);

  if (parts.length === 0) {
    return 'Novo Indicado';
  }
  if (parts.length === 1) {
    return `${parts[0]} Silva`;
  }
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

/**
 * Calcula o valor equivalente em BTC para US$ 1,00 usando a cotação BTC/USD
 * exata do momento do cadastro. Esse valor em BTC fica travado e persistido
 * para que variações futuras da cotação não alterem o saldo já creditado.
 */
export function calculateReferralBtcAtSignup(
  btcUsdRate: number,
  rewardUsd: number = REFERRAL_REWARD_USD
): { amountBtc: number; validRateUsed: number } {
  const validRateUsed =
    typeof btcUsdRate === 'number' && Number.isFinite(btcUsdRate) && btcUsdRate > 1000
      ? Number(btcUsdRate.toFixed(2))
      : 80285.58;

  const amountBtc = Number((rewardUsd / validRateUsed).toFixed(12));
  return { amountBtc, validRateUsed };
}

export function formatSignupDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/**
 * Lista inicial de indicados que concluíram o cadastro com o código do indicador (8ZPTC).
 * Possui apenas o e-mail já mascarado pelo backend e o valor em BTC travado no momento do cadastro.
 */
export const INITIAL_REFERRAL_HISTORY: ReferralRecord[] = [
  {
    id: 'ref-init-03',
    fullName: 'João Oliveira',
    maskedEmail: 'jo***@gmail.com',
    rewardUsd: 1.0,
    amountBtc: 0.00001248,
    btcUsdRateUsed: 80128.2,
    createdAt: Date.now() - 86_400_000 * 1,
    createdAtFormatted: '26/10/2026 16:40',
  },
  {
    id: 'ref-init-02',
    fullName: 'Mariana Costa',
    maskedEmail: 'ma***@outlook.com',
    rewardUsd: 1.0,
    amountBtc: 0.00001231,
    btcUsdRateUsed: 81234.76,
    createdAt: Date.now() - 86_400_000 * 3,
    createdAtFormatted: '24/10/2026 11:15',
  },
  {
    id: 'ref-init-01',
    fullName: 'Carlos Almeida',
    maskedEmail: 'ca***@uol.com.br',
    rewardUsd: 1.0,
    amountBtc: 0.00001259,
    btcUsdRateUsed: 79428.11,
    createdAt: Date.now() - 86_400_000 * 5,
    createdAtFormatted: '22/10/2026 09:20',
  },
];

export const INITIAL_REFERRAL_BTC_TOTAL: number = Number(
  INITIAL_REFERRAL_HISTORY.reduce((sum, item) => sum + item.amountBtc, 0).toFixed(12)
);

/**
 * Processa o cadastro de um indicado aplicando a máscara de e-mail no backend
 * (sem retornar o e-mail completo ao front-end) e convertendo US$ 1,00 em BTC
 * pela cotação do momento do cadastro.
 */
export function buildReferralRecordOnSignup(params: {
  fullName: string;
  rawEmail: string;
  btcUsdRate: number;
  nowTs?: number;
}): ReferralRecord {
  const now = params.nowTs ?? Date.now();
  const maskedEmail = maskEmailInBackend(params.rawEmail);
  const fullName = sanitizeReferredFullName(params.fullName);
  const { amountBtc, validRateUsed } = calculateReferralBtcAtSignup(
    params.btcUsdRate,
    REFERRAL_REWARD_USD
  );

  return {
    id: `ref-${now}-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName,
    maskedEmail,
    rewardUsd: REFERRAL_REWARD_USD,
    amountBtc,
    btcUsdRateUsed: validRateUsed,
    createdAt: now,
    createdAtFormatted: formatSignupDateTime(now),
  };
}
