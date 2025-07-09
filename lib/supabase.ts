import { createClient } from '@supabase/supabase-js'
import { getEnvironmentConfig, logEnvironmentInfo } from './environment'

// Get environment configuration
const config = getEnvironmentConfig()

// Only create client if environment variables are available
export const supabase = config.supabaseUrl && config.supabaseKey 
  ? createClient(config.supabaseUrl, config.supabaseKey)
  : null

// Log environment for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  logEnvironmentInfo()
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          name: string
          password_hash: string
          stars: number
          races_participated: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          name: string
          password_hash: string
          stars?: number
          races_participated?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          name?: string
          password_hash?: string
          stars?: number
          races_participated?: number
          created_at?: string
          updated_at?: string
        }
      }
      races: {
        Row: {
          id: string
          name: string
          city: string
          date: string
          is_completed: boolean
          results: any
          star_winners: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          city: string
          date: string
          is_completed?: boolean
          results?: any
          star_winners?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string
          date?: string
          is_completed?: boolean
          results?: any
          star_winners?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          race_id: string
          first: string
          second: string
          third: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          race_id: string
          first: string
          second: string
          third: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          race_id?: string
          first?: string
          second?: string
          third?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 