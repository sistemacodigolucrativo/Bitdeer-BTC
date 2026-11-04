import React,{useEffect,useState} from 'react';
import {api,Plan} from '../../services/api';
import {LanguageCode} from '../../types';
import {adminText, adminStatus, adminDateLocale} from '../../i18n/adminTexts';

type Kind='accrual'|'bonus'|'purchase'|'withdrawal'|'subscription';
type Entry=Record<string,string|number|boolean|null|undefined>&{historyId:string;adminEdited:boolean;simulation:boolean};
type Data={
  histories:Record<Kind,Entry[]>;balanceUsd:string;balanceBtc:string|null;
  btcUsd:string|null;quoteSource:string|null;planId:string;simulation:boolean
};
const kinds:Record<Kind,string>={
  accrual:'Recompensas de mineração',bonus:'Bônus diários',purchase:'Compras na loja',
  withdrawal:'Solicitações de saque',subscription:'Assinaturas'
};
const fields:Record<Kind,string[]>={
  accrual:['plan_id','start_ts','end_ts','earned_units'],
  bonus:['plan_id','claimed_at','bonus_usd_units','bonus_satoshis'],
  purchase:['plan_id','status','created_at','btc_sats'],
  withdrawal:['plan_id','status','created_at','usd_cents','btc_satoshis'],
  subscription:['plan_id','started_at','expires_at']
};
const names:Record<string,string>={
  plan_id:'Plano',start_ts:'Início (data/hora)',end_ts:'Fim (data/hora)',
  earned_units:'Recompensa (unidades internas)',
  claimed_at:'Resgate (data/hora)',bonus_usd_units:'Bônus USD (unidades internas)',
  bonus_satoshis:'Satoshis internos',status:'Estado',created_at:'Registro (data/hora)',
  btc_sats:'Bitcoin equivalente (satoshis)',usd_cents:'Crédito interno (centavos)',
  started_at:'Ativação (data/hora)',expires_at:'Vencimento (data/hora)'
};
const dateFields=new Set(['start_ts','end_ts','claimed_at','created_at','started_at','expires_at']);
const statuses:Record<'purchase'|'withdrawal',string[]>={
  purchase:['pending','approved','rejected','expired'],
  withdrawal:['pending','approved','rejected','awaiting_vip']
};
function freshDraft(kind:Kind,planId:string):Record<string,string>{
  const at=Math.floor(Date.now()/1000);
  const defaultValues:Record<Kind,Record<string,number|string>>={
    accrual:{start_ts:at-3600,end_ts:at,earned_units:0},
    bonus:{claimed_at:at,bonus_usd_units:0,bonus_satoshis:0},
    purchase:{status:'pending',created_at:at,btc_sats:0},
    withdrawal:{status:'pending',created_at:at,usd_cents:0,btc_satoshis:0},
    subscription:{started_at:at-86400,expires_at:at}
  };
  return Object.fromEntries(Object.entries({plan_id:planId,...defaultValues[kind]}).map(([k,v])=>[k,String(v)]));
}
function dateInput(value:string):string{
  const d=new Date(Number(value)*1000);
  if(!Number.isFinite(d.getTime()))return '';
  const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
}
export const AdminMemberRecords:React.FC<{userId:number;plans:Plan[];language:LanguageCode;onChanged:()=>void}>=
({userId,plans,language,onChanged})=>{
  const tx=(portuguese:string)=>adminText(language,portuguese);
  const dateLocale=adminDateLocale(language);
  const [data,setData]=useState<Data|null>(null);
  const [kind,setKind]=useState<Kind>('accrual');
  const [draft,setDraft]=useState<Record<string,string>|null>(null);
  const [historyId,setHistoryId]=useState('');
  const [planId,setPlanId]=useState('FREE');
  const [currency,setCurrency]=useState<'USD'|'BTC'>('USD');
  const [mode,setMode]=useState<'set'|'add'|'subtract'|'clear'>('set');
  const [amount,setAmount]=useState('');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  async function load(){
    try{
      const response=await api<Data>('admin.member.history',undefined,{id:userId});
      setData(response);setPlanId(response.planId);setNotice('');
    }catch(e){setNotice((e as Error).message)}
  }
  useEffect(()=>{setData(null);setDraft(null);void load()},[userId]);
  async function submit(action:string,body:Record<string,unknown>){
    setBusy(true);setNotice('');
    try{await api(action,{userId,...body});await load();onChanged();setNotice(tx("Alteração salva no SQLite."));setDraft(null);}
    catch(e){setNotice((e as Error).message)}
    finally{setBusy(false)}
  }
  function begin(entry?:Entry){
    const row=entry?Object.fromEntries(fields[kind].map(k=>[k,String(entry[k]??'')])):
      freshDraft(kind,data?.planId||'FREE');
    setDraft(row);setHistoryId(entry?.historyId||'');
  }
  function save(e:React.FormEvent){
    e.preventDefault();if(!draft)return;
    void submit('admin.member.history.save',{
      kind,operation:historyId?'update':'create',historyId,
      fields:Object.fromEntries(fields[kind].map(k=>[k, Number.isFinite(Number(draft[k]))&&
        !['plan_id','status'].includes(k)?Number(draft[k]):draft[k]]))
    });
  }
  function remove(entry:Entry){
    if(!window.confirm(tx("Remover este registro do histórico?")))return;
    void submit('admin.member.history.save',{kind,operation:'delete',historyId:entry.historyId,fields:{}});
  }
  const fieldClass='w-full mt-1 rounded-lg bg-[#11182c] border border-[#303a56] p-2 text-xs';
  return <section data-testid="admin-member-records" className="rounded-xl bg-[#1b2137] border border-[#303a56] p-4 space-y-4">
    <header><h3 className="font-bold">{tx('Plano, saldo e históricos do membro')} #{userId}</h3></header>
    {notice&&<p role="status" className="text-xs text-amber-300">{notice}</p>}
    {!data?<p className="text-xs text-slate-400">{tx("Carregando...")}</p>:<>
      <div className="border-t border-[#303a56] pt-3 space-y-2">
        <h4 className="font-bold text-sm">{tx("Alterar plano em uso")}</h4>
        <div className="flex flex-wrap gap-2">
          <select data-testid="admin-member-plan" className={fieldClass+' flex-1 min-w-32'}
            value={planId} onChange={e=>setPlanId(e.target.value)}>
            {plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="button" disabled={busy||planId===data.planId}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs disabled:opacity-50"
            onClick={()=>{
              if(window.confirm(language==='en'
                ? 'Apply plan '+planId+' to member? The current mining session and active contract will end.'
                : language==='es'
                ? '¿Aplicar el plan '+planId+' al miembro? Terminará la sesión de minería y el contrato vigente.'
                : 'Aplicar plano '+planId+' ao membro? A sessão de mineração atual será encerrada e o contrato vigente será finalizado.'))
                void submit('admin.member.plan.assign',{planId});
            }}>{tx("Aplicar plano")}</button>
        </div>
        <p className="text-[11px] text-slate-400">{tx("Atual:")} {data.planId}. {tx('Atribuição sem simular pagamento real; mantém o histórico contratual anterior.')}</p>
      </div>
      <div className="border-t border-[#303a56] pt-3 space-y-2">
        <h4 className="font-bold text-sm">{tx("Saldo interno (USD e BTC equivalente)")}</h4>
        <p className="font-mono text-sm" data-testid="admin-member-balance">US$ {data.balanceUsd} · {data.balanceBtc??'—'} BTC</p>
        <p className="text-xs text-slate-400">{data.btcUsd?tx('Cotação BTC/USD: US</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select className={fieldClass} value={currency} onChange={e=>{setCurrency(e.target.value as 'USD'|'BTC');setAmount('');}}>
            <option value="USD">{tx("Dólar (USD)")}</option><option value="BTC">Bitcoin (BTC)</option>
          </select>
          <select className={fieldClass} value={mode} onChange={e=>setMode(e.target.value as typeof mode)}>
            <option value="set">{tx("Definir total")}</option><option value="add">{tx("Adicionar")}</option>
            <option value="subtract">{tx("Remover")}</option><option value="clear">{tx("Zerar")}</option>
          </select>
          <input data-testid="admin-member-balance-amount" className={fieldClass} type="number"
            min="0" step={currency==='USD'?'0.01':'0.00000001'}
            value={amount} onChange={e=>setAmount(e.target.value)}
            placeholder={currency==='USD'?'0.00':'0.00000000'} disabled={mode==='clear'}/>
          <button data-testid="admin-member-balance-save" type="button" disabled={busy||!data.btcUsd||(!amount&&mode!=='clear')}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs disabled:opacity-50"
            onClick={()=>{
              if(window.confirm(tx("Confirmar ajuste do saldo interno? A operação será registrada na auditoria.")))
                void submit('admin.member.balance.adjust',{currency,mode,amount:mode==='clear'?'0':amount});
            }}>{tx("Salvar saldo")}</button>
        </div>
        <p className="text-[11px] text-slate-400">{tx("O BTC é equivalência do saldo USD na cotação atual, não uma carteira na blockchain.")}</p>
      </div>
      <div className="border-t border-[#303a56] pt-3 space-y-3">
        <h4 className="font-bold text-sm">{tx("Adicionar, editar ou ocultar históricos")}</h4>
        <select data-testid="admin-history-kind" value={kind} className={fieldClass}
          onChange={e=>{setKind(e.target.value as Kind);setDraft(null);}}>
          {(Object.keys(kinds) as Kind[]).map(k=><option key={k} value={k}>{tx(kinds[k])}</option>)}
        </select>
        <button type="button" disabled={busy} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs"
          onClick={()=>begin()}>{tx("Adicionar registro")}</button>
        {draft&&<form data-testid="admin-history-form" className="rounded-lg bg-[#11182c] border border-[#303a56] p-3 space-y-2"
          onSubmit={save}>
          <p className="text-xs font-semibold">{tx(historyId?'Editar':'Adicionar')} — {tx(kinds[kind])}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fields[kind].map(key=><label key={key} className="text-xs block">{tx(names[key]||key)}
              {key==='plan_id'?<select required className={fieldClass} value={draft[key]||''}
                  onChange={e=>setDraft(d=>d?{...d,[key]:e.target.value}:d)}>
                  {plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>:key==='status'?<select required className={fieldClass} value={draft[key]||''}
                    onChange={e=>setDraft(d=>d?{...d,[key]:e.target.value}:d)}>
                    {statuses[kind as 'purchase'|'withdrawal'].map(x=><option key={x} value={x}>{adminStatus(language,x)}</option>)}
                  </select>:dateFields.has(key)?<input required className={fieldClass}
                    type="datetime-local" value={dateInput(draft[key]||'0')}
                    onChange={e=>setDraft(d=>d?{...d,[key]:String(Math.floor(new Date(e.target.value).getTime()/1000))}:d)}/>:
                <input required type="number" min="0" step="1" className={fieldClass}
                  value={draft[key]||'0'}
                  onChange={e=>setDraft(d=>d?{...d,[key]:e.target.value}:d)}/>}
            </label>)}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs">{tx("Salvar registro")}</button>
            <button type="button" className="text-xs underline" onClick={()=>setDraft(null)}>{tx("Cancelar")}</button>
          </div>
        </form>}
        <div data-testid="admin-history-rows" className="space-y-2 max-h-72 overflow-auto">
          {data.histories[kind].map(entry=><div key={entry.historyId}
            className="bg-[#11182c] border border-[#303a56] rounded-lg p-2 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2"><strong>{entry.historyId}</strong></div>
            <p className="break-words text-slate-300">{fields[kind].map(k=>
              tx(names[k]||k)+': '+(dateFields.has(k)?new Date(Number(entry[k])*1000).toLocaleString(dateLocale):k==='status'?adminStatus(language,String(entry[k]??'')):String(entry[k]??''))).join(' · ')}</p>
            <div className="flex gap-3">
              <button type="button" className="text-indigo-300 underline" onClick={()=>begin(entry)}>{tx("Editar")}</button>
              <button type="button" className="text-rose-300 underline" onClick={()=>remove(entry)}>{tx("Remover")}</button>
            </div>
          </div>)}
          {!data.histories[kind].length&&<p className="text-xs text-slate-400">{tx("Nenhum registro neste histórico.")}</p>}
        </div>
      </div>
    </>}
  </section>;
};
)+' '+data.btcUsd+' · '+(data.quoteSource||''):tx('Cotação indisponível; ajustes bloqueados.')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select className={fieldClass} value={currency} onChange={e=>{setCurrency(e.target.value as 'USD'|'BTC');setAmount('');}}>
            <option value="USD">{tx("Dólar (USD)")}</option><option value="BTC">Bitcoin (BTC)</option>
          </select>
          <select className={fieldClass} value={mode} onChange={e=>setMode(e.target.value as typeof mode)}>
            <option value="set">{tx("Definir total")}</option><option value="add">{tx("Adicionar")}</option>
            <option value="subtract">{tx("Remover")}</option><option value="clear">{tx("Zerar")}</option>
          </select>
          <input data-testid="admin-member-balance-amount" className={fieldClass} type="number"
            min="0" step={currency==='USD'?'0.01':'0.00000001'}
            value={amount} onChange={e=>setAmount(e.target.value)}
            placeholder={currency==='USD'?'0.00':'0.00000000'} disabled={mode==='clear'}/>
          <button data-testid="admin-member-balance-save" type="button" disabled={busy||!data.btcUsd||(!amount&&mode!=='clear')}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs disabled:opacity-50"
            onClick={()=>{
              if(window.confirm(tx("Confirmar ajuste do saldo interno? A operação será registrada na auditoria.")))
                void submit('admin.member.balance.adjust',{currency,mode,amount:mode==='clear'?'0':amount});
            }}>{tx("Salvar saldo")}</button>
        </div>
        <p className="text-[11px] text-slate-400">{tx("O BTC é equivalência do saldo USD na cotação atual, não uma carteira na blockchain.")}</p>
      </div>
      <div className="border-t border-[#303a56] pt-3 space-y-3">
        <h4 className="font-bold text-sm">{tx("Adicionar, editar ou ocultar históricos")}</h4>
        <select data-testid="admin-history-kind" value={kind} className={fieldClass}
          onChange={e=>{setKind(e.target.value as Kind);setDraft(null);}}>
          {(Object.keys(kinds) as Kind[]).map(k=><option key={k} value={k}>{tx(kinds[k])}</option>)}
        </select>
        <button type="button" disabled={busy} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs"
          onClick={()=>begin()}>{tx("Adicionar registro")}</button>
        {draft&&<form data-testid="admin-history-form" className="rounded-lg bg-[#11182c] border border-[#303a56] p-3 space-y-2"
          onSubmit={save}>
          <p className="text-xs font-semibold">{tx(historyId?'Editar':'Adicionar')} — {tx(kinds[kind])}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fields[kind].map(key=><label key={key} className="text-xs block">{tx(names[key]||key)}
              {key==='plan_id'?<select required className={fieldClass} value={draft[key]||''}
                  onChange={e=>setDraft(d=>d?{...d,[key]:e.target.value}:d)}>
                  {plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>:key==='status'?<select required className={fieldClass} value={draft[key]||''}
                    onChange={e=>setDraft(d=>d?{...d,[key]:e.target.value}:d)}>
                    {statuses[kind as 'purchase'|'withdrawal'].map(x=><option key={x} value={x}>{adminStatus(language,x)}</option>)}
                  </select>:dateFields.has(key)?<input required className={fieldClass}
                    type="datetime-local" value={dateInput(draft[key]||'0')}
                    onChange={e=>setDraft(d=>d?{...d,[key]:String(Math.floor(new Date(e.target.value).getTime()/1000))}:d)}/>:
                <input required type="number" min="0" step="1" className={fieldClass}
                  value={draft[key]||'0'}
                  onChange={e=>setDraft(d=>d?{...d,[key]:e.target.value}:d)}/>}
            </label>)}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs">{tx("Salvar registro")}</button>
            <button type="button" className="text-xs underline" onClick={()=>setDraft(null)}>{tx("Cancelar")}</button>
          </div>
        </form>}
        <div data-testid="admin-history-rows" className="space-y-2 max-h-72 overflow-auto">
          {data.histories[kind].map(entry=><div key={entry.historyId}
            className="bg-[#11182c] border border-[#303a56] rounded-lg p-2 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2"><strong>{entry.historyId}</strong></div>
            <p className="break-words text-slate-300">{fields[kind].map(k=>
              tx(names[k]||k)+': '+(dateFields.has(k)?new Date(Number(entry[k])*1000).toLocaleString(dateLocale):k==='status'?adminStatus(language,String(entry[k]??'')):String(entry[k]??''))).join(' · ')}</p>
            <div className="flex gap-3">
              <button type="button" className="text-indigo-300 underline" onClick={()=>begin(entry)}>{tx("Editar")}</button>
              <button type="button" className="text-rose-300 underline" onClick={()=>remove(entry)}>{tx("Remover")}</button>
            </div>
          </div>)}
          {!data.histories[kind].length&&<p className="text-xs text-slate-400">{tx("Nenhum registro neste histórico.")}</p>}
        </div>
      </div>
    </>}
  </section>;
};
