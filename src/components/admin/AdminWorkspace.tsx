import React, { useEffect, useState } from 'react';
import { AuthUser, Plan, api } from '../../services/api';
import { AdminMemberRecords } from './AdminMemberRecords';
import { copyToClipboard } from '../../utils/clipboard';
import { LanguageCode } from '../../types';
import { adminText, adminDateLocale, adminStatus } from '../../i18n/adminTexts';
import {
  MOCKUP_LOCK,
  MOCKUP_PREVIEW_MAX_DAYS,
  MOCKUP_PREVIEW_MIN_DAYS,
  useLegitPreviewCountdown,
  useProjectCopy,
} from '../../i18n/copyMode';
import { LogOut, RefreshCw, Users, CreditCard, Settings, LayoutDashboard, Headphones, Menu, ChevronDown, ChevronUp, X } from 'lucide-react';
import { AdminNotificationsBell } from './AdminNotificationsBell';
import type { AdminOrderNotification } from './AdminNotificationsBell';
import { SlimToast } from '../SlimToast';
import { useSlimToast } from '../../hooks/useSlimToast';

type Member = {id: number; login: string; display_name: string; email: string; status: string; balance_units: number; plan_id: string; phone?: string; wallet_address?: string};
type MemberDetails = {member: Member & {phone: string;wallet_address:string}; contracts:Array<{id:number;plan_id:string;started_at:number;expires_at:number}>;orders:Array<{id:number;plan_id:string;status:string;payment_ref:string|null}>;balanceUsd:string;bonusSatoshis:number};
type Order = {id:number; user_id:number; login:string; plan_id:string; status:string; created_at:number;
  expires_at:number;expired_at:number|null;btc_sats:number;quote_usd_cents:number;quote_source:string;
  payment_ref?:string|null;proof_url:string|null;proof_submitted_at:number|null};
type Withdraw = {id:number;user_id:number;login:string;plan_id:string;btc_address:string;usd_cents:number;btc_satoshis:number;status:'pending'|'awaiting_vip'|'approved'|'rejected';created_at:number;reference:string};
type Ticket = {id:number;user_id:number;login:string;subject:string;message:string;
  status:'open'|'resolved';ticket_state:'open'|'replied'|'closed';admin_reply:string|null;
  notification_status:'pending'|'accepted'|'failed';created_at:number;
  replies:Array<{id:number;author:'admin'|'member';message:string;created_at:number}>};
export const AdminWorkspace: React.FC<{user:AuthUser;language:LanguageCode;onChangeLanguage:(language:LanguageCode)=>void;onLogout:()=>void}> = ({user,language,onChangeLanguage,onLogout}) => {
  const tx=(portuguese:string)=>adminText(language,portuguese);
  const {copy,mockupMode,setMockupMode,legitPreviewActive,startLegitPreview}=useProjectCopy(language);
  const previewRemainingMs=useLegitPreviewCountdown();
  const dateLocale=adminDateLocale(language);
  const [section,setSection]=useState<'overview'|'members'|'plans'|'orders'|'settings'|'audit'|'tickets'|'withdrawals'>('overview');
  const [menuOpen,setMenuOpen]=useState(false);
  const [overview,setOverview]=useState({members:0,active:0,suspended:0,archived:0,activeVip:0,pendingOrders:0,approvedOrders:0});
  const [audit,setAudit]=useState<Array<{id:number;admin_id:number;action:string;target_user_id:number|null;created_at:number}>>([]);
  const [members,setMembers]=useState<Member[]>([]);
  const [plans,setPlans]=useState<Plan[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [notifications,setNotifications]=useState<AdminOrderNotification[]>([]);
  const [unreadNotifications,setUnreadNotifications]=useState(0);
  const [focusedOrderId,setFocusedOrderId]=useState<number|null>(null);
  const [tickets,setTickets]=useState<Ticket[]>([]);
  const [replyTicket,setReplyTicket]=useState<number|null>(null);
  const [replyMessage,setReplyMessage]=useState('');
  const [withdrawals,setWithdrawals]=useState<Withdraw[]>([]);
  const [filter,setFilter]=useState('');
  const [statusFilter,setStatusFilter]=useState('');
  const [offset,setOffset]=useState(0);
  const [total,setTotal]=useState(0);
  const [details,setDetails]=useState<MemberDetails|null>(null);
  const [email,setEmail]=useState('');
  const [kycDuration,setKycDuration]=useState('1.30');
  const [demoInvestorToastsEnabled,setDemoInvestorToastsEnabled]=useState(false);
  const [demoInvestorToastsReady,setDemoInvestorToastsReady]=useState(false);
  const [previewDays,setPreviewDays]=useState('1');
  const [btcAddress,setBtcAddress]=useState('');
  const [btcConfirmed,setBtcConfirmed]=useState(false);
  const [paymentPassword,setPaymentPassword]=useState('');
  const [ownerConfirmation,setOwnerConfirmation]=useState(false);
  const [diagnostics,setDiagnostics]=useState<{phpVersion:string;pdoSqlite:boolean;dbWritable:boolean;https:boolean;mailConfigured:boolean;btcAddressConfirmed:boolean;quoteProviders:string}|null>(null);
  const [selected,setSelected]=useState<Plan|null>(null);
  const [notice,setNotice]=useState('');
  const toast=useSlimToast();
  const [editingMember,setEditingMember]=useState<Member|null>(null);
  const [verificationMethod,setVerificationMethod]=useState('approved');
  const [verificationReference,setVerificationReference]=useState('');
  const [newMemberPassword,setNewMemberPassword]=useState('');
  const [verificationId,setVerificationId]=useState<number|null>(null);
  const [busy,setBusy]=useState(false);
  const [demoMarceloExists,setDemoMarceloExists]=useState(false);
  const [demoMarceloAccess,setDemoMarceloAccess]=useState<{login:string;password:string;referralCode:string}|null>(null);
  const [randomUserAccess,setRandomUserAccess]=useState<{login:string;password:string;referralCode:string;email:string;displayName:string}|null>(null);
  async function refreshNotifications() {
    try {
      const result=await api<{notifications:AdminOrderNotification[];unreadCount:number}>('admin.notifications');
      setNotifications(result.notifications);
      setUnreadNotifications(result.unreadCount);
    } catch {}
  }
  async function refresh() {
    try {
      const [m,p,o,s]=await Promise.all([
        api<{members:Member[];total:number}>('admin.members',undefined,{q:filter,status:statusFilter,offset}),
        api<{plans:Plan[]}>('admin.plans'),
        api<{orders:Order[]}>('admin.orders'),
        api<{email:string}>('support'),
      ]);
      setMembers(m.members);setTotal(m.total);setPlans(p.plans);setOrders(o.orders);setEmail(s.email);
      void api<{durationMinutes:number}>('kyc.settings').then(x=>{
        const hours=Math.floor(x.durationMinutes/60),minutes=x.durationMinutes%60;
        setKycDuration(minutes?`${hours}.${String(minutes).padStart(2,'0')}`:String(hours));
      }).catch(()=>{});
      void refreshNotifications();
      void api<{enabled:boolean}>('admin.demo.new-investors.settings')
        .then(x=>{setDemoInvestorToastsEnabled(x.enabled);setDemoInvestorToastsReady(true);})
        .catch(()=>setDemoInvestorToastsReady(false));
      void api<{exists:boolean}>('admin.demo.marcelo.status')
        .then(x=>setDemoMarceloExists(x.exists)).catch(()=>{});
      api<{actions:typeof audit}>('admin.audit').then(x=>setAudit(x.actions)).catch(()=>{});
      api<typeof overview>('admin.overview').then(setOverview).catch(()=>{});
      api<{tickets:Ticket[]}>('admin.support.tickets').then(x=>setTickets(x.tickets)).catch(()=>{});
      api<typeof diagnostics>('admin.diagnostics').then(setDiagnostics).catch(()=>{});
      api<{requests:Withdraw[]}>('admin.withdrawals').then(x=>setWithdrawals(x.requests)).catch(()=>{});
      api<{btcAddress:string;confirmed:boolean}>('admin.payment.settings')
        .then(x=>{setBtcAddress(x.btcAddress);setBtcConfirmed(x.confirmed);})
        .catch(()=>{});
    } catch(e) {setNotice((e as Error).message);}
  }
  useEffect(()=>{void refresh()},[offset]);
  useEffect(()=>{
    const refreshVisible=()=>{if(document.visibilityState==='visible')void refreshNotifications();};
    const timer=window.setInterval(refreshVisible,15000);
    document.addEventListener('visibilitychange',refreshVisible);
    return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refreshVisible);};
  },[]);
  useEffect(()=>{
    if(section!=='orders'||focusedOrderId===null)return;
    const card=document.getElementById(`admin-order-${focusedOrderId}`);
    if(!card)return;
    card.scrollIntoView({behavior:'smooth',block:'center'});
    card.focus({preventScroll:true});
    const timer=window.setTimeout(()=>setFocusedOrderId(null),4000);
    return ()=>window.clearTimeout(timer);
  },[section,focusedOrderId,orders]);
  async function openOrderFromNotification(orderId:number) {
    setSection('orders');
    setMenuOpen(false);
    setNotice('');
    setFocusedOrderId(orderId);
    try {
      const result=await api<{orders:Order[]}>('admin.orders');
      setOrders(result.orders);
    } catch(e) {
      setNotice((e as Error).message);
    }
  }
  async function change(action:string, body:Record<string,unknown>) {
    setBusy(true);setNotice('');
    try {await api(action,body);toast.show(tx("Alteração registrada."));await refresh();}
    catch(e){setNotice((e as Error).message);}
    finally{setBusy(false);}
  }
  function closeMemberEditor(){
    setEditingMember(null);setDetails(null);setVerificationId(null);
    setNewMemberPassword('');setVerificationReference('');setNotice('');
  }
  async function createMarceloDemo(){
    if(!window.confirm(copy('adminMarceloPrompt')))return;
    setBusy(true);setNotice('');
    try{
      const created=await api<{login:string;initialPassword:string;referralCode:string}>(
        'admin.demo.marcelo.seed',{confirmDemo:true});
      setDemoMarceloAccess({login:created.login,password:created.initialPassword,
        referralCode:created.referralCode});
      setDemoMarceloExists(true);
      setNotice(copy('adminMarceloCreated'));
      await refresh();
    }catch(e){setNotice((e as Error).message)}
    finally{setBusy(false)}
  }
  async function createRandomUser(){
    if(!window.confirm(copy('adminRandomPrompt')))return;
    setBusy(true);setNotice('');
    try{
      const created=await api<{login:string;initialPassword:string;referralCode:string;email:string;displayName:string}>(
        'admin.demo.random-member.seed',{confirmRandomUser:true});
      setRandomUserAccess({login:created.login,password:created.initialPassword,
        referralCode:created.referralCode,email:created.email,displayName:created.displayName});
      setNotice(copy('adminRandomCreated'));
      await refresh();
    }catch(e){setNotice((e as Error).message)}
    finally{setBusy(false)}
  }
  const renderPlanEditor=()=>selected&&<form className="space-y-3"
    onSubmit={e=>{
      e.preventDefault();
      void change('admin.plan.save',{
        id:selected.id,name:selected.name,
        priceCents:Math.round(Number(selected.priceUsd)*100),
        dailyCents:Math.round(Number(selected.dailyUsd)*100),
        bonusUsdCents:Math.round(Number(selected.bonusUsd)*100),
        bonusSatoshis:selected.bonusSatoshis,durationDays:selected.durationDays,
        sessionSeconds:selected.sessionSeconds,restartCooldownSeconds:0,
        withdrawMinCents:Math.round(Number(selected.withdrawMinUsd)*100),
        withdrawAfterDays:0, // Kept for API compatibility; waiting days are discontinued.
        hashrate:selected.hashrate,serverModel:selected.serverModel,available:selected.available
      });
      setSelected(null);
    }}>
    <h3 className="font-semibold">{selected.revision===0?tx('Cadastrar novo plano'):tx('Editar')+' '+selected.name}</h3>
    {selected.revision===0 && <label className="block text-sm">{tx("Identificador do plano")}
      <input required value={selected.id} onChange={e=>setSelected(p=>p?{...p,id:e.target.value.toUpperCase()}:p)}
        className="w-full mt-1 bg-[#11182c] p-3 rounded-lg"/>
    </label>}
    {([
      ['name','Nome do plano'],['priceUsd','Preço (USD)'],
    ['dailyUsd',copy('adminDailyUsdLabel')],['bonusUsd','Bônus diário (USD)'],
    ['bonusSatoshis',copy('adminDailySatoshisLabel')],
      ['durationDays','Duração do plano (dias)'],
      ['sessionSeconds','Duração da sessão (segundos)'],
      ['withdrawMinUsd','Valor mínimo de saque (USD)'],
      ['hashrate',copy('adminIllustrativeCapacityLabel')],['serverModel',copy('adminIllustrativeEquipmentLabel')]
    ] as const).map(([key,label])=><label key={key} className="block text-sm">
      {tx(label)}<input required value={selected[key]} type={
        ['bonusSatoshis','durationDays','sessionSeconds','restartCooldownSeconds','withdrawAfterDays'].includes(key)?'number':
        ['priceUsd','dailyUsd','bonusUsd','withdrawMinUsd'].includes(key)?'number':'text'}
        min={['priceUsd','dailyUsd','bonusUsd','withdrawMinUsd','bonusSatoshis','durationDays','sessionSeconds','restartCooldownSeconds','withdrawAfterDays'].includes(key)?0:undefined}
        step={['priceUsd','dailyUsd','bonusUsd','withdrawMinUsd'].includes(key)?'0.01':'1'}
        onChange={e=>setSelected(p=>p?{...p,[key]:
          typeof p[key]==='number'?Number(e.target.value):e.target.value}:p)}
        className="w-full block mt-1 bg-[#11182c] p-3 rounded-lg"/>
    </label>)}
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={selected.available}
        onChange={e=>setSelected(p=>p?{...p,available:e.target.checked}:p)}/>
      {tx("Disponível para novas adesões")}
    </label>
    <button className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold" disabled={busy}>{tx("Salvar alterações")}</button>
  </form>;
  const btn='rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-3 py-2 text-xs font-bold';
  const previewCountdown=(()=>{
    const totalSeconds=Math.ceil(previewRemainingMs/1000);
    const days=Math.floor(totalSeconds/86400);
    const secondsInDay=totalSeconds%86400;
    const hours=Math.floor(secondsInDay/3600);
    const minutes=Math.floor((secondsInDay%3600)/60);
    const remainingSeconds=secondsInDay%60;
    const clock=[hours,minutes,remainingSeconds].map(value=>String(value).padStart(2,'0')).join(':');
    if(days===0)return clock;
    const dayUnit=copy(days===1?'adminPreviewDaySingular':'adminPreviewDayPlural');
    return `${days} ${dayUnit} ${clock}`;
  })();
  return <div className="relative h-full w-full bg-[#121526] text-white flex flex-col overflow-hidden">
    {toast.message&&<SlimToast message={toast.message} language={language} onDismiss={toast.dismiss}/>}
    <header className={editingMember?'hidden':'relative px-3 sm:px-4 py-3 bg-[#171b2d] border-b border-[#2b3350] flex justify-between items-center gap-2 z-40'}>
      <strong className="min-w-0 flex-1 truncate">Bitdeer BTC <span className="hidden sm:inline text-xs text-slate-400">· {tx('Administração')}</span></strong>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="hidden sm:block text-right">
          <label className="flex items-center justify-end gap-2 text-xs font-semibold">
            <span>{copy('adminModeLabel')}</span>
            <input type="checkbox" role="switch" aria-checked={mockupMode} checked={mockupMode}
              disabled={MOCKUP_LOCK} onChange={e=>setMockupMode(e.target.checked)}
              data-testid="admin-mockup-mode-toggle" className="h-4 w-4 accent-amber-400"/>
          </label>
          {legitPreviewActive
            ? <p className="text-[10px] text-amber-300">{previewCountdown}</p>
            : <p className="text-[10px] text-slate-400">{copy('adminModeLockedNote')}</p>}
        </div>
        <div className="sm:hidden">
          <label className="flex items-center gap-1.5 text-[10px] font-semibold">
            <span>{copy('adminModeLabel')}</span>
            <input type="checkbox" role="switch" aria-checked={mockupMode} checked={mockupMode}
              disabled={MOCKUP_LOCK} onChange={e=>setMockupMode(e.target.checked)}
              data-testid="admin-mockup-mode-toggle-mobile" className="h-4 w-4 accent-amber-400"/>
          </label>
        </div>
        <AdminNotificationsBell language={language} unreadCount={unreadNotifications}
          notifications={notifications}
          onOpenOrders={()=>{setSection('orders');setMenuOpen(false);}}
          onOpenOrder={orderId=>void openOrderFromNotification(orderId)}
          onMarkRead={id=>{void api('admin.notifications.read',{notificationId:id})
            .then(refreshNotifications).catch(e=>setNotice((e as Error).message));}}
          onMarkAllRead={()=>{void api('admin.notifications.read-all',{})
            .then(refreshNotifications).catch(e=>setNotice((e as Error).message));}}/>
        <label className="sr-only" htmlFor="admin-language">{language==='en'?'Language':language==='es'?'Idioma':'Idioma'}</label>
        <select id="admin-language" data-testid="admin-language-selector" aria-label={language==='en'?'Language':language==='es'?'Idioma':'Idioma'}
          value={language} onChange={e=>onChangeLanguage(e.target.value as LanguageCode)}
          className="rounded-lg bg-[#262d49] px-2 py-2 text-xs text-white">
          <option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option>
        </select>
      <button type="button" aria-label={tx("Abrir menu administrativo")} aria-expanded={menuOpen}
        onClick={()=>setMenuOpen(x=>!x)} className="flex gap-2 items-center bg-[#262d49] rounded-lg px-3 py-2 text-sm">
        <Menu size={20}/>{tx(menuOpen?'Fechar':'Menu')}<ChevronDown size={14}/>
      </button></div>
      {menuOpen&&<nav aria-label={tx("Navegação administrativa")}
        className="absolute top-full right-3 left-3 md:left-auto md:w-64 border border-[#2b3350] rounded-xl bg-[#1b2137] p-2 shadow-xl flex flex-col gap-1">
        {([['overview','Visão geral',LayoutDashboard],['members','Membros',Users],['plans','Planos VIP',CreditCard],
          ['orders','Pedidos',CreditCard],['withdrawals','Solicitações de saque',CreditCard],['settings','Configurações',Settings],['audit','Auditoria',Users],
          ['tickets','Suporte',Headphones]] as const).map(([key,label,Icon])=><button key={key}
            type="button" onClick={()=>{setSection(key);setMenuOpen(false);}}
            className={'flex items-center gap-3 rounded-lg p-3 text-sm text-left '+(section===key?'bg-indigo-600':'hover:bg-slate-700')}>
            <Icon size={17}/>{tx(label)}</button>)}
        <button type="button" onClick={onLogout} className="flex gap-3 items-center p-3 text-sm"><LogOut size={17}/>{tx("Sair")}</button>
      </nav>}
    </header>
    <main className={editingMember?'hidden':'flex-1 overflow-auto p-4 md:p-7 space-y-4'}>
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">
        {tx(section==='overview'?'Visão geral':section==='members'?'Gerenciamento de membros':section==='plans'?'Catálogo VIP':section==='orders'?'Pedidos pendentes':section==='withdrawals'?'Solicitações de saque':section==='audit'?'Auditoria administrativa':section==='tickets'?'Tickets de suporte':'Configurações')}
      </h1><button aria-label={tx("Atualizar")} onClick={()=>void refresh()}><RefreshCw size={18}/></button></div>
      {notice && <p role="status" className="bg-[#292a40] p-3 rounded-lg text-amber-300 text-sm">{notice}</p>}
      {section==='overview' && <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {([
          ['Membros cadastrados',overview.members],
          ['Contas ativas',overview.active],
          ['Suspensos',overview.suspended],
          ['Arquivados',overview.archived],
          ['VIPs vigentes',overview.activeVip],
          ['Pedidos pendentes',overview.pendingOrders],
          ['Pedidos aprovados',overview.approvedOrders],
        ] as const).map(([label,value])=>
          <div key={label} className="p-5 bg-[#1b2137] rounded-xl border border-[#2b3350]">
            <p className="text-xs text-slate-400">{tx(label)}</p>
            <strong className="text-2xl">{value}</strong>
          </div>)}
        <p className="col-span-full text-xs text-slate-400">{copy('adminOverviewNotice')}</p>
      </div>}
      {section==='members' && <>
        <section className="rounded-xl border border-[#303a56] bg-[#1b2137] p-3 space-y-2" data-testid="admin-marcelo-demo">
          <p className="text-sm font-semibold">{copy('adminMarceloTitle')}</p>
          <p className="text-xs text-slate-400">{copy('adminMarceloDescription')}</p>
          <button type="button" data-testid="admin-seed-marcelo" disabled={busy||demoMarceloExists}
            className={btn+' disabled:opacity-50'} onClick={()=>void createMarceloDemo()}>
            {demoMarceloExists?copy('adminMarceloAlreadyCreated'):copy('adminMarceloCreate')}
          </button>
          {demoMarceloAccess&&<div role="status" className="rounded-lg border border-amber-400/40 p-3 bg-[#11182c] text-xs space-y-1">
            <p className="text-amber-300 font-semibold">{tx("Credenciais exibidas uma única vez. Guarde-as em local seguro.")}</p>
            <p>{tx("Usuário:")} <code className="select-text">{demoMarceloAccess.login}</code></p>
            <p>{tx("Senha:")} <code className="select-text break-all">{demoMarceloAccess.password}</code></p>
            <p>{tx("Indicação:")} <code className="select-text">{demoMarceloAccess.referralCode}</code></p>
            <button type="button" className="text-indigo-300 underline" onClick={()=>setDemoMarceloAccess(null)}>{tx("Ocultar credenciais")}</button>
          </div>}
        </section>
        <section className="rounded-xl border border-cyan-400/25 bg-gradient-to-br from-[#17283a] to-[#1b2137] p-3 space-y-2" data-testid="admin-random-user">
          <p className="text-sm font-semibold">{copy('adminRandomTitle')}</p>
          <p className="text-xs text-slate-300">{copy('adminRandomDescription')}</p>
          <button type="button" data-testid="admin-seed-random-user" disabled={busy}
            className={btn+' disabled:opacity-50'} onClick={()=>void createRandomUser()}>
            {copy('adminRandomCreate')}
          </button>
          {randomUserAccess&&<div role="status" className="rounded-lg border border-cyan-300/30 p-3 bg-[#11182c] text-xs space-y-1">
            <p className="text-cyan-200 font-semibold">{tx("Usuário criado. Credenciais exibidas somente nesta sessão.")}</p>
            <p>{tx("Nome:")} <code className="select-text">{randomUserAccess.displayName}</code></p>
            <div className="flex flex-wrap items-center gap-2"><span>{tx("Usuário:")} <code className="select-text">{randomUserAccess.login}</code></span>
              <button type="button" className="rounded-md border border-cyan-300/35 px-2 py-1 text-[11px] text-cyan-100" onClick={()=>void copyToClipboard(randomUserAccess.login).then(ok=>setNotice(tx(ok?'Usuário copiado.':'Não foi possível copiar o usuário.')))}>{tx("COPIAR USUÁRIO")}</button></div>
            <div className="flex flex-wrap items-center gap-2"><span>{tx("Senha:")} <code className="select-text break-all">{randomUserAccess.password}</code></span>
              <button type="button" className="rounded-md border border-cyan-300/35 px-2 py-1 text-[11px] text-cyan-100" onClick={()=>void copyToClipboard(randomUserAccess.password).then(ok=>setNotice(tx(ok?'Senha copiada.':'Não foi possível copiar a senha.')))}>{tx("COPIAR SENHA")}</button></div>
            <p>{tx("E-mail:")} <code className="select-text break-all">{randomUserAccess.email}</code></p>
            <p>{tx("Indicação:")} <code className="select-text">{randomUserAccess.referralCode}</code></p>
            <button type="button" className="text-indigo-300 underline" onClick={()=>setRandomUserAccess(null)}>{tx("Ocultar credenciais")}</button>
          </div>}
        </section>
        <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();setOffset(0);void refresh();}}>
          <input placeholder={tx("Buscar por usuário, nome ou e-mail")} value={filter} onChange={e=>setFilter(e.target.value)}
            className="flex-1 min-w-40 bg-[#1b2137] p-3 rounded-xl border border-[#2b3350]"/>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            className="bg-[#1b2137] p-3 rounded-xl">
            <option value="">{tx("Todos os estados")}</option><option value="active">{tx("Ativos")}</option>
            <option value="suspended">{tx("Suspensos")}</option><option value="archived">{tx("Arquivados")}</option>
          </select>
          <button className={btn}>{tx("Pesquisar")}</button>
        </form>
        <p className="text-xs text-slate-400">{total} {language==='en'?'members · up to 50 per page':language==='es'?'miembros · hasta 50 por página':'membro(s) · exibindo até 50 por página'}.</p>
        <div className="space-y-3">{members.map(m=>
          <article key={m.id} className="rounded-xl p-4 bg-[#1b2137] border border-[#2b3350] flex flex-wrap gap-4 items-center justify-between">
            <div><strong>#{m.id} {m.login}</strong><p className="text-xs text-slate-400">{m.display_name} · {adminStatus(language,m.status)} · {m.plan_id}</p></div>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} className={btn} onClick={()=>
                void api<MemberDetails>('admin.member.details',undefined,{id:m.id})
                  .then(d=>{setDetails(d);setEditingMember({...d.member});setVerificationId(null);
                    setNewMemberPassword('');setVerificationReference('');setNotice('');})
                  .catch(e=>setNotice((e as Error).message))}>{tx("Detalhes / Editar")}</button>
              {m.status==='active' && <button disabled={busy} className={btn} onClick={()=>void change('admin.status',{userId:m.id,status:'suspended'})}>{tx("Suspender")}</button>}
              {m.status==='suspended' && <button disabled={busy} className={btn} onClick={()=>void change('admin.status',{userId:m.id,status:'active'})}>{tx("Reativar")}</button>}
              <button disabled={busy} className={btn} onClick={()=>{
                const message=language==='en'?`Permanently delete ${m.login} and their history? Other members will be preserved.`:language==='es'?`¿Eliminar definitivamente a ${m.login} y su historial? Los demás miembros se conservarán.`:`Excluir definitivamente ${m.login} e todo o histórico? Os demais membros serão preservados.`;
                if(window.confirm(message))void change('admin.member.delete',{userId:m.id,confirmed:true});
              }}>{tx("Excluir")}</button>
              {m.status==='archived' && <button disabled={busy} className={btn} onClick={()=>void change('admin.status',{userId:m.id,status:'active'})}>{tx("Restaurar")}</button>}
            </div>
          </article>)}</div>
        <div className="flex gap-3 items-center">
          <button disabled={offset===0} className={btn} onClick={()=>setOffset(Math.max(0,offset-50))}>{tx("Anterior")}</button>
          <span className="text-xs">{Math.floor(offset/50)+1} / {Math.max(1,Math.ceil(total/50))}</span>
          <button disabled={offset+50>=total} className={btn} onClick={()=>setOffset(offset+50)}>{tx("Próxima")}</button>
        </div>
      </>}
      {section==='plans' && <>
        <p className="text-xs text-slate-400">{tx("Cada plano pode ser expandido para edição. Novas regras valem apenas para futuros contratos e renovações.")}</p>
        <button className={btn} onClick={()=>setSelected({
          id:'VIP_CUSTOM',name:'Novo Plano VIP',revision:0,priceUsd:'0.00',dailyUsd:'0.00',
          bonusUsd:'0.00',bonusSatoshis:0,durationDays:30,sessionSeconds:0,restartCooldownSeconds:0,
          withdrawMinUsd:'0.00',withdrawAfterDays:0,hashrate:'',serverModel:'',available:false
        })}>{tx("Criar novo plano")}</button>
        <div className="space-y-3">{plans.map(p=><article key={p.id}
          className="bg-[#1b2137] border border-[#2b3350] rounded-xl overflow-hidden">
          <button type="button" onClick={()=>setSelected(prev=>prev?.id===p.id?null:{...p})}
            aria-expanded={selected?.id===p.id}
            className="w-full text-left p-4 flex justify-between items-center gap-2">
            <div><strong>{p.name}</strong>
              <p className="text-xs text-slate-400 mt-1">USD {p.priceUsd} · USD {p.dailyUsd}/{tx('dia')} · {tx('revisão')} {p.revision} · {tx(p.available?'Disponível':'Arquivado')}</p></div>
            {selected?.id===p.id?<ChevronUp size={19}/>:<ChevronDown size={19}/>}
          </button>
          {selected?.id===p.id && <div className="border-t border-[#2b3350] p-4">
            {renderPlanEditor()}
          </div>}
        </article>)}</div>
        {selected && selected.revision===0 && <div className="bg-[#1b2137] border border-[#2b3350] rounded-xl p-4">
          {renderPlanEditor()}
        </div>}
      </>}
      {section==='withdrawals' && <section className="space-y-3">
        {withdrawals.length===0&&<p className="text-xs text-slate-400">{tx("Nenhum saque registrado.")}</p>}
        {withdrawals.map(w=><article key={w.id} className="bg-[#1b2137] rounded-xl border border-[#2b3350] p-4 space-y-2">
          <strong>{tx("Solicitação")} #{w.id} · {w.login}</strong>
          <p className="text-xs text-slate-300">{tx("Plano:")} {w.plan_id} · {tx('Estado:')} {tx(w.status==='awaiting_vip'?'Aguardando assinatura VIP':w.status==='pending'?'Pendente de conferência':w.status==='approved'?copy('adminApprovedWithdrawal'):'Rejeitada')}</p>
          <p className="text-sm">USD {(w.usd_cents/100).toFixed(2)} · {(w.btc_satoshis/1e8).toFixed(8)} BTC ({copy('adminWithdrawalEquivalent')})</p>
          <p className="text-xs text-slate-400 break-all">{w.btc_address}</p>
          {(w.status==='pending'||w.status==='awaiting_vip')&&<div className="flex flex-wrap gap-2">
            {w.status==='pending'&&<button disabled={busy} className={btn} onClick={()=>{
              const reference=window.prompt(tx("Referência da conferência externa (mínimo 6 caracteres):"));
              if(!reference||reference.trim().length<6)return;
              if(window.confirm(copy('adminReviewPrompt')))
                void change('admin.withdraw.process',{requestId:w.id,status:'approved',reference:reference.trim(),manualReviewConfirmed:true});
            }}>{copy('adminAcceptWithdrawal')}</button>}
            <button disabled={busy} className={btn} onClick={()=>{
              const reference=window.prompt(tx("Motivo da rejeição (mínimo 6 caracteres):"));
              if(reference&&reference.trim().length>=6)
                void change('admin.withdraw.process',{requestId:w.id,status:'rejected',reference:reference.trim()});
            }}>{tx("Rejeitar e devolver saldo")}</button>
          </div>}
        </article>)}
      </section>}
      {section==='orders' && <div className="space-y-3">
        {orders.map(o=><article key={o.id} id={`admin-order-${o.id}`} data-order-id={o.id} tabIndex={-1}
          aria-label={`${tx('Pedido')} #${o.id} · ${o.plan_id}`}
          className={'scroll-mt-4 p-4 rounded-xl bg-[#1b2137] border flex gap-4 flex-wrap justify-between outline-none transition-colors '+
            (focusedOrderId===o.id?'border-indigo-300 ring-2 ring-indigo-300/70':'border-[#2b3350]')}>
          <div><strong>{tx('Pedido')} #{o.id} · {o.plan_id}</strong>
            <p className="text-xs text-slate-400">{o.login} · {adminStatus(language,o.status)} · {(o.btc_sats/100000000).toFixed(8)} BTC</p>
            <p className="text-xs text-slate-400">{tx("Cotação:")} {o.quote_source || tx('indisponível')}</p>
            <p className="text-xs text-slate-500">{tx("Cotação válida até:")} {new Date(o.expires_at*1000).toLocaleString(dateLocale)}</p>
            {o.proof_url && <a href={o.proof_url} target="_blank" rel="noreferrer"
              className="mt-2 inline-flex max-w-full items-center gap-1 text-xs text-indigo-200 underline">
              <span>{tx("Abrir comprovante enviado")}</span>
            </a>}
            {o.proof_submitted_at!==null && <p className="text-[10px] text-slate-500">
              {tx("Comprovante enviado em:")} {new Date(o.proof_submitted_at*1000).toLocaleString(dateLocale)}
            </p>}
            {o.payment_ref && <p className="text-xs break-all">TXID: {o.payment_ref}</p>}
          </div>
          {o.status==='pending' && <button disabled={busy} className={btn} onClick={()=>{
            const reason=window.prompt(tx("Informe o motivo da rejeição do pedido (mínimo 6 caracteres)."));
            if (!reason || reason.trim().length<6)return;
            if (window.confirm(tx("Rejeitar o pedido e manter o plano inalterado?"))) {
              void change('admin.order.reject',{orderId:o.id,reason:reason.trim()});
            }
          }}>{tx("Rejeitar pedido")}</button>}
          {o.status==='pending' && <button data-testid="admin-approve-simulation"
            disabled={busy} className={btn} onClick={()=>{
            if(window.confirm(copy('adminApprovePrompt'))) {
              void change('admin.order.approve',{orderId:o.id,paymentConfirmed:true,simulationConfirmed:true});
            }
          }}>{copy('adminApproveButton')}</button>}
        </article>)}
      </div>}
      {section==='tickets' && <div className="space-y-3">
        {tickets.length===0 && <p className="text-sm text-slate-400">{tx("Nenhum ticket registrado.")}</p>}
        {tickets.map(t=><article key={t.id} data-testid="admin-ticket" className="p-4 rounded-xl bg-[#1b2137] border border-[#2b3350] space-y-2">
          <p className="font-bold text-sm">#{t.id} · {t.subject}</p>
          <p className="text-xs text-slate-400">{t.login} · {adminText(language,t.ticket_state==='replied'?'Respondido':t.ticket_state==='closed'?'Fechado':'Aberto')} · {tx('notificação:')} {adminText(language,t.notification_status==='pending'?'Pendente':t.notification_status==='accepted'?'Encaminhada':'Falhou')}</p>
          <p className="whitespace-pre-wrap text-sm">{t.message}</p>
          {t.replies?.map(reply=><p key={`${reply.author}-${reply.id}`} className="whitespace-pre-wrap text-xs text-emerald-200">{reply.author==='member'?t.login:tx('Suporte')} · {new Date(reply.created_at*1000).toLocaleString(dateLocale)}: {reply.message}</p>)}
          <p className="text-xs text-slate-400">{new Date(t.created_at*1000).toLocaleString(dateLocale)}</p>
          <div className="flex flex-wrap gap-2">
            {t.ticket_state!=='closed'&&<button disabled={busy} className={btn}
              onClick={()=>{setReplyTicket(t.id);setReplyMessage('');}}>{tx("Resolver / Responder")}</button>}
            {t.ticket_state==='closed'
              ? <button disabled={busy} className={btn} onClick={()=>void change('admin.support.manage',{ticketId:t.id,operation:'reopen'})}>{tx("Reabrir")}</button>
              : <button disabled={busy} className={btn} onClick={()=>void change('admin.support.manage',{ticketId:t.id,operation:'close'})}>{tx("Fechar / Trancar")}</button>}
            <button disabled={busy} className={btn} onClick={()=>{
              if(window.confirm(tx("Excluir este ticket da listagem? O registro de auditoria será preservado.")))
                void change('admin.support.manage',{ticketId:t.id,operation:'delete'});
            }}>{tx("Excluir")}</button>
            <button disabled={busy} className={btn} onClick={()=>void change('admin.support.notify',{ticketId:t.id})}>
              {tx("Solicitar envio por e-mail")}
            </button>
          </div>
          {replyTicket===t.id&&<form data-testid="admin-ticket-reply" className="border-t border-[#2b3350] pt-3 space-y-2"
            onSubmit={e=>{e.preventDefault();void change('admin.support.reply',{ticketId:t.id,message:replyMessage}).then(()=>{setReplyTicket(null);setReplyMessage('');});}}>
            <label className="block text-sm">{tx("Responder ticket")}
              <textarea required minLength={2} maxLength={2500} rows={4}
                value={replyMessage} onChange={e=>setReplyMessage(e.target.value)}
                className="mt-2 w-full p-3 bg-[#101629] border border-[#333a57] rounded-xl"/>
            </label>
            <button disabled={busy||replyMessage.trim().length<2} className={btn}>{tx("Enviar resposta")}</button>
            <button type="button" className="text-slate-400 underline text-xs ml-2" onClick={()=>setReplyTicket(null)}>{tx("Cancelar")}</button>
          </form>}
        </article>)}
      </div>}
      {section==='audit' && <div className="space-y-2">
        {audit.map(entry=><div key={entry.id} className="rounded-xl bg-[#1b2137] border border-[#2b3350] p-3 text-xs">
          {new Date(entry.created_at*1000).toLocaleString(dateLocale)} · {entry.action}
          · {tx('administrador')} #{entry.admin_id} · {tx('alvo')} #{entry.target_user_id ?? '-'}
        </div>)}
        {!audit.length && <p className="text-sm text-slate-400">{tx("Nenhuma ação registrada.")}</p>}
      </div>}
      {section==='settings' && <section className="space-y-6">
        <form className="rounded-xl border border-[#374461] bg-[#1b2137] p-4 space-y-3" onSubmit={e=>{e.preventDefault();void change('admin.kyc.settings',{duration:kycDuration});}}>
          <label className="block text-sm font-semibold" htmlFor="admin-kyc-duration">{language==='en'?'KYC simulation duration':language==='es'?'Duración de la simulación KYC':'Tempo da simulação KYC'}</label>
          <input id="admin-kyc-duration" data-testid="admin-kyc-duration" type="text" inputMode="decimal" required pattern="[0-9]{1,3}([.][0-5][0-9])?" maxLength={6} value={kycDuration} onChange={e=>setKycDuration(e.target.value)} className="w-full rounded-xl border border-[#333a57] bg-[#101629] p-3 text-sm"/>
          <p className="text-xs text-slate-400">{language==='en'?'Hours.minutes: 0.30 = 30 minutes; 1.30 = 1 hour 30 minutes.':language==='es'?'Horas.minutos: 0.30 = 30 minutos; 1.30 = 1 hora y 30 minutos.':'Horas.minutos: 0.30 = 30 minutos; 1.30 = 1 hora e 30 minutos.'}</p>
          <button type="submit" disabled={busy} className={btn}>{language==='en'?'Save duration':language==='es'?'Guardar duración':'Salvar prazo'}</button>
        </form>
        {MOCKUP_LOCK && <section data-testid="admin-legit-copy-preview"
          className="rounded-xl border border-amber-300/25 bg-[#1b2137] p-4 space-y-3">
          <div className="space-y-1">
            <h2 className="font-semibold">{copy('adminPreviewTitle')}</h2>
            <p className="text-xs text-slate-300">{copy('adminPreviewDescription')}</p>
          </div>
          {legitPreviewActive && <p className="text-sm text-amber-200" role="timer">
            {copy('adminPreviewCountdownLabel')}{' '}
            <strong data-testid="admin-legit-copy-countdown">{previewCountdown}</strong>
          </p>}
          <form data-testid="admin-legit-copy-preview-form" className="space-y-3"
            onSubmit={async e=>{
              e.preventDefault();
              const days=Number(previewDays);
              if(!Number.isInteger(days)||days<MOCKUP_PREVIEW_MIN_DAYS||days>MOCKUP_PREVIEW_MAX_DAYS){
                setNotice(copy('adminPreviewDurationError'));
                return;
              }
              setBusy(true);
              try{
                if(!await startLegitPreview(days)){
                  setNotice(language==='en'?'Could not save the global setting. Check your admin session and try again.':language==='es'?'No se pudo guardar la configuración global. Comprueba la sesión de administrador e inténtalo de nuevo.':'Não foi possível salvar a configuração global. Verifique a sessão administrativa e tente novamente.');
                  return;
                }
                setNotice('');
              }finally{setBusy(false);}
            }}>
            <label htmlFor="admin-legit-copy-preview-days" className="block text-sm">
              {copy('adminPreviewDurationLabel')}
              <input id="admin-legit-copy-preview-days" data-testid="admin-legit-copy-preview-days"
                type="number" min={MOCKUP_PREVIEW_MIN_DAYS} max={MOCKUP_PREVIEW_MAX_DAYS}
                step={1} required value={previewDays}
                onChange={e=>setPreviewDays(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-[#333a57] bg-[#101629] p-3"/>
            </label>
            <p className="text-xs text-slate-400">{copy('adminPreviewDurationHint')}</p>
            <button type="submit" className={btn} data-testid="admin-legit-copy-preview-start">
              {copy(legitPreviewActive?'adminPreviewUpdate':'adminPreviewStart')}
            </button>
          </form>
        </section>}
        <section data-testid="admin-demo-investors-settings"
          className="rounded-xl border border-[#374461] bg-[#1b2137] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className="font-semibold">{copy('adminInvestorTitle')}</h2>
              <p className="text-xs text-slate-300">{copy('adminInvestorDescription')}</p>
            </div>
            <button type="button" role="switch" data-testid="admin-demo-investors-toggle"
              aria-checked={demoInvestorToastsEnabled} disabled={busy||!demoInvestorToastsReady}
              onClick={()=>void change('admin.demo.new-investors.settings',{enabled:!demoInvestorToastsEnabled})}
              aria-label={copy('adminInvestorAria')}
              className={'relative h-8 w-14 shrink-0 rounded-full border transition-colors disabled:opacity-50 '+(demoInvestorToastsEnabled?'border-emerald-400 bg-emerald-500':'border-slate-500 bg-slate-600')}>
              <span className={'absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform '+(demoInvestorToastsEnabled?'translate-x-6':'translate-x-0')}/>
            </button>
          </div>
          <p data-testid="admin-demo-investors-status" className="text-xs text-slate-300">
            {demoInvestorToastsEnabled?copy('adminInvestorEnabled'):copy('adminInvestorDisabled')}
            {' · '}
            {copy('adminInvestorPlacement')}
          </p>
        </section>
        <form onSubmit={e=>{e.preventDefault();void change('admin.settings',{supportEmail:email})}} className="space-y-3">
          <label className="block text-sm">{tx("E-mail de suporte")}
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
              className="w-full block mt-2 bg-[#1b2137] border border-[#2b3350] p-3 rounded-xl"/>
          </label>
          <button disabled={busy} className={btn}>{tx("Salvar suporte")}</button>
        </form>
        <form onSubmit={e=>{
          e.preventDefault();setBusy(true);setNotice('');
          void api('admin.payment.settings',{
            btcAddress,adminPassword:paymentPassword,confirmedOwner:ownerConfirmation
          }).then(()=>{setPaymentPassword('');setOwnerConfirmation(false);
            toast.show(tx("Configuração de recebimento atualizada."));void refresh();})
            .catch(error=>setNotice((error as Error).message)).finally(()=>setBusy(false));
        }} className="space-y-3 rounded-xl bg-[#1b2137] p-4">
          <h2 className="font-bold">{tx("Recebimento Bitcoin")}</h2>
          <p className={btcConfirmed?'text-emerald-300 text-xs':'text-amber-300 text-xs'}>
            {tx(btcConfirmed?'Endereço confirmado administrativamente.':'Recebimento bloqueado até confirmar a posse do endereço BTC.')}
          </p>
          <label className="block text-sm">{tx("Endereço BTC de recebimento")}
            <input required value={btcAddress} onChange={e=>{setBtcAddress(e.target.value);setBtcConfirmed(false);}}
              className="w-full mt-2 bg-[#11182c] rounded-lg p-3 font-mono text-xs"/>
          </label>
          <label className="block text-sm">{tx("Sua senha de administrador")}
            <input type="password" required value={paymentPassword} onChange={e=>setPaymentPassword(e.target.value)}
              autoComplete="current-password" className="w-full mt-2 bg-[#11182c] rounded-lg p-3"/>
          </label>
          <label className="flex gap-2 text-xs items-start">
            <input type="checkbox" checked={ownerConfirmation}
              onChange={e=>setOwnerConfirmation(e.target.checked)}/>
            Confirmo que controlo esta carteira BTC e verifiquei o endereço por um método independente.
            A confirmação é administrativa, não uma prova criptográfica.
          </label>
          <button disabled={busy||!ownerConfirmation} className={btn}>{tx("Validar endereço e habilitar novos pedidos")}</button>
          <p className="text-xs text-slate-400">{tx("Alterações afetam apenas novos pedidos. Pagamentos e TXIDs antigos permanecem vinculados ao endereço original.")}</p>
        </form>
        <section className="rounded-xl border border-[#2b3350] bg-[#1b2137] p-4 space-y-2">
          <h3 className="font-semibold">{tx("Diagnóstico da hospedagem")}</h3>
          {diagnostics?([
            ['PHP',diagnostics.phpVersion],
            ['SQLite',diagnostics.pdoSqlite?'Disponível':'Indisponível'],
            ['Banco gravável',diagnostics.dbWritable?'Sim':'Não'],
            ['HTTPS nesta conexão',diagnostics.https?'Sim':'Não / verificar proxy'],
            ['Transporte de e-mail configurado',diagnostics.mailConfigured?'Sim':'Não'],
            ['Carteira BTC confirmada',diagnostics.btcAddressConfirmed?'Sim':'Não']
          ] as const).map(([label,value])=><div key={label}
            className="flex gap-3 justify-between text-xs border-b border-[#2b3350] pb-2">
            <span className="text-slate-400">{tx(label)}</span><strong>{tx(value)}</strong>
          </div>):<p className="text-xs text-slate-400">{tx("Diagnóstico indisponível.")}</p>}
          <p className="text-xs text-slate-400">{copy('adminPaymentNotice')}</p>
        </section>
        <p className="text-xs text-slate-400">{tx("O instalador de primeira execução está disponível sem chave somente por acesso local ao servidor. Não é liberado para criação administrativa pública.")}</p>
      </section>}
    </main>
    {editingMember && <section role="region" aria-labelledby="admin-member-editor-title"
      data-testid="admin-member-editor"
      className="absolute inset-0 z-50 flex min-h-0 flex-col bg-[#121526]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#2b3350] bg-[#171b2d] px-4 py-3">
        <div className="min-w-0">
          <h1 id="admin-member-editor-title" className="text-lg font-bold">{tx("Editar membro")}</h1>
          <p className="text-xs text-slate-400">{editingMember.login} · #{editingMember.id}</p>
        </div>
        <button type="button" data-testid="admin-member-editor-close"
          aria-label={tx("Fechar edição")} title={tx("Fechar edição")}
          onClick={closeMemberEditor}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#262d49] text-slate-100">
          <X size={20}/>
        </button>
      </header>
      {notice && <p role="status" className="mx-4 mt-3 shrink-0 rounded-lg bg-[#292a40] p-3 text-sm text-amber-300">{notice}</p>}
      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 md:p-7">
        {details && <section className="space-y-2 rounded-xl bg-[#1b2137] p-4 text-sm">
          <h2 className="font-semibold">{tx("Detalhes de")} #{details.member.id} — {details.member.login}</h2>
          <p>{tx("Plano(s) contratados:")} {details.contracts.length}</p>
          <p>{copy('adminInternalBalanceLabel')} USD {details.balanceUsd} · {copy('adminInternalSatoshisLabel')} {details.bonusSatoshis}</p>
          <p>{tx("Últimos pedidos:")} {details.orders.length}</p>
          {details.contracts.length>0 && <section className="mt-4 space-y-2">
            <h3 className="font-bold text-xs">{tx("Histórico de contratos VIP")}</h3>
            {details.contracts.map(c=><div key={c.id} className="rounded-xl border border-[#2b3350] bg-[#101827] p-3 text-xs">
              <p className="font-bold">{c.plan_id} · {tx("Contrato")} #{c.id}</p>
              <p>{tx("Ativação:")} {new Date(c.started_at*1000).toLocaleString(dateLocale)}</p>
              <p>{tx("Vencimento:")} {new Date(c.expires_at*1000).toLocaleString(dateLocale)}</p>
            </div>)}
          </section>}
          {details.orders.length>0 && <section className="space-y-2">
            <h3 className="font-bold text-xs">{tx("Últimos pedidos")}</h3>
            {details.orders.map(o=><div key={o.id} className="border-b border-[#2b3350] p-2 text-xs">
              {tx("Pedido")} #{o.id} · {o.plan_id} · {adminStatus(language,o.status)}
              <p className="mt-1 break-all font-mono text-slate-400">TXID: {o.payment_ref || (o.status==='approved'?copy('adminMissingPaymentRef'):tx('Não informado'))}</p>
            </div>)}
          </section>}
        </section>}
        <form id="admin-member-profile-form" data-testid="admin-member-profile-form"
          className="space-y-3 rounded-xl bg-[#1b2137] p-4"
          onSubmit={e=>{e.preventDefault();void change('admin.member.edit',{
            userId:editingMember.id,login:editingMember.login,displayName:editingMember.display_name,
            email:editingMember.email,phone:editingMember.phone ?? '',walletAddress:editingMember.wallet_address ?? '',
          });}}>
          <h2 className="font-semibold">{tx("Editar perfil de")} {editingMember.login}</h2>
          {(['login','display_name','email','phone','wallet_address'] as const).map(k=><label key={k} className="block text-sm">
            {tx(({login:'Nome de usuário (login)',display_name:'Nome',email:'E-mail',phone:'Telefone',wallet_address:'Endereço BTC'} as const)[k])}
            <input type={k==='email'?'email':k==='phone'?'tel':'text'}
              autoComplete={k==='email'?'email':k==='phone'?'tel':'off'}
              className="mt-1 w-full rounded-lg bg-[#11182c] p-3" value={editingMember[k] ?? ''}
              onChange={e=>setEditingMember(m=>m?{...m,[k]:e.target.value}:m)}/>
          </label>)}
          <p className="text-xs text-slate-400">{tx("A alteração do login preserva os dados e históricos. Permissões administrativas não podem ser editadas por este formulário.")}</p>
        </form>
        <AdminMemberRecords key={editingMember.id}
          userId={editingMember.id} plans={plans} language={language} onChanged={()=>{void refresh();
            void api<MemberDetails>('admin.member.details',undefined,{id:editingMember.id}).then(setDetails).catch(()=>{});
          }}/>
        <section className="space-y-3 rounded-xl bg-[#1b2137] p-4">
          <h2 className="text-sm font-bold">{tx("Redefinição administrativa de senha")}</h2>
          <p className="text-xs text-amber-300">{tx("Verifique a identidade do membro por meio independente antes de emitir a autorização. Não registre documentos, senhas ou dados sensíveis no campo de referência.")}</p>
          <select value={verificationMethod} onChange={e=>setVerificationMethod(e.target.value)}
            className="w-full rounded-lg bg-[#11182c] p-3 text-sm">
            <option value="approved">{tx("APROVADO")}</option>
            <option value="in_person">{tx("Verificação presencial")}</option>
            <option value="other_offline">{tx("Outro método independente")}</option>
          </select>
          <label className="block text-xs text-slate-300">
            {tx("Referência da verificação realizada")}
            <input value={verificationReference} onChange={e=>setVerificationReference(e.target.value)}
              placeholder={tx("Ex.: protocolo SUP-12345 ou número do atendimento")}
              className="mt-2 w-full rounded-lg bg-[#11182c] p-3 text-sm"/>
            <span className="mt-1 block text-slate-400">{tx("Informe um protocolo, número de atendimento ou identificação interna do registro. Não informe senhas ou documentos pessoais.")}</span>
          </label>
          <button type="button" disabled={busy || verificationReference.trim().length<6} className={btn} onClick={()=>{
            setBusy(true);setNotice('');
            void api<{verificationId:number}>('admin.identity.verify',{
              userId:editingMember.id,verificationMethod,verificationReference
            }).then(result=>{setVerificationId(result.verificationId);
              setNotice(tx("Verificação registrada. Autorização válida por 10 minutos."));})
              .catch(e=>setNotice((e as Error).message)).finally(()=>setBusy(false));
          }}>{tx("Registrar verificação de identidade")}</button>
          {verificationId!==null && <div className="space-y-3 border-t border-[#2b3350] pt-3">
            <label className="block text-xs">{tx("Nova senha")}
              <input type="password" minLength={12} maxLength={256}
                autoComplete="new-password" value={newMemberPassword} onChange={e=>setNewMemberPassword(e.target.value)}
                className="mt-1 w-full rounded-lg bg-[#11182c] p-3"/>
            </label>
            <button type="button" disabled={busy || newMemberPassword.length<12} className={btn} onClick={()=>{
              setBusy(true);setNotice('');
              void api('admin.password.reset',{userId:editingMember.id,verificationId,newPassword:newMemberPassword})
                .then(()=>{setVerificationId(null);setNewMemberPassword('');
                  setNotice(tx("Senha redefinida. Sessões existentes revogadas. Informe a nova senha ao membro por canal seguro."));})
                .catch(e=>setNotice((e as Error).message)).finally(()=>setBusy(false));
            }}>{tx("Redefinir senha e revogar sessões")}</button>
          </div>}
        </section>
      </main>
      <footer className="shrink-0 border-t border-[#2b3350] bg-[#171b2d] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button type="submit" form="admin-member-profile-form" data-testid="admin-member-profile-save"
          disabled={busy} className={btn+' min-h-11 w-full'}>
          {tx("Salvar perfil")}
        </button>
      </footer>
    </section>}
  </div>;
};
