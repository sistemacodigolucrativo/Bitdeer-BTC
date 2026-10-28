import React from 'react';
import {ArrowLeft} from 'lucide-react';
import {LanguageCode} from '../../types';

type Miner={name:string;country:string;flag:string;message:string;btc:string;usd:string};
// Showcase-only reference data. Never associate these names or values with real members,
// blockchain confirmations, the SQLite reward ledger, or actual payouts.
const showcase:Miner[]=[
  {name:'James Hudson',country:'USA',flag:'🇺🇸',message:'Crypto growth unstoppable',btc:'0.99047281',usd:'79,520.6840'},
  {name:'Adi Satria',country:'Indonesia',flag:'🇮🇩',message:'Building the digital future',btc:'0.95812730',usd:'76,919.5377'},
  {name:'Chinedu Okafor',country:'Nigeria',flag:'🇳🇬',message:'Blockchain opportunities ahead',btc:'0.91450380',usd:'73,417.4449'},
  {name:'Ricardo Mendes',country:'Brazil',flag:'🇧🇷',message:'Exploring crypto innovation',btc:'0.87920465',usd:'70,583.1667'},
  {name:'Rohan Kapoor',country:'India',flag:'🇮🇳',message:'New horizons in technology',btc:'0.84116527',usd:'67,529.0493'},
  {name:'Jahir Uddin',country:'Bangladesh',flag:'🇧🇩',message:'Digital progress every day',btc:'0.80234198',usd:'64,411.3549'},
  {name:'Sardor Karimov',country:'Uzbekistan',flag:'🇺🇿',message:'Connected by innovation',btc:'0.76832140',usd:'61,680.0632'},
  {name:'Jose dela Cruz',country:'Philippines',flag:'🇵🇭',message:'A growing crypto community',btc:'0.72150420',usd:'57,920.9798'},
  {name:'Aina Roslan',country:'Malaysia',flag:'🇲🇾',message:'Learning together worldwide',btc:'0.68419035',usd:'54,925.0470'},
  {name:'Javier Torres',country:'Mexico',flag:'🇲🇽',message:'Technology connects us',btc:'0.64289010',usd:'51,609.5112'}
];
type Props={language:LanguageCode;onBack:()=>void};
export const TopMinersView:React.FC<Props>=({language,onBack})=>{
  const notice=language==='en'
    ? 'Demonstration ranking: fictional profiles and illustrative amounts, not actual BTC mined or received.'
    : language==='es'
    ? 'Ranking demostrativo: perfiles y valores ficticios, sin BTC realmente minados ni recibidos.'
    : 'Ranking demonstrativo: perfis e valores fictícios, sem BTC efetivamente minerado ou recebido.';
  return <section className="flex-1 min-h-0 w-full flex flex-col bg-[#121626] text-white overflow-hidden">
    <header className="grid grid-cols-[44px_1fr_44px] items-center gap-2 px-4 py-4 border-b border-[#232943] bg-[#141829]">
      <button type="button" onClick={onBack} aria-label={language==='en'?'Back':language==='es'?'Volver':'Voltar'}
        className="w-10 h-10 rounded-xl bg-[#1b2137] flex items-center justify-center">
        <ArrowLeft size={20}/>
      </button>
      <h2 className="font-extrabold text-lg text-center">Top Miners</h2>
      <span aria-hidden="true"/>
    </header>
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
      <p className="text-[11px] text-slate-400 mb-3">{notice}</p>
      {showcase.map((miner,index)=><article key={miner.name}
        className="bg-[#1c2238] border border-[#2a314d] rounded-2xl px-3.5 py-4 shadow-sm flex gap-2.5 items-center">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[14px] leading-tight text-slate-100 truncate">{miner.name}</h3>
          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 min-w-0">
            <span aria-label={miner.country} className="shrink-0 text-sm">{miner.flag}</span>
            <span className="truncate">{miner.country} · {miner.message}</span>
          </p>
        </div>
        <div className="min-w-[118px] text-right shrink-0">
          <p className="font-semibold font-mono text-[12px] text-slate-100 tabular-nums whitespace-nowrap">{miner.btc} BTC</p>
          <p className="font-mono mt-1.5 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">$ {miner.usd}</p>
        </div>
      </article>)}
    </div>
  </section>;
};
