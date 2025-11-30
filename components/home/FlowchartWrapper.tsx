'use client';

import dynamic from 'next/dynamic';

const AutomationFlowchart = dynamic(
  () => import('./AutomationFlowchart'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-black rounded-lg flex items-center justify-center">
        <div className="text-white text-lg">Loading 3D visualization...</div>
      </div>
    )
  }
);

export default function FlowchartWrapper() {
  return <AutomationFlowchart />;
}




