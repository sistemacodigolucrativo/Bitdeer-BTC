import React, {useMemo} from 'react';
import {ArrowLeft} from 'lucide-react';
import {LanguageCode} from '../../types';

type Miner = {name:string;country:string;flag:string;location:string;message:string;btcSats:number};
/** Fictional profile showcase, not member data, not a blockchain transaction list. */
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
type Props={language:LanguageCode;onBack:()=>void;btcUsd?:number|null};
export const TopMinersView:React.FC<Props>=({language,onBack,btcUsd})=>{
  const notice=language==='en'
    ? 'Demonstration ranking with 200 fictional profiles and illustrative BTC values; these are not actual mining results.'
    : language==='es'
    ? 'Ranking demostrativo con 200 perfiles y cantidades ficticias, sin minería real.'
    : 'Ranking demonstrativo com 200 perfis fictícios. Os valores não são BTC minerados nem saldos de membros.';
  const dollar=useMemo(()=>btcUsd&&btcUsd>0?new Intl.NumberFormat('en-US',{minimumFractionDigits:4,maximumFractionDigits:4}):null,[btcUsd]);
  return <section className="flex-1 min-h-0 w-full flex flex-col bg-[#121626] text-white overflow-hidden">
    <header className="grid grid-cols-[44px_1fr_44px] items-center gap-2 px-4 py-4 border-b border-[#232943] bg-[#141829]">
      <button type="button" onClick={onBack} aria-label={language==='en'?'Back':language==='es'?'Volver':'Voltar'}
        className="w-10 h-10 rounded-xl bg-[#1b2137] flex items-center justify-center"><ArrowLeft size={20}/></button>
      <h2 className="font-extrabold text-lg text-center">Top Miners</h2><span aria-hidden="true"/>
    </header>
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
      <p className="text-[11px] text-slate-400">{notice}</p>
      <p className="text-[10px] text-slate-500">{btcUsd
        ? language==='en'
          ? 'USD is calculated using the public BTC/USD quote provided by the server. BTC values are fictional.'
          : language==='es'
          ? 'USD calculado con la cotización pública BTC/USD del servidor. Las cantidades BTC son ficticias.'
          : 'USD indicado pela cotação pública BTC/USD obtida do servidor. Valores de BTC fictícios.'
        : language==='en'
          ? 'BTC/USD rate unavailable; USD amounts are hidden.'
          : language==='es'
          ? 'Cotización BTC/USD no disponible; los importes USD no se muestran.'
          : 'Cotação BTC/USD indisponível; valores USD não exibidos.'}</p>
      <div className="space-y-3" aria-label="Ranking demonstrativo Top Miners">
        {showcase.map((miner,index)=><article key={miner.name} data-testid="miner-card"
          className="bg-[#1c2238] border border-[#2a314d] rounded-2xl px-3.5 py-4 shadow-sm flex gap-2.5 items-center">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[14px] leading-tight text-slate-100 truncate">{miner.name}</h3>
            <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 min-w-0">
              <span aria-label={miner.country} className="shrink-0 text-sm">{miner.flag}</span>
              <span className="truncate">{miner.location} · {descriptions[language][index%7]}</span>
            </p>
          </div>
          <div className="min-w-[118px] text-right shrink-0">
            <p className="font-semibold font-mono text-[12px] text-slate-100 tabular-nums whitespace-nowrap">
              {(miner.btcSats/100000000).toFixed(8)} BTC
            </p>
            <p className="font-mono mt-1.5 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
              {dollar&&btcUsd?'$ '+dollar.format(miner.btcSats/100000000*btcUsd):'USD —'}
            </p>
          </div>
        </article>)}
      </div>
    </div>
  </section>;
};
