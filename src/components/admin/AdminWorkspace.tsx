import React, { useEffect, useState } from 'react';
import { AuthUser, Plan, api } from '../../services/api';
import { LogOut, RefreshCw, Users, CreditCard, Settings, LayoutDashboard, Headphones } from 'lucide-react';

type Member = {id: number; login: string; display_name: string; email: string; status: string; balance_units: number; plan_id: string; phone?: string; wallet_address?: string};
type MemberDetails = {member: Member & {phone: string;wallet_address:string}; contracts:Array<{id:number;plan_id:string;started_at:number;expires_at:number}>;orders:Array<{id:number;plan_id:string;status:string}>;balanceUsd:string;bonusSatoshis:number};
type Order = {id:number; user_id:number; login:string; plan_id:string; status:string; created_at:number;btc_sats:number;quote_source:string;payment_ref?:string|null};
type Ticket = {id:number;user_id:number;login:string;subject:string;message:string;
  status:'open'|'resolved';notification_status:'pending'|'accepted'|'failed';created_at:number};
export const AdminWorkspace: React.FC<{user:AuthUser;onLogout:()=>void}> = ({user,onLogout}) => {
  const [section,setSection]=useState<'overview'|'members'|'plans'|'orders'|'settings'|'audit'|'tickets'>('overview');
  const [overview,setOverview]=useState({members:0,active:0,suspended:0,archived:0,activeVip:0,pendingOrders:0,approvedOrders:0});
  const [audit,setAudit]=useState<Array<{id:number;admin_id:number;action:string;target_user_id:number|null;created_at:number}>>([]);
  const [members,setMembers]=useState<Member[]>([]);
  const [plans,setPlans]=useState<Plan[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [tickets,setTickets]=useState<Ticket[]>([]);
  const [filter,setFilter]=useState('');
  const [statusFilter,setStatusFilter]=useState('');
  const [offset,setOffset]=useState(0);
  const [total,setTotal]=useState(0);
  const [details,setDetails]=useState<MemberDetails|null>(null);
  const [email,setEmail]=useState('');
  const [selected,setSelected]=useState<Plan|null>(null);
  const [notice,setNotice]=useState('');
  const [editingMember,setEditingMember]=useState<Member|null>(null);
  const [verificationMethod,setVerificationMethod]=useState('known_contact');
  const [verificationReference,setVerificationReference]=useState('');
  const [adminPassword,setAdminPassword]=useState('');
  const [newMemberPassword,setNewMemberPassword]=useState('');
  const [identityConfirmed,setIdentityConfirmed]=useState(false);
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
    } catch(e) {setNotice((e as Error).message);}
  }
  useEffect(()=>{void refresh()},[offset]);
  async function change(action:string, body:Record<string,unknown>) {
    setBusy(true);setNotice('');
    try {await api(action,body);setNotice('Alteração registrada.');await refresh();}
    catch(e){setNotice((e as Error).message);}
    finally{setBusy(false);}
  }
  const btn='rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-3 py-2 text-xs font-bold';
  return <div className="h-full w-full bg-[#121526] text-white flex flex-col md:flex-row overflow-hidden">
    <aside className="md:w-52 bg-[#171b2d] border-r border-[#2b3350] p-4 flex md:flex-col gap-2 flex-wrap">
      <div className="hidden md:block font-bold text-xl pb-6">Bitdeer BTC <span className="block text-xs text-slate-400">Administrador {user.login}</span></div>
      {([['overview','Visão geral',LayoutDashboard],['members','Membros',Users],['plans','Planos VIP',CreditCard],['orders','Pedidos',CreditCard],['settings','Configurações',Settings],['audit','Auditoria',Users],['tickets','Suporte',Headphones]] as const).map(([k,label,Icon])=>
        <button key={k} onClick={()=>setSection(k)} className={'flex items-center gap-2 rounded-xl px-3 py-2 text-sm '+(section===k?'bg-indigo-600':'hover:bg-slate-800')}><Icon size={16}/>{label}</button>)}
      <button className="flex items-center gap-2 rounded-xl p-2 text-sm" onClick={onLogout}><LogOut size={16}/> Sair</button>
    </aside>
    <main className="flex-1 overflow-auto p-4 md:p-7 space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">
        {section==='overview'?'Visão geral':section==='members'?'Gerenciamento de membros':section==='plans'?'Catálogo VIP':section==='orders'?'Pedidos pendentes':section==='audit'?'Auditoria administrativa':section==='tickets'?'Tickets de suporte':'Configurações'}
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
            <div><strong>#{m.id} {m.login}</strong><p className="text-xs text-slate-400">{m.display_name} · {m.status} · {m.plan_id}</p></div>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} className={btn} onClick={()=>
                void api<MemberDetails>('admin.member.details',undefined,{id:m.id})
                  .then(d=>{setDetails(d);setEditingMember({...d.member});setVerificationId(null);
                    setIdentityConfirmed(false);setNewMemberPassword('');setAdminPassword('');setVerificationReference('');})
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
          <button className="text-indigo-300 underline" onClick={()=>setDetails(null)}>Fechar detalhes</button>
        </div>}
        {editingMember && <form className="rounded-xl bg-[#1b2137] p-4 space-y-3"
          onSubmit={e=>{e.preventDefault();void change('admin.member.edit',{
            userId:editingMember.id,displayName:editingMember.display_name,
            email:editingMember.email,phone:details?.member.phone ?? '',walletAddress:details?.member.wallet_address ?? '',
          });setEditingMember(null);}}>
          <strong>Editar perfil de {editingMember.login}</strong>
          {(['display_name','email','phone','wallet_address'] as const).map(k=><label key={k} className="block text-sm">
            {({display_name:'Nome',email:'E-mail',phone:'Telefone',wallet_address:'Endereço BTC'} as const)[k]}
            <input className="w-full bg-[#11182c] p-3 rounded-lg mt-1" value={editingMember[k] ?? ''}
              onChange={e=>setEditingMember(m=>m?{...m,[k]:e.target.value}:m)}/>
          </label>)}
          <p className="text-xs text-slate-400">As credenciais e permissões administrativas não podem ser editadas por este formulário.</p>
          <button className={btn} disabled={busy}>Salvar perfil</button>
          <button type="button" className="ml-2 text-sm" onClick={()=>setEditingMember(null)}>Cancelar</button>
        </form>}
        {editingMember && <section className="rounded-xl bg-[#1b2137] p-4 space-y-3">
          <h3 className="font-bold text-sm">Redefinição administrativa de senha</h3>
          <p className="text-xs text-amber-300">Verifique a identidade do membro por meio independente antes de emitir a autorização. Não registre documentos, senhas ou dados sensíveis no campo de referência.</p>
          <select value={verificationMethod} onChange={e=>setVerificationMethod(e.target.value)}
            className="bg-[#11182c] w-full p-3 rounded-lg text-sm">
            <option value="known_contact">Contato já conhecido e confirmado</option>
            <option value="in_person">Verificação presencial</option>
            <option value="other_offline">Outro método independente</option>
          </select>
          <input value={verificationReference} onChange={e=>setVerificationReference(e.target.value)}
            placeholder="Referência da verificação realizada (mín. 6 caracteres)"
            className="w-full bg-[#11182c] p-3 rounded-lg text-sm"/>
          <input type="password" autoComplete="current-password"
            value={adminPassword} onChange={e=>setAdminPassword(e.target.value)}
            placeholder="Confirme sua senha de administrador" className="w-full bg-[#11182c] p-3 rounded-lg text-sm"/>
          <label className="text-xs flex gap-2 items-start"><input type="checkbox" checked={identityConfirmed}
            onChange={e=>setIdentityConfirmed(e.target.checked)}/>
            Confirmo ter verificado pessoalmente a identidade do membro por canal independente.</label>
          <button disabled={busy || !identityConfirmed} className={btn} onClick={()=>{
            if(!editingMember)return;
            setBusy(true);setNotice('');
            void api<{verificationId:number}>('admin.identity.verify',{
              userId:editingMember.id,verificationMethod,verificationReference,
              adminPassword,identityConfirmed
            }).then(result=>{setVerificationId(result.verificationId);setAdminPassword('');
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
        <p className="text-xs text-slate-400">As alterações afetam apenas futuras contratações; contratos existentes mantêm os valores da contratação.</p>
        <button className={btn} onClick={()=>setSelected({
          id:'VIP_CUSTOM',name:'Novo Plano VIP',revision:0,priceUsd:'0.00',dailyUsd:'0.00',
          bonusUsd:'0.00',bonusSatoshis:0,durationDays:30,sessionSeconds:0,restartCooldownSeconds:0,hashrate:'',serverModel:'',available:false
        })}>Criar novo plano</button>
        <div className="grid md:grid-cols-2 gap-3">{plans.map(p=><button key={p.id} onClick={()=>setSelected({...p})}
            className="text-left p-4 bg-[#1b2137] rounded-xl border border-[#2b3350]">
          <strong>{p.name}</strong><p className="text-sm">US$ {p.priceUsd} · US$ {p.dailyUsd}/dia · revisão {p.revision} · {p.available?'Disponível':'Arquivado'}</p></button>)}</div>
        {selected && <form onSubmit={e=>{
          e.preventDefault();void change('admin.plan.save',{
            id:selected.id,name:selected.name,
            priceCents:Math.round(Number(selected.priceUsd)*100),
            dailyCents:Math.round(Number(selected.dailyUsd)*100),
            bonusUsdCents:Math.round(Number(selected.bonusUsd)*100),
            bonusSatoshis:selected.bonusSatoshis,durationDays:selected.durationDays,
            sessionSeconds:selected.sessionSeconds,restartCooldownSeconds:selected.restartCooldownSeconds,
            hashrate:selected.hashrate,serverModel:selected.serverModel,available:selected.available,
          });setSelected(null);
        }} className="rounded-xl p-4 bg-[#1b2137] space-y-3">
          <strong>{selected.revision===0?'Cadastrar novo plano':'Editar '+selected.id}</strong>
          {selected.revision===0 && <label className="block text-sm">ID estável do plano
            <input required className="w-full bg-[#11182c] p-2 rounded-lg" value={selected.id}
              onChange={e=>setSelected(p=>p?{...p,id:e.target.value.toUpperCase()}:p)}/>
          </label>}
          {(['name','priceUsd','dailyUsd','bonusUsd','bonusSatoshis','durationDays','sessionSeconds','restartCooldownSeconds','hashrate','serverModel'] as const).map(k=>
            <label key={k} className="block text-sm">{k}
              <input value={selected[k]} type={typeof selected[k]==='number'?'number':'text'}
                onChange={e=>setSelected(p=>p?{...p,[k]:typeof p[k]==='number'?Number(e.target.value):e.target.value}:p)}
                className="w-full block mt-1 bg-[#11182c] p-2 rounded-lg"/>
            </label>)}
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={selected.available} onChange={e=>setSelected(p=>p?{...p,available:e.target.checked}:p)}/>Disponível para novas adesões</label>
          <button className={btn} disabled={busy}>Salvar nova revisão</button>
        </form>}
      </>}
      {section==='orders' && <div className="space-y-3">
        {orders.map(o=><article key={o.id} className="p-4 rounded-xl bg-[#1b2137] border border-[#2b3350] flex gap-4 flex-wrap justify-between">
          <div><strong>Pedido #{o.id} · {o.plan_id}</strong>
            <p className="text-xs text-slate-400">{o.login} · {o.status} · {(o.btc_sats/100000000).toFixed(8)} BTC</p>
            <p className="text-xs text-slate-400">Cotação: {o.quote_source || 'indisponível'}</p>
            {o.payment_ref && <p className="text-xs break-all">TXID: {o.payment_ref}</p>}
          </div>
          {o.status==='pending' && <button disabled={busy} className={btn} onClick={()=>{
            const txid = window.prompt('Informe o TXID da transferência BTC confirmada na blockchain (64 caracteres hexadecimais).');
            if (!txid) return;
            if(!/^[a-fA-F0-9]{64}$/.test(txid.trim())) {
              setNotice('TXID inválido. Nenhum plano foi ativado.');return;
            }
            if(window.confirm('Confirma que este TXID corresponde ao valor e ao endereço do pedido e que o pagamento foi verificado independentemente?')) {
              void change('admin.order.approve',{orderId:o.id,paymentConfirmed:true,paymentReference:txid.trim()});
            }
          }}>Confirmar pagamento e ativar</button>}
        </article>)}
      </div>}
      {section==='tickets' && <div className="space-y-3">
        {tickets.length===0 && <p className="text-sm text-slate-400">Nenhum ticket registrado.</p>}
        {tickets.map(t=><article key={t.id} className="p-4 rounded-xl bg-[#1b2137] border border-[#2b3350] space-y-2">
          <p className="font-bold text-sm">#{t.id} · {t.subject}</p>
          <p className="text-xs text-slate-400">{t.login} · {t.status} · notificação: {t.notification_status}</p>
          <p className="whitespace-pre-wrap text-sm">{t.message}</p>
          <p className="text-xs text-slate-400">{new Date(t.created_at*1000).toLocaleString('pt-BR')}</p>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} className={btn} onClick={()=>void change('admin.support.status',{
              ticketId:t.id,status:t.status==='open'?'resolved':'open'
            })}>{t.status==='open'?'Resolver':'Reabrir'}</button>
            <button disabled={busy} className={btn} onClick={()=>void change('admin.support.notify',{ticketId:t.id})}>
              Solicitar envio por e-mail
            </button>
          </div>
        </article>)}
      </div>}
      {section==='audit' && <div className="space-y-2">
        {audit.map(entry=><div key={entry.id} className="rounded-xl bg-[#1b2137] border border-[#2b3350] p-3 text-xs">
          {new Date(entry.created_at*1000).toLocaleString('pt-BR')} · {entry.action}
          · administrador #{entry.admin_id} · alvo #{entry.target_user_id ?? '-'}
        </div>)}
        {!audit.length && <p className="text-sm text-slate-400">Nenhuma ação registrada.</p>}
      </div>}
      {section==='settings' && <form onSubmit={e=>{e.preventDefault();void change('admin.settings',{supportEmail:email})}} className="space-y-3">
        <label className="block text-sm">E-mail de suporte
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
            className="w-full block mt-2 bg-[#1b2137] border border-[#2b3350] p-3 rounded-xl"/>
        </label><button disabled={busy} className={btn}>Salvar</button>
        <p className="text-xs text-amber-300">Instalador /install indisponível até confirmação da decisão técnica nº 13.</p>
      </form>}
    </main>
  </div>;
};
