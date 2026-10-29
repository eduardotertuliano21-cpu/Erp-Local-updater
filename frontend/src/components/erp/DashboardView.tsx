import React from 'react';
import { DashboardOverview } from './DashboardOverview.js';

export const DashboardView: React.FC = () => {
  return (
    <div className="w-full max-w-[1600px] mx-auto pb-8">
      <DashboardOverview />
    </div>
  );
};
