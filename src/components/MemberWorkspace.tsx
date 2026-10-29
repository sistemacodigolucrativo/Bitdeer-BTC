import React, { useEffect, useState } from 'react';
import { AuthUser, MemberData, Plan, api } from '../services/api';
import { CustomerSupportView } from './workspace/CustomerSupportView';
import { LanguageCode } from '../types';
import { Home, Store, User, Headphones, LogOut, Wallet, Gift, Settings, Trophy, ScrollText, ArrowLeft } from 'lucide-react';
import { translations } from '../i18n/translations';
import QRCode from 'qrcode';
import { ServerHomeView } from './ServerHomeView';
import { ServerStoreView } from './ServerStoreView';
import { ServerWalletView } from './ServerWalletView';
import { MockPaymentFeed } from './MockPaymentFeed';
import { formatBrazilianPhone, validBrazilianPhone } from '../utils/phone';
import { projectInternalBalance } from '../utils/projectInternalBalance';
import { ServerRewardView } from './ServerRewardView';
import { TopMinersView } from './workspace/TopMinersView';
import { SubscriptionHistoryView } from './workspace/SubscriptionHistoryView';
import { memberTexts } from '../i18n/memberTexts';
import { memberViewCopy } from '../i18n/memberViewCopy';

type Page = 'home' | 'store' | 'reward' | 'wallet' | 'settings' | 'profile' | 'support' | 'history' | 'topMiners' | 'subscriptions' | 'withdraw';
type PurchaseOrder = {
  orderId: number; status: string; priceUsd: string; quoteRateUsd: string;
  quoteSource: string; btcAddress: string; btcSatoshis: number;
  btcAmount: string; expiresAt: number;
};
export const MemberWorkspace: React.FC<{
  user: AuthUser; language: LanguageCode; onLogout: () => void;
  onChangeLanguage: (lang:LanguageCode)=>void;
}> = ({user, language, onLogout, onChangeLanguage}) => {
  const [page, setPage] = useState<Page>('home');
  const tabNames = translations[language].tabs;
  const words = memberTexts[language] || memberTexts.pt;
  const tr = memberViewCopy[language];
  const dateLocale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  const [account, setAccount] = useState<MemberData | null>(null);
  const [balanceTick,setBalanceTick] = useState(Date.now());
  const [lastSnapshotReceivedAt,setLastSnapshotReceivedAt] = useState(Date.now());
  const acceptSnapshot=(data:MemberData)=>{
    setLastSnapshotReceivedAt(Date.now());
    setAccount(data);
  };
  const [plans, setPlans] = useState<Plan[]>([]);
  const [checkout, setCheckout] = useState<PurchaseOrder|null>(null);
  const [checkoutQr, setCheckoutQr] = useState('');
  const [ledger, setLedger] = useState<{
    accruals: Array<{plan_id:string;start_ts:number;end_ts:number;earned_units:number}>;
    bonuses: Array<{plan_id:string;claimed_at:number;bonus_usd_units:number;bonus_satoshis:number}>;
  }>({accruals:[],bonuses:[]});
  const [profile, setProfile] = useState({displayName:'',email:'',phone:'',walletAddress:''});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [btcUsd,setBtcUsd]=useState<number|null>(null);
  const [quotePhase,setQuotePhase]=useState<'loading'|'ready'|'unavailable'>('loading');
  const [btcQuote,setBtcQuote]=useState<{source:string;quotedAt:number}|null>(null);
  const [walletStep,setWalletStep]=useState<'none'|'register'|'amount'>('none');
  const [walletDraft,setWalletDraft]=useState('');
  const [withdrawMode,setWithdrawMode]=useState<'BTC'|'USD'>('USD');
  const [withdrawAmount,setWithdrawAmount]=useState('');
  const [withdrawEdited,setWithdrawEdited]=useState(false);
  const [withdrawPopup,setWithdrawPopup]=useState<{id:number;usdAmount:string;recommended:string}|null>(null);
  const [storeRecommended,setStoreRecommended]=useState<string|null>(null);
  const [purchaseHistory,setPurchaseHistory]=useState<Array<{id:number|string;plan_id:string;status:string;created_at:number;btc_sats:number;adminEdited?:boolean;simulation?:boolean}>>([]);
  type WithdrawRequest={id:number|string;usd_cents:number;btc_satoshis:number;status:'pending'|'awaiting_vip'|'approved'|'rejected';created_at:number;adminEdited?:boolean;simulation?:boolean};
  const [withdrawHistory,setWithdrawHistory]=useState<WithdrawRequest[]>([]);
  // The PHP/SQLite profile is authoritative. Only complete USD cents can be
  // requested; fractional accruals are not counted as withdrawable cents.
  // The BTC figure is a quote-based equivalent of that very same USD balance,
  // not a separately held on-chain Bitcoin balance.
  const liveBalanceUsd = projectInternalBalance(account,lastSnapshotReceivedAt,balanceTick);
  const freshBtcUsd=btcQuote && balanceTick/1000-btcQuote.quotedAt>=0 &&
    balanceTick/1000-btcQuote.quotedAt<60 && btcUsd!==null && btcUsd>0 ? btcUsd : null;
  // Both screens show the same one-second USD projection converted with a
  // single backend-issued BTC/USD quote, rounded to eight decimal places.
  const liveBtc=freshBtcUsd===null ? null : (liveBalanceUsd/freshBtcUsd).toFixed(8);
  const quoteStatus=freshBtcUsd!==null?'ready':quotePhase==='loading'?'loading':'unavailable';
  const availableUsdCents=Math.max(0,Math.floor((account?.mining.balanceUnits??0)/8640000));
  const validQuote=freshBtcUsd!==null && Number.isFinite(freshBtcUsd) && freshBtcUsd>0 &&
    btcQuote!==null && Date.now()/1000-btcQuote.quotedAt>=0 &&
    Date.now()/1000-btcQuote.quotedAt<60;
  const availableBtcSatoshis=validQuote&&freshBtcUsd!==null
    ? Math.floor(availableUsdCents/100*100000000/freshBtcUsd)
    : null;
  const availableAmount=withdrawMode==='USD'
    ? 'US$ '+new Intl.NumberFormat(dateLocale,{minimumFractionDigits:2,maximumFractionDigits:2})
        .format(availableUsdCents/100)
    : availableBtcSatoshis!==null
      ? (availableBtcSatoshis/100000000).toFixed(8)+' BTC'
      : '— BTC';
  // Fill from the same SQLite-backed, already-reserved balance as the card.
  // Never overwrite a member's manual edit; a tab change resets autofill.
  // If the public quote is unavailable, BTC remains empty rather than guessed.
  const defaultWithdrawAmount=withdrawMode==='USD'
    ? (availableUsdCents/100).toFixed(2)
    : availableBtcSatoshis===null ? '' : (availableBtcSatoshis/100000000).toFixed(8);
  useEffect(()=>{
    if(walletStep==='amount'&&!withdrawEdited) setWithdrawAmount(defaultWithdrawAmount);
  },[walletStep,withdrawEdited,defaultWithdrawAmount]);
  useEffect(() => {
    if (!checkout) {setCheckoutQr('');return;}
    const bip21='bitcoin:'+checkout.btcAddress+'?amount='+checkout.btcAmount;
    let active=true;
    QRCode.toDataURL(bip21,{width:200,margin:1})
      .then(uri=>{if(active)setCheckoutQr(uri)})
      .catch(()=>{if(active)setCheckoutQr('')});
    return ()=>{active=false};
  },[checkout]);
  async function copy(value:string) {
    try {await navigator.clipboard.writeText(value);setNotice(words.copied);}
    catch {setNotice(words.copyFailed);}
  }
  async function reload() {
    try {
      const data = await api<MemberData>('profile');
      acceptSnapshot(data); setProfile({...data.profile,phone:formatBrazilianPhone(data.profile.phone)});
    } catch(e) { setNotice((e as Error).message); }
  }
  function refreshQuote() {
    setQuotePhase('loading');
    return api<{btcUsd:string;source:string;quotedAt:number}>('withdraw.quote')
      .then(x=>{
        const rate=Number(x.btcUsd);
        if(!Number.isFinite(rate)||rate<=0||!Number.isFinite(x.quotedAt))
          throw new Error('Cotação inválida');
        setBtcUsd(rate);
        setBtcQuote({source:x.source,quotedAt:x.quotedAt});
        setQuotePhase('ready');
      }).catch(()=>{
        setBtcUsd(null);setBtcQuote(null);setQuotePhase('unavailable');
      });
  }
  useEffect(() => {
    void refreshQuote();
    const timer=window.setInterval(()=>{void refreshQuote();},45000);
    return ()=>window.clearInterval(timer);
  }, []);
  useEffect(()=>{
    if(page==='wallet')void api<{requests:WithdrawRequest[]}>('withdraw.mine')
      .then(x=>setWithdrawHistory(x.requests)).catch(()=>{});
    if(page==='store')void api<{orders:typeof purchaseHistory}>('orders.mine')
      .then(x=>setPurchaseHistory(x.orders)).catch(()=>{});
  },[page]);
  async function saveWalletForWithdrawal(){
    setBusy(true);setNotice('');
    try{
      await api('profile.update',{...profile,walletAddress:walletDraft});
      await reload();
      setWalletStep('none');
      setPage('wallet');
      setNotice(words.saved);
    }catch(e){setNotice((e as Error).message);}
    finally{setBusy(false);}
  }
  async function submitWithdrawal(){
    setBusy(true);setNotice('');
    try{
      const result=await api<{id:number;status:'pending'|'awaiting_vip';message:string;usdAmount:string}>('withdraw.request',{mode:withdrawMode,amount:withdrawAmount});
      await reload();
      const history=await api<{requests:WithdrawRequest[]}>('withdraw.mine');
      setWithdrawHistory(history.requests);
      setWalletStep('none');setWithdrawAmount('');setPage('wallet');
      setNotice(result.message);
      if(result.status==='awaiting_vip') {
        const recommendation:Record<string,string>={FREE:'VIP_01',VIP_01:'VIP_02',VIP_02:'VIP_03',VIP_03:'VIP_04'};
        const selected=recommendation[account?.plan.id??'FREE']||'VIP_01';
        setWithdrawPopup({id:result.id,usdAmount:result.usdAmount,recommended:selected});
      }
    }catch(e){setNotice((e as Error).message);}
    finally{setBusy(false);}
  }
  useEffect(() => {
    void reload();
    api<{plans: Plan[]}>('plans').then(x=>setPlans(x.plans)).catch(e=>setNotice(String(e)));
    api<typeof ledger>('ledger').then(setLedger).catch(()=>{});
  }, []);
  // Real-time display is interpolated each second between short, authoritative
  // PHP/SQLite reads. No rewards or balances are written by the browser.
  useEffect(()=>{
    const frame=window.setInterval(()=>{
      if (document.visibilityState==='visible') setBalanceTick(Date.now());
    },1000);
    return ()=>window.clearInterval(frame);
  },[]);
  useEffect(() => {
    let outstanding=false;
    const refresh=()=>{
      if (document.visibilityState !== 'visible' || outstanding) return;
      outstanding=true;
      void api<MemberData>('profile')
        .then(data=>{setAccount(data);setLastSnapshotReceivedAt(Date.now());})
        .catch(()=>{})
        .finally(()=>{outstanding=false;});
    };
    const timer=window.setInterval(refresh,5000);
    document.addEventListener('visibilitychange',refresh);
    return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
  }, []);
  async function act(action: string, body: Record<string, unknown> = {}) {
    setBusy(true); setNotice('');
    try {
      if(action==='profile.update' && typeof body.phone==='string' && !validBrazilianPhone(body.phone)) {
        throw new Error(tr.phone);
      }
      const result = await api<PurchaseOrder | {ok:boolean}>(action,body);
      if (action==='orders.create') setCheckout(result as PurchaseOrder);
      setNotice(action==='orders.create'
        ? words.orderCreated : words.saved);
      await reload();
      if (action==='rewards.claim' || action==='mining.stop') {api<typeof ledger>('ledger').then(setLedger).catch(()=>{});}
    } catch(e) { setNotice((e as Error).message); }
    finally {setBusy(false);}
  }
  const tab = (p:Page, label:string, Icon:typeof Home) =>
    <button onClick={()=>{setPage(p);setNotice('');}} className={'flex flex-col items-center text-[11px] gap-1 '+(page===p?'text-white':'text-slate-400')}>
      <Icon size={20}/>{label}</button>;
  return <div className="w-full h-full flex flex-col bg-[#121526] text-white">
    {withdrawPopup && <div role="dialog" aria-modal="true" aria-label={language==='en'?'Withdrawal registered':language==='es'?'Retiro registrado':'Saque registrado'}
      data-testid="withdraw-awaiting-vip-modal" className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#1b2137] border border-indigo-400/40 p-5 shadow-xl space-y-4">
        <h2 className="font-extrabold text-lg">{language==='en'?'Withdrawal request registered':language==='es'?'Solicitud de retiro registrada':'Solicitação de saque registrada'}</h2>
        <p className="text-sm text-slate-200">{language==='en'?'Internal credits reserved: ':language==='es'?'Créditos internos descontados: ':'Créditos internos descontados: '}
          <strong>US$ {withdrawPopup.usdAmount}</strong>.</p>
        <p className="text-xs text-amber-300">{language==='en'?'Awaiting an eligible VIP subscription and administrative review; no BTC has been sent.':
          language==='es'?'En espera de una suscripción VIP elegible y revisión administrativa. No se ha enviado BTC.':
          'Aguardando assinatura VIP elegível e conferência administrativa. Nenhum BTC foi enviado.'}</p>
        <button type="button" data-testid="withdraw-go-to-store"
          className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-sm"
          onClick={()=>{setStoreRecommended(withdrawPopup.recommended);setWithdrawPopup(null);setPage('store');}}>
          {language==='en'?'See VIP '+withdrawPopup.recommended:language==='es'?'Ver plan '+withdrawPopup.recommended:'Ver plano '+withdrawPopup.recommended}
        </button>
        <button type="button" className="w-full text-xs text-slate-300 underline"
          onClick={()=>setWithdrawPopup(null)}>{language==='en'?'Close':language==='es'?'Cerrar':'Fechar'}</button>
      </div>
    </div>}
    <div className="px-5 pb-3 flex justify-between items-center border-b border-[#2b3350] shrink-0"
      style={{paddingTop:'max(12px, env(safe-area-inset-top))'}}>
      <div><strong>Bitdeer BTC</strong><p className="text-xs text-slate-400">{account?.user.login ?? user.login} · {account?.plan.id || '...'}</p></div>
      <button onClick={onLogout} title={words.signOutTitle} aria-label={words.signOutTitle}><LogOut size={20}/></button>
    </div>
    <nav data-testid="member-top-nav"
      className="w-full min-h-16 shrink-0 bg-[#101322] border-b border-[#1f253d] flex items-center justify-around gap-1 px-2 py-2 z-30 select-none"
      aria-label={language==='en'?'Primary navigation':language==='es'?'Navegación principal':'Navegação principal'}>
      {tab('home',tabNames.home,Home)}
      {tab('store',tabNames.store,Store)}
      {tab('reward',tabNames.reward,Gift)}
      {tab('wallet',tabNames.wallet,Wallet)}
      {tab('settings',tabNames.setting,Settings)}
    </nav>
    {page==='withdraw' ? <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
      <button type="button" className="inline-flex gap-2 items-center text-sm text-indigo-200"
        onClick={()=>{setWalletStep('none');setPage('wallet');}}><ArrowLeft size={18}/> {tr.back}</button>
      <h2 className="text-xl font-bold">{tr.title}</h2>
      {notice && <p role="status" className="p-3 rounded-lg bg-[#20243c] text-amber-300 text-xs">{notice}</p>}
      <section data-testid="withdraw-available-card" aria-live="polite"
        className="rounded-xl border border-[#303b59] bg-[#191e32] px-3 py-2 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
          {withdrawMode==='USD'
            ? language==='en'?'Available balance in USD':language==='es'?'Saldo disponible en USD':'Saldo disponível em USD'
            : language==='en'?'Available balance in BTC':language==='es'?'Saldo disponible en BTC':'Saldo disponível em BTC'}
        </p>
        <strong data-testid="withdraw-available-amount"
          className="block text-xl leading-tight font-black font-mono text-emerald-300 tabular-nums break-all">
          {availableAmount}
        </strong>
        <p className="text-[10px] leading-tight text-slate-400">
          {language==='en'?'Internal credits available for requests.':
            language==='es'?'Créditos internos disponibles para solicitudes.':
            'Créditos internos disponíveis para solicitação.'}
        </p>
        {withdrawMode==='BTC'&&!validQuote&&<div className="flex flex-wrap gap-2 items-center text-[10px] text-amber-300">
          <span role="status">{quoteStatus==='loading'
            ? language==='en'?'BTC quote being calculated':language==='es'?'Cotización BTC en cálculo':'Cotação BTC sendo calculada'
            : language==='en'?'BTC quote unavailable':language==='es'?'Cotización BTC no disponible':'Cotação BTC indisponível'}</span>
          {quoteStatus==='unavailable'&&<button type="button" onClick={()=>{void refreshQuote();}}
            className="underline text-indigo-300">{language==='en'?'Retry':language==='es'?'Reintentar':'Tentar novamente'}</button>}
        </div>}
      </section>
          {walletStep!=='none' && <section className="bg-[#1b2137] border border-indigo-500 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 data-testid="withdraw-form-heading" className="font-bold">{walletStep==='register'?tr.walletRegistration:tr.request}</h3>
              <button onClick={()=>{setWalletStep('none');setPage('wallet');}} className="text-xs underline">{tr.close}</button>
            </div>
            {walletStep==='register' ? <form className="space-y-3" onSubmit={e=>{e.preventDefault();void saveWalletForWithdrawal();}}>
              <label className="block text-sm">{tr.address}
                <input required value={walletDraft} onChange={e=>setWalletDraft(e.target.value)}
                  placeholder="bc1..." className="w-full mt-2 bg-[#11182c] rounded-lg p-3 font-mono text-xs"/>
              </label>
              <button disabled={busy} className="w-full bg-indigo-600 rounded-xl p-3 font-bold text-sm">{tr.save}</button>
            </form> : <form className="space-y-3" onSubmit={e=>{e.preventDefault();void submitWithdrawal();}}>
              <p className="text-xs text-slate-400">{tr.minimum}: US$ {account?.plan.withdrawMinUsd??'0.00'}.
                {tr.period}: {account?.plan.withdrawAfterDays??0} {tr.days}.</p>
              <div className="flex gap-2">
                <button type="button" className={'flex-1 p-2 rounded-lg '+(withdrawMode==='USD'?'bg-indigo-600':'bg-[#11182c]')}
                  onClick={()=>{setWithdrawMode('USD');setWithdrawEdited(false);}}>{tr.usd}</button>
                <button type="button" className={'flex-1 p-2 rounded-lg '+(withdrawMode==='BTC'?'bg-indigo-600':'bg-[#11182c]')}
                  onClick={()=>{setWithdrawMode('BTC');setWithdrawEdited(false);}}>{tr.btc}</button>
              </div>
              <label className="block text-sm">{tr.amount} ({withdrawMode})
                <input data-testid="withdraw-request-amount" required type="number"
                  min={withdrawMode==='BTC'?'0.00000001':'0.01'} step={withdrawMode==='BTC'?'0.00000001':'0.01'}
                  value={withdrawAmount} onChange={e=>{setWithdrawEdited(true);setWithdrawAmount(e.target.value);}}
                  className="w-full mt-2 bg-[#11182c] rounded-lg p-3"/>
              </label>
              <button disabled={busy || !freshBtcUsd} className="w-full bg-indigo-600 rounded-xl p-3 font-bold text-sm">{tr.submit}</button>
            </form>}
          </section>}
    </div> :
      page==='support' ? <CustomerSupportView language={language} onBack={()=>setPage('settings')}/> :
      page==='topMiners' ? <TopMinersView language={language} btcUsd={freshBtcUsd} onBack={()=>setPage('settings')}/> :
      page==='subscriptions' ? <SubscriptionHistoryView language={language} onBack={()=>setPage('settings')}/> :
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
        {notice && <p role="status" className="p-3 rounded-lg bg-[#20243c] text-sm text-amber-300">{notice}</p>}
        {page==='home' && <ServerHomeView account={account} liveBalanceUsd={liveBalanceUsd} liveBtc={liveBtc} quoteStatus={quoteStatus}
          onRetryQuote={()=>{void refreshQuote();}} language={language} busy={busy}
          onStart={()=>void act('mining.start')} onStop={()=>void act('mining.stop')}
          onRefresh={()=>void reload()} onRewards={()=>setPage('reward')}
          onHistory={()=>setPage('history')}/>}
        {page==='reward' && <ServerRewardView account={account} language={language} busy={busy}
          onClaim={()=>void act('rewards.claim')} onHistory={()=>setPage('history')}/>}
        {page==='wallet' && <>
          <ServerWalletView account={account} liveBalanceUsd={liveBalanceUsd} liveBtc={liveBtc} quoteStatus={quoteStatus}
            onRetryQuote={()=>{void refreshQuote();}} language={language}
            accruals={ledger.accruals} onEdit={()=>setPage('profile')} onHistory={()=>setPage('history')}
            onWithdraw={()=>{
              setWalletDraft(account?.profile.walletAddress??'');
              setWalletStep(account?.profile.walletAddress?'amount':'register');
              setWithdrawMode('USD');
              setWithdrawEdited(false);
              setWithdrawAmount('');
              setPage('withdraw');
            }}/>
          {withdrawHistory.length>0 && <section className="bg-[#171b2d] rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm">{tr.requests}</h3>
            {withdrawHistory.map(x=><p key={x.id} className="text-xs border-b border-[#2b3350] pb-2">
              #{x.id} · US$ {(x.usd_cents/100).toFixed(2)} · {(x.btc_satoshis/1e8).toFixed(8)} BTC ({tr.equivalent}) · {x.status==='awaiting_vip'?tr.awaiting:x.status==='pending'?tr.pending:x.status==='approved'?tr.approved:tr.rejected}
              {x.adminEdited&&<span className="block text-amber-300">{language==='en'?'Edited demo history':language==='es'?'Historial demostrativo editado':'Histórico demonstrativo ajustado'}</span>}
            </p>)}
          </section>}
          <MockPaymentFeed language={language}/>
        </>}
        {page==='settings' && <section className="space-y-3">
          <h2 className="text-lg font-bold">{words.settings}</h2>
          <p className="text-xs text-slate-400">{words.account}: {account?.user.login ?? user.login} · {language==='en'?'User ID':language==='es'?'ID de usuario':'ID do usuário'} #{user.id}</p>
          <label className="flex items-center justify-between bg-[#1b2137] rounded-xl border border-[#2b3350] p-4 text-sm">
            <span>{language==='en'?'Language':language==='es'?'Idioma':'Idioma'}</span>
            <select value={language} onChange={e=>onChangeLanguage(e.target.value as LanguageCode)}
              className="bg-[#11182c] rounded-lg px-3 py-2 text-xs text-white">
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </label>
          <button type="button" data-testid="settings-top-miners" onClick={()=>setPage('topMiners')}
            className="w-full flex gap-3 items-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-[#231905] border border-yellow-300 p-4 font-black text-sm shadow-lg shadow-amber-900/20">
            <Trophy size={19}/>{language==='es'?'Mejores mineros':'Top Miners'}
          </button>
          {([
            ['profile',words.profile,User],
            ['subscriptions',language==='en'?'Subscriptions':language==='es'?'Suscripciones':'Histórico VIP',ScrollText],
            ['support',words.support,Headphones],
          ] as const).map(([target,label,Icon]) =>
            <button key={target} onClick={()=>setPage(target)}
              className="w-full flex gap-3 items-center rounded-xl bg-[#1b2137] border border-[#2b3350] p-4 text-sm">
              <Icon size={18}/>{label}</button>)}
          <button className="w-full flex gap-3 items-center rounded-xl bg-[#1b2137] border border-[#2b3350] p-4 text-sm"
            onClick={onLogout}><LogOut size={18}/> {words.signOut}</button>
        </section>}
        {page==='store' && <>
          <ServerStoreView plans={plans} activePlanId={account?.plan.id ?? 'FREE'}
            suggestedPlanId={storeRecommended}
            language={language} busy={busy} onPurchase={planId=>void act('orders.create',{planId})}/>
          {checkout && <section className="bg-[#1b2137] border border-indigo-600/50 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold">{tr.order} #{checkout.orderId} — {words.pendingPayment}</h3>
            <p className="text-sm" >{words.price}: US$ {checkout.priceUsd}</p>
            <p className="text-sm" >{words.exactAmount}: <strong>{checkout.btcAmount} BTC</strong> ({checkout.btcSatoshis} satoshis)</p>
            <p className="text-xs text-slate-400" >{words.quotation}: US$ {checkout.quoteRateUsd} {tr.perBtc} · {checkout.quoteSource}</p>
            <p className="text-xs text-amber-300" >{words.quoteExpiry} {new Date(checkout.expiresAt*1000).toLocaleString(dateLocale)}. {words.expiredWarning}</p>
            {checkoutQr && <img src={checkoutQr} alt={tr.qrAlt} className="mx-auto rounded-lg w-40 h-40"/>}
            <p className="text-xs break-all font-mono">{checkout.btcAddress}</p>
            <div className="flex gap-2">
              <button className="flex-1 bg-indigo-600 rounded-xl p-2 text-xs" onClick={()=>void copy(checkout.btcAddress)}>{words.copyAddress}</button>
              <button className="flex-1 bg-indigo-600 rounded-xl p-2 text-xs" onClick={()=>void copy(checkout.btcAmount)}>{words.copyBtc}</button>
            </div>
            <button className="text-indigo-300 text-xs underline" onClick={()=>setCheckout(null)}>{words.close}</button>
          </section>}
          {purchaseHistory.length>0&&<section data-testid="member-purchase-history" className="bg-[#171b2d] rounded-2xl p-3 space-y-2">
            <h3 className="font-bold text-sm">{language==='en'?'Purchase history':language==='es'?'Historial de compras':'Histórico de compras'}</h3>
            {purchaseHistory.map(x=><p key={x.id} className="border-b border-[#2b3350] pb-2 text-xs">
              #{x.id} · {x.plan_id} · {x.status} · {(x.btc_sats/1e8).toFixed(8)} BTC
              {x.adminEdited&&<span className="block text-amber-300">{language==='en'?'Administratively edited demo history':language==='es'?'Historial demostrativo editado':'Histórico demonstrativo ajustado pelo administrador'}</span>}
            </p>)}
          </section>}
        </>}
        {page==='history' && <>
          <h2 className="font-bold text-lg">{words.rewardLog}</h2>
          <button className="text-xs border border-slate-600 rounded-lg p-2" onClick={()=>
            void api<typeof ledger>('ledger').then(setLedger).catch(e=>setNotice((e as Error).message))
          }>{words.updateLog}</button>
          <h3 className="text-sm font-semibold">{words.accrual}</h3>
          {ledger.accruals.length===0 && <p className="text-xs text-slate-400">{words.noAccrual}</p>}
          {ledger.accruals.map((r,i)=><div key={i} className="p-3 bg-[#1b2137] rounded-xl text-xs">
            {r.plan_id} · {new Date(r.start_ts*1000).toLocaleString(dateLocale)} — {new Date(r.end_ts*1000).toLocaleString(dateLocale)}
            <p >{words.earnedUnits}: {r.earned_units}</p>
            {(r as {adminEdited?:boolean}).adminEdited&&<p className="text-amber-300">Histórico demonstrativo ajustado</p>
          </div>)}
          <h3 className="text-sm font-semibold">{words.dailyBonusClaims}</h3>
          {ledger.bonuses.length===0 && <p className="text-xs text-slate-400">{words.noBonus}</p>}
          {ledger.bonuses.map((r,i)=><div key={i} className="p-3 bg-[#1b2137] rounded-xl text-xs">
            {r.plan_id} · {new Date(r.claimed_at*1000).toLocaleString(dateLocale)}
            <p>{r.bonus_satoshis} {tr.satoshis} · {r.bonus_usd_units} {tr.units}</p>
            {(r as {adminEdited?:boolean}).adminEdited&&<p className="text-amber-300">Histórico demonstrativo ajustado</p>
          </div>)}
        </>}
        {page==='profile' && <form onSubmit={e=>{e.preventDefault();void act('profile.update',profile)}} className="space-y-3">
          <h2 className="text-lg font-bold">{words.profile}</h2>
          {(['displayName','email','phone','walletAddress'] as const).map(k=><label key={k} className="block text-sm text-slate-300">
            {({displayName:words.name,email:words.optionalEmail,phone:words.phone,walletAddress:words.btcWallet} as const)[k]}
            <input type={k==='email'?'email':k==='phone'?'tel':'text'} autoComplete={k==='email'?'email':k==='phone'?'tel':'off'}
              value={profile[k]}
              maxLength={k==='phone'?15:undefined} inputMode={k==='phone'?'tel':undefined}
              placeholder={k==='phone'?'(31) 99999-9999':undefined}
              onChange={e=>setProfile(p=>({...p,[k]:k==='phone'?formatBrazilianPhone(e.target.value):e.target.value}))}
              className="mt-1 w-full bg-[#1b2137] border border-[#2b3350] p-3 rounded-xl text-white"/>
          </label>)}
          <button disabled={busy} className="w-full bg-indigo-600 rounded-xl p-3">{words.update}</button>
        </form>}
      </div>}

  </div>;
};
