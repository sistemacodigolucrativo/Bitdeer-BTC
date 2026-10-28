import React, { useEffect, useState } from 'react';
import { AuthUser, MemberData, Plan, api } from '../services/api';
import { CustomerSupportView } from './workspace/CustomerSupportView';
import { LanguageCode } from '../types';
import { Home, Store, User, Headphones, LogOut, RefreshCw, History, Wallet, Gift, Settings } from 'lucide-react';
import { translations } from '../i18n/translations';

type Page = 'home' | 'store' | 'reward' | 'wallet' | 'settings' | 'profile' | 'support' | 'history';
export const MemberWorkspace: React.FC<{user: AuthUser; language: LanguageCode; onLogout: () => void}> =
({user, language, onLogout}) => {
  const [page, setPage] = useState<Page>('home');
  const tabNames = translations[language].tabs;
  const [account, setAccount] = useState<MemberData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<Array<{id:number;plan_id:string;status:string}>>([]);
  const [ledger, setLedger] = useState<{
    accruals: Array<{plan_id:string;start_ts:number;end_ts:number;earned_units:number}>;
    bonuses: Array<{plan_id:string;claimed_at:number;bonus_usd_units:number;bonus_satoshis:number}>;
  }>({accruals:[],bonuses:[]});
  const [profile, setProfile] = useState({displayName:'',email:'',phone:'',walletAddress:''});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
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
  async function act(action: string, body: Record<string, unknown> = {}) {
    setBusy(true); setNotice('');
    try {
      await api(action,body);
      setNotice(action==='orders.create' ? 'Pedido registrado. O VIP só será ativado após confirmação manual do pagamento pelo administrador.' : 'Atualização salva.');
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
        {page==='home' && <>
          <div className="rounded-2xl bg-[#1b2137] p-5 border border-[#2b3350] space-y-2">
            <p className="text-slate-400 text-sm">Saldo interno de recompensas</p>
            <p className="text-3xl font-bold">US$ {account?.mining.balanceUsd || '0.00000000'}</p>
            <p className="text-xs text-slate-400">Plano: {account?.plan.id || 'FREE'} · US$ {account?.plan.dailyUsd || '1.00'}/dia</p>
            <p className="text-xs text-slate-400">Satoshis de bônus internos: {account?.mining.bonusSatoshisBalance || 0}</p>
            <p className="text-xs text-slate-400">Bônus diário disponível: US$ {account?.plan.bonusUsd || '0.00'} + {account?.plan.bonusSatoshis || 0} satoshis</p>
            {account?.plan.expiresAt && <p className="text-xs">VIP até: {new Date(account.plan.expiresAt*1000).toLocaleString('pt-BR')}</p>}
          </div>
          <p className="text-xs text-slate-400">Os valores são registros do sistema calculados pelo servidor; não constituem prova de Bitcoin minerado ou de saldo de carteira externa.</p>
          <div className="flex gap-2">
            <button disabled={busy || account?.mining.running} onClick={()=>void act('mining.start')} className="flex-1 rounded-xl bg-emerald-600 p-3 disabled:opacity-40">Iniciar</button>
            <button disabled={busy || !account?.mining.running} onClick={()=>void act('mining.stop')} className="flex-1 rounded-xl bg-rose-600 p-3 disabled:opacity-40">Parar</button>
            <button disabled={busy} onClick={()=>void reload()} className="p-3 rounded-xl border border-slate-600"><RefreshCw size={18}/></button>
          </div>
          {account?.mining.sessionEndsAt && <p className="text-xs text-slate-400">Fim da sessão: {new Date(account.mining.sessionEndsAt*1000).toLocaleString('pt-BR')}</p>}
          {account?.mining.cooldownUntil && <p className="text-xs text-slate-400">Nova sessão a partir de: {new Date(account.mining.cooldownUntil*1000).toLocaleString('pt-BR')}</p>}
        </>}
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
          <h3 className="font-bold mt-5">Solicitações</h3>
          {orders.length===0 ? <p className="text-xs text-slate-400">Nenhuma solicitação registrada.</p> :
            orders.map(o=><p className="text-sm" key={o.id}>#{o.id} · {o.plan_id} · {o.status}</p>)}
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
