import { motion } from 'motion/react';

interface ProbabilityListScreenProps {
  onBack: () => void;
}

const PROBABILITY_DATA = [
  {
    key: "zombie_small",
    name: "一般殭屍 (Small Zombie)",
    instakill: "50% (1/2)",
    maxHits: 4,
  },
  {
    key: "zombie_big",
    name: "巨型殭屍 (Big Zombie)",
    instakill: "16.67% (1/6)",
    maxHits: 12,
  },
  {
    key: "zombie_bomb",
    name: "炸彈殭屍 (Bomb Zombie)",
    instakill: "12.5% (1/8)",
    maxHits: 16,
  },
  {
    key: "zombie_bouncing",
    name: "彈跳殭屍 (Bouncing Zombie)",
    instakill: "10% (1/10)",
    maxHits: 20,
  },
  {
    key: "zombie_golden",
    name: "黃金殭屍 (Golden Zombie)",
    instakill: "6.67% (1/15)",
    maxHits: 30,
  },
  {
    key: "zombie_black",
    name: "黑曜殭屍 (Black Zombie)",
    instakill: "6.67% (1/15)",
    maxHits: 30,
  },
  {
    key: "zombie_boss",
    name: "首領殭屍 (Boss Zombie)",
    instakill: "0.1% (1/1000)",
    maxHits: 2000,
  },
];

export default function ProbabilityListScreen({ onBack }: ProbabilityListScreenProps) {
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col p-8 font-sans overflow-auto">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-5xl w-full mx-auto bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col flex-1"
      >
        <div className="bg-slate-950 p-6 flex items-center justify-between border-b border-slate-700">
          <div>
            <h2 className="text-4xl font-bold text-cyan-400">機率列表 (Probability List)</h2>
            <p className="text-slate-400 text-lg mt-2">遊戲中設定的所有怪物的擊殺機率、必死機率數值</p>
          </div>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white text-xl rounded-lg font-medium transition-colors"
          >
            返回 (Back)
          </button>
        </div>
        
        <div className="p-8 flex-1 overflow-auto">
          <table className="w-full text-left text-lg text-slate-300">
            <thead className="text-base text-slate-400 uppercase bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">怪物類型 (Monster Type)</th>
                <th className="px-6 py-4">擊殺機率 (Instakill Probability)</th>
                <th className="px-6 py-4 rounded-tr-lg">必死打擊數 (Guaranteed Kill Hits)</th>
              </tr>
            </thead>
            <tbody>
              {PROBABILITY_DATA.map((item, idx) => (
                <tr key={item.key} className={idx % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"}>
                  <td className="px-6 py-4 font-medium text-white text-xl">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-mono text-xl">{item.instakill}</td>
                  <td className="px-6 py-4 text-amber-400 font-mono text-xl">{item.maxHits} 擊</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
