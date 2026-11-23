function CardSkeleton() {
  return (
    <div
      className="relative rounded-[4.5%] bg-surface-1/40 backdrop-blur-md border-[6px] border-line overflow-hidden shadow-lg transition-shadow duration-300 w-full"
      style={{ aspectRatio: '2.5/3.5' }}
    >
      {/* Background Pulse */}
      <div className="absolute inset-0 animate-pulse bg-surface-3/50" />

      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent z-10" />

      {/* Art Box */}
      <div className="absolute top-[10%] left-[5%] right-[5%] h-[42%] bg-surface-3 rounded-sm" />

      {/* Title Bar */}
      <div className="absolute top-[4%] left-[5%] right-[30%] h-[4%] bg-surface-3 rounded-full" />
      <div className="absolute top-[4%] right-[5%] w-[15%] h-[4%] bg-surface-3 rounded-full" />

      {/* Type Line */}
      <div className="absolute top-[55%] left-[5%] right-[10%] h-[4%] bg-surface-3 rounded-full" />

      {/* Text Box Lines */}
      <div className="absolute top-[64%] left-[8%] right-[15%] h-[3%] bg-surface-3 rounded-full" />
      <div className="absolute top-[70%] left-[8%] right-[8%] h-[3%] bg-surface-3 rounded-full" />
      <div className="absolute top-[76%] left-[8%] right-[25%] h-[3%] bg-surface-3 rounded-full" />

      {/* PT Box */}
      <div className="absolute bottom-[4%] right-[5%] w-[20%] h-[6%] bg-surface-3 rounded-md" />
    </div>
  );
}

export default CardSkeleton;
