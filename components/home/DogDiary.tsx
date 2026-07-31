"use client";

export default function DogDiary() {
  return (
    <div className="flex h-[160px] w-full flex-col rounded-3xl border border-white/40 bg-white/40 p-3 shadow-xl backdrop-blur-md md:h-[220px] md:p-6 dark:border-white/10 dark:bg-slate-800/50">
      <div className="flex items-center justify-between">
        <span className="rounded-sm bg-white/50 px-2 py-0.5 text-[10px] font-black tracking-widest text-pink-500 uppercase shadow-sm dark:bg-slate-900/50 dark:text-pink-400">
          舔狗日记
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        暂无内容
      </div>
    </div>
  );
}
