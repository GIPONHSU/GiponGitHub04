import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CANVAS_W, CANVAS_H } from '../../game/constants';

interface ArenaLayoutScreenProps {
  onBack: () => void;
}

type SpawnType = 'none' | 'obstacles' | 'chests' | 'pads' | 'pads_single' | 'pads_single_around' | 'pads_single_spiral' | 'pads_single_cross' | 'pads_single_figure8' | 'pads_multi' | 'zombies' | 'drops';

export default function ArenaLayoutScreen({ onBack }: ArenaLayoutScreenProps) {
  const [selectedType, setSelectedType] = useState<SpawnType>('none');
  const [isPadsExpanded, setIsPadsExpanded] = useState(false);
  const [isSinglePadsExpanded, setIsSinglePadsExpanded] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const borderSize = 2; // matches border-2
    const contentWidth = rect.width - borderSize * 2;
    const contentHeight = rect.height - borderSize * 2;
    
    const xRel = e.clientX - rect.left - borderSize;
    const yRel = e.clientY - rect.top - borderSize;
    
    const x = (xRel / contentWidth) * CANVAS_W;
    const y = (yRel / contentHeight) * CANVAS_H;
    
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const renderArenaMap = () => {
    // 縮放比例，讓 1920x1080 可以塞進右側畫面
    const scale = 0.5; // => 960x540

    return (
      <div 
        className="relative bg-slate-900 border-2 border-slate-700 overflow-hidden cursor-crosshair box-content"
        style={{ width: CANVAS_W * scale, height: CANVAS_H * scale }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* 背景網格與座標軸 */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="100%" height="100%" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="none">
            {/* 格線 */}
            <defs>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse" x="60" y="40">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* X/Y 座標軸 (以 960, 540 為原點) */}
            <line x1="0" y1={CANVAS_H / 2} x2={CANVAS_W} y2={CANVAS_H / 2} stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="10 10" />
            <line x1={CANVAS_W / 2} y1="0" x2={CANVAS_W / 2} y2={CANVAS_H} stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="10 10" />

            {/* 標示象限 */}
            <text x={CANVAS_W / 2 + 20} y={40} fill="rgba(255,255,255,0.5)" fontSize="32" fontFamily="monospace">Y-</text>
            <text x={CANVAS_W / 2 + 20} y={CANVAS_H - 20} fill="rgba(255,255,255,0.5)" fontSize="32" fontFamily="monospace">Y+</text>
            <text x={20} y={CANVAS_H / 2 - 20} fill="rgba(255,255,255,0.5)" fontSize="32" fontFamily="monospace">X-</text>
            <text x={CANVAS_W - 60} y={CANVAS_H / 2 - 20} fill="rgba(255,255,255,0.5)" fontSize="32" fontFamily="monospace">X+</text>
            
            {/* 原點標示 */}
            <circle cx={CANVAS_W / 2} cy={CANVAS_H / 2} r="5" fill="white" />
            <text x={CANVAS_W / 2 + 10} y={CANVAS_H / 2 - 15} fill="white" fontSize="28" fontFamily="monospace">(0, 0)</text>

            {/* 場地邊界 (膠囊形) */}
            <path 
              d={`M 540 ${540 - 480} L 1380 ${540 - 480} A 480 480 0 0 1 1380 ${540 + 480} L 540 ${540 + 480} A 480 480 0 0 1 540 ${540 - 480} Z`}
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="4" 
            />

            {/* 根據選擇的項目顯示生成範圍或位置 */}
            {selectedType === 'obstacles' && (
              <rect x="400" y="250" width={1520 - 400} height={830 - 250} fill="rgba(148, 163, 184, 0.3)" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5" />
            )}
            
            {selectedType === 'chests' && (
              <rect x="400" y="250" width={1520 - 400} height={830 - 250} fill="rgba(250, 204, 21, 0.3)" stroke="#facc15" strokeWidth="2" strokeDasharray="5 5" />
            )}

            {selectedType === 'drops' && (
              <rect x="200" y="200" width={1720 - 200} height={880 - 200} fill="rgba(250, 204, 21, 0.3)" stroke="#facc15" strokeWidth="2" strokeDasharray="5 5" />
            )}

            {(selectedType.startsWith('pads_single') || selectedType === 'pads' || selectedType === 'pads_multi') && (
              <>
                {(selectedType === 'pads' || selectedType === 'pads_single') && (
                  <>
                    <circle cx="360" cy="840" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <circle cx="1560" cy="240" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <circle cx="960" cy="540" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <circle cx="560" cy="140" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <circle cx="1360" cy="940" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <circle cx="760" cy="540" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <circle cx="1160" cy="540" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <text x="360" y="840" fill="white" fontSize="28" textAnchor="middle" dominantBaseline="middle">單人</text>
                    <text x="1560" y="240" fill="white" fontSize="28" textAnchor="middle" dominantBaseline="middle">單人</text>
                    <text x="960" y="540" fill="white" fontSize="28" textAnchor="middle" dominantBaseline="middle">單人</text>
                    <text x="560" y="140" fill="white" fontSize="28" textAnchor="middle" dominantBaseline="middle">單人</text>
                    <text x="1360" y="940" fill="white" fontSize="28" textAnchor="middle" dominantBaseline="middle">單人</text>
                    <text x="760" y="540" fill="white" fontSize="28" textAnchor="middle" dominantBaseline="middle">單人</text>
                    <text x="1160" y="540" fill="white" fontSize="28" textAnchor="middle" dominantBaseline="middle">單人</text>
                  </>
                )}
                {(selectedType === 'pads' || selectedType === 'pads_multi') && (
                  <>
                    <circle cx="960" cy="540" r="120" fill="rgba(59, 130, 246, 0.5)" stroke="#3b82f6" strokeWidth="3" />
                    <text x="960" y="470" fill="white" fontSize="32" textAnchor="middle" dominantBaseline="middle">多人共用</text>
                  </>
                )}

                {selectedType === 'pads_single_around' && (
                  <>
                    <circle cx="360" cy="840" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <circle cx="1560" cy="240" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <text x="360" y="840" fill="white" fontSize="32" textAnchor="middle" dominantBaseline="middle">左下</text>
                    <text x="1560" y="240" fill="white" fontSize="32" textAnchor="middle" dominantBaseline="middle">右上</text>
                  </>
                )}
                {selectedType === 'pads_single_spiral' && (
                  <>
                    <circle cx="960" cy="540" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <text x="960" y="540" fill="white" fontSize="32" textAnchor="middle" dominantBaseline="middle">中央</text>
                  </>
                )}
                {selectedType === 'pads_single_cross' && (
                  <>
                    <circle cx="560" cy="140" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <circle cx="1360" cy="940" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <text x="560" y="140" fill="white" fontSize="32" textAnchor="middle" dominantBaseline="middle">左上</text>
                    <text x="1360" y="940" fill="white" fontSize="32" textAnchor="middle" dominantBaseline="middle">右下</text>
                  </>
                )}
                {selectedType === 'pads_single_figure8' && (
                  <>
                    <circle cx="760" cy="540" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <circle cx="1160" cy="540" r="48" fill="rgba(34, 197, 94, 0.5)" stroke="#22c55e" strokeWidth="3" />
                    <text x="760" y="540" fill="white" fontSize="32" textAnchor="middle" dominantBaseline="middle">中左</text>
                    <text x="1160" y="540" fill="white" fontSize="32" textAnchor="middle" dominantBaseline="middle">中右</text>
                  </>
                )}
              </>
            )}

            {selectedType === 'zombies' && (
              <>
                <rect x="0" y="0" width={CANVAS_W} height="100" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth="4" />
                <rect x="0" y={CANVAS_H - 100} width={CANVAS_W} height="100" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth="4" />
                <rect x="0" y="100" width="100" height={CANVAS_H - 200} fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth="4" />
                <rect x={CANVAS_W - 100} y="100" width="100" height={CANVAS_H - 200} fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth="4" />
                
                <text x={CANVAS_W / 2} y="50" fill="white" fontSize="40" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">上方邊緣生成區</text>
                <text x={CANVAS_W / 2} y={CANVAS_H - 50} fill="white" fontSize="40" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">下方邊緣生成區</text>
                <text x="50" y={CANVAS_H / 2} fill="white" fontSize="40" textAnchor="middle" dominantBaseline="middle" fontWeight="bold" transform={`rotate(-90 50 ${CANVAS_H / 2})`}>左方邊緣生成區</text>
                <text x={CANVAS_W - 50} y={CANVAS_H / 2} fill="white" fontSize="40" textAnchor="middle" dominantBaseline="middle" fontWeight="bold" transform={`rotate(90 ${CANVAS_W - 50} ${CANVAS_H / 2})`}>右方邊緣生成區</text>
              </>
            )}

            {/* 十字游標與座標 */}
            {mousePos && (
              <>
                <line x1={mousePos.x} y1={0} x2={mousePos.x} y2={CANVAS_H} stroke="rgba(255,255,255,0.8)" strokeWidth="1" strokeDasharray="4 4" pointerEvents="none" />
                <line x1={0} y1={mousePos.y} x2={CANVAS_W} y2={mousePos.y} stroke="rgba(255,255,255,0.8)" strokeWidth="1" strokeDasharray="4 4" pointerEvents="none" />
                <rect 
                  x={mousePos.x > CANVAS_W - 220 ? mousePos.x - 230 : mousePos.x + 10} 
                  y={mousePos.y > CANVAS_H - 60 ? mousePos.y - 60 : mousePos.y + 10} 
                  width="220" 
                  height="50" 
                  fill="rgba(0,0,0,0.7)" 
                  rx="5"
                  pointerEvents="none"
                />
                <text 
                  x={mousePos.x > CANVAS_W - 220 ? mousePos.x - 220 : mousePos.x + 20} 
                  y={mousePos.y > CANVAS_H - 60 ? mousePos.y - 25 : mousePos.y + 40} 
                  fill="white" 
                  fontSize="28" 
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  ({Math.round(mousePos.x - CANVAS_W / 2)}, {Math.round(mousePos.y - CANVAS_H / 2)})
                </text>
              </>
            )}

          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-slate-950 flex font-sans text-white">
      {/* 左側選單 */}
      <div className="w-96 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <h2 className="text-4xl font-bold text-cyan-400 mb-6">場地配置圖<br/><span className="text-lg text-slate-400">Arena Layout</span></h2>
        
        <div className="flex flex-col space-y-3 flex-grow">
          <button 
            onClick={() => setSelectedType('obstacles')}
            className={`px-4 py-3 text-xl text-left rounded-lg transition-colors border ${selectedType === 'obstacles' ? 'bg-slate-700 border-cyan-500 text-white' : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-700'}`}
          >
            水泥塊 (Obstacles)
          </button>
          <button 
            onClick={() => setSelectedType('chests')}
            className={`px-4 py-3 text-xl text-left rounded-lg transition-colors border ${selectedType === 'chests' ? 'bg-slate-700 border-cyan-500 text-white' : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-700'}`}
          >
            道具箱 (Item Chests)
          </button>
          <div className="flex flex-col">
            <button 
              onClick={() => {
                setIsPadsExpanded(!isPadsExpanded);
                if (!selectedType.startsWith('pads')) {
                  setSelectedType('pads');
                }
              }}
              className={`px-4 py-3 text-xl text-left rounded-lg transition-colors border flex justify-between items-center ${selectedType.startsWith('pads') ? 'bg-slate-700 border-cyan-500 text-white' : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-700'}`}
            >
              <span>彈射區 (Launch Pads)</span>
              <span className="text-base text-slate-400">{isPadsExpanded ? '▼' : '▶'}</span>
            </button>
            
            {isPadsExpanded && (
              <div className="flex flex-col pl-4 mt-2 space-y-2 mb-2">
                <button 
                  onClick={() => setSelectedType('pads')}
                  className={`px-4 py-2 text-left rounded-lg transition-colors text-lg border ${selectedType === 'pads' ? 'bg-slate-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                >
                  全部彈射區 (All Pads)
                </button>
                
                <div className="flex flex-col">
                  <button 
                    onClick={() => {
                      setIsSinglePadsExpanded(!isSinglePadsExpanded);
                      if (!selectedType.startsWith('pads_single')) {
                        setSelectedType('pads_single');
                      }
                    }}
                    className={`px-4 py-2 text-left rounded-lg transition-colors text-lg border flex justify-between items-center ${selectedType.startsWith('pads_single') ? 'bg-slate-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                  >
                    <span>單人彈射區 (Single Pads)</span>
                    <span className="text-base text-slate-400">{isSinglePadsExpanded ? '▼' : '▶'}</span>
                  </button>
                  
                  {isSinglePadsExpanded && (
                    <div className="flex flex-col pl-4 mt-2 space-y-2 mb-2">
                      <button 
                        onClick={() => setSelectedType('pads_single_around')}
                        className={`px-4 py-1.5 text-left rounded-lg transition-colors text-base border ${selectedType === 'pads_single_around' ? 'bg-slate-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                      >
                        繞場型 (Around)
                      </button>
                      <button 
                        onClick={() => setSelectedType('pads_single_spiral')}
                        className={`px-4 py-1.5 text-left rounded-lg transition-colors text-base border ${selectedType === 'pads_single_spiral' ? 'bg-slate-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                      >
                        螺旋型 (Spiral)
                      </button>
                      <button 
                        onClick={() => setSelectedType('pads_single_cross')}
                        className={`px-4 py-1.5 text-left rounded-lg transition-colors text-base border ${selectedType === 'pads_single_cross' ? 'bg-slate-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                      >
                        交叉彈跳型 (Cross)
                      </button>
                      <button 
                        onClick={() => setSelectedType('pads_single_figure8')}
                        className={`px-4 py-1.5 text-left rounded-lg transition-colors text-base border ${selectedType === 'pads_single_figure8' ? 'bg-slate-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                      >
                        八字形 (Figure 8)
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedType('pads_multi')}
                  className={`px-4 py-2 text-left rounded-lg transition-colors text-lg border ${selectedType === 'pads_multi' ? 'bg-slate-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                >
                  多人共用彈射區 (Multi Pads)
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSelectedType('zombies')}
            className={`px-4 py-3 text-xl text-left rounded-lg transition-colors border ${selectedType === 'zombies' ? 'bg-slate-700 border-cyan-500 text-white' : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-700'}`}
          >
            殭屍生成區 (Zombie Spawns)
          </button>
          <button 
            onClick={() => setSelectedType('drops')}
            className={`px-4 py-3 text-xl text-left rounded-lg transition-colors border ${selectedType === 'drops' ? 'bg-slate-700 border-cyan-500 text-white' : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-700'}`}
          >
            一般掉落物 (Item Drops)
          </button>
        </div>

        <button
          onClick={onBack}
          className="mt-6 px-4 py-3 bg-red-900/80 hover:bg-red-800 text-xl text-red-100 rounded-lg font-bold transition-colors w-full"
        >
          返回 (Back)
        </button>
      </div>

      {/* 右側畫面 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <h3 className="text-3xl font-bold mb-4 text-slate-300">
          全景圖 (1920x1080)
        </h3>
        {renderArenaMap()}
        
        <div className="absolute bottom-8 text-slate-500 text-lg">
          * 單位為 px。原點(0,0)設定於 (960, 540)
        </div>
      </div>
    </div>
  );
}
