import Link from 'next/link';
import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import FlowchartWrapper from '@/components/home/FlowchartWrapper';

export const metadata: Metadata = {
  title: 'AutoShorts - Automated YouTube Shorts Generation',
  description: 'Create and upload YouTube Shorts automatically with AI. Turn your content into viral shorts with our automated system.',
  keywords: ['YouTube Shorts', 'automation', 'AI video generation', 'content creation'],
};

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <PublicHeader />
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-16">
        <h1 className="text-6xl md:text-7xl font-bold mb-6">
          <span className="text-red-600">Auto</span>
          <span className="text-white">Shorts</span>
        </h1>
        <p className="text-2xl md:text-3xl mb-4 text-gray-300 font-semibold">
          Automated YouTube Shorts Generation
        </p>
        <p className="text-lg md:text-xl mb-8 text-gray-400 max-w-2xl">
          Turn your content into viral shorts. Our AI creates, uploads, and learns from feedback to maximize your views, subscribers, and earnings.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <div className="flex items-center text-green-600">
            <span className="mr-2 text-xl">✓</span>
            <span>7-Day Free Trial</span>
          </div>
          <div className="flex items-center text-green-600">
            <span className="mr-2 text-xl">✓</span>
            <span>No Credit Card</span>
          </div>
          <div className="flex items-center text-green-600">
            <span className="mr-2 text-xl">✓</span>
            <span>Start Earning Today</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/signin"
            className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition inline-block"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition inline-block border-2 border-red-600"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            Our automated system creates, uploads, and optimizes your YouTube Shorts in a continuous improvement loop.
          </p>
          
          {/* 3D Flowchart */}
          <div className="mb-16">
            <FlowchartWrapper />
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-black mb-2">AI Thinking</h3>
              <p className="text-gray-600">
                Advanced AI analyzes trends and generates engaging story concepts that resonate with your audience.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-bold text-black mb-2">Video Creator</h3>
              <p className="text-gray-600">
                Automatically creates professional videos with narration, visuals, and optimized formatting.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-4xl mb-4">📺</div>
              <h3 className="text-xl font-bold text-black mb-2">Auto Upload</h3>
              <p className="text-gray-600">
                Seamlessly uploads to YouTube with SEO-optimized titles and descriptions.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-black mb-2">Smart Learning</h3>
              <p className="text-gray-600">
                Learns from feedback, comments, and analytics to continuously improve your content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">
            Start Growing Your Channel Today
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-5xl font-bold text-red-600 mb-2">10x</div>
              <div className="text-xl text-gray-300">More Views</div>
              <p className="text-gray-400 mt-2">Automated content generation helps you post consistently</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-xl text-gray-300">Automation</div>
              <p className="text-gray-400 mt-2">Create and upload videos even while you sleep</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">∞</div>
              <div className="text-xl text-gray-300">Scalability</div>
              <p className="text-gray-400 mt-2">Generate unlimited shorts with our automation</p>
            </div>
          </div>
          <Link
            href="/signup"
            className="bg-red-600 text-white px-12 py-4 rounded-lg font-bold text-xl hover:bg-red-700 transition inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Automate Your YouTube Growth?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of creators who are already using AutoShorts to grow their channels and increase their earnings.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-red-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition inline-block"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="bg-white text-black px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition inline-block"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

