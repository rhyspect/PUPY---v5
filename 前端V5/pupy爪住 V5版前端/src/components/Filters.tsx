import { useState } from 'react';
import { motion } from 'motion/react';

interface FiltersProps {
  onClose: () => void;
}

export default function Filters({ onClose }: FiltersProps) {
  const filterCategories = [
    {
      id: 'breed',
      label: '品种',
      icon: 'pets',
      description: '优先展示测试池中更常见的宠物类型。',
      options: ['金毛', '柴犬', '边牧', '柯基', '哈士奇', '萨摩耶'],
    },
    {
      id: 'mbti',
      label: '性格类型',
      icon: 'psychology',
      description: '按宠物互动强度筛选，减少无效推荐。',
      options: ['E系宠物', 'I系宠物', '社恐', '社牛', '治愈系', '运动健将'],
    },
    {
      id: 'distance',
      label: '距离范围',
      icon: 'near_me',
      description: '控制同城线下见面和云端地图推荐半径。',
      options: ['500米内', '1公里内', '2公里内', '5公里内', '同城'],
    }
  ];
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
    breed: '金毛',
    mbti: 'E系宠物',
    distance: '2公里内',
  });

  const resetFilters = () => {
    setSelectedFilters({ breed: '金毛', mbti: 'E系宠物', distance: '2公里内' });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end justify-center p-4">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md glass rounded-[3rem] shadow-2xl p-7 space-y-7 border border-white/50"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-primary/70">偏好设置</p>
            <h2 className="mt-2 text-2xl font-black font-headline text-slate-900 tracking-tight">筛选更合适的小伙伴</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">先用精简条件做测试，后续可接入后端推荐权重。</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 shrink-0 rounded-full bg-white/80 flex items-center justify-center text-slate-400 shadow-sm">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          {filterCategories.map((category) => (
            <div key={category.id} className="soft-panel rounded-[2rem] border border-white/60 p-4">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">{category.icon}</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{category.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{category.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {category.options.map((option) => {
                  const active = selectedFilters[category.id] === option;
                  return (
                  <button 
                    key={option}
                    type="button"
                    onClick={() => setSelectedFilters((previous) => ({ ...previous, [category.id]: option }))}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all ${active ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-white/70 bg-white/80 text-slate-500 hover:text-primary'}`}
                  >
                    {option}
                  </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={resetFilters}
            className="flex-1 py-4 bg-white/80 text-slate-500 font-black rounded-2xl active:scale-95 transition-transform shadow-sm"
          >
            重置
          </button>
          <button 
            onClick={onClose}
            className="flex-[2] py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 active:scale-95 transition-transform"
          >
            应用筛选
          </button>
        </div>
      </motion.div>
    </div>
  );
}
