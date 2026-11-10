import React, {useEffect, useMemo, useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {LanguageCode} from '../../types';
import {readLastKnownQuote} from '../../utils/lastKnownQuote';
import {useProjectCopy} from '../../i18n/copyMode';

type Miner = {name:string;country:string;flag:string;location:string;message:string;btcSats:number};
/** Fictional profile showcase, not member data, not a blockchain transaction list. */
type DemoMetrics={onlineCount:number;activeMiners:number;onlineIndices:number[]};
const DEMO_METRICS_KEY='bitdeer:top-miners:demo-metrics:v1';
const DEMO_SESSION_KEY='bitdeer:top-miners:demo-session:v1';
const TOTAL_SHOWCASE_MINERS=200;
const randomInteger=(min:number,max:number)=>Math.floor(Math.random()*(max-min+1))+min;
function nextBoundedCount(previous:number,min:number,max:number,deltaMin:number,deltaMax:number):number {
  const candidates:number[]=[];
  for(let delta=deltaMin;delta<=deltaMax;delta++){
    if(previous+delta<=max)candidates.push(previous+delta);
    if(previous-delta>=min)candidates.push(previous-delta);
  }
  return candidates.length?candidates[randomInteger(0,candidates.length-1)]:randomInteger(min,max);
}
function randomOnlineIndices(count:number):number[] {
  const indices=Array.from({length:TOTAL_SHOWCASE_MINERS},(_,index)=>index);
  for(let i=indices.length-1;i>0;i--){
    const j=randomInteger(0,i);
    [indices[i],indices[j]]=[indices[j],indices[i]];
  }
  return indices.slice(0,count).sort((a,b)=>a-b);
}
function validDemoMetrics(value:unknown):value is DemoMetrics {
  if(!value||typeof value!=='object')return false;
  const metrics=value as Partial<DemoMetrics>;
  return Number.isInteger(metrics.onlineCount)&&metrics.onlineCount!>=50&&metrics.onlineCount!<=142&&
    Number.isInteger(metrics.activeMiners)&&metrics.activeMiners!>=2349&&metrics.activeMiners!<=2631&&
    Array.isArray(metrics.onlineIndices)&&metrics.onlineIndices.length===metrics.onlineCount&&
    metrics.onlineIndices.every(index=>Number.isInteger(index)&&index>=0&&index<TOTAL_SHOWCASE_MINERS)&&
    new Set(metrics.onlineIndices).size===metrics.onlineIndices.length;
}
function makeInitialDemoMetrics():DemoMetrics {
  const onlineCount=randomInteger(50,142);
  return {onlineCount,activeMiners:randomInteger(2349,2631),onlineIndices:randomOnlineIndices(onlineCount)};
}
function loadDemoMetrics():DemoMetrics {
  try{
    const raw=window.localStorage.getItem(DEMO_METRICS_KEY);
    let previous:DemoMetrics|null=null;
    if(raw){
      const parsed:unknown=JSON.parse(raw);
      if(validDemoMetrics(parsed))previous=parsed;
    }
    const newSession=!window.sessionStorage.getItem(DEMO_SESSION_KEY);
    if(!newSession&&previous)return previous;
    const metrics=previous?{
      onlineCount:nextBoundedCount(previous.onlineCount,50,142,12,22),
      activeMiners:nextBoundedCount(previous.activeMiners,2349,2631,138,442),
      onlineIndices:[] as number[],
    }:makeInitialDemoMetrics();
    metrics.onlineIndices=randomOnlineIndices(metrics.onlineCount);
    window.localStorage.setItem(DEMO_METRICS_KEY,JSON.stringify(metrics));
    window.sessionStorage.setItem(DEMO_SESSION_KEY,'active');
    return metrics;
  }catch{
    return makeInitialDemoMetrics();
  }
}
const originals=[
{name:'James Hudson',country:'USA',flag:'🇺🇸',message:'Crypto growth unstoppable',btc:'0.99047281',usd:'79,520.6840'},
{name:'Adi Satria',country:'Indonesia',flag:'🇮🇩',message:'Building the digital future',btc:'0.95812730',usd:'76,919.5377'},
{name:'Chinedu Okafor',country:'Nigeria',flag:'🇳🇬',message:'Blockchain opportunities ahead',btc:'0.91450380',usd:'73,417.4449'},
{name:'Ricardo Mendes',country:'Brazil',flag:'🇧🇷',message:'Exploring crypto innovation',btc:'0.87920465',usd:'70,583.1667'},
{name:'Rohan Kapoor',country:'India',flag:'🇮🇳',message:'New horizons in technology',btc:'0.84116527',usd:'67,529.0493'},
{name:'Jahir Uddin',country:'Bangladesh',flag:'🇧🇩',message:'Digital progress every day',btc:'0.80234198',usd:'64,411.3549'},
{name:'Sardor Karimov',country:'Uzbekistan',flag:'🇺🇿',message:'Connected by innovation',btc:'0.76832140',usd:'61,680.0632'},
{name:'Jose dela Cruz',country:'Philippines',flag:'🇵🇭',message:'A growing crypto community',btc:'0.72150420',usd:'57,920.9798'},
{name:'Aina Roslan',country:'Malaysia',flag:'🇲🇾',message:'Learning together worldwide',btc:'0.68419035',usd:'54,925.0470'},
{name:'Javier Torres',country:'Mexico',flag:'🇲🇽',message:'Technology connects us',btc:'0.64289010',usd:'51,609.5112'},
];
const brFirst=['Ana','Bruno','Camila','Daniel','Eduarda','Felipe','Gabriela','Henrique','Isabela','João','Larissa','Marcos','Natália','Pedro','Renata'];
const brLast=["Almeida","Barbosa","Carvalho","Dias","Ferreira","Gomes","Lima","Martins","Nascimento","Oliveira","Pereira","Ribeiro","Rocha","Rodrigues","Santos","Silva","Souza","Costa","Araújo","Batista","Cardoso","Correia","Duarte","Farias","Freitas","Guimarães","Leite","Lopes","Machado","Marques","Monteiro","Moreira","Moura","Nogueira","Pacheco","Peixoto","Pinheiro","Queiroz","Ramos","Reis","Rezende","Sampaio","Santana","Teixeira","Vieira","Azevedo","Barros","Borges","Campos","Cavalcanti","Figueiredo","Fonseca","Macedo","Magalhães","Neves","Paiva","Prado","Tavares","Viana","Xavier"];
const brCities=['São Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Salvador','Recife','Fortaleza','Manaus','Belém','Florianópolis','Vitória','Goiânia','Campinas','Santos','Natal','João Pessoa','Maceió','Aracaju','Campo Grande','Porto Alegre'];
const regions: Array<[string,string,string,string,string,string]>=[
  ['🇺🇸','USA','Austin','James|Michael|David|Daniel|Ryan','Parker|Carter|Williams|Collins|Murphy','Seattle|Chicago|Denver|Boston|Atlanta'],
  ['🇮🇩','Indonesia','Jakarta','Adi|Budi|Dimas|Rizky|Fajar','Santoso|Pratama|Wijaya|Putra|Saputra','Bandung|Surabaya|Medan|Yogyakarta|Semarang'],
  ['🇳🇬','Nigeria','Lagos','Chinedu|Tunde|Emeka|Kelechi|Ifeanyi','Okoro|Adeyemi|Nwosu|Balogun|Ibrahim','Abuja|Kano|Ibadan|Enugu|Port Harcourt'],
  ['🇮🇳','India','Mumbai','Rohan|Aarav|Vihaan|Arjun|Ishaan','Sharma|Patel|Gupta|Mehta|Singh','Delhi|Pune|Chennai|Jaipur|Hyderabad'],
  ['🇧🇩','Bangladesh','Dhaka','Jahir|Rafiq|Imran|Nayeem|Sajid','Ahmed|Rahman|Hossain|Islam|Chowdhury','Chittagong|Sylhet|Khulna|Rajshahi|Barisal'],
  ['🇺🇿','Uzbekistan','Tashkent','Sanjar|Aziz|Bekzod|Jasur|Otabek','Karimov|Ismailov|Rakhimov|Yusupov|Saidov','Samarkand|Bukhara|Andijan|Fergana|Namangan'],
  ['🇵🇭','Philippines','Manila','Jose|Miguel|Paolo|Carlo|Rafael','Reyes|Santos|Garcia|Cruz|Ramos','Cebu|Davao|Baguio|Iloilo|Quezon City'],
  ['🇲🇾','Malaysia','Kuala Lumpur','Alia|Amir|Farah|Hafiz|Nadia','Roslan|Ismail|Rahman|Zulkifli|Hassan','Penang|Ipoh|Johor Bahru|Malacca|Kota Kinabalu'],
  ['🇲🇽','Mexico','Mexico City','Javier|Carlos|Sofia|Diego|Lucia','Mendoza|Ramirez|Morales|Hernandez|Flores','Guadalajara|Monterrey|Puebla|Cancun|Merida'],
  ['🇨🇦','Canada','Toronto','Oliver|Ethan|Emma|Liam|Charlotte','Bennett|Martin|Thompson|Wilson|Clark','Vancouver|Montreal|Ottawa|Calgary|Halifax'],
  ['🇬🇧','United Kingdom','London','Harry|George|Amelia|Olivia|Jack','Smith|Brown|Taylor|Evans|Walker','Manchester|Bristol|Liverpool|Leeds|York'],
  ['🇯🇵','Japan','Tokyo','Haruto|Yuto|Sakura|Ren|Hina','Tanaka|Sato|Suzuki|Kobayashi|Nakamura','Osaka|Kyoto|Nagoya|Sapporo|Kobe'],
  ['🇿🇦','South Africa','Cape Town','Thabo|Sipho|Lerato|Nomsa|Kabelo','Mokoena|Dlamini|Nkosi|Khumalo|Ndlovu','Johannesburg|Pretoria|Durban|Soweto|Gqeberha']
];
// 200 unique profile names with 61 Brazilian profiles including original Ricardo.
const testimonials=['Exploring digital technologies','Building a connected community','Learning about blockchain','Ideas for a digital future',
  'Innovation without borders','Discovering new opportunities','Connected through technology'];
/** Piecewise monotone reduction: 1→0.5, 2→1, 3→2, 4→3 BTC.
 * Values below 2 BTC are halved; values above 2 lose 1 BTC.
 * Integer satoshis preserve ranking and eight-decimal precision.
 */
export const reduceShowcaseBtcSats=(sats:number):number=>
  sats<=200000000?Math.round(sats/2):sats-100000000;

export const showcase: Miner[] = (()=>{
  const result:Miner[]=[];
  const add=(name:string,country:string,flag:string,location:string)=>{
    // BTC amounts are intentionally illustrative, strictly descending by rank.
    const rank=result.length;
    const btcSats=reduceShowcaseBtcSats(423000000-rank*1965713);
    result.push({name,country,flag,location,message:testimonials[rank%testimonials.length],btcSats});
  };
  for(const x of originals) add(x.name,x.country,x.flag,x.country);
  let brazilianIndex=0;
  let internationalIndex=0;
  // Spread the 60 additional Brazilian profiles across all remaining 190 ranks.
  for(let position=0;position<190;position++){
    const isBrazilian=Math.floor((position+1)*60/190)>Math.floor(position*60/190);
    if(isBrazilian){
      const i=brazilianIndex++;
      let first=brFirst[i%brFirst.length];
      if(first===result[result.length-1]?.name.split(' ')[0])
        first=brFirst[(i+1)%brFirst.length];
      const name=first+' '+brLast[i];
      const city=brCities[i%brCities.length];
      add(name,'Brazil','🇧🇷',city+', Brasil');
    } else {
      const i=internationalIndex++;
      const [flag,country,capital,given,surnames,cities]=regions[i%regions.length];
      const j=Math.floor(i/regions.length);
      const first=given.split('|')[j%5];
      const last=surnames.split('|')[(j%5+Math.floor(j/5))%5];
      const places=[capital,...cities.split('|')];
      add(first+' '+last,country,flag,places[j%places.length]+', '+country);
    }
  }
  const brazilian=result.filter(x=>x.country==='Brazil');
  const surnames=brazilian.map(x=>x.name.split(' ').at(-1));
  const firstNames=result.map(x=>x.name.split(' ')[0]);
  if(result.length!==200 || brazilianIndex!==60 || internationalIndex!==130 ||
     brazilian.length!==61 || new Set(result.map(x=>x.name)).size!==200 ||
     new Set(surnames).size!==brazilian.length ||
     result.some((x,i)=>i>0 && x.btcSats>=result[i-1].btcSats) ||
     firstNames.some((x,i)=>i>0 && x===firstNames[i-1])) {
    throw new Error('Top Miners must have distributed Brazilian names, unique surnames, no adjacent duplicate first names and descending BTC amounts');
  }
  return result;
})();

const descriptions = {
 pt: ['Explorando tecnologias digitais','Construindo uma comunidade conectada','Aprendendo sobre blockchain',
      'Ideias para um futuro digital','Inovação sem fronteiras','Descobrindo oportunidades',
      'Conectados pela tecnologia'],
 en: ['Exploring digital technologies','Building a connected community','Learning about blockchain',
      'Ideas for a digital future','Innovation without borders','Discovering new opportunities',
      'Connected through technology'],
 es: ['Explorando tecnologías digitales','Construyendo una comunidad conectada','Aprendiendo sobre blockchain',
      'Ideas para un futuro digital','Innovación sin fronteras','Descubriendo oportunidades',
      'Conectados por la tecnología']
} as const;
type Props={language:LanguageCode;onBack:()=>void;btcUsd?:number|null;quoteTime?:number|null};
export const TopMinersView:React.FC<Props>=({language,onBack,btcUsd,quoteTime})=>{
  const {copy,mockupMode,legitPreviewActive}=useProjectCopy(language);
  const showDemoMetrics=mockupMode||legitPreviewActive;
  const [demoMetrics,setDemoMetrics]=useState<DemoMetrics|null>(null);
  useEffect(()=>{
    if(!showDemoMetrics){setDemoMetrics(null);return;}
    setDemoMetrics(loadDemoMetrics());
  },[showDemoMetrics]);
  // The ranking is informational. A previously verified public quote is safe
  // for DISPLAY, even while the background refresh endpoint is unavailable.
  // Never use this fallback to authorize or calculate a withdrawal request.
  const cachedQuote=readLastKnownQuote();
  const displayRate=typeof btcUsd==='number'&&Number.isFinite(btcUsd)&&btcUsd>0
    ?btcUsd:cachedQuote?.rate??null;
  const displayQuotedAt=quoteTime??cachedQuote?.quotedAt??null;
  const dollar=useMemo(()=>displayRate!==null?new Intl.NumberFormat(language==='en'?'en-US':language==='es'?'es-ES':'pt-BR',{minimumFractionDigits:4,maximumFractionDigits:4}):null,[displayRate,language]);
  const locale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  return <section className="flex-1 min-h-0 w-full flex flex-col bg-[#121626] text-white overflow-hidden">
    <header className="grid grid-cols-[44px_1fr_44px] items-center gap-2 px-4 py-4 border-b border-[#232943] bg-[#141829]">
      <button type="button" onClick={onBack} aria-label={language==='en'?'Back':language==='es'?'Volver':'Voltar'}
        className="w-10 h-10 rounded-xl bg-[#1b2137] flex items-center justify-center"><ArrowLeft size={24}/></button>
      <div className="min-w-0 text-center">
        <h2 className="font-extrabold text-lg text-center">{language==='en'?'Top Miners':language==='es'?'Mejores mineros':'Top Mineradores'}</h2>
        {showDemoMetrics&&demoMetrics&&<p data-testid="top-miners-demo-count" className="mt-0.5 flex flex-wrap items-center justify-center gap-x-1 text-[9px] leading-tight text-slate-300">
          <span>{language==='en'?'Mining now:':language==='es'?'Minerando ahora:':'Minerando agora:'}</span>
          <span aria-hidden="true" className="text-emerald-400">●</span>
          <strong className="font-mono tabular-nums">{new Intl.NumberFormat(locale).format(demoMetrics.activeMiners)}</strong>
          {mockupMode&&<span className="text-amber-300">({language==='en'?'simulated':language==='es'?'simulado':'simulado'})</span>}
        </p>}
      </div><span aria-hidden="true"/>
    </header>
    <div data-testid="top-miners-scroll" className="top-miners-vertical-scroll flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y member-vertical-scroll p-4 space-y-3">
      <p className="text-[11px] text-slate-400">{copy('topMinersNotice')}</p>
      {mockupMode&&<p data-testid="top-miners-demo-status" className="text-[10px] text-slate-500">
        {language==='en'?'Green online dots and the counter are simulated.':language==='es'?'Los puntos verdes y el contador son simulados.':'As bolinhas verdes e o contador são simulados.'}
      </p>}
      {displayRate!==null&&
        <p className="text-[10px] text-slate-500">
          {copy('topMinersQuoteNotice')}
        </p>}
      <div className="space-y-3" aria-label={copy('topMinersListLabel')}>
        {showcase.map((miner,index)=>{
          const isOnline=showDemoMetrics&&!!demoMetrics?.onlineIndices.includes(index);
          return <article key={miner.name} data-testid="miner-card"
          className="miner-card bg-[#1c2238] border border-[#2a314d] rounded-2xl px-3.5 py-4 shadow-sm flex gap-2.5 items-center">
          <div className="min-w-0 flex-1">
            <h3 className="flex min-w-0 items-center gap-1.5 font-semibold text-[14px] leading-tight text-slate-100">
              {isOnline&&<span data-testid="miner-online-indicator" aria-label={language==='en'?'Simulated online':language==='es'?'En línea simulado':'Online simulado'} title={language==='en'?'Simulated online':language==='es'?'En línea simulado':'Online simulado'} className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"/>}
              <span className="truncate">{miner.name}</span>
            </h3>
            <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 min-w-0">
              <span aria-label={miner.country} className="shrink-0 text-sm">{miner.flag}</span>
              <span className="truncate">{miner.location} · {descriptions[language][index%7]}</span>
            </p>
          </div>
          <div className="min-w-[118px] text-right shrink-0">
            <p className="font-semibold font-mono text-[12px] text-slate-100 tabular-nums whitespace-nowrap">
              {(miner.btcSats/100000000).toFixed(8)} BTC
            </p>
            <p data-testid="miner-usd-amount" data-quote-at={displayQuotedAt??undefined}
              data-btc-usd-rate={displayRate??undefined}
              title={displayQuotedAt?new Date(displayQuotedAt*1000).toLocaleString(language==='en'?'en-US':language==='es'?'es-ES':'pt-BR'):undefined}
              className="font-mono mt-1.5 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
              {dollar&&displayRate!==null?'$ '+dollar.format(miner.btcSats/100000000*displayRate):'USD —'}
            </p>
          </div>
        </article>})}
      </div>
    </div>
  </section>;
};
