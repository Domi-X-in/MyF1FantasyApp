import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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