import React, { useEffect, useState } from 'react';
import { AuthUser, Plan, api } from '../../services/api';
import { LogOut, RefreshCw, Users, CreditCard, Settings } from 'lucide-react';

type Member = {id: number; login: string; display_name: string; email: string; status: string; balance_units: number};
type Order = {id:number; user_id:number; login:string; plan_id:string; status:string; created_at:number};
export const AdminWorkspace: React.FC<{user:AuthUser;onLogout:()=>void}> = ({user,onLogout}) => {
  const [section,setSection]=useState<'members'|'plans'|'orders'|'settings'>('members');
  const [members,setMembers]=useState<Member[]>([]);
  const [plans,setPlans]=useState<Plan[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [filter,setFilter]=useState('');
  const [email,setEmail]=useState('');
  const [selected,setSelected]=useState<Plan|null>(null);
  const [notice,setNotice]=useState('');
  const [editingMember,setEditingMember]=useState<Member|null>(null);
  const [busy,setBusy]=useState(false);
  async function refresh() {
    try {
      const [m,p,o,s]=await Promise.all([
        api<{members:Member[]}>('admin.members'),
        api<{plans:Plan[]}>('plans'),
        api<{orders:Order[]}>('admin.orders'),
        api<{email:string}>('support'),
      ]);
      setMembers(m.members);setPlans(p.plans);setOrders(o.orders);setEmail(s.email);
    } catch(e) {setNotice((e as Error).message);}
  }
  useEffect(()=>{void refresh()},[]);
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
      {([['members','Membros',Users],['plans','Planos VIP',CreditCard],['orders','Pedidos',CreditCard],['settings','Configurações',Settings]] as const).map(([k,label,Icon])=>
        <button key={k} onClick={()=>setSection(k)} className={'flex items-center gap-2 rounded-xl px-3 py-2 text-sm '+(section===k?'bg-indigo-600':'hover:bg-slate-800')}><Icon size={16}/>{label}</button>)}
      <button className="flex items-center gap-2 rounded-xl p-2 text-sm" onClick={onLogout}><LogOut size={16}/> Sair</button>
    </aside>
    <main className="flex-1 overflow-auto p-4 md:p-7 space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">
        {section==='members'?'Gerenciamento de membros':section==='plans'?'Catálogo VIP':section==='orders'?'Pedidos pendentes':'Configurações'}
      </h1><button aria-label="Atualizar" onClick={()=>void refresh()}><RefreshCw size={18}/></button></div>
      {notice && <p role="status" className="bg-[#292a40] p-3 rounded-lg text-amber-300 text-sm">{notice}</p>}
      {section==='members' && <>
        <input placeholder="Filtrar membros" value={filter} onChange={e=>setFilter(e.target.value)}
          className="bg-[#1b2137] p-3 rounded-xl w-full border border-[#2b3350]"/>
        <div className="space-y-3">{members.filter(m=>(m.login+' '+m.display_name).toLowerCase().includes(filter.toLowerCase())).map(m=>
          <article key={m.id} className="rounded-xl p-4 bg-[#1b2137] border border-[#2b3350] flex flex-wrap gap-4 items-center justify-between">
            <div><strong>#{m.id} {m.login}</strong><p className="text-xs text-slate-400">{m.display_name} · {m.status}</p></div>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} className={btn} onClick={()=>setEditingMember({...m})}>Editar</button>
              {m.status==='active' && <button disabled={busy} className={btn} onClick={()=>void change('admin.status',{userId:m.id,status:'suspended'})}>Suspender</button>}
              {m.status==='suspended' && <button disabled={busy} className={btn} onClick={()=>void change('admin.status',{userId:m.id,status:'active'})}>Reativar</button>}
              {m.status!=='archived' && <button disabled={busy} className={btn} onClick={()=>{
                if(window.confirm('Arquivar conta e preservar histórico?'))void change('admin.status',{userId:m.id,status:'archived'});
              }}>Arquivar</button>}
              {m.status==='archived' && <button disabled={busy} className={btn} onClick={()=>void change('admin.status',{userId:m.id,status:'active'})}>Restaurar</button>}
            </div>
          </article>)}</div>
        {editingMember && <form className="rounded-xl bg-[#1b2137] p-4 space-y-3"
          onSubmit={e=>{e.preventDefault();void change('admin.member.edit',{
            userId:editingMember.id,displayName:editingMember.display_name,
            email:editingMember.email,
          });setEditingMember(null);}}>
          <strong>Editar perfil de {editingMember.login}</strong>
          {(['display_name','email'] as const).map(k=><label key={k} className="block text-sm">
            {k==='display_name'?'Nome':'E-mail'}
            <input className="w-full bg-[#11182c] p-3 rounded-lg mt-1" value={editingMember[k]}
              onChange={e=>setEditingMember(m=>m?{...m,[k]:e.target.value}:m)}/>
          </label>)}
          <p className="text-xs text-slate-400">Os campos não exibidos serão preservados sem alterações.</p>
          <button className={btn} disabled={busy}>Salvar perfil</button>
          <button type="button" className="ml-2 text-sm" onClick={()=>setEditingMember(null)}>Cancelar</button>
        </form>}
        <p className="text-xs text-slate-400">Redefinição de senha bloqueada até aprovação do procedimento de verificação de identidade.</p>
      </>}
      {section==='plans' && <>
        <p className="text-xs text-slate-400">As alterações afetam apenas futuras contratações; contratos existentes mantêm os valores da contratação.</p>
        <button className={btn} onClick={()=>setSelected({
          id:'VIP_CUSTOM',name:'Novo Plano VIP',revision:0,priceUsd:'0.00',dailyUsd:'0.00',
          bonusUsd:'0.00',bonusSatoshis:0,durationDays:30,sessionSeconds:0,restartCooldownSeconds:0,hashrate:'',serverModel:'',available:false
        })}>Criar novo plano</button>
        <div className="grid md:grid-cols-2 gap-3">{plans.map(p=><button key={p.id} onClick={()=>setSelected({...p})}
            className="text-left p-4 bg-[#1b2137] rounded-xl border border-[#2b3350]">
          <strong>{p.name}</strong><p className="text-sm">US$ {p.priceUsd} · US$ {p.dailyUsd}/dia · revisão {p.revision}</p></button>)}</div>
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
          <div><strong>Pedido #{o.id} · {o.plan_id}</strong><p className="text-xs text-slate-400">{o.login} · {o.status}</p></div>
          {o.status==='pending' && <button disabled={busy} className={btn} onClick={()=>{
            if(window.confirm('Você verificou o pagamento deste pedido de forma independente? Apenas confirme se o pagamento foi realmente recebido.')) {
              void change('admin.order.approve',{orderId:o.id,paymentConfirmed:true});
            }
          }}>Confirmar pagamento e ativar</button>}
        </article>)}
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
