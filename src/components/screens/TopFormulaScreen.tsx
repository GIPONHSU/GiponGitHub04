import { motion } from 'motion/react';

interface TopFormulaScreenProps {
  onBack: () => void;
}

export default function TopFormulaScreen({ onBack }: TopFormulaScreenProps) {
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col p-8 font-sans overflow-auto">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-5xl w-full mx-auto bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col flex-1"
      >
        <div className="bg-slate-950 p-6 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-6xl font-bold text-cyan-400">陀螺計算公式 (Top Formula)</h2>
            <p className="text-slate-400 text-2xl mt-4">陀螺基本參數與戰鬥破壞判定公式說明</p>
          </div>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white text-3xl rounded-lg font-medium transition-colors"
          >
            返回 (Back)
          </button>
        </div>
        
        <div className="p-8 flex-1 overflow-auto space-y-8 text-slate-300">
          
          <section className="space-y-6">
            <h3 className="text-4xl font-bold text-emerald-400 border-b border-slate-700 pb-2">一、 陀螺基礎參數運作規則</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 p-5 rounded-lg border border-slate-600">
                <h4 className="text-3xl font-bold text-white mb-4">轉速 (Spin)</h4>
                <p className="text-slate-300 leading-relaxed text-2xl">
                  陀螺的核心動力指標。轉速越高，機動性越強。發動技能或特殊攻擊（如衝刺）時會消耗轉速。此外，當陀螺遭受怪物或陷阱攻擊時，也會被扣減轉速值。轉速不會隨時間自然衰減，但若因受擊或過度衝刺降至過低，陀螺將失去攻擊與防禦能力。
                </p>
              </div>
              <div className="bg-slate-700/30 p-5 rounded-lg border border-slate-600">
                <h4 className="text-3xl font-bold text-white mb-4">能量值 (Energy)</h4>
                <p className="text-slate-300 leading-relaxed text-2xl">
                  代表陀螺的戰鬥儲備資源。能量值的消耗是依據陀螺進行碰撞攻擊的次數而定（每次有效碰撞敵人會扣除 1 點能量）。能量值只能透過玩家投幣來補充，且受擊時不會被扣除（受擊是扣減轉速）。當能量值因持續攻擊消耗至歸零時，陀螺將會失去戰鬥能力並進入停滯狀態，若未能在時限內重新投幣補充，將會被判定為破壞並從場上淘汰。
                </p>
              </div>
              <div className="bg-slate-700/30 p-5 rounded-lg border border-slate-600">
                <h4 className="text-3xl font-bold text-white mb-4">質量 (Mass)</h4>
                <p className="text-slate-300 leading-relaxed text-2xl">
                  影響物理碰撞的關鍵參數。質量越大的陀螺在與其他物體或怪物發生碰撞時，越不容易被彈開（擊退抗性高），同時能給予對方更大的物理推力。
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-4xl font-bold text-amber-400 border-b border-slate-700 pb-2">二、 碰撞目標破壞判定計算公式</h3>
            <p className="text-2xl leading-relaxed text-slate-300 bg-slate-900/50 p-6 rounded border border-slate-800">
              當陀螺與怪物發生碰撞時，每一次有效的傷害碰撞都會對該怪物進行一次**「破壞判定」**。判定機制包含**「即死機率觸發」**與**「保底擊殺次數」**雙重系統：<br/><br/>
              <span className="text-cyan-300 font-semibold">運算邏輯：</span> 系統會記錄單一陀螺對該目標的「累積攻擊次數 (Current Hits)」。每次碰撞時，會進行一次亂數機率判定（Instakill Check）。若機率命中，**或**該陀螺對目標的累積攻擊次數達標，目標將被直接判定破壞（HP歸零）。
            </p>

            <div className="overflow-hidden rounded-lg border border-slate-700">
              <table className="w-full text-left text-2xl text-slate-300">
                <thead className="text-xl text-slate-400 uppercase bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4">目標類型 (Target Type)</th>
                    <th className="px-6 py-4">機率判定 (Instakill Probability)</th>
                    <th className="px-6 py-4">保底擊殺 (Guaranteed Kill Hits)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  <tr className="bg-slate-800 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">一般殭屍 (Small Zombie)</td>
                    <td className="px-6 py-4 text-emerald-400 font-mono">50.0% (1/2)</td>
                    <td className="px-6 py-4 text-amber-400 font-mono">4 次</td>
                  </tr>
                  <tr className="bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">巨型殭屍 (Big Zombie)</td>
                    <td className="px-6 py-4 text-emerald-400 font-mono">16.6% (1/6)</td>
                    <td className="px-6 py-4 text-amber-400 font-mono">12 次</td>
                  </tr>
                  <tr className="bg-slate-800 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">炸彈殭屍 (Bomb Zombie)</td>
                    <td className="px-6 py-4 text-emerald-400 font-mono">12.5% (1/8)</td>
                    <td className="px-6 py-4 text-amber-400 font-mono">16 次</td>
                  </tr>
                  <tr className="bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">彈跳殭屍 (Bouncing Zombie)</td>
                    <td className="px-6 py-4 text-emerald-400 font-mono">10.0% (1/10)</td>
                    <td className="px-6 py-4 text-amber-400 font-mono">20 次</td>
                  </tr>
                  <tr className="bg-slate-800 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">黃金/黑曜殭屍 (Golden/Black Zombie)</td>
                    <td className="px-6 py-4 text-emerald-400 font-mono">6.6% (1/15)</td>
                    <td className="px-6 py-4 text-amber-400 font-mono">30 次</td>
                  </tr>
                  <tr className="bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-red-400">首領殭屍 (Boss Zombie)</td>
                    <td className="px-6 py-4 text-emerald-400 font-mono">0.1% (1/1000)</td>
                    <td className="px-6 py-4 text-amber-400 font-mono">2000 次</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="bg-blue-900/20 p-6 rounded border border-blue-800/50 mt-6">
              <h4 className="text-blue-400 font-bold mb-2 text-2xl">💡 計算備註</h4>
              <ul className="list-disc pl-8 space-y-2 text-slate-300 text-xl">
                <li>累積次數是綁定於「單一陀螺」與「單一怪物」之間。不同陀螺對同一怪物的攻擊次數分開計算。</li>
                <li>怪物基礎設定上仍有傳統 HP，但現行主要擊殺手段由上述雙重判定系統決定。</li>
                <li>部分特殊攻擊（如場地陷阱傷害）可能有不同的傷害係數，但一般物理撞擊皆遵循此判定公式。</li>
              </ul>
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
}
