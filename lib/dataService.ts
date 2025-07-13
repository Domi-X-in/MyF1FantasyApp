import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Helper function to check if supabase is available
const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Environment variables may be missing.')
  }
  return supabase
}

// Types
export interface User {
  id: string
  username: string
  name: string
  password: string
  stars: number
  racesParticipated: number
}

// Race status enum
export enum RaceStatus {
  UPCOMING = 'UPCOMING',      // Predictions open. Race has not started.
  IN_PROGRESS = 'IN_PROGRESS', // Race has started. Predictions locked but still visible.
  COMPLETED = 'COMPLETED',     // Admin has submitted results. Show results and scores.
  CANCELLED = 'CANCELLED'      // Reserved for future use.
}

export interface Race {
  id: string
  name: string
  city: string
  date: string
  raceStatus: RaceStatus      // NEW: Replace isCompleted with raceStatus
  results?: {
    first: string
    second: string
    third: string
  }
  predictions: { [userId: string]: { first: string; second: string; third: string } }
  starWinners?: string[]
  // Timezone-aware fields
  raceTime?: string        // Local race time (e.g., "15:00")
  timezone?: string        // IANA timezone (e.g., "Europe/Monaco")
  raceDatetimeUtc?: string // UTC timestamp for consistent comparison
  country?: string         // Country name
  circuitName?: string     // Official circuit name
}

// Enhanced race creation interface
export interface CreateRaceRequest {
  name: string
  city: string
  date: string
  raceStatus?: RaceStatus
  raceTime?: string
  timezone?: string
  country?: string
  circuitName?: string
}

// Race with timezone details
export interface RaceWithTimezone extends Race {
  timezonePreview?: {
    [timezone: string]: string // timezone -> formatted time string
  }
}

// Timezone option for selectors
export interface TimezoneOption {
  value: string
  label: string
  offset: string
}

export interface Positions {
  first: string
  second: string
  third: string
}

export interface PasswordResetRequest {
  id: string
  userId: string
  requestedBy: string
  requestedAt: string
  newPasswordHash: string
  isUsed: boolean
  usedAt?: string
  status: 'pending' | 'completed' | 'expired'
}

export interface AuthSession {
  user: User
  access_token: string
  refresh_token: string
}

export interface OfflineAction {
  id: string
  type: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'CREATE_RACE' | 'UPDATE_RACE' | 'DELETE_RACE' | 'CREATE_PREDICTION' | 'UPDATE_PREDICTION' | 'DELETE_PREDICTION' | 'CREATE_PASSWORD_RESET' | 'UPDATE_PASSWORD_RESET'
  data: any
  timestamp: number
}

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: "Admin",
  password: "dd090982"
};

// Utility functions
const hashPassword = async (password: string): Promise<string> => {
  // In a real app, use bcrypt or similar
  // For now, we'll use a simple hash
  if (typeof crypto === 'undefined') {
    // Fallback for SSR - return a simple hash
    return password.split('').map(char => char.charCodeAt(0).toString(16)).join('')
  }
  
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedPassword = await hashPassword(password)
  return hashedPassword === hash
}

// Local storage utilities
const getLocalData = (key: string, defaultValue: any): any => {
  if (typeof window === "undefined") return defaultValue
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : defaultValue
}

const setLocalData = (key: string, data: any): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

// Timezone utility functions
export class TimezoneHelpers {
  // F1 circuit timezone mappings
  static readonly CITY_TIMEZONE_MAP: { [key: string]: string } = {
    'melbourne': 'Australia/Melbourne',
    'suzuka': 'Asia/Tokyo',
    'shanghai': 'Asia/Shanghai',
    'monaco': 'Europe/Monaco',
    'silverstone': 'Europe/London',
    'spa': 'Europe/Brussels',
    'monza': 'Europe/Rome',
    'budapest': 'Europe/Budapest',
    'zandvoort': 'Europe/Amsterdam',
    'austin': 'America/Chicago',
    'mexico city': 'America/Mexico_City',
    'sao paulo': 'America/Sao_Paulo',
    'las vegas': 'America/Las_Vegas',
    'singapore': 'Asia/Singapore',
    'baku': 'Asia/Baku',
    'manama': 'Asia/Bahrain',
    'doha': 'Asia/Qatar',
    'abu dhabi': 'Asia/Dubai',
    'miami': 'America/New_York',
    'imola': 'Europe/Rome',
    'spielberg': 'Europe/Vienna',
    'jeddah': 'Asia/Riyadh',
    'montreal': 'America/Toronto',
    'barcelona': 'Europe/Madrid'
  }

  // Simplified timezone offset mappings (for basic calculations)
  static readonly TIMEZONE_OFFSETS: { [key: string]: number } = {
    'Australia/Melbourne': 11,
    'Asia/Tokyo': 9,
    'Asia/Shanghai': 8,
    'Europe/Monaco': 2,
    'Europe/London': 1,
    'America/New_York': -4,
    'America/Los_Angeles': -7,
    'Asia/Bahrain': 3,
    'Asia/Qatar': 3,
    'Europe/Rome': 2,
    'Europe/Budapest': 2,
    'Europe/Brussels': 2,
    'Europe/Amsterdam': 2,
    'America/Mexico_City': -5,
    'America/Sao_Paulo': -3,
    'America/Las_Vegas': -8,
    'Asia/Singapore': 8,
    'Asia/Baku': 4,
    'Asia/Dubai': 4,
    'Europe/Vienna': 2,
    'Asia/Riyadh': 3,
    'America/Toronto': -4,
    'Europe/Madrid': 2,
    'America/Chicago': -5,
    'UTC': 0
  }

  // Get F1-specific timezone options
  static getF1TimezoneOptions(): TimezoneOption[] {
    return [
      { value: 'Australia/Melbourne', label: 'Melbourne (AEDT)', offset: '+11:00' },
      { value: 'Asia/Tokyo', label: 'Japan (JST)', offset: '+09:00' },
      { value: 'Asia/Shanghai', label: 'China (CST)', offset: '+08:00' },
      { value: 'Europe/Monaco', label: 'Monaco (CET)', offset: '+02:00' },
      { value: 'Europe/London', label: 'United Kingdom (GMT)', offset: '+01:00' },
      { value: 'Europe/Rome', label: 'Italy (CET)', offset: '+02:00' },
      { value: 'Europe/Budapest', label: 'Hungary (CET)', offset: '+02:00' },
      { value: 'Europe/Brussels', label: 'Belgium (CET)', offset: '+02:00' },
      { value: 'Europe/Amsterdam', label: 'Netherlands (CET)', offset: '+02:00' },
      { value: 'Europe/Vienna', label: 'Austria (CET)', offset: '+02:00' },
      { value: 'Europe/Madrid', label: 'Spain (CET)', offset: '+02:00' },
      { value: 'America/New_York', label: 'USA East (EDT)', offset: '-04:00' },
      { value: 'America/Chicago', label: 'USA Central (CDT)', offset: '-05:00' },
      { value: 'America/Las_Vegas', label: 'Las Vegas (PDT)', offset: '-08:00' },
      { value: 'America/Mexico_City', label: 'Mexico (CDT)', offset: '-05:00' },
      { value: 'America/Sao_Paulo', label: 'Brazil (BRT)', offset: '-03:00' },
      { value: 'America/Toronto', label: 'Canada (EDT)', offset: '-04:00' },
      { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: '+08:00' },
      { value: 'Asia/Baku', label: 'Azerbaijan (AZT)', offset: '+04:00' },
      { value: 'Asia/Bahrain', label: 'Bahrain (AST)', offset: '+03:00' },
      { value: 'Asia/Qatar', label: 'Qatar (AST)', offset: '+03:00' },
      { value: 'Asia/Dubai', label: 'UAE (GST)', offset: '+04:00' },
      { value: 'Asia/Riyadh', label: 'Saudi Arabia (AST)', offset: '+03:00' }
    ]
  }

  // Get suggested timezone for a city
  static getTimezoneForCity(city: string): string {
    return this.CITY_TIMEZONE_MAP[city.toLowerCase()] || 'UTC'
  }

  // Calculate UTC datetime from local race time using dynamic timezone conversion
  static calculateUTCTime(date: string, time: string, timezone: string): Date {
    try {
      // For UTC timezone, return the date as-is
      if (timezone === 'UTC') {
        return new Date(`${date}T${time}`);
      }
      
      // Use a simpler approach: create the date in the target timezone
      // and then convert to UTC by subtracting the offset
      const localDateTime = new Date(`${date}T${time}`);
      
      // Get the timezone offset for the target timezone at the specific date
      const targetOffset = this.getTimezoneOffsetAtDate(timezone, localDateTime);
      
      // Calculate UTC time by subtracting the timezone offset
      const utcTime = new Date(localDateTime.getTime() - (targetOffset * 60 * 60 * 1000));
      
      // Validate the result
      if (isNaN(utcTime.getTime())) {
        throw new Error(`Invalid UTC time calculation for ${timezone}`);
      }
      
      return utcTime;
    } catch (error) {
      console.error('Error calculating UTC time:', error);
      // Fallback to static offset method
      const localDateTime = new Date(`${date}T${time}`);
      const offset = this.TIMEZONE_OFFSETS[timezone] || 0;
      const fallbackTime = new Date(localDateTime.getTime() - (offset * 60 * 60 * 1000));
      
      // Validate fallback result
      if (isNaN(fallbackTime.getTime())) {
        throw new Error(`Fallback UTC calculation also failed for ${timezone}`);
      }
      
      return fallbackTime;
    }
  }

  // Get the timezone offset for a specific timezone at a specific date (handles DST)
  static getTimezoneOffsetAtDate(timezone: string, date: Date): number {
    try {
      // For UTC, return 0 immediately
      if (timezone === 'UTC') {
        return 0;
      }
      
      // Use a simpler and more reliable method
      // Create a date in the target timezone
      const targetDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
      
      // Create a date in UTC
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      
      // Calculate the difference in hours
      const diffMs = targetDate.getTime() - utcDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      // Validate the result
      if (isNaN(diffHours)) {
        throw new Error(`Invalid offset calculation for ${timezone}`);
      }
      
      return diffHours;
    } catch (error) {
      console.error(`Error getting timezone offset for ${timezone}:`, error);
      // Fallback to static offset
      return this.TIMEZONE_OFFSETS[timezone] || 0;
    }
  }

  // Get the current timezone offset for a timezone (handles DST)
  static getCurrentTimezoneOffset(timezone: string): number {
    return this.getTimezoneOffsetAtDate(timezone, new Date());
  }

  // Get timezone offset string (e.g., "+02:00", "-05:00") for a specific date
  static getTimezoneOffsetString(timezone: string, date: Date): string {
    const offset = this.getTimezoneOffsetAtDate(timezone, date);
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.abs(offset).toString().padStart(2, '0');
    return `${sign}${hours}:00`;
  }

  // Get typical race start time for a region
  static getTypicalRaceTime(timezone: string): string {
    // Night races
    if (['Asia/Singapore', 'Asia/Bahrain', 'Asia/Qatar', 'Asia/Dubai'].includes(timezone)) {
      return '20:00'
    }
    // Late night race
    if (timezone === 'America/Las_Vegas') {
      return '22:00'
    }
    // Early races for European TV
    if (['Australia/Melbourne', 'Asia/Tokyo', 'Asia/Shanghai'].includes(timezone)) {
      return '14:00'
    }
    // Standard European afternoon
    return '15:00'
  }

  // Preview race time in multiple timezones
  static previewTimesInZones(utcTime: Date): { [timezone: string]: string } {
    const commonZones = [
      { key: 'UTC', offset: 0 },
      { key: 'America/New_York', offset: -4 },
      { key: 'Europe/London', offset: 1 },
      { key: 'Europe/Rome', offset: 2 },
      { key: 'Asia/Tokyo', offset: 9 },
      { key: 'Australia/Melbourne', offset: 11 }
    ]

    const previews: { [timezone: string]: string } = {}
    
    commonZones.forEach(zone => {
      const zoneTime = new Date(utcTime.getTime() + (zone.offset * 60 * 60 * 1000))
      previews[zone.key] = zoneTime.toLocaleString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    })

    return previews
  }

  // Check if prediction is still allowed based on race start time
  static isPredictionAllowed(race: Race): boolean {
    // Predictions are only allowed for UPCOMING races
    return race.raceStatus === RaceStatus.UPCOMING
  }

  // Get time until race start
  static getTimeUntilRace(race: Race): {
    totalSeconds: number
    days: number
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  } {
    const now = new Date().getTime()
    let raceTime: number

    if (race.raceDatetimeUtc) {
      raceTime = new Date(race.raceDatetimeUtc).getTime()
    } else {
      // Fallback to legacy logic
      raceTime = new Date(race.date + 'T00:00:00').getTime()
    }

    const difference = raceTime - now

    if (difference <= 0) {
      return {
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true
      }
    }

    const totalSeconds = Math.floor(difference / 1000)
    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    return {
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
      isExpired: false
    }
  }

  // Single Source of Truth: Calculate race time preview for any component
  static calculateRaceTimePreview(date: string, time: string, timezone: string): {
    raceTime: string
    utcTime: string
    userTime: string
    offset: string
    error?: string
  } | null {
    try {
      if (!date || !time || !timezone) {
        throw new Error('Missing required parameters: date, time, or timezone');
      }
      
      // Check if timezone is supported (including UTC)
      if (!(timezone in this.TIMEZONE_OFFSETS)) {
        throw new Error(`Unsupported timezone: ${timezone}`);
      }
      
      // Calculate UTC time using dynamic timezone conversion
      const raceDatetimeUtc = this.calculateUTCTime(date, time, timezone);
      
      // Validate the calculated UTC time
      if (isNaN(raceDatetimeUtc.getTime())) {
        throw new Error(`Invalid UTC time calculation for ${timezone}`);
      }
      
      const raceStartUTC = new Date(raceDatetimeUtc);
      const localDate = new Date(`${date}T${time}`);
      
      // Validate local date
      if (isNaN(localDate.getTime())) {
        throw new Error(`Invalid local date calculation for ${date} ${time}`);
      }
      
      // Get offset strings
      const raceOffsetString = this.getTimezoneOffsetString(timezone, localDate);
      const utcOffsetString = '+00:00';
      
      // Format Race time (in race city timezone)
      const raceTimeFormatted = localDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone
      });
      
      // Validate formatted race time
      if (raceTimeFormatted === 'Invalid Date') {
        throw new Error(`Invalid race time formatting for ${timezone}`);
      }
      
      // Format UTC time
      const utcTimeFormatted = raceStartUTC.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
        timeZoneName: 'short'
      });
      
      // Validate formatted UTC time
      if (utcTimeFormatted === 'Invalid Date') {
        throw new Error(`Invalid UTC time formatting`);
      }
      
      // Format User time (in user's local timezone)
      const userTimeFormatted = raceStartUTC.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      });
      
      // Validate formatted user time
      if (userTimeFormatted === 'Invalid Date') {
        throw new Error(`Invalid user time formatting`);
      }
      
      // Compose display strings
      const raceCity = timezone.split('/').pop()?.replace('_', ' ') || timezone;
      const raceTime = `${raceTimeFormatted} ${raceCity}`;
      const utcTime = `${utcTimeFormatted} (${utcOffsetString})`;
      
      // For user time, extract the offset from the formatted string if possible
      const userTzMatch = userTimeFormatted.match(/GMT[+-]\d+/) || userTimeFormatted.match(/UTC[+-]\d+/);
      const userTz = userTzMatch ? userTzMatch[0] : '';
      const userTime = `${userTimeFormatted.replace(/ GMT[+-]\d+| UTC[+-]\d+/, '')}${userTz ? ' ' + userTz : ''}`;
      
      return {
        raceTime,
        utcTime,
        userTime,
        offset: raceOffsetString
      };
    } catch (error) {
      console.error(`Error in calculateRaceTimePreview:`, error);
      return {
        raceTime: '',
        utcTime: '',
        userTime: '',
        offset: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Offline queue management
class OfflineQueue {
  private queue: OfflineAction[] = []

  constructor() {
    this.loadQueue()
  }

  private loadQueue() {
    this.queue = getLocalData('offline_queue', [])
  }

  private saveQueue() {
    setLocalData('offline_queue', this.queue)
  }

  addAction(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
    const fullAction: OfflineAction = {
      ...action,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }
    this.queue.push(fullAction)
    this.saveQueue()
  }

  getQueue(): OfflineAction[] {
    return [...this.queue]
  }

  removeAction(actionId: string) {
    this.queue = this.queue.filter(action => action.id !== actionId)
    this.saveQueue()
  }

  clearQueue() {
    this.queue = []
    this.saveQueue()
  }
}

// Main data service class
export class DataService {
  private offlineQueue: OfflineQueue
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true
  private syncInProgress: boolean = false

  constructor() {
    this.offlineQueue = new OfflineQueue()
    this.setupOnlineOfflineListeners()
  }

  private setupOnlineOfflineListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.processOfflineQueue()
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
  }

  // User management
  async createUser(userData: { username: string; name: string; password: string }): Promise<User> {
    const passwordHash = await hashPassword(userData.password)
    
    if (this.isOnline) {
      try {
        const { data, error } = await getSupabase()
          .from('users')
          .insert({
            username: userData.username,
            name: userData.name,
            password_hash: passwordHash,
            stars: 0,
            races_participated: 0
          })
          .select()
          .single()

        if (error) throw error

        return {
          id: data.id,
          username: data.username,
          name: data.name,
          password: userData.password, // Keep plain text for local use
          stars: data.stars,
          racesParticipated: data.races_participated
        }
      } catch (error) {
        console.error('Error creating user:', error)
        throw error
      }
    } else {
      // Offline mode - create local user
      const localUser: User = {
        id: Date.now().toString(),
        ...userData,
        stars: 0,
        racesParticipated: 0
      }
      
      // Store locally
      const localUsers = getLocalData('users', [])
      localUsers.push(localUser)
      setLocalData('users', localUsers)
      
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'CREATE_USER',
        data: { ...userData, password_hash: passwordHash }
      })
      
      return localUser
    }
  }

  async loginUser(username: string, password: string): Promise<User | null> {
    // Check for hardcoded admin user first
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const adminUser: User = {
        id: "00000000-0000-0000-0000-000000000001",
        username: ADMIN_CREDENTIALS.username,
        name: "Admin User",
        password: ADMIN_CREDENTIALS.password,
        stars: 0,
        racesParticipated: 0
      };
      return adminUser;
    }

    if (this.isOnline) {
      try {
        const { data, error } = await getSupabase()
          .from('users')
          .select('*')
          .eq('username', username)
          .single()

        if (error) throw error

        const isValidPassword = await verifyPassword(password, data.password_hash)
        if (!isValidPassword) return null

        return {
          id: data.id,
          username: data.username,
          name: data.name,
          password: password, // Keep plain text for local use
          stars: data.stars,
          racesParticipated: data.races_participated
        }
      } catch (error) {
        console.error('Error logging in:', error)
        return null
      }
    } else {
      // Offline mode - check local users
      const localUsers = getLocalData('users', [])
      const user = localUsers.find((u: User) => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
      )
      return user || null
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    if (this.isOnline) {
      try {
        const updateData: any = {}
        if (updates.username) updateData.username = updates.username
        if (updates.name) updateData.name = updates.name
        if (updates.stars !== undefined) updateData.stars = updates.stars
        if (updates.racesParticipated !== undefined) updateData.races_participated = updates.racesParticipated
        if (updates.password) updateData.password_hash = await hashPassword(updates.password)

        const { error } = await getSupabase()
          .from('users')
          .update(updateData)
          .eq('id', userId)

        if (error) throw error
      } catch (error) {
        console.error('Error updating user:', error)
        throw error
      }
    } else {
      // Offline mode - update local user
      const localUsers = getLocalData('users', [])
      const userIndex = localUsers.findIndex((u: User) => u.id === userId)
      if (userIndex !== -1) {
        localUsers[userIndex] = { ...localUsers[userIndex], ...updates }
        setLocalData('users', localUsers)
      }
      
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'UPDATE_USER',
        data: { userId, updates }
      })
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (this.isOnline) {
      try {
        // First delete related predictions
        const { error: predictionsError } = await getSupabase()
          .from('predictions')
          .delete()
          .eq('user_id', userId)

        if (predictionsError) throw predictionsError

        // Then delete the user
        const { error: userError } = await getSupabase()
          .from('users')
          .delete()
          .eq('id', userId)

        if (userError) throw userError
      } catch (error) {
        console.error('Error deleting user:', error)
        throw error
      }
    } else {
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'DELETE_USER',
        data: { userId }
      })
    }

    // Update local cache
    const localUsers = getLocalData('users', [])
    const updatedUsers = localUsers.filter((u: User) => u.id !== userId)
    setLocalData('users', updatedUsers)
  }

  async getUsers(): Promise<User[]> {
    if (this.isOnline) {
      try {
        const { data, error } = await getSupabase()
          .from('users')
          .select('*')
          .order('stars', { ascending: false })

        if (error) throw error

        // Transform data to match local format
        const users: User[] = data.map(user => ({
          id: user.id,
          username: user.username,
          name: user.name,
          password: '', // Don't return password hash
          stars: user.stars,
          racesParticipated: user.races_participated
        }))

        // Cache locally
        setLocalData('users', users)
        return users
      } catch (error) {
        console.error('Error fetching users:', error)
        // Fallback to local data
        return getLocalData('users', [])
      }
    } else {
      return getLocalData('users', [])
    }
  }

  // Race management
  async getRaces(): Promise<Race[]> {
    console.log('DataService: Getting races');
    if (this.isOnline) {
      try {
        const { data: racesData, error: racesError } = await getSupabase()
          .from('races')
          .select('*')
          .order('date', { ascending: true })

        if (racesError) throw racesError

        const { data: predictionsData, error: predictionsError } = await getSupabase()
          .from('predictions')
          .select('*')

        if (predictionsError) throw predictionsError

        // Transform data to match local format
        const races: Race[] = racesData.map(race => {
          const racePredictions: { [userId: string]: Positions } = {}
          predictionsData
            .filter(pred => pred.race_id === race.id)
            .forEach(pred => {
              racePredictions[pred.user_id] = {
                first: pred.first,
                second: pred.second,
                third: pred.third
              }
            })

          // Map database race_status to RaceStatus enum
          let raceStatus: RaceStatus
          if (race.race_status) {
            raceStatus = race.race_status as RaceStatus
          } else {
            // Fallback for legacy races: map is_completed to raceStatus
            raceStatus = race.is_completed ? RaceStatus.COMPLETED : RaceStatus.UPCOMING
          }

          return {
            id: race.id,
            name: race.name,
            city: race.city,
            date: race.date,
            raceStatus: raceStatus,
            results: race.results,
            predictions: racePredictions,
            starWinners: race.star_winners,
            // Timezone-aware fields
            raceTime: race.race_time,
            timezone: race.timezone,
            raceDatetimeUtc: race.race_datetime_utc,
            country: race.country,
            circuitName: race.circuit_name
          }
        })

        console.log('DataService: Races from database:', races.length);
        
        // Auto-update race status based on time (legacy logic - will be replaced by database triggers)
        const now = new Date();
        const updatedRaces = races.map((race: Race) => {
          if (race.raceStatus === RaceStatus.UPCOMING && race.raceDatetimeUtc && new Date(race.raceDatetimeUtc) <= now) {
            console.log(`DataService: Auto-marking race ${race.name} as IN_PROGRESS (time: ${race.raceDatetimeUtc})`);
            return { ...race, raceStatus: RaceStatus.IN_PROGRESS };
          }
          return race;
        });
        
        // Cache locally
        setLocalData('races', updatedRaces)
        return updatedRaces
      } catch (error) {
        console.error('Error fetching races:', error)
        // Fallback to local data
        const localRaces = getLocalData('races', [])
        console.log('DataService: Using local races:', localRaces.length);
        return localRaces
      }
    } else {
      const localRaces = getLocalData('races', [])
      console.log('DataService: Using local races (offline):', localRaces.length);
      
      // Auto-update race status based on time (offline mode)
      const now = new Date();
      const updatedLocalRaces = localRaces.map((race: Race) => {
        if (race.raceStatus === RaceStatus.UPCOMING && race.raceDatetimeUtc && new Date(race.raceDatetimeUtc) <= now) {
          console.log(`DataService: Auto-marking race ${race.name} as IN_PROGRESS (offline mode, time: ${race.raceDatetimeUtc})`);
          return { ...race, raceStatus: RaceStatus.IN_PROGRESS };
        }
        return race;
      });
      
      return updatedLocalRaces
    }
  }

  async createRace(raceData: CreateRaceRequest): Promise<Race> {
    // Auto-suggest timezone and race time if not provided
    const timezone = raceData.timezone || TimezoneHelpers.getTimezoneForCity(raceData.city)
    const raceTime = raceData.raceTime || TimezoneHelpers.getTypicalRaceTime(timezone)
    
    // Calculate UTC datetime
    const raceDatetimeUtc = TimezoneHelpers.calculateUTCTime(raceData.date, raceTime, timezone)

    const newRace: Race = {
      id: Date.now().toString(),
      name: raceData.name,
      city: raceData.city,
      date: raceData.date,
      raceStatus: RaceStatus.UPCOMING,
      predictions: {},
      // Timezone-aware fields
      raceTime,
      timezone,
      raceDatetimeUtc: raceDatetimeUtc.toISOString(),
      country: raceData.country,
      circuitName: raceData.circuitName
    }

    if (this.isOnline) {
      try {
        const { data, error } = await getSupabase()
          .from('races')
          .insert({
            name: raceData.name,
            city: raceData.city,
            date: raceData.date,
            is_completed: false,
            race_time: raceTime,
            timezone: timezone,
            race_datetime_utc: raceDatetimeUtc.toISOString(),
            country: raceData.country,
            circuit_name: raceData.circuitName
          })
          .select()
          .single()

        if (error) throw error

        newRace.id = data.id
        // Update with actual database values
        newRace.raceTime = data.race_time
        newRace.timezone = data.timezone
        newRace.raceDatetimeUtc = data.race_datetime_utc
        newRace.country = data.country
        newRace.circuitName = data.circuit_name
      } catch (error) {
        console.error('Error creating race:', error)
        throw error
      }
    } else {
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'CREATE_RACE',
        data: {
          ...raceData,
          race_time: raceTime,
          timezone: timezone,
          race_datetime_utc: raceDatetimeUtc.toISOString(),
          country: raceData.country,
          circuit_name: raceData.circuitName
        }
      })
    }

    // Update local cache
    const localRaces = getLocalData('races', [])
    localRaces.push(newRace)
    setLocalData('races', localRaces)

    return newRace
  }

  async updateRace(raceId: string, updates: Partial<CreateRaceRequest>): Promise<Race> {
    // Calculate new UTC time if time-related fields are being updated
    let raceDatetimeUtc: Date | undefined
    if (updates.date || updates.raceTime || updates.timezone) {
      // Get current race data to fill in missing values
      const currentRaces = await this.getRaces()
      const currentRace = currentRaces.find(r => r.id === raceId)
      if (!currentRace) {
        throw new Error('Race not found')
      }

      const date = updates.date || currentRace.date
      const raceTime = updates.raceTime || currentRace.raceTime || '15:00'
      const timezone = updates.timezone || currentRace.timezone || 'UTC'
      
      raceDatetimeUtc = TimezoneHelpers.calculateUTCTime(date, raceTime, timezone)
    }

    if (this.isOnline) {
      try {
        const updateData: any = {}
        if (updates.name) updateData.name = updates.name
        if (updates.city) updateData.city = updates.city
        if (updates.date) updateData.date = updates.date
        if (updates.raceStatus) updateData.race_status = updates.raceStatus
        if (updates.raceTime) updateData.race_time = updates.raceTime
        if (updates.timezone) updateData.timezone = updates.timezone
        if (updates.country) updateData.country = updates.country
        if (updates.circuitName) updateData.circuit_name = updates.circuitName
        if (raceDatetimeUtc) updateData.race_datetime_utc = raceDatetimeUtc.toISOString()

        const { data, error } = await getSupabase()
          .from('races')
          .update(updateData)
          .eq('id', raceId)
          .select()
          .single()

        if (error) throw error

        // Transform back to Race format
        const updatedRace: Race = {
          id: data.id,
          name: data.name,
          city: data.city,
          date: data.date,
          raceStatus: data.race_status as RaceStatus || RaceStatus.UPCOMING,
          results: data.results,
          predictions: {}, // Will be populated by getRaces
          starWinners: data.star_winners,
          raceTime: data.race_time,
          timezone: data.timezone,
          raceDatetimeUtc: data.race_datetime_utc,
          country: data.country,
          circuitName: data.circuit_name
        }

        return updatedRace
      } catch (error) {
        console.error('Error updating race:', error)
        throw error
      }
    } else {
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'UPDATE_RACE',
        data: { raceId, updates }
      })

      // Update local cache
      const localRaces = getLocalData('races', [])
      const raceIndex = localRaces.findIndex((r: Race) => r.id === raceId)
      if (raceIndex !== -1) {
        localRaces[raceIndex] = { 
          ...localRaces[raceIndex], 
          ...updates,
          raceDatetimeUtc: raceDatetimeUtc?.toISOString()
        }
        setLocalData('races', localRaces)
        return localRaces[raceIndex]
      } else {
        throw new Error('Race not found')
      }
    }
  }

  async getRaceWithTimezone(raceId: string): Promise<RaceWithTimezone> {
    const races = await this.getRaces()
    const race = races.find(r => r.id === raceId)
    if (!race) {
      throw new Error('Race not found')
    }

    // Add timezone preview if race has timezone data
    let timezonePreview: { [timezone: string]: string } | undefined
    if (race.raceDatetimeUtc) {
      timezonePreview = TimezoneHelpers.previewTimesInZones(new Date(race.raceDatetimeUtc))
    }

    return {
      ...race,
      timezonePreview
    }
  }

  // Validation method for race data
  validateRaceData(raceData: CreateRaceRequest): string[] {
    const errors: string[] = []

    if (!raceData.name?.trim()) {
      errors.push('Race name is required')
    }

    if (!raceData.city?.trim()) {
      errors.push('City is required')
    }

    if (!raceData.date) {
      errors.push('Date is required')
    } else {
      const raceDate = new Date(raceData.date)
      if (isNaN(raceDate.getTime())) {
        errors.push('Invalid date format')
      }
    }

    if (raceData.raceTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(raceData.raceTime)) {
        errors.push('Invalid time format (use HH:MM)')
      }
    }

    if (raceData.timezone) {
      const validTimezones = TimezoneHelpers.getF1TimezoneOptions().map(tz => tz.value)
      if (!validTimezones.includes(raceData.timezone)) {
        errors.push('Invalid timezone')
      }
    }

    return errors
  }

  async deleteRace(raceId: string): Promise<void> {
    console.log('DataService: Deleting race', raceId);
    if (this.isOnline) {
      try {
        // First delete related predictions
        console.log('DataService: Deleting predictions for race', raceId);
        const { error: predictionsError } = await getSupabase()
          .from('predictions')
          .delete()
          .eq('race_id', raceId)

        if (predictionsError) throw predictionsError
        console.log('DataService: Predictions deleted successfully');

        // Then delete the race
        console.log('DataService: Deleting race', raceId);
        const { error: raceError } = await getSupabase()
          .from('races')
          .delete()
          .eq('id', raceId)

        if (raceError) throw raceError
        console.log('DataService: Race deleted successfully');
      } catch (error) {
        console.error('Error deleting race:', error)
        throw error
      }
    } else {
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'DELETE_RACE',
        data: { raceId }
      })
    }

    // Update local cache
    console.log('DataService: Updating local cache');
    const localRaces = getLocalData('races', [])
    const updatedRaces = localRaces.filter((r: Race) => r.id !== raceId)
    setLocalData('races', updatedRaces)
    console.log('DataService: Local cache updated, races remaining:', updatedRaces.length);
  }

  async updateRaceResults(raceId: string, results: Positions, starWinners?: string[]): Promise<void> {
    if (this.isOnline) {
      try {
        // 1. Update race results as before
        const { error: raceError } = await getSupabase()
          .from('races')
          .update({
            results,
            race_status: 'COMPLETED'
          })
          .eq('id', raceId)
        if (raceError) throw raceError;

        // 2. Fetch all predictions for this race
        const { data: predictionsData, error: predictionsError } = await getSupabase()
          .from('predictions')
          .select('*')
          .eq('race_id', raceId);
        if (predictionsError) throw predictionsError;

        // 3. Calculate scores for each user
        const calculateScore = (prediction: Positions, results: Positions): number => {
          if (prediction.first === results.first && 
              prediction.second === results.second && 
              prediction.third === results.third) {
            return 100;
          }
          let score = 0;
          if (prediction.first === results.first) score += 30;
          if (prediction.second === results.second) score += 30;
          if (prediction.third === results.third) score += 30;
          if (prediction.first === results.second || prediction.first === results.third) score += 10;
          if (prediction.second === results.first || prediction.second === results.third) score += 10;
          if (prediction.third === results.first || prediction.third === results.second) score += 10;
          return score;
        };
        const userScores: { [userId: string]: number } = {};
        predictionsData.forEach(pred => {
          userScores[pred.user_id] = calculateScore({
            first: pred.first,
            second: pred.second,
            third: pred.third
          }, results);
        });
        // 4. Find max score
        const maxScore = Math.max(...Object.values(userScores));
        // 5. For each user: update stars and racesParticipated
        const starWinnerIds: string[] = [];
        for (const userId in userScores) {
          const score = userScores[userId];
          // Fetch user
          const { data: userData, error: userError } = await getSupabase()
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          if (userError || !userData) continue;
          let newStars = userData.stars;
          if (score === maxScore) {
            newStars = (userData.stars || 0) + 1;
            starWinnerIds.push(userId);
          }
          const newRacesParticipated = (userData.races_participated || 0) + 1;
          // Update user
          await getSupabase()
            .from('users')
            .update({
              stars: newStars,
              races_participated: newRacesParticipated
            })
            .eq('id', userId);
        }
        // 6. Update race with star_winners
        await getSupabase()
          .from('races')
          .update({
            star_winners: starWinnerIds
          })
          .eq('id', raceId);
      } catch (error) {
        console.error('Error updating race results:', error)
        throw error
      }
    } else {
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'UPDATE_RACE',
        data: { raceId, results, starWinners, raceStatus: 'COMPLETED' }
      })
    }

    // Update local cache
    const localRaces = getLocalData('races', [])
    const raceIndex = localRaces.findIndex((r: Race) => r.id === raceId)
    if (raceIndex !== -1) {
      localRaces[raceIndex].results = results
      localRaces[raceIndex].starWinners = starWinners
      localRaces[raceIndex].raceStatus = RaceStatus.COMPLETED
      setLocalData('races', localRaces)
    }
  }

  async removeRaceResults(raceId: string): Promise<void> {
    if (this.isOnline) {
      try {
        const { error } = await getSupabase()
          .from('races')
          .update({
            results: null,
            star_winners: [],
            race_status: 'UPCOMING'
          })
          .eq('id', raceId)

        if (error) throw error
      } catch (error) {
        console.error('Error removing race results:', error)
        throw error
      }
    } else {
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'UPDATE_RACE',
        data: { raceId, results: null, starWinners: [], raceStatus: 'UPCOMING' }
      })
    }

    // Update local cache
    const localRaces = getLocalData('races', [])
    const raceIndex = localRaces.findIndex((r: Race) => r.id === raceId)
    if (raceIndex !== -1) {
      localRaces[raceIndex].results = undefined
      localRaces[raceIndex].starWinners = undefined
      localRaces[raceIndex].raceStatus = RaceStatus.UPCOMING
      setLocalData('races', localRaces)
    }
  }

  async bulkImportRaces(races: Race[]): Promise<void> {
    console.log('DataService: Bulk importing races:', races.length);
    
    if (this.isOnline) {
      try {
        for (const race of races) {
          // Create the race first
          const { data: raceData, error: raceError } = await getSupabase()
            .from('races')
            .insert({
              name: race.name,
              city: race.city,
              date: race.date,
              race_status: race.raceStatus,
              results: race.results,
              star_winners: race.starWinners || []
            })
            .select()
            .single()

          if (raceError) {
            console.error('Error creating race during import:', raceError);
            throw raceError;
          }

          console.log('DataService: Created race during import:', raceData.id);
        }
      } catch (error) {
        console.error('Error during bulk import:', error);
        throw error;
      }
    } else {
      // Queue for sync
      for (const race of races) {
        this.offlineQueue.addAction({
          type: 'CREATE_RACE',
          data: {
            name: race.name,
            city: race.city,
            date: race.date,
            raceStatus: race.raceStatus,
            results: race.results,
            starWinners: race.starWinners
          }
        });
      }
    }

    // Update local cache
    const localRaces = getLocalData('races', []);
    const updatedRaces = [...localRaces, ...races];
    setLocalData('races', updatedRaces);
    console.log('DataService: Local cache updated with imported races');
  }

  // Prediction management
  async submitPrediction(userId: string, raceId: string, prediction: Positions): Promise<void> {
    if (this.isOnline) {
      try {
        const { error } = await getSupabase()
          .from('predictions')
          .upsert({
            user_id: userId,
            race_id: raceId,
            first: prediction.first,
            second: prediction.second,
            third: prediction.third
          }, {
            onConflict: 'user_id,race_id'
          })

        if (error) throw error
      } catch (error) {
        console.error('Error submitting prediction:', error)
        throw error
      }
    } else {
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'CREATE_PREDICTION',
        data: { userId, raceId, prediction }
      })
    }

    // Update local cache
    const localRaces = getLocalData('races', [])
    const raceIndex = localRaces.findIndex((r: Race) => r.id === raceId)
    if (raceIndex !== -1) {
      localRaces[raceIndex].predictions[userId] = prediction
      setLocalData('races', localRaces)
    }
  }

  async deletePrediction(userId: string, raceId: string): Promise<void> {
    if (this.isOnline) {
      try {
        const { error } = await getSupabase()
          .from('predictions')
          .delete()
          .eq('user_id', userId)
          .eq('race_id', raceId)

        if (error) throw error
      } catch (error) {
        console.error('Error deleting prediction:', error)
        throw error
      }
    } else {
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'DELETE_PREDICTION',
        data: { userId, raceId }
      })
    }

    // Update local cache
    const localRaces = getLocalData('races', [])
    const raceIndex = localRaces.findIndex((r: Race) => r.id === raceId)
    if (raceIndex !== -1) {
      delete localRaces[raceIndex].predictions[userId]
      setLocalData('races', localRaces)
    }
  }

  // Offline queue processing
  private async processOfflineQueue() {
    if (this.syncInProgress || !this.isOnline) return

    this.syncInProgress = true
    const queue = this.offlineQueue.getQueue()

    for (const action of queue) {
      try {
        switch (action.type) {
          case 'CREATE_USER':
            await this.createUser(action.data)
            break
          case 'UPDATE_USER':
            await this.updateUser(action.data.userId, action.data.updates)
            break
          case 'DELETE_USER':
            await this.deleteUser(action.data.userId)
            break
          case 'CREATE_RACE':
            await this.createRace(action.data)
            break
          case 'DELETE_RACE':
            await this.deleteRace(action.data.raceId)
            break
          case 'UPDATE_RACE':
            if (action.data.raceStatus === 'UPCOMING' && !action.data.results) {
              // This is a remove results action
              await this.removeRaceResults(action.data.raceId)
            } else if (action.data.raceStatus === 'COMPLETED') {
              // This is a normal update results action
              await this.updateRaceResults(action.data.raceId, action.data.results, action.data.starWinners)
            }
            break
          case 'CREATE_PREDICTION':
            await this.submitPrediction(action.data.userId, action.data.raceId, action.data.prediction)
            break
          case 'CREATE_PASSWORD_RESET':
            await this.createPasswordResetRequest(action.data.userId, action.data.newPassword, action.data.adminId)
            break
          case 'UPDATE_PASSWORD_RESET':
            await this.markPasswordResetAsUsed(action.data.resetId)
            break
          case 'DELETE_PREDICTION':
            await this.deletePrediction(action.data.userId, action.data.raceId)
            break
        }
        this.offlineQueue.removeAction(action.id)
      } catch (error) {
        console.error(`Error processing offline action ${action.type}:`, error)
        // Keep action in queue for retry
      }
    }

    this.syncInProgress = false
  }

  // Real-time subscriptions
  subscribeToChanges(callback: (changes: any) => void) {
    if (!this.isOnline) return

    const racesSubscription = getSupabase()
      .channel('races_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'races' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, callback)
      .subscribe()

    return () => {
      getSupabase().removeChannel(racesSubscription)
    }
  }

  // Password Reset Management
  async createPasswordResetRequest(userId: string, newPassword: string, adminId: string): Promise<PasswordResetRequest> {
    const newPasswordHash = await hashPassword(newPassword)
    
    // Validate required fields
    if (!userId || !adminId) {
      throw new Error('User ID and Admin ID are required')
    }
    
    if (this.isOnline) {
      try {
        // Use the admin ID directly since it's now a valid UUID
        const requestAdminId = adminId
        
        const { data, error } = await getSupabase()
          .from('password_reset_requests')
          .insert({
            user_id: userId,
            requested_by: requestAdminId,
            new_password_hash: newPasswordHash,
            status: 'pending'
          })
          .select()
          .single()

        if (error) throw error

        return {
          id: data.id,
          userId: data.user_id,
          requestedBy: adminId, // Keep original adminId for consistency
          requestedAt: data.requested_at,
          newPasswordHash: data.new_password_hash,
          isUsed: data.is_used,
          usedAt: data.used_at,
          status: data.status
        }
      } catch (error) {
        console.error('Error creating password reset request:', error)
        throw error
      }
    } else {
      throw new Error('Password reset requires online connection')
    }
  }

  async getPendingPasswordResets(): Promise<PasswordResetRequest[]> {
    if (this.isOnline) {
      try {
        // First get the password reset requests
        const { data: resetData, error: resetError } = await getSupabase()
          .from('password_reset_requests')
          .select('*')
          .eq('status', 'pending')
          .order('requested_at', { ascending: false })

        if (resetError) throw resetError

        // Then get user details for each request
        const result = await Promise.all(
          resetData.map(async (reset: any) => {
            // Get user details
            const { data: userData } = await getSupabase()
              .from('users')
              .select('username, name')
              .eq('id', reset.user_id)
              .single()

            // Get admin details
            const { data: adminData } = await getSupabase()
              .from('users')
              .select('username, name')
              .eq('id', reset.requested_by)
              .single()

            return {
              id: reset.id,
              userId: reset.user_id,
              requestedBy: reset.requested_by,
              requestedAt: reset.requested_at,
              newPasswordHash: reset.new_password_hash,
              isUsed: reset.is_used,
              usedAt: reset.used_at,
              status: reset.status,
              userName: userData?.name || 'Unknown User',
              adminName: adminData?.name || 'Unknown Admin'
            }
          })
        )

        return result
      } catch (error) {
        console.error('Error fetching pending password resets:', error)
        throw error
      }
    } else {
      return []
    }
  }

  async markPasswordResetAsUsed(resetId: string): Promise<void> {
    if (this.isOnline) {
      try {
        const { error } = await getSupabase()
          .from('password_reset_requests')
          .update({
            is_used: true,
            used_at: new Date().toISOString(),
            status: 'completed'
          })
          .eq('id', resetId)

        if (error) throw error
      } catch (error) {
        console.error('Error marking password reset as used:', error)
        throw error
      }
    } else {
      throw new Error('Password reset update requires online connection')
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const newPasswordHash = await hashPassword(newPassword)
    
    if (this.isOnline) {
      try {
        // First get current user to increment the count
        const { data: currentUser, error: fetchError } = await getSupabase()
          .from('users')
          .select('password_reset_count')
          .eq('id', userId)
          .single()

        if (fetchError) throw fetchError

        const { error } = await getSupabase()
          .from('users')
          .update({
            password_hash: newPasswordHash,
            last_password_reset: new Date().toISOString(),
            password_reset_count: (currentUser?.password_reset_count || 0) + 1
          })
          .eq('id', userId)

        if (error) throw error
      } catch (error) {
        console.error('Error updating user password:', error)
        throw error
      }
    } else {
      throw new Error('Password update requires online connection')
    }
  }

  async generateSecurePassword(length: number = 12): Promise<string> {
    if (this.isOnline) {
      try {
        const { data, error } = await getSupabase()
          .rpc('generate_secure_password', { length })

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error generating secure password:', error)
        // Fallback to client-side generation
        return this.generateClientSidePassword(length)
      }
    } else {
      return this.generateClientSidePassword(length)
    }
  }

  private generateClientSidePassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  async getUserPasswordResetHistory(userId: string): Promise<PasswordResetRequest[]> {
    if (this.isOnline) {
      try {
        const { data: resetData, error: resetError } = await getSupabase()
          .from('password_reset_requests')
          .select('*')
          .eq('user_id', userId)
          .order('requested_at', { ascending: false })

        if (resetError) throw resetError

        // Get admin details for each request
        const result = await Promise.all(
          resetData.map(async (reset: any) => {
            // Get admin details
            const { data: adminData } = await getSupabase()
              .from('users')
              .select('username, name')
              .eq('id', reset.requested_by)
              .single()

            return {
              id: reset.id,
              userId: reset.user_id,
              requestedBy: reset.requested_by,
              requestedAt: reset.requested_at,
              newPasswordHash: reset.new_password_hash,
              isUsed: reset.is_used,
              usedAt: reset.used_at,
              status: reset.status,
              adminName: adminData?.name || 'Unknown Admin'
            }
          })
        )

        return result
      } catch (error) {
        console.error('Error fetching user password reset history:', error)
        throw error
      }
    } else {
      return []
    }
  }

}

// Export singleton instance
let _dataService: DataService | null = null;

export const dataService = {
  get instance(): DataService {
    if (!_dataService) {
      _dataService = new DataService();
    }
    return _dataService;
  }
}; 