import { motion } from 'motion/react';

interface DeveloperScreenProps {
  onSelect: (screen: 'fbxPreview' | 'taskList' | 'probabilityList' | 'arenaLayout' | 'spawnList' | 'formulaScreen') => void;
  onBack: () => void;
}

export default function DeveloperScreen({ onSelect, onBack }: DeveloperScreenProps) {
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-8 font-sans">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700"
      >
        <div className="bg-slate-950 p-6 text-center border-b border-slate-700">
          <h2 className="text-3xl font-bold text-cyan-400">Developer Menu</h2>
          <p className="text-slate-400 text-base mt-2">Access development tools and configurations</p>
        </div>
        
        <div className="p-6 space-y-4 flex flex-col">
          <button
            onClick={() => onSelect('fbxPreview')}
            className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg rounded-lg font-medium transition-colors shadow-sm flex items-center justify-between group"
          >
            <span>FBX預覽模式 (FBX Preview)</span>
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">→</span>
          </button>
          
          <button
            onClick={() => onSelect('taskList')}
            className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg rounded-lg font-medium transition-colors shadow-sm flex items-center justify-between group"
          >
            <span>任務列表 (Task List)</span>
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">→</span>
          </button>

          <button
            onClick={() => onSelect('formulaScreen')}
            className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg rounded-lg font-medium transition-colors shadow-sm flex items-center justify-between group"
          >
            <span>陀螺計算公式 (Top Formula)</span>
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">→</span>
          </button>

          <button
            onClick={() => onSelect('probabilityList')}
            className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg rounded-lg font-medium transition-colors shadow-sm flex items-center justify-between group"
          >
            <span>機率列表 (Probability List)</span>
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">→</span>
          </button>

          <button
            onClick={() => onSelect('arenaLayout')}
            className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg rounded-lg font-medium transition-colors shadow-sm flex items-center justify-between group"
          >
            <span>場地配置圖 (Arena Layout)</span>
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">→</span>
          </button>

          <button
            onClick={() => onSelect('spawnList')}
            className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg rounded-lg font-medium transition-colors shadow-sm flex items-center justify-between group"
          >
            <span>單位生成列表 (Spawn Rules)</span>
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">→</span>
          </button>
        </div>

        <div className="p-4 bg-slate-900/50 text-center border-t border-slate-700">
          <button
            onClick={onBack}
            className="px-8 py-3 bg-red-900/80 hover:bg-red-800 text-red-100 text-xl rounded-lg font-bold tracking-wider uppercase transition-colors"
          >
            返回 (Back)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
