'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface Flowchart {
  id: number;
  name: string;
  description: string | null;
  flowchartData: {
    nodes: any[];
    connections: any[];
  };
  updatedAt: Date;
}

interface FlowchartListClientProps {
  initialFlowcharts: Flowchart[];
}

export default function FlowchartListClient({ initialFlowcharts }: FlowchartListClientProps) {
  const router = useRouter();
  const [flowcharts, setFlowcharts] = useState(initialFlowcharts);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this flowchart?')) return;

    try {
      const response = await fetch(`/api/flowchart/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFlowcharts(prev => prev.filter(f => f.id !== id));
      } else {
        alert('Failed to delete flowchart');
      }
    } catch (error) {
      alert('Failed to delete flowchart');
    }
  };

  if (!flowcharts || flowcharts.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-600 mb-4">You haven't created any flowcharts yet.</p>
        <Link href="/flowchart">
          <Button>Create Your First Flowchart</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {flowcharts.map((flowchart) => (
        <Card key={flowchart.id} className="hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-black mb-2">{flowchart.name}</h3>
          {flowchart.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{flowchart.description}</p>
          )}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span>{new Date(flowchart.updatedAt).toLocaleDateString()}</span>
            <span>{flowchart.flowchartData?.nodes?.length || 0} nodes</span>
          </div>
          <div className="flex gap-2">
            <Link href={`/flowchart?id=${flowchart.id}`} className="flex-1">
              <Button fullWidth>Edit</Button>
            </Link>
            <button
              onClick={() => handleDelete(flowchart.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

