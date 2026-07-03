import { motion } from 'motion/react';

interface TaskListScreenProps {
  onBack: () => void;
}

const MISSION_CONFIG = {
  zombie_small: [10, 20, 30],
  zombie_big: [3, 6, 9],
  zombie_bomb: [2, 4, 6],
  zombie_bouncing: [2, 4, 6]
};

const ZOMBIE_NAMES: Record<string, string> = {
  zombie_small: "一般殭屍 (Small Zombie)",
  zombie_big: "巨型殭屍 (Big Zombie)",
  zombie_bomb: "炸彈殭屍 (Bomb Zombie)",
  zombie_bouncing: "彈跳殭屍 (Bouncing Zombie)",
};

export default function TaskListScreen({ onBack }: TaskListScreenProps) {
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col p-8 font-sans overflow-auto">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-5xl w-full mx-auto bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col flex-1"
      >
        <div className="bg-slate-950 p-6 flex items-center justify-between border-b border-slate-700">
          <div>
            <h2 className="text-4xl font-bold text-cyan-400">任務列表 (Task List)</h2>
            <p className="text-slate-400 text-lg mt-2">遊戲中設定的所有任務項目內容</p>
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
                <th className="px-6 py-4 rounded-tl-lg">目標類型 (Target)</th>
                <th className="px-6 py-4">一階段 (Tier 1)</th>
                <th className="px-6 py-4">二階段 (Tier 2)</th>
                <th className="px-6 py-4 rounded-tr-lg">三階段 (Tier 3)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(MISSION_CONFIG).map(([key, tiers], idx) => (
                <tr key={key} className={idx % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"}>
                  <td className="px-6 py-4 font-medium text-white text-xl">
                    {ZOMBIE_NAMES[key] || key}
                  </td>
                  <td className="px-6 py-4 text-cyan-300 text-xl">{tiers[0]} 隻</td>
                  <td className="px-6 py-4 text-cyan-300 text-xl">{tiers[1]} 隻</td>
                  <td className="px-6 py-4 text-cyan-300 text-xl">{tiers[2]} 隻</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
