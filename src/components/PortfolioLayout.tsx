import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PortfolioNav } from './PortfolioNav';

export default function PortfolioLayout() {
  return (
    <div className="section-spacing space-y-4">
      <PortfolioNav />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4 opacity-50">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        </div>
      }>
        <Outlet />
      </Suspense>
    </div>
  );
}
