import { motion } from 'motion/react';

interface SpawnListScreenProps {
  onBack: () => void;
}

export default function SpawnListScreen({ onBack }: SpawnListScreenProps) {
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col p-8 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-cyan-400">單位生成規則 (Spawn Rules)</h2>
          <p className="text-slate-400 mt-2">Main battle spawn intervals, limits, and extra rules</p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium border border-slate-600"
        >
          返回 (Back)
        </button>
      </div>

      <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="h-full overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          <section className="space-y-4">
            <h3 className="text-2xl font-bold text-purple-400 flex items-center border-b border-slate-700 pb-2">
              敵人 (Enemies)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-lg font-bold text-white mb-2">一般殭屍 (Small/Big/Bomb/Bouncing Zombies)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-cyan-300">生成間隔 (Interval):</span> 0.75秒 / 玩家數量加成 (Scale Multiplier)</li>
                  <li><span className="text-cyan-300">數量上限 (Limits):</span> 基礎小殭屍20隻, 大殭屍6隻 (依玩家數量乘倍率, 最高1.8倍)</li>
                  <li><span className="text-cyan-300">每次生成 (Per Spawn):</span> 每次生成 2 隻</li>
                  <li><span className="text-cyan-300">種類機率 (Types):</span> 70% 小殭屍, 30% 大殭屍系列</li>
                  <li><span className="text-cyan-300">大殭屍系列分支:</span> 50% 大殭屍 (紫), 33.3% 炸彈殭屍 (棕), 16.7% 彈跳殭屍 (粉)</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-lg font-bold text-yellow-400 mb-2">黃金殭屍 (Golden Zombie)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-cyan-300">生成間隔 (Interval):</span> 每 30 秒</li>
                  <li><span className="text-cyan-300">數量上限 (Limit):</span> 場上最多 1 隻</li>
                  <li><span className="text-cyan-300">額外規則 (Extra):</span> 生成時會自帶 10 隻環繞的小殭屍</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-lg font-bold text-zinc-400 mb-2">黑猩猩殭屍 (Black Zombie)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-cyan-300">生成間隔 (Interval):</span> 每 30 秒</li>
                  <li><span className="text-cyan-300">數量上限 (Limit):</span> 場上最多 1 隻</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-lg font-bold text-red-400 mb-2">Boss 殭屍 (Boss Zombie)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-cyan-300">觸發條件 (Trigger):</span> 玩家收集滿 5 把鑰匙後觸發場地轉換，進入Boss戰</li>
                  <li><span className="text-cyan-300">數量上限 (Limit):</span> 1 隻</li>
                  <li><span className="text-cyan-300">額外規則 (Extra):</span> 出現時會清空場上所有一般殭屍並暫停一般殭屍生成</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold text-green-400 flex items-center border-b border-slate-700 pb-2">
              障礙物 (Obstacles)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-lg font-bold text-white mb-2">中央水泥塊 (Concrete Blocks)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-cyan-300">生成時間 (Spawn Time):</span> 遊戲初始化時生成</li>
                  <li><span className="text-cyan-300">數量 (Count):</span> 隨機散佈 3 個於場地中央</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-lg font-bold text-yellow-500 mb-2">寶箱 (Chest)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-cyan-300">生成間隔 (Interval):</span> 每 20 秒</li>
                  <li><span className="text-cyan-300">數量上限 (Limit):</span> 場上最多 1 個</li>
                  <li><span className="text-cyan-300">條件 (Condition):</span> 場上無寶箱且無任何已啟動的特殊武器時才會累計計時</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 opacity-50">
                <h4 className="text-lg font-bold text-red-400 mb-2">汽油桶 (Barrel / Landmine)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-red-300">狀態 (Status):</span> 已停用 (Disabled by user)</li>
                  <li><span className="text-cyan-300">原生成間隔 (Original Interval):</span> 每 8 秒</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold text-blue-400 flex items-center border-b border-slate-700 pb-2">
              道具 (Items)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-lg font-bold text-yellow-300 mb-2">鑰匙 (Key)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-cyan-300">掉落條件 (Drop Rule):</span> 擊殺敵人時有 1/2000 機率掉落</li>
                  <li><span className="text-cyan-300">停留時間 (Hover Time):</span> 2 秒</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-lg font-bold text-green-300 mb-2">能量幣 (Ticket)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-cyan-300">掉落條件 (Drop Rule):</span> 擊殺敵人時必定掉落</li>
                  <li><span className="text-cyan-300">掉落數量 (Amounts):</span> 小殭屍(2), 大殭屍(6), 炸彈(8), 彈跳(10), 黃金/黑猩猩(15), Boss(100)</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 opacity-50">
                <h4 className="text-lg font-bold text-yellow-400 mb-2">無敵星 (Star)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-red-300">狀態 (Status):</span> 已停用 (Disabled by user)</li>
                  <li><span className="text-cyan-300">原生成間隔 (Original Interval):</span> 每 30 秒</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold text-orange-400 flex items-center border-b border-slate-700 pb-2">
              彈射區 (Launch Pads)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-lg font-bold text-white mb-2">單人彈射區 (Single Launch Pad)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-cyan-300">生成間隔 (Interval):</span> 每 10 秒</li>
                  <li><span className="text-cyan-300">功能 (Function):</span> 陀螺進入後會進入高速旋轉並朝指標方向發射</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-lg font-bold text-pink-400 mb-2">多人彈射區 (Multiplayer Launch Pad)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-cyan-300">生成間隔 (Interval):</span> 每 20 秒</li>
                  <li><span className="text-cyan-300">功能 (Function):</span> 允許多個陀螺同時進入並聯合發射</li>
                </ul>
              </div>
            </div>
          </section>

        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
