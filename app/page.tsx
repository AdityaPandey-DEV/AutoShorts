import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center">
      <div className="text-center text-white p-8">
        <h1 className="text-5xl font-bold mb-4">AutoShorts</h1>
        <p className="text-xl mb-8">Automated YouTube Shorts Generation</p>
        <div className="space-x-4">
          <Link
            href="/signin"
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

