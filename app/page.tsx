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
          <div className="flex flex-col items-center space-y-4">
            <img 
              src="/Punezolanos.png" 
              alt="Punezolanos" 
              className="h-16 w-auto object-contain"
            />
            <p className="text-gray-600">Loading Fantasy League...</p>
          </div>
        </div>
      </div>
    )
  }
)

export default function Home() {
  return <F1FantasyAppWithSupabase />
}
