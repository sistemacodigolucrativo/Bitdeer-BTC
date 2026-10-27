/**
 * checkout.js — Controlador de Interface do Checkout BTC (Vanilla JS — Modo Produção)
 */
import { CONFIG, getReceivingAddress } from './config.js';
import { calculateUsdToBtc, buildBip21Uri } from './calc.js';
import { fetchBtcUsdQuote } from './quote.js';

let selectedPlan = CONFIG.PLANS[0];
let currentQuote = null;
let currentCalc = null;
let orderStatus = 'AGUARDANDO'; // AGUARDANDO | EXPIRADO
let remainingSeconds = CONFIG.QUOTE_LOCK_SECONDS;
let countdownTimer = null;

function formatUsd(val) {
  return `US$ ${Number(val).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatSats(val) {
  return `${Number(val).toLocaleString('pt-BR')} sats`;
}

function formatTimer(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderPlanCards() {
  const grid = document.getElementById('plans-grid');
  grid.innerHTML = '';

  CONFIG.PLANS.forEach((plan) => {
    const active = plan.id === selectedPlan.id;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `plan-card ${active ? 'active' : ''}`;
    card.innerHTML = `
      <div class="plan-header">
        <span class="plan-name">${plan.name}</span>
        <span class="plan-price">US$ ${plan.priceUsd}</span>
      </div>
      <div class="plan-details">
        <div><span>Diário:</span> <strong class="text-emerald">US$ ${plan.dailyUsd}/dia</strong></div>
        <div><span>Duração:</span> <strong>${plan.durationDays} dias</strong></div>
        <div><span>Total 30d:</span> <strong>US$ ${plan.total30DaysUsd}</strong></div>
      </div>
    `;
    // Ao clicar nos cards maiores, o efeito é somente a seleção do card
    card.addEventListener('click', () => {
      selectedPlan = plan;
      renderPlanCards();
    });
    grid.appendChild(card);
  });
}

async function openCheckoutForSelectedPlan() {
  const storeSection = document.getElementById('store-section');
  const checkoutSection = document.getElementById('checkout-section');

  document.getElementById('selected-plan-title').textContent = `Checkout Bitcoin — ${selectedPlan.name}`;
  document.getElementById('selected-plan-subtitle').textContent = `US$ ${selectedPlan.priceUsd} • US$ ${selectedPlan.dailyUsd}/dia (${selectedPlan.durationDays} dias = US$ ${selectedPlan.total30DaysUsd})`;

  storeSection.classList.add('hidden');
  checkoutSection.classList.remove('hidden');

  await loadQuoteAndRender(false);
}

async function loadQuoteAndRender(forceRefresh = false) {
  const loadingEl = document.getElementById('loading-state');
  const errorEl = document.getElementById('error-state');
  const errorMsgEl = document.getElementById('error-message');
  const paymentPanel = document.getElementById('payment-panel');

  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  paymentPanel.classList.add('hidden');

  try {
    currentQuote = await fetchBtcUsdQuote(forceRefresh);
    currentCalc = calculateUsdToBtc(selectedPlan.priceUsd, currentQuote.rateUsd);
    orderStatus = 'AGUARDANDO';
    remainingSeconds = CONFIG.QUOTE_LOCK_SECONDS;

    startCountdown();
    updatePaymentUI();
    loadingEl.classList.add('hidden');
    paymentPanel.classList.remove('hidden');
  } catch (err) {
    loadingEl.classList.add('hidden');
    errorMsgEl.textContent = err.message || 'Falha ao buscar cotação BTC/USD.';
    errorEl.classList.remove('hidden');
  }
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    remainingSeconds -= 1;
    const timerEl = document.getElementById('quote-timer');
    if (timerEl) timerEl.textContent = formatTimer(Math.max(0, remainingSeconds));

    if (remainingSeconds <= 0) {
      orderStatus = 'EXPIRADO';
      updateStatusBadge();
      loadQuoteAndRender(true);
    }
  }, 1000);
}

function updateStatusBadge() {
  const badge = document.getElementById('order-status-badge');
  badge.textContent = orderStatus;
  badge.className = `status-badge status-${orderStatus.toLowerCase()}`;
}

function updatePaymentUI() {
  const addr = getReceivingAddress();
  const bip21 = buildBip21Uri(
    addr,
    currentCalc.amountBtcFormatted,
    `BitCloud ${selectedPlan.name}`
  );

  updateStatusBadge();
  document.getElementById('quote-timer').textContent = formatTimer(remainingSeconds);
  document.getElementById('btc-amount').textContent = `${currentCalc.amountBtcFormatted} BTC`;
  document.getElementById('sats-amount').textContent = formatSats(currentCalc.satoshis);
  document.getElementById('usd-amount').textContent = formatUsd(selectedPlan.priceUsd);

  // Quebra controlada antes do colchete em "Cotação usada"
  document.getElementById('quote-source-name').textContent = currentQuote.sourceName;
  document.getElementById('quote-bracket').textContent = `[1 BTC = ${formatUsd(
    currentQuote.rateUsd
  )}${currentQuote.fromCache ? ' • cache' : ''}]`;

  document.getElementById('btc-address').textContent = addr;
  document.getElementById('bip21-uri').textContent = bip21;
  document.getElementById('bip21-link').href = bip21;

  // Render QR Code via biblioteca QRCode client-side
  const qrContainer = document.getElementById('qr-container');
  qrContainer.innerHTML = '';
  if (window.QRCode) {
    new window.QRCode(qrContainer, {
      text: bip21,
      width: 180,
      height: 180,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
    });
  }
}

function initEvents() {
  document.getElementById('activate-plan-btn').addEventListener('click', () => {
    openCheckoutForSelectedPlan();
  });

  document.getElementById('back-to-store-btn').addEventListener('click', () => {
    if (countdownTimer) clearInterval(countdownTimer);
    document.getElementById('checkout-section').classList.add('hidden');
    document.getElementById('store-section').classList.remove('hidden');
  });

  document.getElementById('retry-btn').addEventListener('click', () => loadQuoteAndRender(true));
  document.getElementById('refresh-quote-btn').addEventListener('click', () => loadQuoteAndRender(true));

  document.getElementById('copy-address-btn').addEventListener('click', (e) => {
    navigator.clipboard.writeText(getReceivingAddress());
    e.target.textContent = 'Copiado!';
    setTimeout(() => (e.target.textContent = 'Copiar'), 1800);
  });

  document.getElementById('copy-btc-btn').addEventListener('click', (e) => {
    if (!currentCalc) return;
    navigator.clipboard.writeText(currentCalc.amountBtcFormatted);
    e.target.textContent = 'Copiado!';
    setTimeout(() => (e.target.textContent = 'Copiar BTC'), 1800);
  });

  document.getElementById('copy-bip21-btn').addEventListener('click', (e) => {
    if (!currentCalc) return;
    const bip21 = buildBip21Uri(
      getReceivingAddress(),
      currentCalc.amountBtcFormatted,
      `BitCloud ${selectedPlan.name}`
    );
    navigator.clipboard.writeText(bip21);
    e.target.textContent = 'Copiado!';
    setTimeout(() => (e.target.textContent = 'Copiar URI'), 1800);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderPlanCards();
  initEvents();
});
