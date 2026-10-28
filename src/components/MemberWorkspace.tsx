import React, { useEffect, useState } from 'react';
import { AuthUser, MemberData, Plan, api } from '../services/api';
import { CustomerSupportView } from './workspace/CustomerSupportView';
import { LanguageCode } from '../types';
import { Home, Store, User, Headphones, LogOut, RefreshCw, History, Wallet, Gift, Settings } from 'lucide-react';
import { translations } from '../i18n/translations';
import QRCode from 'qrcode';
import { ServerHomeView } from './ServerHomeView';

type Page = 'home' | 'store' | 'reward' | 'wallet' | 'settings' | 'profile' | 'support' | 'history';
type PurchaseOrder = {
  orderId: number; status: string; priceUsd: string; quoteRateUsd: string;
  quoteSource: string; btcAddress: string; btcSatoshis: number;
  btcAmount: string; expiresAt: number;
};
type OrderRow = {id:number;plan_id:string;status:string;btc_address?:string;btc_sats?:number;expires_at?:number};
export const MemberWorkspace: React.FC<{user: AuthUser; language: LanguageCode; onLogout: () => void}> =
({user, language, onLogout}) => {
  const [page, setPage] = useState<Page>('home');
  const tabNames = translations[language].tabs;
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
    try {await navigator.clipboard.writeText(value);setNotice('Copiado com sucesso.');}
    catch {setNotice('Não foi possível copiar. Selecione e copie o texto.');}
  }
  async function reload() {
    try {
      const data = await api<MemberData>('profile');
      setAccount(data); setProfile(data.profile);
    } catch(e) { setNotice((e as Error).message); }
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
      const result = await api<PurchaseOrder | {ok:boolean}>(action,body);
      if (action==='orders.create') setCheckout(result as PurchaseOrder);
      setNotice(action==='orders.create'
        ? 'Pedido registrado com cotação temporária. A ativação VIP depende de conferência manual do pagamento pelo administrador.'
        : 'Atualização salva.');
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
      <div><strong>Bitdeer BTC</strong><p className="text-xs text-slate-400">{user.login} · {account?.plan.id || '...'}</p></div>
      <button onClick={onLogout} title="Sair" aria-label="Sair"><LogOut size={20}/></button>
    </div>
    {page==='support' ? <CustomerSupportView language={language} onBack={()=>setPage('home')}/> :
      <div className="flex-1 overflow-auto p-5 space-y-4">
        {notice && <p role="status" className="p-3 rounded-lg bg-[#20243c] text-sm text-amber-300">{notice}</p>}
        {page==='home' && <ServerHomeView account={account} language={language} busy={busy}
          onStart={()=>void act('mining.start')} onStop={()=>void act('mining.stop')}
          onRefresh={()=>void reload()} onRewards={()=>setPage('reward')}
          onHistory={()=>setPage('history')}/>}
        {page==='reward' && <section className="space-y-4">
          <h2 className="text-lg font-bold">Recompensas</h2>
          <div className="bg-[#1b2137] rounded-2xl p-5 border border-[#2b3350] space-y-2">
            <p className="text-xs text-slate-400">Bônus disponível a cada 24 horas</p>
            <p className="text-2xl font-bold">US$ {account?.plan.bonusUsd ?? '0.00'}</p>
            <p className="text-sm">+ {account?.plan.bonusSatoshis ?? 0} satoshis internos</p>
            <p className="text-xs text-slate-400">Plano atual: {account?.plan.id || 'FREE'}</p>
            {account?.mining.lastBonusAt &&
              <p className="text-xs text-slate-400">Último resgate: {new Date(account.mining.lastBonusAt * 1000).toLocaleString('pt-BR')}</p>}
            <button disabled={busy || !!(account?.mining.lastBonusAt && Date.now()/1000 < account.mining.lastBonusAt+86400)}
              onClick={()=>void act('rewards.claim')}
              className="w-full p-3 mt-2 bg-indigo-600 rounded-xl disabled:opacity-40">
              Resgatar bônus diário
            </button>
          </div>
          <p className="text-xs text-slate-400">Os bônus são registros internos do sistema, não depósitos automáticos em uma carteira Bitcoin.</p>
          <button className="text-sm underline text-indigo-300" onClick={()=>setPage('history')}>Ver histórico de recompensas</button>
        </section>}
        {page==='wallet' && <section className="space-y-4">
          <h2 className="text-lg font-bold">Carteira</h2>
          <div className="p-5 bg-[#1b2137] rounded-2xl border border-[#2b3350] space-y-2">
            <p className="text-xs text-slate-400">Saldo de recompensas (interno)</p>
            <p className="text-3xl font-bold">US$ {account?.mining.balanceUsd || '0.00000000'}</p>
            <p className="text-xs text-slate-400">Bônus internos em satoshis: {account?.mining.bonusSatoshisBalance || 0}</p>
          </div>
          <p className="text-xs text-amber-300">Os valores acima não representam saldo real de BTC nem confirmam pagamentos de mineração.</p>
          <div className="p-4 bg-[#1b2137] rounded-2xl border border-[#2b3350]">
            <p className="text-xs text-slate-400">Endereço BTC informado no perfil</p>
            <p className="text-xs break-all mt-2">{account?.profile.walletAddress || 'Nenhuma carteira cadastrada'}</p>
          </div>
          <button className="text-sm underline text-indigo-300" onClick={()=>setPage('profile')}>Editar dados de carteira</button>
          <button className="block text-sm underline text-indigo-300" onClick={()=>setPage('history')}>Ver histórico</button>
        </section>}
        {page==='settings' && <section className="space-y-3">
          <h2 className="text-lg font-bold">Configurações</h2>
          <p className="text-xs text-slate-400">Conta: {user.login} · Usuário ID #{user.id}</p>
          {([
            ['profile','Meu perfil',User],
            ['history','Histórico',History],
            ['support','Atendimento / Suporte',Headphones],
          ] as const).map(([target,label,Icon]) =>
            <button key={target} onClick={()=>setPage(target)}
              className="w-full flex gap-3 items-center rounded-xl bg-[#1b2137] border border-[#2b3350] p-4 text-sm">
              <Icon size={18}/>{label}</button>)}
          <button className="w-full flex gap-3 items-center rounded-xl bg-[#1b2137] border border-[#2b3350] p-4 text-sm"
            onClick={onLogout}><LogOut size={18}/> Encerrar sessão</button>
        </section>}
        {page==='store' && <>
          <h2 className="font-bold text-lg">Planos de mineração</h2>
          {plans.map(p=><article key={p.id} className="rounded-2xl bg-[#1b2137] p-4 space-y-2 border border-[#2b3350]">
            <div className="flex justify-between"><strong>{p.name}</strong><strong>US$ {p.priceUsd}</strong></div>
            <p className="text-sm">US$ {p.dailyUsd}/dia · bônus: US$ {p.bonusUsd}/dia e {p.bonusSatoshis} satoshis/dia</p>
            <p className="text-xs text-slate-400">{p.hashrate} · {p.durationDays ? p.durationDays+' dias' : 'gratuito'} · {p.sessionSeconds===0 ? 'contínuo' : 'sessões de '+(p.sessionSeconds/3600)+'h'}</p>
            {p.id!=='FREE' && <button disabled={busy} onClick={()=>void act('orders.create',{planId:p.id})}
              className="w-full bg-indigo-600 rounded-xl p-3 text-sm disabled:opacity-50">Solicitar contratação (aguardar aprovação)</button>}
          </article>)}
          {checkout && <section className="bg-[#1b2137] border border-indigo-600/50 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold">Pedido #{checkout.orderId} — Aguardando pagamento</h3>
            <p className="text-sm">Preço: US$ {checkout.priceUsd}</p>
            <p className="text-sm">Valor exato: <strong>{checkout.btcAmount} BTC</strong> ({checkout.btcSatoshis} satoshis)</p>
            <p className="text-xs text-slate-400">Cotação: US$ {checkout.quoteRateUsd} por BTC · {checkout.quoteSource}</p>
            <p className="text-xs text-amber-300">Cotação válida até {new Date(checkout.expiresAt*1000).toLocaleString('pt-BR')}. Não envie pagamentos após o vencimento: solicite um novo pedido.</p>
            {checkoutQr && <img src={checkoutQr} alt="QR do endereço e valor BTC deste pedido" className="mx-auto rounded-lg w-40 h-40"/>}
            <p className="text-xs break-all font-mono">{checkout.btcAddress}</p>
            <div className="flex gap-2">
              <button className="flex-1 bg-indigo-600 rounded-xl p-2 text-xs" onClick={()=>void copy(checkout.btcAddress)}>Copiar endereço</button>
              <button className="flex-1 bg-indigo-600 rounded-xl p-2 text-xs" onClick={()=>void copy(checkout.btcAmount)}>Copiar BTC</button>
            </div>
            <p className="text-xs text-slate-400">A transferência BTC não é confirmada automaticamente. O administrador deverá verificar o TXID antes de ativar o plano.</p>
            <button className="text-indigo-300 text-xs underline" onClick={()=>setCheckout(null)}>Fechar instruções</button>
          </section>}
                    <h3 className="font-bold mt-5">Solicitações</h3>
          {orders.length===0 ? <p className="text-xs text-slate-400">Nenhuma solicitação registrada.</p> :
            orders.map(o=><p className="text-sm" key={o.id}>#{o.id} · {o.plan_id} · {o.status}{o.btc_sats? ' · '+(o.btc_sats/100000000).toFixed(8)+' BTC':''}</p>)}
        </>}
        {page==='history' && <>
          <h2 className="font-bold text-lg">Histórico de recompensas</h2>
          <button className="text-xs border border-slate-600 rounded-lg p-2" onClick={()=>
            void api<typeof ledger>('ledger').then(setLedger).catch(e=>setNotice((e as Error).message))
          }>Atualizar histórico</button>
          <h3 className="text-sm font-semibold">Mineração por tempo decorrido</h3>
          {ledger.accruals.length===0 && <p className="text-xs text-slate-400">Nenhum intervalo registrado.</p>}
          {ledger.accruals.map((r,i)=><div key={i} className="p-3 bg-[#1b2137] rounded-xl text-xs">
            {r.plan_id} · {new Date(r.start_ts*1000).toLocaleString('pt-BR')} — {new Date(r.end_ts*1000).toLocaleString('pt-BR')}
            <p>Unidades creditadas: {r.earned_units}</p>
          </div>)}
          <h3 className="text-sm font-semibold">Bônus diários</h3>
          {ledger.bonuses.length===0 && <p className="text-xs text-slate-400">Nenhum bônus resgatado.</p>}
          {ledger.bonuses.map((r,i)=><div key={i} className="p-3 bg-[#1b2137] rounded-xl text-xs">
            {r.plan_id} · {new Date(r.claimed_at*1000).toLocaleString('pt-BR')}
            <p>{r.bonus_satoshis} satoshis internos · {r.bonus_usd_units} unidades USD</p>
          </div>)}
        </>}
        {page==='profile' && <form onSubmit={e=>{e.preventDefault();void act('profile.update',profile)}} className="space-y-3">
          <h2 className="text-lg font-bold">Meu perfil</h2>
          {(['displayName','email','phone','walletAddress'] as const).map(k=><label key={k} className="block text-sm text-slate-300">
            {({displayName:'Nome',email:'E-mail (opcional)',phone:'Telefone',walletAddress:'Carteira BTC'} as const)[k]}
            <input value={profile[k]} onChange={e=>setProfile(p=>({...p,[k]:e.target.value}))}
              className="mt-1 w-full bg-[#1b2137] border border-[#2b3350] p-3 rounded-xl text-white"/>
          </label>)}
          <button disabled={busy} className="w-full bg-indigo-600 rounded-xl p-3">Atualizar</button>
        </form>}
      </div>}
    <nav className="w-full h-16 bg-[#101322] border-t border-[#1f253d] flex items-center justify-around px-2 z-30 select-none">
      {tab('home',tabNames.home,Home)}
      {tab('store',tabNames.store,Store)}
      {tab('reward',tabNames.reward,Gift)}
      {tab('wallet',tabNames.wallet,Wallet)}
      {tab('settings',tabNames.setting,Settings)}
    </nav>
  </div>;
};
