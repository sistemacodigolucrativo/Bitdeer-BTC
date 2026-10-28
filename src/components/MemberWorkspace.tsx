import React, { useEffect, useState } from 'react';
import { AuthUser, MemberData, Plan, api } from '../services/api';
import { CustomerSupportView } from './workspace/CustomerSupportView';
import { LanguageCode } from '../types';
import { Home, Store, User, Headphones, LogOut, RefreshCw, History, Wallet, Gift, Settings, Trophy, ScrollText, Users, ArrowLeft } from 'lucide-react';
import { translations } from '../i18n/translations';
import QRCode from 'qrcode';
import { ServerHomeView } from './ServerHomeView';
import { ServerStoreView } from './ServerStoreView';
import { ServerWalletView } from './ServerWalletView';
import { formatBrazilianPhone, validBrazilianPhone } from '../utils/phone';
import { ServerRewardView } from './ServerRewardView';
import { TopMinersView } from './workspace/TopMinersView';
import { ReferralHistoryView } from './workspace/ReferralHistoryView';
import { SubscriptionHistoryView } from './workspace/SubscriptionHistoryView';
import { memberTexts } from '../i18n/memberTexts';

type Page = 'home' | 'store' | 'reward' | 'wallet' | 'settings' | 'profile' | 'support' | 'history' | 'topMiners' | 'subscriptions' | 'referrals' | 'withdraw';
type PurchaseOrder = {
  orderId: number; status: string; priceUsd: string; quoteRateUsd: string;
  quoteSource: string; btcAddress: string; btcSatoshis: number;
  btcAmount: string; expiresAt: number;
};
type OrderRow = {id:number;plan_id:string;status:string;btc_address?:string;btc_sats?:number;expires_at?:number};
export const MemberWorkspace: React.FC<{
  user: AuthUser; language: LanguageCode; onLogout: () => void;
  onChangeLanguage: (lang:LanguageCode)=>void;
}> = ({user, language, onLogout, onChangeLanguage}) => {
  const [page, setPage] = useState<Page>('home');
  const tabNames = translations[language].tabs;
  const words = memberTexts[language] || memberTexts.pt;
  const dateLocale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  const [account, setAccount] = useState<MemberData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
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
  const [walletStep,setWalletStep]=useState<'none'|'register'|'amount'>('none');
  const [walletDraft,setWalletDraft]=useState('');
  const [withdrawMode,setWithdrawMode]=useState<'BTC'|'USD'>('USD');
  const [withdrawAmount,setWithdrawAmount]=useState('');
  type WithdrawRequest={id:number;usd_cents:number;btc_satoshis:number;status:string;created_at:number};
  const [withdrawHistory,setWithdrawHistory]=useState<WithdrawRequest[]>([]);
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
      setAccount(data); setProfile({...data.profile,phone:formatBrazilianPhone(data.profile.phone)});
    } catch(e) { setNotice((e as Error).message); }
  }
  useEffect(() => {
    const quote=()=>void api<{btcUsd:string}>('withdraw.quote')
      .then(x=>setBtcUsd(Number(x.btcUsd))).catch(()=>setBtcUsd(null));
    quote();
    const timer=window.setInterval(quote,90000);
    return ()=>window.clearInterval(timer);
  }, []);
  useEffect(()=>{
    if(page==='wallet')void api<{requests:WithdrawRequest[]}>('withdraw.mine')
      .then(x=>setWithdrawHistory(x.requests)).catch(()=>{});
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
      const result=await api<{id:number;message:string}>('withdraw.request',{mode:withdrawMode,amount:withdrawAmount});
      await reload();
      const history=await api<{requests:WithdrawRequest[]}>('withdraw.mine');
      setWithdrawHistory(history.requests);
      setWalletStep('none');setWithdrawAmount('');setPage('wallet');
      setNotice(result.message);
    }catch(e){setNotice((e as Error).message);}
    finally{setBusy(false);}
  }
  useEffect(() => {
    void reload();
    api<{plans: Plan[]}>('plans').then(x=>setPlans(x.plans)).catch(e=>setNotice(String(e)));
    api<{orders: typeof orders}>('orders.mine').then(x=>setOrders(x.orders)).catch(()=>{});
    api<typeof ledger>('ledger').then(setLedger).catch(()=>{});
  }, []);
  // Refresh server-authoritative balances and active plan across devices without
  // overwriting any member profile form currently being edited.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void api<MemberData>('profile').then(setAccount).catch(() => {});
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);
  async function act(action: string, body: Record<string, unknown> = {}) {
    setBusy(true); setNotice('');
    try {
      if(action==='profile.update' && typeof body.phone==='string' && !validBrazilianPhone(body.phone)) {
        throw new Error('Informe um telefone brasileiro válido com DDD (10 ou 11 dígitos).');
      }
      const result = await api<PurchaseOrder | {ok:boolean}>(action,body);
      if (action==='orders.create') setCheckout(result as PurchaseOrder);
      setNotice(action==='orders.create'
        ? words.orderCreated : words.saved);
      await reload();
      if (action==='rewards.claim' || action==='mining.stop') {api<typeof ledger>('ledger').then(setLedger).catch(()=>{});}
      if (action==='orders.create') {
        const x=await api<{orders: typeof orders}>('orders.mine'); setOrders(x.orders);
      }
    } catch(e) { setNotice((e as Error).message); }
    finally {setBusy(false);}
  }
  const tab = (p:Page, label:string, Icon:typeof Home) =>
    <button onClick={()=>{setPage(p);setNotice('');}} className={'flex flex-col items-center text-[11px] gap-1 '+(page===p?'text-white':'text-slate-400')}>
      <Icon size={20}/>{label}</button>;
  return <div className="w-full h-full flex flex-col bg-[#121526] text-white">
    <div className="px-5 pt-5 pb-3 flex justify-between items-center border-b border-[#2b3350]">
      <div><strong>Bitdeer BTC</strong><p className="text-xs text-slate-400">{account?.user.login ?? user.login} · {account?.plan.id || '...'}</p></div>
      <button onClick={onLogout} title={words.signOutTitle} aria-label={words.signOutTitle}><LogOut size={20}/></button>
    </div>
    {page==='withdraw' ? <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
      <button type="button" className="inline-flex gap-2 items-center text-sm text-indigo-200"
        onClick={()=>{setWalletStep('none');setPage('wallet');}}><ArrowLeft size={18}/> Voltar à carteira</button>
      <h2 className="text-xl font-bold">Solicitação de Saque</h2>
      {notice && <p role="status" className="p-3 rounded-lg bg-[#20243c] text-amber-300 text-xs">{notice}</p>}
          {walletStep!=='none' && <section className="bg-[#1b2137] border border-indigo-500 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{walletStep==='register'?'Cadastrar carteira Bitcoin':'Solicitar saque interno'}</h3>
              <button onClick={()=>setWalletStep('none')} className="text-xs underline">Fechar</button>
            </div>
            {walletStep==='register' ? <form className="space-y-3" onSubmit={e=>{e.preventDefault();void saveWalletForWithdrawal();}}>
              <label className="block text-sm">Endereço de recebimento BTC
                <input required value={walletDraft} onChange={e=>setWalletDraft(e.target.value)}
                  placeholder="bc1..." className="w-full mt-2 bg-[#11182c] rounded-lg p-3 font-mono text-xs"/>
              </label>
              <button disabled={busy} className="w-full bg-indigo-600 rounded-xl p-3 font-bold text-sm">Salvar carteira</button>
            </form> : <form className="space-y-3" onSubmit={e=>{e.preventDefault();void submitWithdrawal();}}>
              <p className="text-xs text-slate-300 break-all">Carteira: {account?.profile.walletAddress}</p>
              <p className="text-xs text-slate-400">Cotação indicativa: {btcUsd?('US$ '+btcUsd.toFixed(2)+'/BTC'):'indisponível'}. O servidor atualiza a cotação ao registrar o pedido.</p>
              <p className="text-xs text-slate-400">Saque mínimo: US$ {account?.plan.withdrawMinUsd??'0.00'}.
                Prazo do plano: {account?.plan.withdrawAfterDays??0} dia(s).</p>
              <div className="flex gap-2">
                <button type="button" className={'flex-1 p-2 rounded-lg '+(withdrawMode==='USD'?'bg-indigo-600':'bg-[#11182c]')}
                  onClick={()=>{setWithdrawMode('USD');setWithdrawAmount('');}}>Dólar (USD)</button>
                <button type="button" className={'flex-1 p-2 rounded-lg '+(withdrawMode==='BTC'?'bg-indigo-600':'bg-[#11182c]')}
                  onClick={()=>{setWithdrawMode('BTC');setWithdrawAmount('');}}>Bitcoin (BTC)</button>
              </div>
              <label className="block text-sm">Valor solicitado ({withdrawMode})
                <input required type="number" min="0.00000001" step={withdrawMode==='BTC'?'0.00000001':'0.01'}
                  value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)}
                  className="w-full mt-2 bg-[#11182c] rounded-lg p-3"/>
              </label>
              <p className="text-xs text-amber-300">O pedido utiliza créditos internos do sistema, sem transferência automática de Bitcoin real. A solicitação permanece pendente de conferência administrativa.</p>
              <button disabled={busy || !btcUsd} className="w-full bg-indigo-600 rounded-xl p-3 font-bold text-sm">Registrar solicitação</button>
            </form>}
          </section>}
    </div> :
      page==='support' ? <CustomerSupportView language={language} onBack={()=>setPage('settings')}/> :
      page==='topMiners' ? <TopMinersView language={language} onBack={()=>setPage('settings')}/> :
      page==='subscriptions' ? <SubscriptionHistoryView language={language} onBack={()=>setPage('settings')}/> :
      page==='referrals' ? <ReferralHistoryView language={language} onBack={()=>setPage('settings')}/> :
      <div className="flex-1 overflow-auto p-5 space-y-4">
        {notice && <p role="status" className="p-3 rounded-lg bg-[#20243c] text-sm text-amber-300">{notice}</p>}
        {page==='home' && <ServerHomeView account={account} language={language} btcUsd={btcUsd} busy={busy}
          onStart={()=>void act('mining.start')} onStop={()=>void act('mining.stop')}
          onRefresh={()=>void reload()} onRewards={()=>setPage('reward')}
          onHistory={()=>setPage('history')}/>}
        {page==='reward' && <ServerRewardView account={account} language={language} busy={busy}
          onClaim={()=>void act('rewards.claim')} onHistory={()=>setPage('history')}/>}
        {page==='wallet' && <>
          <ServerWalletView account={account} language={language} btcUsd={btcUsd}
            accruals={ledger.accruals} onEdit={()=>setPage('profile')} onHistory={()=>setPage('history')}
            onWithdraw={()=>{
              setWalletDraft(account?.profile.walletAddress??'');
              setWalletStep(account?.profile.walletAddress?'amount':'register');
              setWithdrawAmount('');
              setPage('withdraw');
            }}/>
          {withdrawHistory.length>0 && <section className="bg-[#171b2d] rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm">Solicitações de saque</h3>
            {withdrawHistory.map(x=><p key={x.id} className="text-xs border-b border-[#2b3350] pb-2">
              #{x.id} · US$ {(x.usd_cents/100).toFixed(2)} · {(x.btc_satoshis/1e8).toFixed(8)} BTC (equivalência interna) · {x.status}
            </p>)}
          </section>}
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
          {([
            ['profile',words.profile,User],
            ['history',words.history,History],
            ['referrals',language==='en'?'Referrals':language==='es'?'Referidos':'Indicações',Users],
            ['subscriptions',language==='en'?'Subscriptions':language==='es'?'Suscripciones':'Histórico VIP',ScrollText],
            ['topMiners',language==='en'?'Top Miners':language==='es'?'Mejores mineros':'Top Miners',Trophy],
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
            language={language} busy={busy} onPurchase={planId=>void act('orders.create',{planId})}/>
          {checkout && <section className="bg-[#1b2137] border border-indigo-600/50 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold">Pedido #{checkout.orderId} — {words.pendingPayment}</h3>
            <p className="text-sm" >{words.price}: US$ {checkout.priceUsd}</p>
            <p className="text-sm" >{words.exactAmount}: <strong>{checkout.btcAmount} BTC</strong> ({checkout.btcSatoshis} satoshis)</p>
            <p className="text-xs text-slate-400" >{words.quotation}: US$ {checkout.quoteRateUsd} por BTC · {checkout.quoteSource}</p>
            <p className="text-xs text-amber-300" >{words.quoteExpiry} {new Date(checkout.expiresAt*1000).toLocaleString(dateLocale)}. {words.expiredWarning}</p>
            {checkoutQr && <img src={checkoutQr} alt="QR do endereço e valor BTC deste pedido" className="mx-auto rounded-lg w-40 h-40"/>}
            <p className="text-xs break-all font-mono">{checkout.btcAddress}</p>
            <div className="flex gap-2">
              <button className="flex-1 bg-indigo-600 rounded-xl p-2 text-xs" onClick={()=>void copy(checkout.btcAddress)}>{words.copyAddress}</button>
              <button className="flex-1 bg-indigo-600 rounded-xl p-2 text-xs" onClick={()=>void copy(checkout.btcAmount)}>{words.copyBtc}</button>
            </div>
            <p className="text-xs text-slate-400">{words.txidNotice}</p>
            <button className="text-indigo-300 text-xs underline" onClick={()=>setCheckout(null)}>{words.close}</button>
          </section>}
                    <h3 className="font-bold mt-5">{words.orders}</h3>
          {orders.length===0 ? <p className="text-xs text-slate-400">{words.noOrders}</p> :
            orders.map(o=><p className="text-sm" key={o.id}>#{o.id} · {o.plan_id} · {o.status}{o.btc_sats? ' · '+(o.btc_sats/100000000).toFixed(8)+' BTC':''}</p>)}
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
          </div>)}
          <h3 className="text-sm font-semibold">{words.dailyBonusClaims}</h3>
          {ledger.bonuses.length===0 && <p className="text-xs text-slate-400">{words.noBonus}</p>}
          {ledger.bonuses.map((r,i)=><div key={i} className="p-3 bg-[#1b2137] rounded-xl text-xs">
            {r.plan_id} · {new Date(r.claimed_at*1000).toLocaleString(dateLocale)}
            <p>{r.bonus_satoshis} satoshis internos · {r.bonus_usd_units} unidades USD</p>
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
    {page!=='withdraw' && <nav className="w-full h-16 bg-[#101322] border-t border-[#1f253d] flex items-center justify-around px-2 z-30 select-none">
      {tab('home',tabNames.home,Home)}
      {tab('store',tabNames.store,Store)}
      {tab('reward',tabNames.reward,Gift)}
      {tab('wallet',tabNames.wallet,Wallet)}
      {tab('settings',tabNames.setting,Settings)}
    </nav>}
  </div>;
};
