'use client';

import { useEffect, useState, useRef } from 'react';

interface Metric {
  label: string;
  value: number;
  suffix: string;
  color: string;
}

interface MetricsDisplayHTMLProps {
  metrics: Metric[];
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return Math.floor(num).toString();
}

function AnimatedMetric({ metric }: { metric: Metric }) {
  const [currentValue, setCurrentValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }

          const duration = 2000; // 2 seconds
          const steps = 60;
          const increment = metric.value / steps;
          const stepDuration = duration / steps;

          let step = 0;
          const timer = setInterval(() => {
            step++;
            const newValue = Math.min(increment * step, metric.value);
            setCurrentValue(newValue);

            if (step >= steps) {
              clearInterval(timer);
              setCurrentValue(metric.value);
            }
          }, stepDuration);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
      observer.disconnect();
    };
  }, [hasAnimated, metric.value]);

  return (
    <div
      ref={ref}
      className="bg-gray-800 rounded-lg p-6 text-center border-2 border-transparent hover:border-gray-600 transition-all duration-300"
    >
      <div className={`text-3xl md:text-4xl font-bold mb-2`} style={{ color: metric.color }}>
        {formatNumber(currentValue)}{metric.suffix}
      </div>
      <div className="text-gray-400 text-sm md:text-base uppercase tracking-wide">
        {metric.label}
      </div>
    </div>
  );
}

export default function MetricsDisplayHTML({ metrics }: MetricsDisplayHTMLProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8">
      {metrics.map((metric, index) => (
        <AnimatedMetric key={index} metric={metric} />
      ))}
    </div>
  );
}

