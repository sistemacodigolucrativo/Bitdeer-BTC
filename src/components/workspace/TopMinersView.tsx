import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { LanguageCode } from '../../types';

interface TopMinersViewProps {
  language: LanguageCode;
  onBack: () => void;
}

interface TopMinerItem {
  id: string;
  name: string;
  flag: string;
  countryDesc: string;
  btcAmt: string;
  usdAmt: string;
}

export const TopMinersView: React.FC<TopMinersViewProps> = ({
  onBack
}) => {
  // Exact list from screenshot fc9eea7c
  const miners: TopMinerItem[] = [
    {
      id: '1',
      name: 'Ricardo Mendes',
      flag: '🇧🇷',
      countryDesc: 'Brazil — Blockchain innovation strong',
      btcAmt: '0.97547285',
      usdAmt: '$78,316.4600'
    },
    {
      id: '2',
      name: 'Rohan Kapoor',
      flag: '🇮🇳',
      countryDesc: 'India — Secure chain forward',
      btcAmt: '0.97047273',
      usdAmt: '$77,914.9660'
    },
    {
      id: '3',
      name: 'Jahir Uddin',
      flag: '🇧🇩',
      countryDesc: 'Bangladesh — Crypto roots expanding',
      btcAmt: '0.96547282',
      usdAmt: '$77,513.5453'
    },
    {
      id: '4',
      name: 'Sardor Karimov',
      flag: '🇺🇿',
      countryDesc: 'Uzbekistan — Blocks bridging nations',
      btcAmt: '0.96047269',
      usdAmt: '$77,112.1070'
    },
    {
      id: '5',
      name: 'Jose dela Cruz',
      flag: '🇵🇭',
      countryDesc: 'Philippines — Island chain powering',
      btcAmt: '0.95547283',
      usdAmt: '$76,710.6903'
    },
    {
      id: '6',
      name: 'Aina Roslan',
      flag: '🇲🇾',
      countryDesc: 'Malaysia — Mining culture thrives',
      btcAmt: '0.95447261',
      usdAmt: '$76,630.3871'
    },
    {
      id: '7',
      name: 'Javier Torres',
      flag: '🇲🇽',
      countryDesc: 'Mexico — Crypto legacy rising',
      btcAmt: '0.95247273',
      usdAmt: '$76,469.8256'
    },
    {
      id: '8',
      name: 'Nikaashvili G.',
      flag: '🇬🇪',
      countryDesc: 'Georgia — Digital blocks growing',
      btcAmt: '0.95047282',
      usdAmt: '$76,309.2616'
    },
    {
      id: '9',
      name: 'Alistair Finch',
      flag: '🇬🇧',
      countryDesc: 'UK — Blockchain vision expanding',
      btcAmt: '0.94947269',
      usdAmt: '$76,228.9656'
    },
    {
      id: '10',
      name: 'Zayed Al Marzooqi',
      flag: '🇸🇦',
      countryDesc: 'Saudi Arabia — Crypto frontier bold',
      btcAmt: '0.94847273',
      usdAmt: '$76,148.6832'
    },
    {
      id: '11',
      name: 'Khalid Al Junaibi',
      flag: '🇦🇪',
      countryDesc: 'UAE — Desert mining future',
      btcAmt: '0.94747281',
      usdAmt: '$76,068.4041'
    }
  ];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#121626] text-white select-none overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#232943] bg-[#141829]">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-[#1b2137] hover:bg-[#232b47] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-white tracking-wide">Top Miners</h2>

        <div className="w-9 h-9" />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 pb-20">
        {miners.map((miner) => (
          <div
            key={miner.id}
            className="bg-[#1b2137] border border-[#272e4b] rounded-2xl p-3.5 flex items-center justify-between hover:border-[#38426b] transition-colors"
          >
            {/* Left info: Name & Country/Motto */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white leading-tight">
                {miner.name}
              </h4>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 leading-snug">
                <span>{miner.flag}</span>
                <span>{miner.countryDesc}</span>
              </p>
            </div>

            {/* Right info: BTC amount & USD value */}
            <div className="text-right space-y-0.5 font-mono">
              <p className="text-xs font-black text-white tracking-tight">
                {miner.btcAmt}
              </p>
              <p className="text-[11px] text-slate-400">
                {miner.usdAmt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
