import React, { useEffect, useState } from 'react';
import { AuthUser, Plan, api } from '../../services/api';
import { AdminMemberRecords } from './AdminMemberRecords';
import { LogOut, RefreshCw, Users, CreditCard, Settings, LayoutDashboard, Headphones, Menu, ChevronDown, ChevronUp } from 'lucide-react';

type Member = {id: number; login: string; display_name: string; email: string; status: string; balance_units: number; plan_id: string; phone?: string; wallet_address?: string};
type MemberDetails = {member: Member & {phone: string;wallet_address:string}; contracts:Array<{id:number;plan_id:string;started_at:number;expires_at:number}>;orders:Array<{id:number;plan_id:string;status:string;payment_ref:string|null}>;balanceUsd:string;bonusSatoshis:number};
type Order = {id:number; user_id:number; login:string; plan_id:string; status:string; created_at:number;btc_sats:number;quote_source:string;payment_ref?:string|null};
type Withdraw = {id:number;user_id:number;login:string;plan_id:string;btc_address:string;usd_cents:number;btc_satoshis:number;status:'pending'|'awaiting_vip'|'approved'|'rejected';created_at:number;reference:string};
type Ticket = {id:number;user_id:number;login:string;subject:string;message:string;
  status:'open'|'resolved';ticket_state:'open'|'replied'|'closed';admin_reply:string|null;
  notification_status:'pending'|'accepted'|'failed';created_at:number};
export const AdminWorkspace: React.FC<{user:AuthUser;onLogout:()=>void}> = ({user,onLogout}) => {
  const [section,setSection]=useState<'overview'|'members'|'plans'|'orders'|'settings'|'audit'|'tickets'|'withdrawals'>('overview');
  const [menuOpen,setMenuOpen]=useState(false);
  const [overview,setOverview]=useState({members:0,active:0,suspended:0,archived:0,activeVip:0,pendingOrders:0,approvedOrders:0});
  const [audit,setAudit]=useState<Array<{id:number;admin_id:number;action:string;target_user_id:number|null;created_at:number}>>([]);
  const [members,setMembers]=useState<Member[]>([]);
  const [plans,setPlans]=useState<Plan[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
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
  const [btcAddress,setBtcAddress]=useState('');
  const [btcConfirmed,setBtcConfirmed]=useState(false);
  const [paymentPassword,setPaymentPassword]=useState('');
  const [ownerConfirmation,setOwnerConfirmation]=useState(false);
  const [diagnostics,setDiagnostics]=useState<{phpVersion:string;pdoSqlite:boolean;dbWritable:boolean;https:boolean;mailConfigured:boolean;btcAddressConfirmed:boolean;quoteProviders:string}|null>(null);
  const [selected,setSelected]=useState<Plan|null>(null);
  const [notice,setNotice]=useState('');
  const [editingMember,setEditingMember]=useState<Member|null>(null);
  const [verificationMethod,setVerificationMethod]=useState('approved');
  const [verificationReference,setVerificationReference]=useState('');
  const [newMemberPassword,setNewMemberPassword]=useState('');
  const [verificationId,setVerificationId]=useState<number|null>(null);
  const [busy,setBusy]=useState(false);
  async function refresh() {
    try {
      const [m,p,o,s]=await Promise.all([
        api<{members:Member[];total:number}>('admin.members',undefined,{q:filter,status:statusFilter,offset}),
        api<{plans:Plan[]}>('admin.plans'),
        api<{orders:Order[]}>('admin.orders'),
        api<{email:string}>('support'),
      ]);
      setMembers(m.members);setTotal(m.total);setPlans(p.plans);setOrders(o.orders);setEmail(s.email);
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
  async function change(action:string, body:Record<string,unknown>) {
    setBusy(true);setNotice('');
    try {await api(action,body);setNotice('Alteração registrada.');await refresh();}
    catch(e){setNotice((e as Error).message);}
    finally{setBusy(false);}
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
        withdrawAfterDays:selected.withdrawAfterDays,
        hashrate:selected.hashrate,serverModel:selected.serverModel,available:selected.available
      });
      setSelected(null);
    }}>
    <h3 className="font-semibold">{selected.revision===0?'Cadastrar novo plano':'Editar '+selected.name}</h3>
    {selected.revision===0 && <label className="block text-sm">Identificador do plano
      <input required value={selected.id} onChange={e=>setSelected(p=>p?{...p,id:e.target.value.toUpperCase()}:p)}
        className="w-full mt-1 bg-[#11182c] p-3 rounded-lg"/>
    </label>}
    {([
      ['name','Nome do plano'],['priceUsd','Preço (USD)'],
      ['dailyUsd','Recompensa diária interna (USD)'],['bonusUsd','Bônus diário (USD)'],
      ['bonusSatoshis','Bônus diário (satoshis internos)'],
      ['durationDays','Duração do plano (dias)'],
      ['sessionSeconds','Duração da sessão (segundos)'],
      ['withdrawMinUsd','Valor mínimo de saque (USD)'],
      ['hashrate','Capacidade ilustrativa'],['serverModel','Equipamento ilustrativo']
    ] as const).map(([key,label])=><label key={key} className="block text-sm">
      {label}<input required value={selected[key]} type={
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
      Disponível para novas adesões
    </label>
    <button className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold" disabled={busy}>Salvar alterações</button>
  </form>;
  const btn='rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-3 py-2 text-xs font-bold';
  return <div className="h-full w-full bg-[#121526] text-white flex flex-col overflow-hidden">
    <header className="relative px-4 py-3 bg-[#171b2d] border-b border-[#2b3350] flex justify-between items-center z-40">
      <strong>Bitdeer BTC <span className="text-xs text-slate-400">· Administração</span></strong>
      <button type="button" aria-label="Abrir menu administrativo" aria-expanded={menuOpen}
        onClick={()=>setMenuOpen(x=>!x)} className="flex gap-2 items-center bg-[#262d49] rounded-lg px-3 py-2 text-sm">
        <Menu size={20}/>{menuOpen?'Fechar':'Menu'}<ChevronDown size={14}/>
      </button>
      {menuOpen&&<nav aria-label="Navegação administrativa"
        className="absolute top-full right-3 left-3 md:left-auto md:w-64 border border-[#2b3350] rounded-xl bg-[#1b2137] p-2 shadow-xl flex flex-col gap-1">
        {([['overview','Visão geral',LayoutDashboard],['members','Membros',Users],['plans','Planos VIP',CreditCard],
          ['orders','Pedidos',CreditCard],['withdrawals','Solicitações de saque',CreditCard],['settings','Configurações',Settings],['audit','Auditoria',Users],
          ['tickets','Suporte',Headphones]] as const).map(([key,label,Icon])=><button key={key}
            type="button" onClick={()=>{setSection(key);setMenuOpen(false);}}
            className={'flex items-center gap-3 rounded-lg p-3 text-sm text-left '+(section===key?'bg-indigo-600':'hover:bg-slate-700')}>
            <Icon size={17}/>{label}</button>)}
        <button type="button" onClick={onLogout} className="flex gap-3 items-center p-3 text-sm"><LogOut size={17}/>Sair</button>
      </nav>}
    </header>
    <main className="flex-1 overflow-auto p-4 md:p-7 space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">
        {section==='overview'?'Visão geral':section==='members'?'Gerenciamento de membros':section==='plans'?'Catálogo VIP':section==='orders'?'Pedidos pendentes':section==='withdrawals'?'Solicitações de saque':section==='audit'?'Auditoria administrativa':section==='tickets'?'Tickets de suporte':'Configurações'}
      </h1><button aria-label="Atualizar" onClick={()=>void refresh()}><RefreshCw size={18}/></button></div>
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
            <p className="text-xs text-slate-400">{label}</p>
            <strong className="text-2xl">{value}</strong>
          </div>)}
        <p className="col-span-full text-xs text-slate-400">Contagens obtidas do banco SQLite; não representam faturamento ou BTC confirmado na blockchain.</p>
      </div>}
      {section==='members' && <>
        <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();setOffset(0);void refresh();}}>
          <input placeholder="Buscar por usuário, nome ou e-mail" value={filter} onChange={e=>setFilter(e.target.value)}
            className="flex-1 min-w-40 bg-[#1b2137] p-3 rounded-xl border border-[#2b3350]"/>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            className="bg-[#1b2137] p-3 rounded-xl">
            <option value="">Todos os estados</option><option value="active">Ativos</option>
            <option value="suspended">Suspensos</option><option value="archived">Arquivados</option>
          </select>
          <button className={btn}>Pesquisar</button>
        </form>
        <p className="text-xs text-slate-400">{total} membro(s) · exibindo até 50 por página.</p>
        <div className="space-y-3">{members.map(m=>
          <article key={m.id} className="rounded-xl p-4 bg-[#1b2137] border border-[#2b3350] flex flex-wrap gap-4 items-center justify-between">
            <div><strong>#{m.id} {m.login}</strong><p className="text-xs text-slate-400">{m.display_name} · {m.status==='active'?'Ativo':m.status==='suspended'?'Suspenso':'Arquivado'} · {m.plan_id}</p></div>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} className={btn} onClick={()=>
                void api<MemberDetails>('admin.member.details',undefined,{id:m.id})
                  .then(d=>{setDetails(d);setEditingMember({...d.member});setVerificationId(null);
                    setNewMemberPassword('');setVerificationReference('');})
                  .catch(e=>setNotice((e as Error).message))}>Detalhes / Editar</button>
              {m.status==='active' && <button disabled={busy} className={btn} onClick={()=>void change('admin.status',{userId:m.id,status:'suspended'})}>Suspender</button>}
              {m.status==='suspended' && <button disabled={busy} className={btn} onClick={()=>void change('admin.status',{userId:m.id,status:'active'})}>Reativar</button>}
              {m.status!=='archived' && <button disabled={busy} className={btn} onClick={()=>{
                if(window.confirm('Arquivar conta e preservar histórico?'))void change('admin.status',{userId:m.id,status:'archived'});
              }}>Arquivar</button>}
              {m.status==='archived' && <button disabled={busy} className={btn} onClick={()=>void change('admin.status',{userId:m.id,status:'active'})}>Restaurar</button>}
            </div>
          </article>)}</div>
        <div className="flex gap-3 items-center">
          <button disabled={offset===0} className={btn} onClick={()=>setOffset(Math.max(0,offset-50))}>Anterior</button>
          <span className="text-xs">{Math.floor(offset/50)+1} / {Math.max(1,Math.ceil(total/50))}</span>
          <button disabled={offset+50>=total} className={btn} onClick={()=>setOffset(offset+50)}>Próxima</button>
        </div>
        {details && <div className="bg-[#1b2137] rounded-xl p-4 space-y-2 text-sm">
          <h3 className="font-semibold">Detalhes de #{details.member.id} — {details.member.login}</h3>
          <p>Plano(s) contratados: {details.contracts.length}</p>
          <p>Saldo interno: US$ {details.balanceUsd} · satoshis internos: {details.bonusSatoshis}</p>
          <p>Últimos pedidos: {details.orders.length}</p>
          {details.contracts.length>0 && <section className="mt-4 space-y-2">
            <h4 className="font-bold text-xs">Histórico de contratos VIP</h4>
            {details.contracts.map(c=><div key={c.id} className="p-3 bg-[#101827] border border-[#2b3350] rounded-xl text-xs">
              <p className="font-bold">{c.plan_id} · Contrato #{c.id}</p>
              <p>Ativação: {new Date(c.started_at*1000).toLocaleString('pt-BR')}</p>
              <p>Vencimento: {new Date(c.expires_at*1000).toLocaleString('pt-BR')}</p>
            </div>)}
          </section>}
          {details.orders.length>0 && <section className="space-y-2">
            <h4 className="font-bold text-xs">Últimos pedidos</h4>
            {details.orders.map(o=><div key={o.id} className="text-xs p-2 border-b border-[#2b3350]">
              Pedido #{o.id} · {o.plan_id} · {o.status}
              <p className="font-mono text-slate-400 break-all mt-1">TXID: {o.payment_ref || (o.status==='approved'?'Não existe — aprovação simulada':'Não informado')}</p>
            </div>)}
          </section>}
          <button className="text-indigo-300 underline" onClick={()=>setDetails(null)}>Fechar detalhes</button>
        </div>}
        {editingMember && <form className="rounded-xl bg-[#1b2137] p-4 space-y-3"
          onSubmit={e=>{e.preventDefault();void change('admin.member.edit',{
            userId:editingMember.id,login:editingMember.login,displayName:editingMember.display_name,
            email:editingMember.email,phone:editingMember.phone ?? '',walletAddress:editingMember.wallet_address ?? '',
          });}}>
          <strong>Editar perfil de {editingMember.login}</strong>
          {(['login','display_name','email','phone','wallet_address'] as const).map(k=><label key={k} className="block text-sm">
            {({login:'Nome de usuário (login)',display_name:'Nome',email:'E-mail',phone:'Telefone',wallet_address:'Endereço BTC'} as const)[k]}
            <input type={k==='email'?'email':k==='phone'?'tel':'text'}
               autoComplete={k==='email'?'email':k==='phone'?'tel':'off'}
               className="w-full bg-[#11182c] p-3 rounded-lg mt-1" value={editingMember[k] ?? ''}
              onChange={e=>setEditingMember(m=>m?{...m,[k]:e.target.value}:m)}/>
          </label>)}
          <p className="text-xs text-slate-400">A alteração do login preserva os dados e históricos. Permissões administrativas não podem ser editadas por este formulário.</p>
          <button className={btn} disabled={busy}>Salvar perfil</button>
          <button type="button" className="ml-2 text-sm" onClick={()=>setEditingMember(null)}>Cancelar</button>
        </form>}
        {editingMember && <AdminMemberRecords key={editingMember.id}
          userId={editingMember.id} plans={plans} onChanged={()=>{void refresh();
            void api<MemberDetails>('admin.member.details',undefined,{id:editingMember.id}).then(setDetails).catch(()=>{});
          }}/>}
        {editingMember && <section className="rounded-xl bg-[#1b2137] p-4 space-y-3">
          <h3 className="font-bold text-sm">Redefinição administrativa de senha</h3>
          <p className="text-xs text-amber-300">Verifique a identidade do membro por meio independente antes de emitir a autorização. Não registre documentos, senhas ou dados sensíveis no campo de referência.</p>
          <select value={verificationMethod} onChange={e=>setVerificationMethod(e.target.value)}
            className="bg-[#11182c] w-full p-3 rounded-lg text-sm">
            <option value="approved">APROVADO</option>
            <option value="in_person">Verificação presencial</option>
            <option value="other_offline">Outro método independente</option>
          </select>
          <label className="block text-xs text-slate-300">
            Referência da verificação realizada
            <input value={verificationReference} onChange={e=>setVerificationReference(e.target.value)}
              placeholder="Ex.: protocolo SUP-12345 ou número do atendimento"
              className="mt-2 w-full bg-[#11182c] p-3 rounded-lg text-sm"/>
            <span className="mt-1 block text-slate-400">Informe um protocolo, número de atendimento ou identificação interna do registro. Não informe senhas ou documentos pessoais.</span>
          </label>
          <button type="button" disabled={busy || verificationReference.trim().length<6} className={btn} onClick={()=>{
            if(!editingMember)return;
            setBusy(true);setNotice('');
            void api<{verificationId:number}>('admin.identity.verify',{
              userId:editingMember.id,verificationMethod,verificationReference
            }).then(result=>{setVerificationId(result.verificationId);
              setNotice('Verificação registrada. Autorização válida por 10 minutos.');})
              .catch(e=>setNotice((e as Error).message)).finally(()=>setBusy(false));
          }}>Registrar verificação de identidade</button>
          {verificationId!==null && <div className="space-y-3 border-t border-[#2b3350] pt-3">
            <label className="text-xs block">Nova senha
              <input type="password" minLength={10} maxLength={256}
                autoComplete="new-password" value={newMemberPassword} onChange={e=>setNewMemberPassword(e.target.value)}
                className="w-full bg-[#11182c] rounded-lg p-3 mt-1"/>
            </label>
            <button disabled={busy || newMemberPassword.length<10} className={btn} onClick={()=>{
              if(!editingMember)return;
              setBusy(true);setNotice('');
              void api('admin.password.reset',{userId:editingMember.id,verificationId,newPassword:newMemberPassword})
                .then(()=>{setVerificationId(null);setNewMemberPassword('');
                  setNotice('Senha redefinida. Sessões existentes revogadas. Informe a nova senha ao membro por canal seguro.');})
                .catch(e=>setNotice((e as Error).message)).finally(()=>setBusy(false));
            }}>Redefinir senha e revogar sessões</button>
          </div>}
        </section>}
      </>}
      {section==='plans' && <>
        <p className="text-xs text-slate-400">Cada plano pode ser expandido para edição. Novas regras valem apenas para futuros contratos e renovações.</p>
        <button className={btn} onClick={()=>setSelected({
          id:'VIP_CUSTOM',name:'Novo Plano VIP',revision:0,priceUsd:'0.00',dailyUsd:'0.00',
          bonusUsd:'0.00',bonusSatoshis:0,durationDays:30,sessionSeconds:0,restartCooldownSeconds:0,
          withdrawMinUsd:'0.00',withdrawAfterDays:0,hashrate:'',serverModel:'',available:false
        })}>Criar novo plano</button>
        <div className="space-y-3">{plans.map(p=><article key={p.id}
          className="bg-[#1b2137] border border-[#2b3350] rounded-xl overflow-hidden">
          <button type="button" onClick={()=>setSelected(prev=>prev?.id===p.id?null:{...p})}
            aria-expanded={selected?.id===p.id}
            className="w-full text-left p-4 flex justify-between items-center gap-2">
            <div><strong>{p.name}</strong>
              <p className="text-xs text-slate-400 mt-1">US$ {p.priceUsd} · US$ {p.dailyUsd}/dia · revisão {p.revision} · {p.available?'Disponível':'Arquivado'}</p></div>
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
        <p className="text-xs text-amber-300">Solicitações de créditos internos. Nenhum Bitcoin é enviado automaticamente.</p>
        {withdrawals.length===0&&<p className="text-xs text-slate-400">Nenhum saque registrado.</p>}
        {withdrawals.map(w=><article key={w.id} className="bg-[#1b2137] rounded-xl border border-[#2b3350] p-4 space-y-2">
          <strong>Solicitação #{w.id} · {w.login}</strong>
          <p className="text-xs text-slate-300">Plano: {w.plan_id} · Estado: {w.status==='awaiting_vip'?'Aguardando assinatura VIP':w.status==='pending'?'Pendente de conferência':w.status==='approved'?'Aprovada (simulação interna; sem envio de BTC)':'Rejeitada'}</p>
          <p className="text-sm">US$ {(w.usd_cents/100).toFixed(2)} · {(w.btc_satoshis/1e8).toFixed(8)} BTC (equivalência interna)</p>
          <p className="text-xs text-slate-400 break-all">{w.btc_address}</p>
          {(w.status==='pending'||w.status==='awaiting_vip')&&<div className="flex flex-wrap gap-2">
            {w.status==='pending'&&<button disabled={busy} className={btn} onClick={()=>{
              const reference=window.prompt('Referência da conferência externa (mínimo 6 caracteres):');
              if(!reference||reference.trim().length<6)return;
              if(window.confirm('Registrar conferência? Esta ação NÃO transmite BTC.'))
                void change('admin.withdraw.process',{requestId:w.id,status:'approved',reference:reference.trim(),manualReviewConfirmed:true});
            }}>Registrar conferência manual</button>}
            <button disabled={busy} className={btn} onClick={()=>{
              const reference=window.prompt('Motivo da rejeição (mínimo 6 caracteres):');
              if(reference&&reference.trim().length>=6)
                void change('admin.withdraw.process',{requestId:w.id,status:'rejected',reference:reference.trim()});
            }}>Rejeitar e devolver saldo</button>
          </div>}
        </article>)}
      </section>}
      {section==='orders' && <div className="space-y-3">
        {orders.map(o=><article key={o.id} className="p-4 rounded-xl bg-[#1b2137] border border-[#2b3350] flex gap-4 flex-wrap justify-between">
          <div><strong>Pedido #{o.id} · {o.plan_id}</strong>
            <p className="text-xs text-slate-400">{o.login} · {o.status==='pending'?'Pendente':o.status==='approved'?'Aprovado':o.status==='rejected'?'Rejeitado':'Expirado'} · {(o.btc_sats/100000000).toFixed(8)} BTC</p>
            <p className="text-xs text-slate-400">Cotação: {o.quote_source || 'indisponível'}</p>
            {o.payment_ref && <p className="text-xs break-all">TXID: {o.payment_ref}</p>}
          </div>
          {o.status==='pending' && <button disabled={busy} className={btn} onClick={()=>{
            const reason=window.prompt('Informe o motivo da rejeição do pedido (mínimo 6 caracteres).');
            if (!reason || reason.trim().length<6)return;
            if (window.confirm('Rejeitar o pedido e manter o plano inalterado?')) {
              void change('admin.order.reject',{orderId:o.id,reason:reason.trim()});
            }
          }}>Rejeitar pedido</button>}
          {o.status==='pending' && <button data-testid="admin-approve-simulation"
            disabled={busy} className={btn} onClick={()=>{
            if(window.confirm('Aprovar somente como simulação interna? Nenhum pagamento BTC real foi confirmado.')) {
              void change('admin.order.approve',{orderId:o.id,paymentConfirmed:true,simulationConfirmed:true});
            }
          }}>Aprovar simulação e ativar VIP</button>}
        </article>)}
      </div>}
      {section==='tickets' && <div className="space-y-3">
        {tickets.length===0 && <p className="text-sm text-slate-400">Nenhum ticket registrado.</p>}
        {tickets.map(t=><article key={t.id} data-testid="admin-ticket" className="p-4 rounded-xl bg-[#1b2137] border border-[#2b3350] space-y-2">
          <p className="font-bold text-sm">#{t.id} · {t.subject}</p>
          <p className="text-xs text-slate-400">{t.login} · {t.ticket_state==='replied'?'Respondido':t.ticket_state==='closed'?'Fechado':'Aberto'} · notificação: {t.notification_status==='pending'?'Pendente':t.notification_status==='accepted'?'Encaminhada':'Falhou'}</p>
          <p className="whitespace-pre-wrap text-sm">{t.message}</p>
          {t.admin_reply&&<p className="whitespace-pre-wrap text-xs text-emerald-200">Resposta registrada: {t.admin_reply}</p>}
          <p className="text-xs text-slate-400">{new Date(t.created_at*1000).toLocaleString('pt-BR')}</p>
          <div className="flex flex-wrap gap-2">
            {t.ticket_state!=='closed'&&<button disabled={busy} className={btn}
              onClick={()=>{setReplyTicket(t.id);setReplyMessage('');}}>Resolver / Responder</button>}
            {t.ticket_state==='closed'
              ? <button disabled={busy} className={btn} onClick={()=>void change('admin.support.manage',{ticketId:t.id,operation:'reopen'})}>Reabrir</button>
              : <button disabled={busy} className={btn} onClick={()=>void change('admin.support.manage',{ticketId:t.id,operation:'close'})}>Fechar / Trancar</button>}
            <button disabled={busy} className={btn} onClick={()=>{
              if(window.confirm('Excluir este ticket da listagem? O registro de auditoria será preservado.'))
                void change('admin.support.manage',{ticketId:t.id,operation:'delete'});
            }}>Excluir</button>
            <button disabled={busy} className={btn} onClick={()=>void change('admin.support.notify',{ticketId:t.id})}>
              Solicitar envio por e-mail
            </button>
          </div>
          {replyTicket===t.id&&<form data-testid="admin-ticket-reply" className="border-t border-[#2b3350] pt-3 space-y-2"
            onSubmit={e=>{e.preventDefault();void change('admin.support.reply',{ticketId:t.id,message:replyMessage}).then(()=>{setReplyTicket(null);setReplyMessage('');});}}>
            <label className="block text-sm">Responder ticket
              <textarea required minLength={2} maxLength={2500} rows={4}
                value={replyMessage} onChange={e=>setReplyMessage(e.target.value)}
                className="mt-2 w-full p-3 bg-[#101629] border border-[#333a57] rounded-xl"/>
            </label>
            <button disabled={busy||replyMessage.trim().length<2} className={btn}>Enviar resposta</button>
            <button type="button" className="text-slate-400 underline text-xs ml-2" onClick={()=>setReplyTicket(null)}>Cancelar</button>
          </form>}
        </article>)}
      </div>}
      {section==='audit' && <div className="space-y-2">
        {audit.map(entry=><div key={entry.id} className="rounded-xl bg-[#1b2137] border border-[#2b3350] p-3 text-xs">
          {new Date(entry.created_at*1000).toLocaleString('pt-BR')} · {entry.action}
          · administrador #{entry.admin_id} · alvo #{entry.target_user_id ?? '-'}
        </div>)}
        {!audit.length && <p className="text-sm text-slate-400">Nenhuma ação registrada.</p>}
      </div>}
      {section==='settings' && <section className="space-y-6">
        <form onSubmit={e=>{e.preventDefault();void change('admin.settings',{supportEmail:email})}} className="space-y-3">
          <label className="block text-sm">E-mail de suporte
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
              className="w-full block mt-2 bg-[#1b2137] border border-[#2b3350] p-3 rounded-xl"/>
          </label>
          <button disabled={busy} className={btn}>Salvar suporte</button>
        </form>
        <form onSubmit={e=>{
          e.preventDefault();setBusy(true);setNotice('');
          void api('admin.payment.settings',{
            btcAddress,adminPassword:paymentPassword,confirmedOwner:ownerConfirmation
          }).then(()=>{setPaymentPassword('');setOwnerConfirmation(false);
            setNotice('Configuração de recebimento atualizada.');void refresh();})
            .catch(error=>setNotice((error as Error).message)).finally(()=>setBusy(false));
        }} className="space-y-3 rounded-xl bg-[#1b2137] p-4">
          <h2 className="font-bold">Recebimento Bitcoin</h2>
          <p className={btcConfirmed?'text-emerald-300 text-xs':'text-amber-300 text-xs'}>
            {btcConfirmed?'Endereço confirmado administrativamente.':'Recebimento bloqueado até confirmar a posse do endereço BTC.'}
          </p>
          <label className="block text-sm">Endereço BTC de recebimento
            <input required value={btcAddress} onChange={e=>{setBtcAddress(e.target.value);setBtcConfirmed(false);}}
              className="w-full mt-2 bg-[#11182c] rounded-lg p-3 font-mono text-xs"/>
          </label>
          <label className="block text-sm">Sua senha de administrador
            <input type="password" required value={paymentPassword} onChange={e=>setPaymentPassword(e.target.value)}
              autoComplete="current-password" className="w-full mt-2 bg-[#11182c] rounded-lg p-3"/>
          </label>
          <label className="flex gap-2 text-xs items-start">
            <input type="checkbox" checked={ownerConfirmation}
              onChange={e=>setOwnerConfirmation(e.target.checked)}/>
            Confirmo que controlo esta carteira BTC e verifiquei o endereço por um método independente.
            A confirmação é administrativa, não uma prova criptográfica.
          </label>
          <button disabled={busy||!ownerConfirmation} className={btn}>Validar endereço e habilitar novos pedidos</button>
          <p className="text-xs text-slate-400">Alterações afetam apenas novos pedidos. Pagamentos e TXIDs antigos permanecem vinculados ao endereço original.</p>
        </form>
        <section className="rounded-xl border border-[#2b3350] bg-[#1b2137] p-4 space-y-2">
          <h3 className="font-semibold">Diagnóstico da hospedagem</h3>
          {diagnostics?([
            ['PHP',diagnostics.phpVersion],
            ['SQLite',diagnostics.pdoSqlite?'Disponível':'Indisponível'],
            ['Banco gravável',diagnostics.dbWritable?'Sim':'Não'],
            ['HTTPS nesta conexão',diagnostics.https?'Sim':'Não / verificar proxy'],
            ['Transporte de e-mail configurado',diagnostics.mailConfigured?'Sim':'Não'],
            ['Carteira BTC confirmada',diagnostics.btcAddressConfirmed?'Sim':'Não']
          ] as const).map(([label,value])=><div key={label}
            className="flex gap-3 justify-between text-xs border-b border-[#2b3350] pb-2">
            <span className="text-slate-400">{label}</span><strong>{value}</strong>
          </div>):<p className="text-xs text-slate-400">Diagnóstico indisponível.</p>}
          <p className="text-xs text-slate-400">Cotações: Coinbase e CoinGecko; a disponibilidade de rede deve ser verificada no domínio real. O sistema não confirma blockchain nem entrega de e-mail automaticamente.</p>
        </section>
        <p className="text-xs text-slate-400">O instalador de primeira execução está disponível sem chave somente por acesso local ao servidor. Não é liberado para criação administrativa pública.</p>
      </section>}
    </main>
  </div>;
};
