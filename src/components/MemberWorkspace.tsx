import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AuthUser, MemberData, Plan, api } from '../services/api';
import { CustomerSupportView } from './workspace/CustomerSupportView';
import { WalletRequiredModal } from './workspace/WalletRequiredModal';
import { LanguageCode } from '../types';
import { Home, Store, User, Headphones, LogOut, Wallet, Gift, Settings, Trophy, ScrollText, ArrowLeft, Crown, LockKeyhole } from 'lucide-react';
import { translations } from '../i18n/translations';
import QRCode from 'qrcode';
import { ServerHomeView } from './ServerHomeView';
import { ServerStoreView } from './ServerStoreView';
import { ServerWalletView } from './ServerWalletView';
import { MockPaymentFeed } from './MockPaymentFeed';
import { formatInternationalPhone, normalizeInternationalPhone, validInternationalPhone } from '../utils/phone';
import { projectInternalBalance } from '../utils/projectInternalBalance';
import { ServerRewardView } from './ServerRewardView';
import { RewardHistoryLog } from './RewardHistoryLog';
import { TopMinersView } from './workspace/TopMinersView';
import { SubscriptionHistoryView } from './workspace/SubscriptionHistoryView';
import { memberTexts } from '../i18n/memberTexts';
import { memberViewCopy } from '../i18n/memberViewCopy';
import { NewInvestorToast } from './NewInvestorToast';
import { useProjectCopy } from '../i18n/copyMode';
import { readLastKnownQuote, saveLastKnownQuote } from '../utils/lastKnownQuote';
import { PaymentInstructionsCard } from './PaymentInstructionsCard';
import type { PaymentInstructionsOrder } from './PaymentInstructionsCard';

type Page = 'home' | 'store' | 'reward' | 'wallet' | 'settings' | 'profile' | 'support' | 'history' | 'topMiners' | 'subscriptions' | 'withdraw';
type PurchaseOrder = PaymentInstructionsOrder & {status:string;createdAt:number};
type PurchaseHistoryOrder = {
  id:number|string;plan_id:string;status:string;created_at:number;btc_sats:number;
  expires_at?:number;can_pay?:boolean;native_order?:boolean;
  proof_url?:string|null;proof_submitted_at?:number|null;
};
const memberWalletStorageKey=(userId:number)=>`bitdeer:member-wallet:${userId}`;
function readMemberWalletAddress(userId:number):string {
  try {
    return window.localStorage.getItem(memberWalletStorageKey(userId))?.trim()??'';
  } catch {
    return '';
  }
}
function cacheMemberWalletAddress(userId:number,address:string):void {
  try {
    const key=memberWalletStorageKey(userId);
    const value=address.trim();
    if(value)window.localStorage.setItem(key,value);
  } catch {
    // The server profile remains authoritative if local storage is unavailable.
  }
}
function removeMemberWalletAddress(userId:number):void {
  try {
    window.localStorage.removeItem(memberWalletStorageKey(userId));
  } catch {
    // The server profile remains authoritative if local storage is unavailable.
  }
}
export const MemberWorkspace: React.FC<{
  user: AuthUser; language: LanguageCode; onLogout: () => void;
  onChangeLanguage: (lang:LanguageCode)=>void;
}> = ({user, language, onLogout, onChangeLanguage}) => {
  const [page, setPage] = useState<Page>('home');
  const tabNames = translations[language].tabs;
  const words = memberTexts[language] || memberTexts.pt;
  const tr = memberViewCopy[language];
  const { copy: copyText, mockupMode } = useProjectCopy(language);
  const dateLocale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  const [account, setAccount] = useState<MemberData | null>(null);
  const [balanceTick,setBalanceTick] = useState(Date.now());
  const [lastSnapshotReceivedAt,setLastSnapshotReceivedAt] = useState(Date.now());
  const acceptSnapshot=(data:MemberData)=>{
    cacheMemberWalletAddress(data.user.id,data.profile.walletAddress);
    setLastSnapshotReceivedAt(Date.now());
    setAccount(data);
  };
  const [plans, setPlans] = useState<Plan[]>([]);
  const [checkout, setCheckout] = useState<PurchaseOrder|null>(null);
  const [checkoutQr, setCheckoutQr] = useState('');
  const [checkoutCopied,setCheckoutCopied]=useState<'address'|'btc'|null>(null);
  const [proofLink,setProofLink]=useState('');
  const [proofSaving,setProofSaving]=useState(false);
  const [ledger, setLedger] = useState<{
    accruals: Array<{plan_id:string;start_ts:number;end_ts:number;earned_units:number}>;
    bonuses: Array<{plan_id:string;claimed_at:number;bonus_usd_units:number;bonus_satoshis:number}>;
  }>({accruals:[],bonuses:[]});
  const [profile, setProfile] = useState({displayName:'',email:'',phone:'',avatarUrl:'',avatarLocked:false,walletAddress:''});
  const [avatarModal,setAvatarModal]=useState(false);
  const [avatarDraft,setAvatarDraft]=useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [savedToast,setSavedToast]=useState('');
  const [savedToastVisible,setSavedToastVisible]=useState(false);
  const savedToastTimer=useRef<number|undefined>(undefined);
  const savedToastClearTimer=useRef<number|undefined>(undefined);
  const showSavedToast=()=>{
    if(savedToastTimer.current!==undefined)window.clearTimeout(savedToastTimer.current);
    if(savedToastClearTimer.current!==undefined)window.clearTimeout(savedToastClearTimer.current);
    setSavedToast(words.saved);
    setSavedToastVisible(true);
    savedToastTimer.current=window.setTimeout(()=>setSavedToastVisible(false),2200);
    savedToastClearTimer.current=window.setTimeout(()=>setSavedToast(''),2500);
  };
  useEffect(()=>{
    if(page==='home'&&notice===words.saved){
      setNotice('');
      showSavedToast();
    }
  },[page,notice,words.saved]);
  const [btcUsd,setBtcUsd]=useState<number|null>(()=>readLastKnownQuote()?.rate??null);
  const [quotePhase,setQuotePhase]=useState<'loading'|'ready'|'unavailable'>('loading');
  const [btcQuote,setBtcQuote]=useState<{source:string;quotedAt:number}|null>(()=>{
    const quote=readLastKnownQuote();
    return quote?{source:quote.source,quotedAt:quote.quotedAt}:null;
  });
  const [walletStep,setWalletStep]=useState<'none'|'register'|'amount'>('none');
  const [walletPromptDismissed,setWalletPromptDismissed]=useState(false);
  const walletOriginPage=useRef<Page>('home');
  const navigateToPage=(target:Page)=>{
    if(target==='wallet'&&page!=='wallet'){
      walletOriginPage.current=page;
      setWalletPromptDismissed(false);
    }
    setPage(target);
  };
  const [walletDraft,setWalletDraft]=useState('');
  const [walletConfirmation,setWalletConfirmation]=useState(false);
  const [withdrawMode,setWithdrawMode]=useState<'BTC'|'USD'>('USD');
  const [withdrawAmount,setWithdrawAmount]=useState('');
  const [withdrawEdited,setWithdrawEdited]=useState(false);
  const [withdrawPopup,setWithdrawPopup]=useState<{recommended:string}|null>(null);
  const [storeRecommended,setStoreRecommended]=useState<string|null>(null);
  const [purchaseHistory,setPurchaseHistory]=useState<PurchaseHistoryOrder[]>([]);
  type WithdrawRequest={id:number|string;usd_cents:number;btc_satoshis:number;status:'pending'|'awaiting_vip'|'approved'|'rejected'|'failed';created_at:number;reason?:string;adminEdited?:boolean;simulation?:boolean};
  const [withdrawHistory,setWithdrawHistory]=useState<WithdrawRequest[]>([]);
  const [withdrawPage,setWithdrawPage]=useState(1);
  const withdrawPages=Math.max(1,Math.ceil(withdrawHistory.length/10));
  const currentWithdrawPage=Math.min(withdrawPage,withdrawPages);
  useEffect(()=>()=> {
    if(savedToastTimer.current!==undefined)window.clearTimeout(savedToastTimer.current);
    if(savedToastClearTimer.current!==undefined)window.clearTimeout(savedToastClearTimer.current);
  },[]);
  const checkoutSecondsRemaining=checkout
    ? Math.max(0,checkout.expiresAt-Math.floor(balanceTick/1000))
    : 0;
  const visibleWithdrawHistory=useMemo(()=>[...withdrawHistory]
    .sort((a,b)=>Number(b.created_at)-Number(a.created_at)||Number(b.id)-Number(a.id))
    .slice((currentWithdrawPage-1)*10,currentWithdrawPage*10),
    [withdrawHistory,currentWithdrawPage]);
  // The PHP/SQLite profile is authoritative. Only complete USD cents can be
  // requested; fractional accruals are not counted as withdrawable cents.
  // The BTC figure is a quote-based equivalent of that very same USD balance,
  // not a separately held on-chain Bitcoin balance.
  const liveBalanceUsd = projectInternalBalance(account,lastSnapshotReceivedAt,balanceTick);
  const freshBtcUsd=btcQuote && balanceTick/1000-btcQuote.quotedAt>=0 &&
    balanceTick/1000-btcQuote.quotedAt<60 && btcUsd!==null && btcUsd>0 ? btcUsd : null;
  // Display the last successfully verified quote across temporary outages.
  // Strict freshness is still required for withdrawals (validQuote below).
  const displayBtcUsd=btcUsd!==null&&Number.isFinite(btcUsd)&&btcUsd>0?btcUsd:null;
  const liveBtc=displayBtcUsd===null ? null : (liveBalanceUsd/displayBtcUsd).toFixed(8);
  const quoteStatus=freshBtcUsd!==null?'ready':quotePhase==='loading'?'loading':'unavailable';
  const availableUsdCents=Math.max(0,Math.floor((account?.mining.balanceUnits??0)/8640000));
  const validQuote=freshBtcUsd!==null && Number.isFinite(freshBtcUsd) && freshBtcUsd>0 &&
    btcQuote!==null && Date.now()/1000-btcQuote.quotedAt>=0 &&
    Date.now()/1000-btcQuote.quotedAt<60;
  const availableBtcSatoshis=validQuote&&freshBtcUsd!==null
    ? Math.floor(availableUsdCents/100*100000000/freshBtcUsd)
    : null;
  const availableAmount=withdrawMode==='USD'
    ? 'USD '+new Intl.NumberFormat(dateLocale,{minimumFractionDigits:2,maximumFractionDigits:2})
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
    if (!checkout) {setCheckoutQr('');setCheckoutCopied(null);return;}
    const bip21='bitcoin:'+checkout.btcAddress+'?amount='+checkout.btcAmount;
    let active=true;
    QRCode.toDataURL(bip21,{width:200,margin:1})
      .then(uri=>{if(active)setCheckoutQr(uri)})
      .catch(()=>{if(active)setCheckoutQr('')});
    return ()=>{active=false};
  },[checkout]);
  async function copy(value:string,field?:'address'|'btc') {
    try {
      await navigator.clipboard.writeText(value);
      if(field){
        setCheckoutCopied(field);
        window.setTimeout(()=>setCheckoutCopied(null),1600);
      } else setNotice(words.copied);
    }
    catch {setNotice(words.copyFailed);}
  }
  async function refreshPurchaseHistory() {
    const result=await api<{orders:PurchaseHistoryOrder[]}>('orders.mine');
    setPurchaseHistory(result.orders);
  }
  async function reload() {
    try {
      const data = await api<MemberData>('profile');
      acceptSnapshot(data); setProfile({...data.profile,phone:formatInternationalPhone(data.profile.phone)});
    } catch(e) { setNotice((e as Error).message); }
  }
  function refreshQuote():Promise<boolean> {
    setQuotePhase('loading');
    return api<{btcUsd:string;source:string;quotedAt:number}>('withdraw.quote')
      .then(x=>{
        const rate=Number(x.btcUsd);
        if(!Number.isFinite(rate)||rate<=0||!Number.isFinite(x.quotedAt)||
           x.quotedAt<=0||x.quotedAt>Date.now()/1000+60)
          throw new Error('Invalid server BTC/USD quote');
        setBtcUsd(rate);
        setBtcQuote({source:x.source,quotedAt:x.quotedAt});
        saveLastKnownQuote(rate,x.source,x.quotedAt);
        setQuotePhase('ready');
        return true;
      }).catch(()=>{
        // Do not clear the last known quote; never use it for transfers.
        setQuotePhase('unavailable');
        return false;
      });
  }
  useEffect(()=>{
    let stopped=false;
    let pending=false;
    let failures=0;
    let retry:number|undefined;
    const run=async()=>{
      if(stopped||pending)return;
      if(document.visibilityState==='hidden'){
        retry=window.setTimeout(()=>{void run();},45000);
        return;
      }
      pending=true;
      const succeeded=await refreshQuote();
      pending=false;
      failures=succeeded?0:failures+1;
      if(!stopped){
        const delay=succeeded?45000:Math.min(60000,5000*2**Math.min(failures-1,4));
        retry=window.setTimeout(()=>{void run();},delay);
      }
    };
    const onVisibility=()=>{
      if(document.visibilityState==='visible'&&!pending){
        if(retry!==undefined)window.clearTimeout(retry);
        void run();
      }
    };
    void run();
    document.addEventListener('visibilitychange',onVisibility);
    return ()=>{
      stopped=true;
      if(retry!==undefined)window.clearTimeout(retry);
      document.removeEventListener('visibilitychange',onVisibility);
    };
  },[]);
  useEffect(()=>{
    if(page==='wallet') {
      let stopped=false;
      let pending=false;
      const load=async()=>{
        if(stopped||pending||document.visibilityState==='hidden')return;
        pending=true;
        try{
          const result=await api<{requests:WithdrawRequest[]}>('withdraw.mine');
          if(!stopped)setWithdrawHistory(result.requests);
        }catch{}
        finally{pending=false;}
      };
      void load();
      const timer=window.setInterval(()=>void load(),60_000);
      const onVisibility=()=>{if(document.visibilityState==='visible')void load();};
      document.addEventListener('visibilitychange',onVisibility);
      return ()=>{
        stopped=true;
        window.clearInterval(timer);
        document.removeEventListener('visibilitychange',onVisibility);
      };
    }
    if(page!=='store')return;
    let stopped=false;
    let pending=false;
    const load=async()=>{
      if(stopped||pending||document.visibilityState==='hidden')return;
      pending=true;
      try{
        const result=await api<{orders:PurchaseHistoryOrder[]}>('orders.mine');
        if(!stopped)setPurchaseHistory(result.orders);
      }catch{}
      finally{pending=false;}
    };
    const onVisibility=()=>{if(document.visibilityState==='visible')void load();};
    void load();
    const timer=window.setInterval(()=>void load(),15000);
    document.addEventListener('visibilitychange',onVisibility);
    return ()=>{
      stopped=true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange',onVisibility);
    };
  },[page]);
  async function registerRequiredWallet(walletAddress:string):Promise<void>{
    if(!account)throw new Error('Member profile unavailable');
    // Reuse the existing PHP validation and SQLite persistence.
    await api('profile.update',{
      displayName:account.profile.displayName,
      email:account.profile.email,
      phone:account.profile.phone,
      walletAddress
    });
    const saved=await api<MemberData>('profile');
    if(saved.profile.walletAddress!==walletAddress)
      throw new Error('Wallet registration could not be verified');
    acceptSnapshot(saved);
    setProfile({...saved.profile,phone:formatInternationalPhone(saved.profile.phone)});
    setWalletDraft(saved.profile.walletAddress);
    setWalletStep('none');
  }
  async function saveWalletForWithdrawal(){
    if(!walletConfirmation){setWalletConfirmation(true);return;}
    setBusy(true);setNotice('');
    try{
      await api('profile.update',{...profile,walletAddress:walletDraft});
      await reload();
      setWalletStep('none');
      setWalletConfirmation(false);
      setPage('wallet');
      setNotice(words.saved);
    }catch(e){setNotice((e as Error).message);}
    finally{setBusy(false);}
  }
  async function submitWithdrawal(){
    setBusy(true);setNotice('');
    try{
      const result=await api<{id:number;status:'pending';message:string;usdAmount:string}>('withdraw.request',{mode:withdrawMode,amount:withdrawAmount});
      await reload();
      const history=await api<{requests:WithdrawRequest[]}>('withdraw.mine');
      setWithdrawHistory(history.requests);
      setWithdrawPage(1);
      setWalletStep('none');setWithdrawAmount('');setPage('wallet');
      setNotice(result.message);
    }catch(e){
      const message=(e as Error).message;
      if(message.includes('Você não pode realizar outros saques no momento!')) {
        const recommendation:Record<string,string>={FREE:'VIP_01',VIP_01:'VIP_02',VIP_02:'VIP_03',VIP_03:'VIP_04'};
        const selected=recommendation[account?.plan.id??'FREE']||'VIP_01';
        setWalletStep('none');setPage('wallet');setWithdrawPopup({recommended:selected});
      } else setNotice(message);
    }
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
        .then(acceptSnapshot)
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
      if(action==='profile.update' && typeof body.phone==='string' && !validInternationalPhone(body.phone)) {
        throw new Error(tr.phone);
      }
      const result = await api<PurchaseOrder | {ok:boolean}>(action,body);
      if(action==='profile.update'&&typeof body.walletAddress==='string'){
        if(body.walletAddress.trim())cacheMemberWalletAddress(user.id,body.walletAddress);
        else removeMemberWalletAddress(user.id);
      }
      if (action==='orders.create') {
        const order=result as PurchaseOrder;
        setCheckout(order);
        setProofLink(order.proofUrl??'');
        setNotice('');
      } else if(action==='mining.start')showSavedToast();
      else setNotice(words.saved);
      await reload();
      if(action==='orders.create')void refreshPurchaseHistory().catch(()=>{});
      if (action==='rewards.claim' || action==='mining.stop') {api<typeof ledger>('ledger').then(setLedger).catch(()=>{});}
    } catch(e) { setNotice((e as Error).message); }
    finally {setBusy(false);}
  }
  async function resumeOrderPayment(orderId:number|string) {
    setBusy(true);setNotice('');
    try {
      const order=await api<PurchaseOrder>('orders.resume',{orderId:Number(orderId)});
      setCheckout(order);
      setProofLink(order.proofUrl??'');
      setCheckoutCopied(null);
    } catch(e) {
      setNotice((e as Error).message);
      void refreshPurchaseHistory().catch(()=>{});
    } finally {setBusy(false);}
  }
  async function submitOrderProof() {
    if(!checkout)return;
    setProofSaving(true);setNotice('');
    try {
      const url=proofLink.trim();
      const result=await api<{ok:boolean;proofSubmittedAt:number}>(
        'orders.proof.submit',{orderId:checkout.orderId,proofUrl:url});
      setCheckout(current=>current?{
        ...current,proofUrl:url,proofSubmittedAt:result.proofSubmittedAt
      }:current);
      void refreshPurchaseHistory().catch(()=>{});
    } catch(e) {setNotice((e as Error).message);}
    finally {setProofSaving(false);}
  }
  async function saveAvatar(){
    setBusy(true);setNotice('');
    try{
      await api('profile.update',{...profile,avatarUrl:avatarDraft.trim()});
      await reload();
      setAvatarModal(false);
      setNotice(words.saved);
    }catch(e){setNotice((e as Error).message);}
    finally{setBusy(false);}
  }
  const tab = (p:Page, label:string, Icon:typeof Home) =>
    <button type="button" onClick={()=>{navigateToPage(p);setNotice('');}}
      aria-current={page===p?'page':undefined}
      className={'flex flex-1 min-w-0 flex-col items-center justify-center text-[10px] sm:text-[11px] gap-1 rounded-xl py-1.5 transition-colors '+(page===p?'text-white bg-indigo-500/15':'text-slate-400 hover:text-white')}>
      <Icon size={20} className="shrink-0"/><span className="w-full truncate text-center">{label}</span></button>;
  return <div className="relative w-full h-full flex flex-col bg-[#121526] text-white">
    {savedToast&&<div data-testid="saved-toast" role="status" aria-live="polite"
      style={{bottom:'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)'}}
      className={'pointer-events-none fixed right-4 z-[200] w-fit max-w-[calc(100vw-2rem)] rounded-xl border border-emerald-300/25 bg-[#16352f]/95 px-3 py-2 text-center text-xs font-semibold text-emerald-100 shadow-xl backdrop-blur transition-all duration-300 '+
        (savedToastVisible?'translate-y-0 opacity-100':'translate-y-2 opacity-0')}>
      {savedToast}
    </div>}
    {page==='wallet' && account!==null && !account.profile.walletAddress && !walletPromptDismissed &&
      <WalletRequiredModal language={language}
        initialAddress={account.profile.walletAddress||readMemberWalletAddress(account.user.id)}
        onRegister={registerRequiredWallet}
        onClose={()=>{setWalletPromptDismissed(true);setPage(walletOriginPage.current);}}/>}
    {withdrawPopup && <div role="dialog" aria-modal="true" aria-label={language==='en'?'Active VIP plan required':language==='es'?'Se requiere un plan VIP activo':'Plano VIP ativo necessário'}
      data-testid="withdraw-awaiting-vip-modal" className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-amber-300/40 bg-gradient-to-b from-[#26203b] via-[#171b2d] to-[#101423] p-6 shadow-2xl shadow-amber-950/40 space-y-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300"/>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-400/10 text-amber-300 shadow-lg shadow-amber-900/30"><Crown size={29}/></div>
        <div className="text-center space-y-2">
          <p className="text-[11px] font-black tracking-[0.18em] text-amber-300">{language==='en'?'VIP REQUIRED':language==='es'?'SE REQUIERE VIP':'VIP NECESSÁRIO'}</p>
          <h2 className="font-extrabold text-xl text-white">{language==='en'?'Activate your VIP plan':language==='es'?'Active su plan VIP':'Ative seu plano VIP'}</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center space-y-2">
          <LockKeyhole className="mx-auto text-amber-300" size={19}/>
          <p className="text-sm font-semibold leading-6 text-slate-100">{language==='en'?'You cannot make other withdrawals right now. Your VIP subscription has recently expired.':language==='es'?'No puede realizar más retiros por ahora. Su suscripción VIP venció recientemente.':'Você não pode realizar outros saques no momento! Sua assinatura VIP Expirou a pouco tempo.'}</p>
          <p className="text-sm leading-6 text-slate-300">{language==='en'?'To send your transfer, activate one of the VIP plans again.':language==='es'?'Para enviar su transferencia, active nuevamente uno de los planes VIP.':'Para enviar sua transferência ative novamente um dos planos VIP.'}</p>
        </div>
        <button type="button" data-testid="withdraw-go-to-store"
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 p-3.5 font-extrabold text-sm text-[#211806] shadow-lg shadow-amber-900/30"
          onClick={()=>{setStoreRecommended(withdrawPopup.recommended);setWithdrawPopup(null);setPage('store');}}>
          {language==='en'?'Activate '+withdrawPopup.recommended:language==='es'?'Activar '+withdrawPopup.recommended:'Ativar '+withdrawPopup.recommended}
        </button>
        <button type="button" className="w-full text-xs text-slate-300 underline underline-offset-4"
          onClick={()=>setWithdrawPopup(null)}>{language==='en'?'Close':language==='es'?'Cerrar':'Fechar'}</button>
      </div>
    </div>}
    {avatarModal&&<div role="dialog" aria-modal="true" aria-label={language==='en'?'Profile image':language==='es'?'Imagen de perfil':'Imagem de perfil'} className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <form onSubmit={e=>{e.preventDefault();void saveAvatar();}} className="w-full max-w-sm rounded-3xl border border-indigo-400/35 bg-[#171b2d] p-5 shadow-2xl space-y-4">
        <h2 className="text-lg font-extrabold">{language==='en'?'Profile image':language==='es'?'Imagen de perfil':'Imagem de perfil'}</h2>
        <p className="text-xs leading-relaxed text-slate-300">{language==='en'?'Paste a direct HTTP or HTTPS image URL.':language==='es'?'Pegue una URL directa de imagen HTTP o HTTPS.':'Informe uma URL direta de imagem HTTP ou HTTPS.'}</p>
        <input autoFocus type="url" inputMode="url" maxLength={2048} value={avatarDraft} onChange={e=>setAvatarDraft(e.target.value)} placeholder="https://..." className="w-full rounded-xl bg-[#11182c] p-3 text-xs outline-none ring-indigo-400 focus:ring-1"/>
        <div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setAvatarModal(false)} className="rounded-xl bg-slate-700 p-3 text-xs font-bold">{language==='en'?'Cancel':language==='es'?'Cancelar':'Cancelar'}</button><button disabled={busy} className="rounded-xl bg-indigo-600 p-3 text-xs font-bold">{language==='en'?'Save':language==='es'?'Guardar':'Salvar'}</button></div>
      </form>
    </div>}
    {page==='withdraw' ? <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y member-vertical-scroll p-4 sm:p-5 space-y-4">
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
          {copyText('withdrawalAvailableCredits')} · {copyText('withdrawalEquivalent')}
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
              <button onClick={()=>{setWalletStep('none');setWalletConfirmation(false);setPage('wallet');}} className="text-xs underline">{tr.close}</button>
            </div>
            {walletStep==='register' ? <form className="space-y-3" onSubmit={e=>{e.preventDefault();void saveWalletForWithdrawal();}}>
              <label className="block text-sm">{tr.address}
                <input required value={walletDraft} onChange={e=>{setWalletDraft(e.target.value);setWalletConfirmation(false);}}
                  placeholder="bc1..." className="w-full mt-2 bg-[#11182c] rounded-lg p-3 font-mono text-xs"/>
              </label>
              {walletConfirmation&&<div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-center space-y-2">
                <p className="text-xs font-bold text-amber-100">{language==='en'?'Confirm Bitcoin address':language==='es'?'Confirme la dirección Bitcoin':'Confirme o endereço Bitcoin'}</p>
                <p className="break-all font-mono text-[11px] text-white">{walletDraft.trim()}</p>
                <p className="text-[11px] text-slate-300">{language==='en'?'Confirm that this address is correct before saving.':language==='es'?'Confirme que esta dirección es correcta antes de guardarla.':'Confirme que este endereço está correto antes de salvar.'}</p>
                <button type="button" onClick={()=>setWalletConfirmation(false)} className="w-full rounded-lg bg-slate-700 p-2 text-xs font-bold">{language==='en'?'Go back and correct':language==='es'?'Volver y corregir':'Voltar e corrigir'}</button>
              </div>}
              <button disabled={busy} className="w-full bg-indigo-600 rounded-xl p-3 font-bold text-sm">{walletConfirmation?(language==='en'?'Confirm and save':language==='es'?'Confirmar y guardar':'Confirmar e salvar'):tr.save}</button>
            </form> : <form className="space-y-3" onSubmit={e=>{e.preventDefault();void submitWithdrawal();}}>
              <p className="text-xs text-slate-400">{tr.minimum}: USD {account?.plan.withdrawMinUsd??'0.00'}.</p>
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
              <p className="text-center text-xs leading-relaxed text-slate-400">{copyText('withdrawalNotice')}</p>
            </form>}
          </section>}
    </div> :
      page==='support' ? <CustomerSupportView language={language} onBack={()=>setPage('settings')}/> :
      page==='topMiners' ? <TopMinersView language={language} btcUsd={displayBtcUsd} quoteTime={btcQuote?.quotedAt??null} onBack={()=>setPage('settings')}/> :
      page==='subscriptions' ? <SubscriptionHistoryView language={language} onBack={()=>setPage('settings')}/> :
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y member-vertical-scroll p-4 sm:p-5 space-y-4">
        {notice && <p role="status" data-testid={page==='home'?'home-feedback-notice':undefined}
          style={page==='home'?{bottom:'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)'}:undefined}
          className={page==='home'
            ?'pointer-events-none fixed right-4 z-[201] w-fit max-w-[calc(100vw-2rem)] rounded-xl border border-amber-300/25 bg-[#20243c]/95 px-3 py-2 text-xs text-amber-200 shadow-xl backdrop-blur'
            :'p-3 rounded-lg bg-[#20243c] text-sm text-amber-300'}>{notice}</p>}
        {page==='home' && <><ServerHomeView account={account} liveBalanceUsd={liveBalanceUsd} liveBtc={liveBtc} language={language} busy={busy}
          onStart={()=>void act('mining.start')} onStop={()=>void act('mining.stop')}
          onRewards={()=>setPage('reward')}
          onHistory={()=>setPage('history')} avatarLocked={profile.avatarLocked} onAvatarClick={()=>{setAvatarDraft(profile.avatarUrl);setAvatarModal(true);}}/><MockPaymentFeed language={language}/></>}
        {page==='reward' && <ServerRewardView account={account} language={language} busy={busy}
          ledger={ledger} onClaim={()=>void act('rewards.claim')}
          onRefreshHistory={()=>{void api<typeof ledger>('ledger').then(setLedger).catch(e=>setNotice((e as Error).message));}}/>}
        {page==='wallet' && <>
          <ServerWalletView account={account} liveBalanceUsd={liveBalanceUsd} liveBtc={liveBtc} language={language}
            accruals={ledger.accruals} onEdit={()=>setPage('profile')}
            onWithdraw={()=>{
              setWalletDraft(account?.profile.walletAddress??'');
              setWalletStep(account?.profile.walletAddress?'amount':'register');setWalletConfirmation(false);
              setWithdrawMode('USD');
              setWithdrawEdited(false);
              setWithdrawAmount('');
              setPage('withdraw');
            }}/>
          {withdrawHistory.length>0 && <section className="bg-[#171b2d] rounded-2xl p-4 space-y-2 min-w-0">
            <h3 className="font-bold text-sm">{tr.requests}</h3>
            <div data-testid="withdraw-history-scroll" className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-auto member-horizontal-scroll" tabIndex={0}
              aria-label={tr.requests}>
              <div className="min-w-max space-y-2">
                {visibleWithdrawHistory.map(x=><div key={x.id} data-testid="withdraw-history-row"
                  className="w-full min-w-max text-xs border-b border-[#2b3350] pb-2 flex items-center gap-3">
                  <span>#{x.id}</span>
                  <span>USD {(x.usd_cents/100).toFixed(2)}</span>
                  <span>{(x.btc_satoshis/1e8).toFixed(8)} BTC</span>
                  <span data-testid="withdraw-status"
                    className={x.status==='approved'?'text-emerald-400 font-semibold':x.status==='failed'||x.status==='rejected'?'text-rose-300 font-semibold':'text-slate-300'}>
                    {x.status==='awaiting_vip'?tr.awaiting:x.status==='pending'?tr.pending:x.status==='approved'?tr.approved:x.status==='failed'?tr.failed:tr.rejected}
                  </span>
                  {mockupMode&&x.simulation&&<span data-testid="withdraw-simulation-notice" className="whitespace-nowrap rounded-md border border-amber-400/25 bg-amber-400/5 px-2 py-1 text-[10px] text-amber-200">{copyText('withdrawalDemoBadge')}</span>}
                  <span className="whitespace-nowrap text-[11px] text-slate-400">{new Date(x.created_at*1000).toLocaleString(dateLocale)}</span>
                  {x.reason&&<span className="max-w-[220px] whitespace-normal text-[11px] text-rose-200">{x.reason}</span>}
                </div>)}
              </div>
            </div>
            {withdrawPages>1&&<nav data-testid="withdraw-pagination"
              aria-label={language==='en'?'Withdrawal history pages':language==='es'?'Páginas del historial de retiros':'Páginas do histórico de saques'}
              className="flex items-center justify-between gap-2 pt-2 text-xs">
              <button type="button" data-testid="withdraw-page-prev"
                disabled={currentWithdrawPage<=1}
                onClick={()=>setWithdrawPage(p=>Math.max(1,p-1))}
                className="px-3 py-2 rounded-lg bg-[#252b46] disabled:opacity-40">
                {language==='en'?'Previous':language==='es'?'Anterior':'Anterior'}
              </button>
              <span data-testid="withdraw-page-indicator" className="text-slate-300 font-mono tabular-nums">
                {currentWithdrawPage} / {withdrawPages}
              </span>
              <button type="button" data-testid="withdraw-page-next"
                disabled={currentWithdrawPage>=withdrawPages}
                onClick={()=>setWithdrawPage(p=>Math.min(withdrawPages,p+1))}
                className="px-3 py-2 rounded-lg bg-[#252b46] disabled:opacity-40">
                {language==='en'?'Next':language==='es'?'Siguiente':'Próxima'}
              </button>
            </nav>}
          </section>}
        </>}
        {page==='settings' && <section className="space-y-3">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{words.settings}</h2>
            <button type="button" data-testid="settings-exit" onClick={onLogout}
              aria-label={language==='en'?'Exit':language==='es'?'Salir':'Sair'} title={language==='en'?'Exit':language==='es'?'Salir':'Sair'}
              className="rounded-xl border border-[#303b59] bg-[#11182c] p-2 text-rose-300"><LogOut size={24}/></button>
          </div>
          <p className="text-xs text-slate-400">{words.account}: {account?.user.login ?? user.login} · {language==='en'?'User ID':language==='es'?'ID de usuario':'ID do usuário'} #{user.id}</p>
          <button type="button" data-testid="settings-top-miners" onClick={()=>setPage('topMiners')}
            className="w-full flex gap-3 items-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-[#231905] border border-yellow-300 p-4 font-black text-sm shadow-lg shadow-amber-900/20">
            <Trophy size={19}/>{language==='en'?'Top Miners':language==='es'?'Mejores mineros':'Top Mineradores'}
          </button>
          {([
            ['profile',words.profile,User],
            ['subscriptions',language==='en'?'Subscriptions':language==='es'?'Suscripciones':'Histórico VIP',ScrollText],
            ['support',words.support,Headphones],
          ] as const).map(([target,label,Icon]) =>
            <button key={target} onClick={()=>setPage(target)}
              className="w-full flex gap-3 items-center rounded-xl bg-[#1b2137] border border-[#2b3350] p-4 text-sm">
              <Icon size={18}/>{label}</button>)}
          <label className="flex items-center justify-between bg-[#1b2137] rounded-xl border border-[#2b3350] p-4 text-sm">
            <span>{language==='en'?'Language':language==='es'?'Idioma':'Idioma'}</span>
            <select value={language} onChange={e=>onChangeLanguage(e.target.value as LanguageCode)}
              className="bg-[#11182c] rounded-lg px-3 py-2 text-xs text-white">
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </label>
          <button className="w-full flex gap-3 items-center rounded-xl bg-[#1b2137] border border-[#2b3350] p-4 text-sm"
            onClick={onLogout}><LogOut size={18}/> {words.signOut}</button>
        </section>}
        {page==='store' && <>
          <ServerStoreView plans={plans} activePlanId={account?.plan.id ?? 'FREE'}
            suggestedPlanId={storeRecommended}
            language={language} busy={busy} onPurchase={planId=>void act('orders.create',{planId})}/>
          {checkout && <div role="dialog" aria-modal="true" aria-labelledby="payment-instructions-title"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
            <div className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl">
              <PaymentInstructionsCard language={language} order={checkout} qrDataUrl={checkoutQr}
                remainingSeconds={checkoutSecondsRemaining} proofLink={proofLink} proofSaving={proofSaving}
                copied={checkoutCopied} onProofLinkChange={setProofLink}
                onSubmitProof={()=>void submitOrderProof()}
                onCopyAddress={()=>void copy(checkout.btcAddress,'address')}
                onCopyAmount={()=>void copy(checkout.btcAmount,'btc')}
                onClose={()=>{setCheckout(null);setNotice('');}}/>
            </div>
          </div>}
          {purchaseHistory.length>0&&<section data-testid="member-purchase-history" className="bg-[#171b2d] rounded-2xl p-3 space-y-2">
            <h3 className="font-bold text-sm">{language==='en'?'Purchase history':language==='es'?'Historial de compras':'Histórico de compras'}</h3>
            {purchaseHistory.map(x=><article key={x.id} data-testid="purchase-history-order"
              className="min-w-0 border-b border-[#2b3350] pb-3 text-xs last:border-b-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
                <span className="font-semibold">#{x.id} · {x.plan_id}</span>
                <span className={x.status==='approved'?'text-emerald-300':x.status==='expired'||x.status==='rejected'?'text-rose-300':'text-slate-300'}>
                  {x.status==='pending'?tr.orderPending:x.status==='approved'?tr.orderApproved:
                    x.status==='rejected'?tr.orderRejected:x.status==='expired'?tr.orderExpired:x.status}
                </span>
                <span className="font-mono tabular-nums">{(x.btc_sats/1e8).toFixed(8)} BTC</span>
                {x.can_pay&&x.status==='pending'&&Number(x.expires_at)>Math.floor(balanceTick/1000)&&
                  <button type="button" data-testid="purchase-order-pay"
                  disabled={busy} onClick={()=>void resumeOrderPayment(x.id)}
                  className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 font-bold text-amber-100 hover:bg-amber-300/15 disabled:opacity-50">
                  {tr.pay}
                </button>}
              </div>
              {x.native_order&&x.status==='pending'&&x.expires_at&&<p className="mt-2 text-[10px] text-slate-400">
                {tr.quoteValidUntil}: {new Date(x.expires_at*1000).toLocaleString(dateLocale)}
                {' · '}{checkoutSecondsRemaining>0&&checkout?.orderId===Number(x.id)
                  ? `${Math.floor(checkoutSecondsRemaining/60)}:${String(checkoutSecondsRemaining%60).padStart(2,'0')}`
                  : Math.max(0,x.expires_at-Math.floor(balanceTick/1000))>0
                    ? `${Math.floor((x.expires_at-Math.floor(balanceTick/1000))/60)}:${String((x.expires_at-Math.floor(balanceTick/1000))%60).padStart(2,'0')}`
                    : tr.orderExpired}
              </p>}
              {x.proof_url&&<a href={x.proof_url} target="_blank" rel="noreferrer"
                className="mt-2 inline-block max-w-full truncate text-[10px] text-indigo-200 underline">
                {tr.proofSubmitted}
              </a>}
            </article>)}
          </section>}
        </>}
        {page==='history' && <RewardHistoryLog language={language} ledger={ledger}
          onRefresh={()=>{void api<typeof ledger>('ledger').then(setLedger).catch(e=>setNotice((e as Error).message));}}/>}
        {page==='profile' && <form onSubmit={e=>{e.preventDefault();void act('profile.update',profile)}} className="space-y-3">
          <h2 className="text-lg font-bold">{words.profile}</h2>
          {(['displayName','email','phone','walletAddress'] as const).map(k=><label key={k} className="block text-sm text-slate-300">
            {({displayName:words.name,email:words.optionalEmail,phone:words.phone,walletAddress:words.btcWallet} as const)[k]}
            <input type={k==='email'?'email':k==='phone'?'tel':'text'} autoComplete={k==='email'?'email':k==='phone'?'tel':'off'}
              value={profile[k]}
              maxLength={k==='phone'?24:undefined} inputMode={k==='phone'?'tel':undefined}
              placeholder={k==='phone'?'+55 31 99999-9999':undefined}
              onChange={e=>setProfile(p=>({...p,[k]:k==='phone'?formatInternationalPhone(e.target.value):e.target.value}))}
              onBlur={e=>{if(k==='phone')setProfile(p=>({...p,phone:normalizeInternationalPhone(e.target.value)}));}}
              className="mt-1 w-full bg-[#1b2137] border border-[#2b3350] p-3 rounded-xl text-white"/>
          </label>)}
          <button disabled={busy} className="w-full bg-indigo-600 rounded-xl p-3">{words.update}</button>
        </form>}
      </div>}

    <NewInvestorToast language={language} userId={user.id}/>
    <nav data-testid="member-bottom-nav"
      className="w-full min-h-16 shrink-0 bg-[#101322] border-t border-[#1f253d] flex items-stretch justify-around gap-0.5 px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] z-30 select-none"
      aria-label={language==='en'?'Primary navigation':language==='es'?'Navegación principal':'Navegação principal'}>
      {tab('home',tabNames.home,Home)}
      {tab('store',tabNames.store,Store)}
      {tab('reward',tabNames.reward,Gift)}
      {tab('wallet',tabNames.wallet,Wallet)}
      {tab('settings',tabNames.setting,Settings)}
    </nav>
  </div>;
};
