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

export interface Race {
  id: string
  name: string
  city: string
  date: string
  isCompleted: boolean
  results?: {
    first: string
    second: string
    third: string
  }
  predictions: { [userId: string]: { first: string; second: string; third: string } }
  starWinners?: string[]
}

export interface Positions {
  first: string
  second: string
  third: string
}

export interface AuthSession {
  user: User
  access_token: string
  refresh_token: string
}

export interface OfflineAction {
  id: string
  type: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'CREATE_RACE' | 'UPDATE_RACE' | 'DELETE_RACE' | 'CREATE_PREDICTION' | 'UPDATE_PREDICTION'
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
        id: "admin-user-id",
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

        const { error } = await supabase
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
        const { error: predictionsError } = await supabase
          .from('predictions')
          .delete()
          .eq('user_id', userId)

        if (predictionsError) throw predictionsError

        // Then delete the user
        const { error: userError } = await supabase
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
        const { data, error } = await supabase
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
        const { data: racesData, error: racesError } = await supabase
          .from('races')
          .select('*')
          .order('date', { ascending: true })

        if (racesError) throw racesError

        const { data: predictionsData, error: predictionsError } = await supabase
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

          return {
            id: race.id,
            name: race.name,
            city: race.city,
            date: race.date,
            isCompleted: race.is_completed,
            results: race.results,
            predictions: racePredictions,
            starWinners: race.star_winners
          }
        })

        console.log('DataService: Races from database:', races.length);
        // Cache locally
        setLocalData('races', races)
        return races
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
      return localRaces
    }
  }

  async createRace(raceData: { name: string; city: string; date: string }): Promise<Race> {
    const newRace: Race = {
      id: Date.now().toString(),
      ...raceData,
      isCompleted: false,
      predictions: {}
    }

    if (this.isOnline) {
      try {
        const { data, error } = await supabase
          .from('races')
          .insert({
            name: raceData.name,
            city: raceData.city,
            date: raceData.date,
            is_completed: false
          })
          .select()
          .single()

        if (error) throw error

        newRace.id = data.id
      } catch (error) {
        console.error('Error creating race:', error)
        throw error
      }
    } else {
      // Queue for sync
      this.offlineQueue.addAction({
        type: 'CREATE_RACE',
        data: raceData
      })
    }

    // Update local cache
    const localRaces = getLocalData('races', [])
    localRaces.push(newRace)
    setLocalData('races', localRaces)

    return newRace
  }

  async deleteRace(raceId: string): Promise<void> {
    console.log('DataService: Deleting race', raceId);
    if (this.isOnline) {
      try {
        // First delete related predictions
        console.log('DataService: Deleting predictions for race', raceId);
        const { error: predictionsError } = await supabase
          .from('predictions')
          .delete()
          .eq('race_id', raceId)

        if (predictionsError) throw predictionsError
        console.log('DataService: Predictions deleted successfully');

        // Then delete the race
        console.log('DataService: Deleting race', raceId);
        const { error: raceError } = await supabase
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
        const { error: raceError } = await supabase
          .from('races')
          .update({
            results,
            is_completed: true
          })
          .eq('id', raceId)
        if (raceError) throw raceError;

        // 2. Fetch all predictions for this race
        const { data: predictionsData, error: predictionsError } = await supabase
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
          const { data: userData, error: userError } = await supabase
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
          await supabase
            .from('users')
            .update({
              stars: newStars,
              races_participated: newRacesParticipated
            })
            .eq('id', userId);
        }
        // 6. Update race with star_winners
        await supabase
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
        data: { raceId, results, starWinners, isCompleted: true }
      })
    }

    // Update local cache
    const localRaces = getLocalData('races', [])
    const raceIndex = localRaces.findIndex((r: Race) => r.id === raceId)
    if (raceIndex !== -1) {
      localRaces[raceIndex].results = results
      localRaces[raceIndex].starWinners = starWinners
      localRaces[raceIndex].isCompleted = true
      setLocalData('races', localRaces)
    }
  }

  async removeRaceResults(raceId: string): Promise<void> {
    if (this.isOnline) {
      try {
        const { error } = await supabase
          .from('races')
          .update({
            results: null,
            star_winners: [],
            is_completed: false
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
        data: { raceId, results: null, starWinners: [], isCompleted: false }
      })
    }

    // Update local cache
    const localRaces = getLocalData('races', [])
    const raceIndex = localRaces.findIndex((r: Race) => r.id === raceId)
    if (raceIndex !== -1) {
      localRaces[raceIndex].results = undefined
      localRaces[raceIndex].starWinners = undefined
      localRaces[raceIndex].isCompleted = false
      setLocalData('races', localRaces)
    }
  }

  async bulkImportRaces(races: Race[]): Promise<void> {
    console.log('DataService: Bulk importing races:', races.length);
    
    if (this.isOnline) {
      try {
        for (const race of races) {
          // Create the race first
          const { data: raceData, error: raceError } = await supabase
            .from('races')
            .insert({
              name: race.name,
              city: race.city,
              date: race.date,
              is_completed: race.isCompleted,
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
            isCompleted: race.isCompleted,
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
        const { error } = await supabase
          .from('predictions')
          .upsert({
            user_id: userId,
            race_id: raceId,
            first: prediction.first,
            second: prediction.second,
            third: prediction.third
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
            if (action.data.isCompleted === false) {
              // This is a remove results action
              await this.removeRaceResults(action.data.raceId)
            } else {
              // This is a normal update results action
              await this.updateRaceResults(action.data.raceId, action.data.results, action.data.starWinners)
            }
            break
          case 'CREATE_PREDICTION':
            await this.submitPrediction(action.data.userId, action.data.raceId, action.data.prediction)
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

    const racesSubscription = supabase
      .channel('races_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'races' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, callback)
      .subscribe()

    return () => {
      supabase.removeChannel(racesSubscription)
    }
  }

  // Migration helpers
  async migrateLocalData() {
    const localUsers = getLocalData('users', [])
    const localRaces = getLocalData('races', [])

    console.log(`Migrating ${localUsers.length} users and ${localRaces.length} races`)

    // Migrate users
    for (const user of localUsers) {
      try {
        await this.createUser({
          username: user.username,
          name: user.name,
          password: user.password
        })
      } catch (error) {
        console.error(`Error migrating user ${user.username}:`, error)
      }
    }

    // Migrate races
    for (const race of localRaces) {
      try {
        const newRace = await this.createRace({
          name: race.name,
          city: race.city,
          date: race.date
        })

        // Migrate predictions
        for (const [userId, prediction] of Object.entries(race.predictions)) {
          await this.submitPrediction(userId, newRace.id, prediction as Positions)
        }

        // Migrate results if race is completed
        if (race.isCompleted && race.results) {
          await this.updateRaceResults(newRace.id, race.results, race.starWinners)
        }
      } catch (error) {
        console.error(`Error migrating race ${race.name}:`, error)
      }
    }

    console.log('Migration completed')
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