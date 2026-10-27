import React, { useEffect, useState } from 'react';
import { AuthUser, MemberData, Plan, api } from '../services/api';
import { CustomerSupportView } from './workspace/CustomerSupportView';
import { LanguageCode } from '../types';
import { Home, Store, User, Headphones, LogOut, RefreshCw } from 'lucide-react';

type Page = 'home' | 'store' | 'profile' | 'support';
export const MemberWorkspace: React.FC<{user: AuthUser; language: LanguageCode; onLogout: () => void}> =
({user, language, onLogout}) => {
  const [page, setPage] = useState<Page>('home');
  const [account, setAccount] = useState<MemberData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<Array<{id:number;plan_id:string;status:string}>>([]);
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
  }, []);
  async function act(action: string, body: Record<string, unknown> = {}) {
    setBusy(true); setNotice('');
    try {
      await api(action,body);
      setNotice(action==='orders.create' ? 'Pedido registrado. O VIP só será ativado após confirmação manual do pagamento pelo administrador.' : 'Atualização salva.');
      await reload();
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
          <button disabled={busy || !!(account?.mining.lastBonusAt && Date.now()/1000 < account.mining.lastBonusAt+86400)}
            onClick={()=>void act('rewards.claim')}
            className="w-full p-3 bg-indigo-600 rounded-xl disabled:opacity-40">
            Resgatar bônus diário
          </button>
          {account?.mining.sessionEndsAt && <p className="text-xs text-slate-400">Fim da sessão: {new Date(account.mining.sessionEndsAt*1000).toLocaleString('pt-BR')}</p>}
          {account?.mining.cooldownUntil && <p className="text-xs text-slate-400">Nova sessão a partir de: {new Date(account.mining.cooldownUntil*1000).toLocaleString('pt-BR')}</p>}
        </>}
        {page==='store' && <>
          <h2 className="font-bold text-lg">Planos de mineração</h2>
          {plans.map(p=><article key={p.id} className="rounded-2xl bg-[#1b2137] p-4 space-y-2 border border-[#2b3350]">
            <div className="flex justify-between"><strong>{p.name}</strong><strong>US$ {p.priceUsd}</strong></div>
            <p className="text-sm">US$ {p.dailyUsd}/dia · bônus: US$ {p.bonusUsd}/dia e {p.bonusSatoshis} satoshis/dia</p>
            <p className="text-xs text-slate-400">{p.hashrate} · {p.durationDays ? p.durationDays+' dias' : 'gratuito'}</p>
            {p.id!=='FREE' && <button disabled={busy} onClick={()=>void act('orders.create',{planId:p.id})}
              className="w-full bg-indigo-600 rounded-xl p-3 text-sm disabled:opacity-50">Solicitar contratação (aguardar aprovação)</button>}
          </article>)}
          <h3 className="font-bold mt-5">Solicitações</h3>
          {orders.length===0 ? <p className="text-xs text-slate-400">Nenhuma solicitação registrada.</p> :
            orders.map(o=><p className="text-sm" key={o.id}>#{o.id} · {o.plan_id} · {o.status}</p>)}
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
    <nav className="flex justify-around items-center p-3 h-16 border-t border-[#2b3350] bg-[#101322]">
      {tab('home','Início',Home)}{tab('store','Planos',Store)}
      {tab('profile','Perfil',User)}{tab('support','Suporte',Headphones)}
    </nav>
  </div>;
};
