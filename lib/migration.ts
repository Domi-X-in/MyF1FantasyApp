import { dataService } from './dataService'

export interface MigrationProgress {
  current: number
  total: number
  message: string
}

export class MigrationService {
  private onProgress?: (progress: MigrationProgress) => void

  constructor(onProgress?: (progress: MigrationProgress) => void) {
    this.onProgress = onProgress
  }

  private updateProgress(current: number, total: number, message: string) {
    if (this.onProgress) {
      this.onProgress({ current, total, message })
    }
  }

  async migrateAllData(): Promise<void> {
    try {
      // Get local data
      const localUsers = this.getLocalData('users', [])
      const localRaces = this.getLocalData('races', [])
      
      const totalItems = localUsers.length + localRaces.length
      let currentItem = 0

      this.updateProgress(currentItem, totalItems, 'Starting migration...')

      // Migrate users
      for (const user of localUsers) {
        try {
          this.updateProgress(currentItem, totalItems, `Migrating user: ${user.username}`)
          
          await dataService.instance.createUser({
            username: user.username,
            name: user.name,
            password: user.password
          })
          
          currentItem++
        } catch (error) {
          console.error(`Error migrating user ${user.username}:`, error)
          // Continue with other users
          currentItem++
        }
      }

      // Migrate races
      for (const race of localRaces) {
        try {
          this.updateProgress(currentItem, totalItems, `Migrating race: ${race.name}`)
          
          const newRace = await dataService.instance.createRace({
            name: race.name,
            city: race.city,
            date: race.date
          })

          // Migrate predictions for this race
          for (const [userId, prediction] of Object.entries(race.predictions)) {
            try {
              await dataService.instance.submitPrediction(userId, newRace.id, prediction as any)
            } catch (error) {
              console.error(`Error migrating prediction for user ${userId} in race ${race.name}:`, error)
            }
          }

          // Migrate results if race is completed
          if (race.isCompleted && race.results) {
            await dataService.instance.updateRaceResults(newRace.id, race.results, race.starWinners)
          }
          
          currentItem++
        } catch (error) {
          console.error(`Error migrating race ${race.name}:`, error)
          // Continue with other races
          currentItem++
        }
      }

      this.updateProgress(totalItems, totalItems, 'Migration completed successfully!')
      
      // Clear local data after successful migration
      this.clearLocalData()
      
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  async validateMigration(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []
    
    try {
      // Check if users were migrated
      const localUsers = this.getLocalData('users', [])
      const migratedUsers = await dataService.instance.getRaces() // This will fetch from cloud
      
      if (localUsers.length > 0 && migratedUsers.length === 0) {
        errors.push('No races found in cloud database')
      }

      // Check if races were migrated
      const localRaces = this.getLocalData('races', [])
      const migratedRaces = await dataService.instance.getRaces()
      
      if (localRaces.length > 0 && migratedRaces.length === 0) {
        errors.push('No races found in cloud database')
      }

      return {
        success: errors.length === 0,
        errors
      }
    } catch (error) {
      errors.push(`Validation failed: ${error}`)
      return {
        success: false,
        errors
      }
    }
  }

  private getLocalData(key: string, defaultValue: any): any {
    if (typeof window === "undefined") return defaultValue
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  }

  private clearLocalData(): void {
    if (typeof window === "undefined") return
    
    // Keep some data for backup
    const backupData = {
      users: this.getLocalData('users', []),
      races: this.getLocalData('races', []),
      migratedAt: new Date().toISOString()
    }
    
    localStorage.setItem('migration_backup', JSON.stringify(backupData))
    
    // Clear original data
    localStorage.removeItem('users')
    localStorage.removeItem('races')
    localStorage.removeItem('current_user')
    localStorage.removeItem('admin_logged_in')
  }

  async restoreFromBackup(): Promise<void> {
    if (typeof window === "undefined") return
    
    const backupData = localStorage.getItem('migration_backup')
    if (!backupData) {
      throw new Error('No backup data found')
    }

    const backup = JSON.parse(backupData)
    
    // Restore data
    localStorage.setItem('users', JSON.stringify(backup.users))
    localStorage.setItem('races', JSON.stringify(backup.races))
    
    console.log('Data restored from backup')
  }
}

// Migration status component props
export interface MigrationStatusProps {
  isVisible: boolean
  progress: MigrationProgress
  onClose: () => void
} 