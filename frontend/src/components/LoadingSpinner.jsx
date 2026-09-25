import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: '#6366f1', borderRightColor: '#8b5cf6' }} />
      </div>
      <p className="text-sm text-slate-400 font-medium">Loading...</p>
    </div>
  );
}
