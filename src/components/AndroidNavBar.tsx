import React from 'react';

export const AndroidNavBar: React.FC = () => {
  return (
    <div className="h-6 w-full flex items-center justify-center bg-slate-950 shrink-0 select-none">
      {/* Android gesture home pill */}
      <div className="w-32 h-1 bg-slate-400/60 rounded-full hover:bg-slate-300 transition-colors" />
    </div>
  );
};
