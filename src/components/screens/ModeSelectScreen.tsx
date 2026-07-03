import { useEffect } from 'react';
import { isSkillKey } from '../../constants/ui';
import bgImage from '../../PIC/Gemini_Generated_Image_zgmjdfzgmjdfzgmj.png';
import { SoundSystem } from '../../game/systems/SoundSystem';

interface ModeSelectScreenProps {
  onSelectMode: (mode: 'campaign' | 'versus') => void;
  energyPerCoin: number;
  onEnergyChange: (val: number) => void;
}

export default function ModeSelectScreen({ onSelectMode, energyPerCoin, onEnergyChange }: ModeSelectScreenProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const energies = [10, 15, 20, 25, 30];
      const currentIndex = energies.indexOf(energyPerCoin);

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (currentIndex > 0) {
          SoundSystem.play('Sse_03');
          onEnergyChange(energies[currentIndex - 1]);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        if (currentIndex < energies.length - 1) {
          SoundSystem.play('Sse_03');
          onEnergyChange(energies[currentIndex + 1]);
        }
      } else if (isSkillKey(e)) {
        e.preventDefault();
        SoundSystem.play('Sca_02');
        onSelectMode('campaign');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectMode, energyPerCoin, onEnergyChange]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-white font-mono p-16 select-none relative bg-slate-950 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none" 
        style={{ backgroundImage: `url(${bgImage})`, filter: 'brightness(0.8)' }} 
      />
      {/* Animated Matrix-like Background Sparkles and Contrast Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950/75 to-black pointer-events-none" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center max-w-7xl w-full">
        {/* Title / Header Area */}
        <div className="text-center mb-10 animate-fade-in pointer-events-none">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-400 to-red-500 tracking-widest mb-6 drop-shadow-[0_10px_25px_rgba(245,158,11,0.25)]">
            迴 旋 突 擊
          </h1>
          <p className="text-slate-400 text-2xl uppercase tracking-[0.4em] font-extrabold flex items-center justify-center gap-6">
            <span className="w-16 h-[3px] bg-cyan-500/50" />
            彩票機 V1.0
            <span className="w-16 h-[3px] bg-red-500/50" />
          </p>
        </div>

        {/* Energy Settings */}
        <div className="flex flex-col items-center gap-4 mb-10 pointer-events-auto">
          <h2 className="text-2xl font-bold tracking-widest text-slate-300 shadow-black drop-shadow-md">每1幣獲得能量數</h2>
          <div className="flex gap-4">
            {[10, 15, 20, 25, 30].map(val => (
              <button
                key={val}
                onClick={() => {
                  SoundSystem.play('Sse_03');
                  onEnergyChange(val);
                }}
                className={`px-6 py-3 rounded-xl font-bold text-2xl border-2 transition-all ${energyPerCoin === val ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-110 shadow-[0_0_20px_rgba(34,211,238,0.6)]' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white hover:bg-slate-700'}`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Control Hint Bar (Moved up) */}
        <div className="flex items-center gap-10 bg-slate-900/80 border-2 border-slate-800 px-12 py-5 rounded-full text-slate-300 text-lg tracking-[0.15em] animate-pulse backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.6)] mb-8">
          <span className="flex items-center gap-3">
            <span className="bg-slate-950 px-3 py-1 text-cyan-400 border border-slate-700 rounded-lg text-xl font-black">← / →</span>
            <span>選擇能量</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="bg-slate-950 px-3 py-1 text-pink-400 border border-slate-700 rounded-lg text-xl font-black">任一技能鍵</span>
            <span>確認進入</span>
          </span>
        </div>

        {/* Controls Layout Wrapper */}
        <div className="w-full max-w-7xl mb-6 bg-slate-900/60 border-2 border-slate-700/80 rounded-[2rem] p-8 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col items-center pointer-events-none">
          <h3 className="text-3xl font-black text-slate-300 mb-6 tracking-[0.2em]">玩家控制說明</h3>
          <div className="grid grid-cols-4 gap-6 w-full">
            {/* P1 Controls */}
            <div className="bg-slate-950/80 border border-blue-500/50 rounded-2xl p-6 flex flex-col items-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <h4 className="text-3xl font-black text-blue-400 mb-4 border-b border-blue-500/30 w-full text-center pb-3">1P 控制按鍵</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xl text-slate-300 w-full font-mono items-center">
                <span className="text-right text-slate-400">投幣</span>
                <span className="font-bold text-emerald-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">1</span>
                <span className="text-right text-slate-400">移動</span>
                <span className="font-bold text-white bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">WASD</span>
                <span className="text-right text-slate-400">加速</span>
                <span className="font-bold text-pink-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">Q</span>
                <span className="text-right text-slate-400">技能</span>
                <span className="font-bold text-cyan-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">E</span>
              </div>
            </div>
            
            {/* P2 Controls */}
            <div className="bg-slate-950/80 border border-red-500/50 rounded-2xl p-6 flex flex-col items-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <h4 className="text-3xl font-black text-red-400 mb-4 border-b border-red-500/30 w-full text-center pb-3">2P 控制按鍵</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xl text-slate-300 w-full font-mono items-center">
                <span className="text-right text-slate-400">投幣</span>
                <span className="font-bold text-emerald-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">2</span>
                <span className="text-right text-slate-400">移動</span>
                <span className="font-bold text-white bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">方向鍵</span>
                <span className="text-right text-slate-400">加速</span>
                <span className="font-bold text-pink-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">Enter</span>
                <span className="text-right text-slate-400">技能</span>
                <span className="font-bold text-cyan-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">Ctrl</span>
              </div>
            </div>
            
            {/* P3 Controls */}
            <div className="bg-slate-950/80 border border-yellow-500/50 rounded-2xl p-6 flex flex-col items-center shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              <h4 className="text-3xl font-black text-yellow-400 mb-4 border-b border-yellow-500/30 w-full text-center pb-3">3P 控制按鍵</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xl text-slate-300 w-full font-mono items-center">
                <span className="text-right text-slate-400">投幣</span>
                <span className="font-bold text-emerald-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">3</span>
                <span className="text-right text-slate-400">移動</span>
                <span className="font-bold text-white bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">IJKL</span>
                <span className="text-right text-slate-400">加速</span>
                <span className="font-bold text-pink-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">U</span>
                <span className="text-right text-slate-400">技能</span>
                <span className="font-bold text-cyan-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">O</span>
              </div>
            </div>

            {/* P4 Controls */}
            <div className="bg-slate-950/80 border border-green-500/50 rounded-2xl p-6 flex flex-col items-center shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <h4 className="text-3xl font-black text-green-400 mb-4 border-b border-green-500/30 w-full text-center pb-3">4P 控制按鍵</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xl text-slate-300 w-full font-mono items-center">
                <span className="text-right text-slate-400">投幣</span>
                <span className="font-bold text-emerald-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">4</span>
                <span className="text-right text-slate-400">移動</span>
                <span className="font-bold text-white bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">Num 8456</span>
                <span className="text-right text-slate-400">加速</span>
                <span className="font-bold text-pink-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">Num 7</span>
                <span className="text-right text-slate-400">技能</span>
                <span className="font-bold text-cyan-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-700 w-max">Num 9</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
