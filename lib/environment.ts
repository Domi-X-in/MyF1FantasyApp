// Environment management utility
export type Environment = 'prod' | 'qa' | 'dev'

export interface EnvironmentConfig {
  name: string
  supabaseUrl: string
  supabaseKey: string
  isProduction: boolean
}

export function getCurrentEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT?.toLowerCase()
  
  if (env === 'qa') return 'qa'
  if (env === 'dev') return 'dev'
  return 'prod' // default to production
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment()
  
  switch (env) {
    case 'qa':
      return {
        name: 'QA',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_QA || '',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_QA || '',
        isProduction: false
      }
    case 'dev':
      return {
        name: 'Development',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        isProduction: false
      }
    default:
      return {
        name: 'Production',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        isProduction: true
      }
  }
}

export function isProduction(): boolean {
  return getCurrentEnvironment() === 'prod'
}

export function isQA(): boolean {
  return getCurrentEnvironment() === 'qa'
}

export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'dev'
}

// Helper function to get environment-specific values
export function getEnvValue<T>(
  prodValue: T,
  qaValue?: T,
  devValue?: T
): T {
  const env = getCurrentEnvironment()
  
  switch (env) {
    case 'qa':
      return qaValue !== undefined ? qaValue : prodValue
    case 'dev':
      return devValue !== undefined ? devValue : prodValue
    default:
      return prodValue
  }
}

// Get header background color based on environment
export function getHeaderBackgroundColor(): string {
  const env = getCurrentEnvironment()
  
  switch (env) {
    case 'qa':
      return 'bg-orange-600' // Orange for QA
    case 'dev':
      return 'bg-blue-600' // Blue for development
    default:
      return 'bg-[#E10800]' // Red for production
  }
}

// Get header border color based on environment
export function getHeaderBorderColor(): string {
  const env = getCurrentEnvironment()
  
  switch (env) {
    case 'qa':
      return 'border-orange-700' // Darker orange for QA
    case 'dev':
      return 'border-blue-700' // Darker blue for development
    default:
      return 'border-red-800' // Darker red for production
  }
}

// Get navigation background color based on environment
export function getNavigationBackgroundColor(): string {
  const env = getCurrentEnvironment()
  
  switch (env) {
    case 'qa':
      return 'bg-orange-600' // Orange for QA
    case 'dev':
      return 'bg-blue-600' // Blue for development
    default:
      return 'bg-[#E10800]' // Red for production
  }
}

// Get navigation border color based on environment
export function getNavigationBorderColor(): string {
  const env = getCurrentEnvironment()
  
  switch (env) {
    case 'qa':
      return 'border-orange-700' // Darker orange for QA
    case 'dev':
      return 'border-blue-700' // Darker blue for development
    default:
      return 'border-red-800' // Darker red for production
  }
}

// Get active navigation background color based on environment
export function getActiveNavigationBackgroundColor(): string {
  const env = getCurrentEnvironment()
  
  switch (env) {
    case 'qa':
      return 'bg-orange-700' // Darker orange for QA
    case 'dev':
      return 'bg-blue-700' // Darker blue for development
    default:
      return 'bg-red-800' // Darker red for production
  }
}

// Get hover navigation background color based on environment
export function getHoverNavigationBackgroundColor(): string {
  const env = getCurrentEnvironment()
  
  switch (env) {
    case 'qa':
      return 'hover:bg-orange-700/50' // Semi-transparent darker orange for QA
    case 'dev':
      return 'hover:bg-blue-700/50' // Semi-transparent darker blue for development
    default:
      return 'hover:bg-red-800/50' // Semi-transparent darker red for production
  }
}

// Debug function to log environment info
export function logEnvironmentInfo(): void {
  if (process.env.NODE_ENV === 'development') {
    const config = getEnvironmentConfig()
    console.group('🌍 Environment Information')
    console.log(`Environment: ${config.name}`)
    console.log(`Supabase URL: ${config.supabaseUrl}`)
    console.log(`Is Production: ${config.isProduction}`)
    console.log(`Header Color: ${getHeaderBackgroundColor()}`)
    console.groupEnd()
  }
} 