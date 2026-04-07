import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';

export default function Creation({ onComplete }: { onComplete: () => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(18);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phases = useMemo(
    () => ['扫描毛发纹理', '提取脸部特征', '同步互动偏好', '生成宠语人格', '写入数字分身档案'],
    [],
  );

  useEffect(() => {
    if (!isGenerating) return;
    const progressTimer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 9, 100));
      setPhaseIndex((current) => (current + 1) % phases.length);
    }, 560);
    const finishTimer = window.setTimeout(() => {
      window.clearInterval(progressTimer);
      onComplete();
    }, 4200);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(finishTimer);
    };
  }, [isGenerating, onComplete, phases.length]);

  const startGeneration = () => {
    if (isGenerating) return;
    setProgress(18);
    setPhaseIndex(0);
    setIsGenerating(true);
  };

  return (
    <div className="px-6 space-y-10">
      <section 
        className="text-center space-y-4 cursor-pointer"
        onClick={startGeneration}
      >
        <h1 className="font-headline text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          创建您的 <span className="text-primary italic">宠物数字分身</span>
        </h1>
        <p className="text-slate-500 text-lg px-4 font-medium">上传一张宠物的清晰照片，生成它们的 3D 虚拟形象与宠语人格。</p>
      </section>

      <div className="relative group">
        <div 
          onClick={startGeneration}
          className="w-full aspect-square border-4 border-dashed border-primary/20 rounded-[4rem] bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all duration-500 shadow-sm overflow-hidden relative"
        >
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(175,251,216,0.62),transparent_60%)]"
            />
          )}
          <motion.div
            animate={isGenerating ? { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] } : { scale: 1, rotate: 0 }}
            transition={isGenerating ? { duration: 1.1, repeat: Infinity } : undefined}
            className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform relative z-10"
          >
            <span className="material-symbols-outlined text-primary text-4xl font-bold">{isGenerating ? 'neurology' : 'add_a_photo'}</span>
          </motion.div>
          <p className="font-bold text-slate-900 text-xl relative z-10">{isGenerating ? phases[phaseIndex] : '上传宠物照片'}</p>
          <p className="text-slate-400 text-sm mt-2 font-medium relative z-10">
            {isGenerating ? '正在生成可交互数字分身...' : '正脸肖像效果最佳'}
          </p>
          <div className="relative z-10 mt-6 rounded-full bg-primary/10 px-4 py-2 text-xs font-black text-primary">
            {isGenerating ? '生成中，请稍候' : '点击开始生成'}
          </div>
        </div>

        <div className="absolute -bottom-6 -right-4 w-48 h-64 bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl p-4 border border-white/20 z-30">
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-surface-container-low">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCip9UhM8dtpLNLJ7NmIX2DIvfcgrrW3fl0t-QTYhQQQPFeMpILCUy-ioYCJs5U3k2HnIvWYb4_l1ypiLo6OeoR0taBdyjl-IciAdTZ63Sh5IXNovvOkT_oaQ5UU-FbO9z8fuO77hFpPD_1h4_dwqIGsdj2tQQBnc8zPGIU50NNMWvN7UiZd_CuLVI4BssHxsJQIBbfbYjo4I1TEoMXNJJi9AMKF_H3smjsFEj9MeemkO52G9uqK4fOuyu6paDWjN_XIX6tcwIgyW8" 
              className="w-full h-full object-cover" 
              alt="3D 预览" 
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-3">
              <div className="h-2 w-16 bg-primary/20 rounded-full mb-2" />
              <div className="h-2 w-10 bg-primary/20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end mb-2 px-1">
          <span className="font-bold text-on-surface text-lg">{isGenerating ? `${phases[phaseIndex]}...` : '等待开始生成...'}</span>
          <span className="text-primary font-bold">{progress}%</span>
        </div>
        <div className="h-4 w-full bg-surface-container rounded-full overflow-hidden p-1 shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-xl">auto_fix</span>
          </div>
          <p className="font-bold text-on-surface">神经细节</p>
          <p className="text-on-surface-variant text-xs">增强3D写实特征。</p>
        </div>
        <div className="bg-white p-6 rounded-3xl space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary text-xl">palette</span>
          </div>
          <p className="font-bold text-on-surface">调色板</p>
          <p className="text-on-surface-variant text-xs">提取独特的皮毛图案。</p>
        </div>
      </div>

      <button 
        onClick={startGeneration}
        disabled={isGenerating}
        className="w-full bg-primary text-white font-bold py-5 rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {isGenerating ? '正在生成数字分身' : '开始生成并审核特征'}
        <span className="material-symbols-outlined">{isGenerating ? 'progress_activity' : 'arrow_forward'}</span>
      </button>
    </div>
  );
}
