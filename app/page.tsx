'use client'

import dynamic from 'next/dynamic'

// Dynamically import the Supabase app with no SSR to prevent build-time errors
const F1FantasyAppWithSupabase = dynamic(
  () => import('@/components/F1FantasyAppWithSupabase'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading F1 Punezolanos Fantasy...</p>
        </div>
      </div>
    )
  }
)

export default function Home() {
  return <F1FantasyAppWithSupabase />
}
