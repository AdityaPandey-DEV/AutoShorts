'use client';

import { Brain, Video, Upload, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Thinking',
    description: 'Advanced AI analyzes trends and generates engaging story concepts that resonate with your audience.',
    gradient: 'from-purple-500 to-pink-500',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Video,
    title: 'Video Creator',
    description: 'Automatically creates professional videos with narration, visuals, and optimized formatting.',
    gradient: 'from-red-500 to-orange-500',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    icon: Upload,
    title: 'Auto Upload',
    description: 'Seamlessly uploads to YouTube with SEO-optimized titles and descriptions.',
    gradient: 'from-green-500 to-emerald-500',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: TrendingUp,
    title: 'Smart Learning',
    description: 'Learns from feedback, comments, and analytics to continuously improve your content.',
    gradient: 'from-blue-500 to-cyan-500',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={index}
            className="group relative bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden"
          >
            {/* Background gradient on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            
            {/* Icon Container */}
            <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-xl ${feature.bgColor} mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
              <Icon className={`w-8 h-8 ${feature.iconColor} relative z-10`} strokeWidth={2.5} />
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300`} />
            </div>
            
            {/* Title */}
            <h3 className="relative text-xl font-bold text-black mb-3 group-hover:text-red-600 transition-colors duration-300">
              {feature.title}
            </h3>
            
            {/* Description */}
            <p className="relative text-gray-600 leading-relaxed mb-4">
              {feature.description}
            </p>
            
            {/* Decorative gradient line */}
            <div className={`relative mt-auto h-1 w-0 bg-gradient-to-r ${feature.gradient} group-hover:w-full transition-all duration-300 rounded-full`} />
            
            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        );
      })}
    </div>
  );
}

