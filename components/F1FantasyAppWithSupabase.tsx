"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trophy, Car, BookOpen, Crown, Star, LogIn, LogOut, History, Wifi, WifiOff, X } from "lucide-react";
import { dataService, User, Race, Positions } from "@/lib/dataService";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Driver data
const drivers = [
  { code: "VER", name: "Max Verstappen", 		    team: "Red Bull Racing", 	img: "/drivers/2025redbullracingmaxver01right.avif" },
  { code: "TSU", name: "Yuki Tsunoda", 			    team: "Red Bull Racing", 	img: "/drivers/2025redbullracingyuktsu01right.avif" },
  { code: "LAW", name: "Liam Lawson", 			    team: "Racing Bulls", 		img: "/drivers/2025racingbullslialaw01right.avif" },
  { code: "HAD", name: "Isack Hadjar", 			    team: "Racing Bulls", 		img: "/drivers/2025racingbullsisahad01right.avif" },
  { code: "LEC", name: "Charles Leclerc", 		  team: "Ferrari",  			img: "/drivers/2025ferrarichalec01right.avif" },
  { code: "HAM", name: "Lewis Hamilton", 		    team: "Ferrari",  			img: "/drivers/2025ferrarilewham01right.avif" },
  { code: "NOR", name: "Lando Norris", 			    team: "McLaren",  			img: "/drivers/2025mclarenlannor01right.avif" },
  { code: "PIA", name: "Oscar Piastri", 		    team: "McLaren",  			img: "/drivers/2025mclarenoscpia01right.avif" },
  { code: "RUS", name: "George Russell", 		    team: "Mercedes",  			img: "/drivers/2025mercedesgeorus01right.avif" },
  { code: "ANT", name: "Andrea Kimi Antonelli", team: "Mercedes",  			img: "/drivers/2025mercedesandant01right.avif" },
  { code: "ALO", name: "Fernando Alonso", 		  team: "Aston Martin",   	img: "/drivers/2025astonmartinferalo01right.avif" },
  { code: "STR", name: "Lance Stroll", 			    team: "Aston Martin",   	img: "/drivers/2025astonmartinlanstr01right.avif" },
  { code: "GAS", name: "Pierre Gasly", 			    team: "Alpine",   			img: "/drivers/2025alpinepiegas01right.avif" },
  { code: "COL", name: "Franco Colapinto", 		  team: "Alpine",   			img: "/drivers/2025alpinefracol01right.avif" },
  { code: "HUL", name: "Nico Hulkenberg", 		  team: "Kick Sauber",   		img: "/drivers/2025kicksaubernichul01right.avif" },
  { code: "BOR", name: "Gabriel Bortoleto", 	  team: "Kick Sauber",   		img: "/drivers/2025kicksaubergabbor01right.avif" },
  { code: "SAI", name: "Carlos Sainz", 			    team: "Williams",   		img: "/drivers/2025williamscarsai01right.avif" },
  { code: "ALB", name: "Alexander Albon", 		  team: "Williams",   		img: "/drivers/2025williamsalealb01right.avif" },
  { code: "BEA", name: "Oliver Bearman", 		    team: "Haas",   			img: "/drivers/2025haasolibea01right.avif" },
  { code: "EST", name: "Esteban Ocon", 			    team: "Haas",   			img: "/drivers/2025haasestoco01right.avif" },
];

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: "Admin",
  password: "dd090982"
};

// Scoring function
const calculateScore = (prediction: Positions, results: Positions): number => {
  // Check for perfect match
  const isPerfect = 
    prediction.first === results.first &&
    prediction.second === results.second &&
    prediction.third === results.third;
  
  if (isPerfect) {
    return 60; // Perfect match = 60 points total (30+20+10)
  }
  
  // Track which drivers have already been matched
  const usedActual = { first: false, second: false, third: false };
  let total = 0;
  
  // 1st position: 30 points if correct, 5 if in top 3 but wrong
  if (prediction.first === results.first) {
    total += 30; usedActual.first = true;
  } else if (prediction.first === results.second && !usedActual.second) {
    total += 5; usedActual.second = true;
  } else if (prediction.first === results.third && !usedActual.third) {
    total += 5; usedActual.third = true;
  }
  
  // 2nd position: 20 points if correct, 5 if in top 3 but wrong
  if (prediction.second === results.second && !usedActual.second) {
    total += 20; usedActual.second = true;
  } else if (prediction.second === results.first && !usedActual.first) {
    total += 5; usedActual.first = true;
  } else if (prediction.second === results.third && !usedActual.third) {
    total += 5; usedActual.third = true;
  }
  
  // 3rd position: 10 points if correct, 5 if in top 3 but wrong
  if (prediction.third === results.third && !usedActual.third) {
    total += 10; usedActual.third = true;
  } else if (prediction.third === results.first && !usedActual.first) {
    total += 5; usedActual.first = true;
  } else if (prediction.third === results.second && !usedActual.second) {
    total += 5; usedActual.second = true;
  }
  
  return total;
};

// Car data mapping teams to their car images
const teamCars = {
  "Red Bull Racing": "/drivers/cars/2025redbullracingcarright.avif",
  "Racing Bulls": "/drivers/cars/2025racingbullscarright.avif",
  "Ferrari": "/drivers/cars/2025ferraricarright.avif",
  "McLaren": "/drivers/cars/2025mclarencarright.avif",
  "Mercedes": "/drivers/cars/2025mercedescarright.avif",
  "Aston Martin": "/drivers/cars/2025astonmartincarright.avif",
  "Alpine": "/drivers/cars/2025alpinecarright.avif",
  "Kick Sauber": "/drivers/cars/2025kicksaubercarright.avif",
  "Williams": "/drivers/cars/2025williamscarright.avif",
  "Haas": "/drivers/cars/2025haascarright.avif",
};

const tabKeys = ["fantasy", "ranking", "history", "rules", "admin"];

// Component for displaying driver-car pair
const DriverCarPair = ({ pair }: { pair: { driver: any; carImage: string } | null }) => {
  const [driverImageError, setDriverImageError] = useState(false);
  const [carImageError, setCarImageError] = useState(false);

  if (!pair) {
    return null;
  }

  return (
    <div className="mt-8 p-4 flex flex-col items-center">
      <div className="relative w-full max-w-[500px] h-[300px]">
        {/* Car (background) */}
        {!carImageError && pair.carImage ? (
          <img
            src={pair.carImage}
            alt={`${pair.driver.team} Car`}
            className="absolute top-1/2 left-1/2 max-w-full max-h-full w-auto h-auto object-contain"
            style={{ 
              transform: 'translate(-50%, -50%)', 
              zIndex: 1 
            }}
            onError={() => setCarImageError(true)}
          />
        ) : null}
        {/* Driver (foreground) */}
        {!driverImageError && pair.driver.img ? (
          <img
            src={pair.driver.img}
            alt={pair.driver.name}
            className="absolute top-1/2 left-1/2 max-w-full max-h-full w-auto h-auto object-contain"
            style={{ 
              transform: 'translate(-50%, -50%)', 
              zIndex: 2 
            }}
            onError={() => setDriverImageError(true)}
          />
        ) : null}
      </div>
      <div className="mt-6 text-center">
        <div className="text-2xl md:text-4xl font-bold text-gray-900">{pair.driver.name}</div>
        <div className="text-lg md:text-2xl text-gray-600">{pair.driver.team}</div>
      </div>
    </div>
  );
};

// Countdown Clock Component
const CountdownClock = ({ raceDate, onTimeExpired }: { raceDate: string; onTimeExpired?: (expired: boolean) => void }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const raceDateTime = new Date(raceDate + 'T00:00:00').getTime(); // Set to start of race day
      const now = new Date().getTime();
      const difference = raceDateTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
        onTimeExpired?.(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        onTimeExpired?.(true);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [raceDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-red-600 font-bold">⏰</span>
          <span className="text-red-700 font-semibold">Race Day!</span>
          <span className="text-red-600 font-bold">⏰</span>
        </div>
        <p className="text-red-600 text-sm text-center mt-1">Predictions are now locked</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="text-center mb-2">
        <span className="text-blue-700 font-semibold">⏰ Time to Submit Predictions</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-white rounded-lg p-2 border border-blue-200">
          <div className="text-lg font-bold text-blue-600">{timeLeft.days}</div>
          <div className="text-xs text-blue-500">Days</div>
        </div>
        <div className="bg-white rounded-lg p-2 border border-blue-200">
          <div className="text-lg font-bold text-blue-600">{timeLeft.hours.toString().padStart(2, '0')}</div>
          <div className="text-xs text-blue-500">Hours</div>
        </div>
        <div className="bg-white rounded-lg p-2 border border-blue-200">
          <div className="text-lg font-bold text-blue-600">{timeLeft.minutes.toString().padStart(2, '0')}</div>
          <div className="text-xs text-blue-500">Minutes</div>
        </div>
        <div className="bg-white rounded-lg p-2 border border-blue-200">
          <div className="text-lg font-bold text-blue-600">{timeLeft.seconds.toString().padStart(2, '0')}</div>
          <div className="text-xs text-blue-500">Seconds</div>
        </div>
      </div>
      <p className="text-blue-600 text-xs text-center mt-2">
        Submit your predictions before race day to participate!
      </p>
    </div>
  );
};

export default function F1FantasyAppWithSupabase() {
  // State
  const [activeTab, setActiveTab] = useState<"ranking" | "fantasy" | "history" | "rules" | "admin">("fantasy");
  const [users, setUsers] = useState<User[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Tab pairs state
  const [tabPairs, setTabPairs] = useState<{ [key: string]: { driver: any; carImage: string } }>({});

  // User input states
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // Profile editing states
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileEditData, setProfileEditData] = useState({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Prediction states
  const [currentPrediction, setCurrentPrediction] = useState<Positions>({ first: "", second: "", third: "" });
  const [isEditingPrediction, setIsEditingPrediction] = useState(false);
  const [isPredictionTimeExpired, setIsPredictionTimeExpired] = useState(false);
  

  
  // Admin states
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAddRace, setShowAddRace] = useState(false);
  const [showAddResults, setShowAddResults] = useState(false);
  const [newRace, setNewRace] = useState({ name: "", city: "", date: "" });
  const [raceResults, setRaceResults] = useState<Positions>({ first: "", second: "", third: "" });
  const [selectedRaceForResults, setSelectedRaceForResults] = useState<string>("");

  // Admin Tab main entry point
  const [adminTab, setAdminTab] = useState('addRace');
  const adminFeatures = [
    { key: 'addRace', label: 'Race' },
    { key: 'addResults', label: 'Results' },
    { key: 'users', label: 'Users' },
    { key: 'backfill', label: 'Backfill' },
  ];

  // Additional admin state variables
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<{ username: string; name: string; password: string }>({ username: "", name: "", password: "" });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [backfillPrediction, setBackfillPrediction] = useState<Positions>({ first: "", second: "", third: "" });
  
  // New state variables for unified Backfill UI
  const [currentOperation, setCurrentOperation] = useState<'add' | 'edit' | null>(null);
  
  // File input ref for CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History tab state and helpers
  const [historyFilter, setHistoryFilter] = useState({
    dateRange: "all",
    raceType: "all",
    performance: "all",
    driver: "all"
  });

  // 1. Add state for recalculation loading
  const [isRecalculatingScores, setIsRecalculatingScores] = useState(false);

  // New state variables for race-categorized leaderboard
  const [leaderboardView, setLeaderboardView] = useState<'overall' | 'recent' | 'progress-chart' | 'table-result'>('overall');
  const [processedLeaderboardData, setProcessedLeaderboardData] = useState<any[]>([]);

  const router = useRouter();

  // Initialize tab pairs on mount
  useEffect(() => {
    // Shuffle drivers
    const shuffledDrivers = [...drivers].sort(() => Math.random() - 0.5);
    const pairs: { [key: string]: { driver: any; carImage: string } } = {};
    tabKeys.forEach((tab, idx) => {
      const driver = shuffledDrivers[idx % shuffledDrivers.length];
      const carImage = teamCars[driver.team as keyof typeof teamCars];
      pairs[tab] = { driver, carImage };
    });
    setTabPairs(pairs);
  }, []);

  // Helper: get user prediction history
  const getUserPredictionHistory = (userId: string) => {
    return getCompletedRaces()
      .filter(race => race.predictions[userId])
      .map(race => {
        const prediction = race.predictions[userId];
        const accuracy = race.results ? {
          first: prediction.first === race.results.first,
          second: prediction.second === race.results.second,
          third: prediction.third === race.results.third,
          perfectMatch: prediction.first === race.results.first && prediction.second === race.results.second && prediction.third === race.results.third
        } : {
          first: false, second: false, third: false, perfectMatch: false
        };
        const score = race.results ? calculateScore(prediction, race.results) : 0;
        return {
          raceId: race.id,
          raceName: race.name,
          raceCity: race.city,
          raceDate: race.date,
          prediction,
          actualResults: race.results,
          score,
          isStarWinner: race.starWinners?.includes(userId) || false,
          accuracy
        };
      })
      .sort((a, b) => new Date(b.raceDate).getTime() - new Date(a.raceDate).getTime());
  };

  // Helper: filter history
  const filterHistory = (history: any[], filters: any) => {
    let filtered = [...history];
    if (filters.dateRange !== "all") {
      const now = new Date();
      const limit = parseInt(filters.dateRange.replace("last", ""));
      const cutoffDate = new Date(now.getTime() - (limit * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(h => new Date(h.raceDate) >= cutoffDate);
    }
    if (filters.raceType !== "all") {
      filtered = filtered.filter(h => h.raceCity === filters.raceType);
    }
    if (filters.performance !== "all") {
      switch (filters.performance) {
        case "high":
          filtered = filtered.filter(h => (h.score || 0) >= 20);
          break;
        case "low":
          filtered = filtered.filter(h => (h.score || 0) < 10);
          break;
        case "perfect":
          filtered = filtered.filter(h => h.accuracy.perfectMatch);
          break;
      }
    }
    if (filters.driver !== "all") {
      filtered = filtered.filter(h => 
        h.prediction.first === filters.driver ||
        h.prediction.second === filters.driver ||
        h.prediction.third === filters.driver
      );
    }
    return filtered;
  };

  // Helper: calculate user stats
  const calculateUserStats = (history: any[]) => {
    if (history.length === 0) {
      return {
        totalRaces: 0,
        totalScore: 0,
        averageScore: 0,
        perfectMatches: 0,
        starWins: 0,
        accuracyByPosition: { first: 0, second: 0, third: 0 },
        favoriteDrivers: []
      };
    }
    const totalRaces = history.length;
    const totalScore = history.reduce((sum, h) => sum + (h.score || 0), 0);
    const averageScore = totalScore / totalRaces;
    const perfectMatches = history.filter(h => h.accuracy.perfectMatch).length;
    const starWins = history.filter(h => h.isStarWinner).length;
    const accuracyByPosition = {
      first: history.filter(h => h.accuracy.first).length,
      second: history.filter(h => h.accuracy.second).length,
      third: history.filter(h => h.accuracy.third).length
    };
    const driverStats: { [key: string]: { predicted: number; correct: number } } = {};
    history.forEach(h => {
      [h.prediction.first, h.prediction.second, h.prediction.third].forEach(driverCode => {
        if (!driverStats[driverCode]) {
          driverStats[driverCode] = { predicted: 0, correct: 0 };
        }
        driverStats[driverCode].predicted++;
        if (h.actualResults && (
          h.actualResults.first === driverCode ||
          h.actualResults.second === driverCode ||
          h.actualResults.third === driverCode
        )) {
          driverStats[driverCode].correct++;
        }
      });
    });
    const favoriteDrivers = Object.entries(driverStats)
      .map(([driverCode, stats]) => ({
        driverCode,
        predictedCount: stats.predicted,
        correctCount: stats.correct
      }))
      .sort((a, b) => b.predictedCount - a.predictedCount)
      .slice(0, 5);
    return {
      totalRaces,
      totalScore,
      averageScore,
      perfectMatches,
      starWins,
      accuracyByPosition,
      favoriteDrivers
    };
  };

  // Initialize client-side data after mount
  useEffect(() => {
    setIsClient(true);
    loadData();
    setupOnlineOfflineListeners();
    setupRealTimeSync();
  }, []);

  const setupOnlineOfflineListeners = () => {
    if (typeof window !== 'undefined') {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
    }
  };

  const setupRealTimeSync = () => {
    const unsubscribe = dataService.instance.subscribeToChanges((changes) => {
      console.log('Real-time update received:', changes);
      loadData(); // Reload data when changes occur
    });

    return unsubscribe;
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading data...');
      const [usersData, racesData] = await Promise.all([
        dataService.instance.getUsers(),
        dataService.instance.getRaces()
      ]);
      
      console.log('Users loaded:', usersData.length);
      console.log('Races loaded:', racesData.length);
      
      // Auto-complete races that have passed their date
      const now = new Date();
      const updatedRaces = racesData.map((race: Race) => {
        if (!race.isCompleted && new Date(race.date) <= now) {
          console.log(`Auto-marking race ${race.name} as completed (date: ${race.date})`);
          return { ...race, isCompleted: true };
        }
        return race;
      });
      
      setUsers(usersData);
      setRaces(updatedRaces);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // User management
  const addUser = async () => {
    if (newUserUsername.trim() && newUserPassword.trim() && newUserName.trim()) {
      try {
        setIsLoading(true);
        const newUser = await dataService.instance.createUser({
          username: newUserUsername.trim(),
          name: newUserName.trim(),
          password: newUserPassword.trim()
        });
        
        setCurrentUser(newUser);
        setNewUserName("");
        setNewUserUsername("");
        setNewUserPassword("");
        setIsLoginMode(true);
        await loadData();
      } catch (error) {
        console.error('Error creating user:', error);
        alert("Error creating user. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please fill in all fields!");
    }
  };

  const loginUser = async () => {
    if (loginUsername.trim() && loginPassword.trim()) {
      try {
        setIsLoading(true);
        const user = await dataService.instance.loginUser(loginUsername.trim(), loginPassword.trim());
        
        if (user) {
          setCurrentUser(user);
          setLoginUsername("");
          setLoginPassword("");
          setShowLoginForm(false);
          
          // Check if this is the admin user and automatically enable admin mode
          if (user.username === "Admin") {
            setIsAdminLoggedIn(true);
          }
        } else {
          alert("Invalid username or password!");
        }
      } catch (error) {
        console.error('Error logging in:', error);
        alert("Error logging in. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please enter both username and password!");
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setShowLoginForm(false);
    // Clear admin status when user logs out
    setIsAdminLoggedIn(false);
  };

  // Profile editing functions
  const openProfileEdit = () => {
    if (currentUser) {
      setProfileEditData({
        name: currentUser.name,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setShowProfileEdit(true);
    }
  };

  const closeProfileEdit = () => {
    setShowProfileEdit(false);
    setProfileEditData({
      name: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const updateUserProfile = async () => {
    if (!currentUser) return;

    // Validation
    if (!profileEditData.name.trim()) {
      alert("Display name cannot be empty!");
      return;
    }

    if (!profileEditData.currentPassword.trim()) {
      alert("Please enter your current password to verify changes!");
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await dataService.instance.loginUser(
      currentUser.username, 
      profileEditData.currentPassword
    );
    
    if (!isCurrentPasswordValid) {
      alert("Current password is incorrect!");
      return;
    }

    // Check if new password is provided
    if (profileEditData.newPassword.trim()) {
      if (profileEditData.newPassword !== profileEditData.confirmPassword) {
        alert("New password and confirm password do not match!");
        return;
      }
      
      if (profileEditData.newPassword.length < 3) {
        alert("New password must be at least 3 characters long!");
        return;
      }
    }

    try {
      setIsUpdatingProfile(true);
      
      // Prepare update data
      const updateData: any = {
        name: profileEditData.name.trim()
      };
      
      // Only update password if new password is provided
      if (profileEditData.newPassword.trim()) {
        updateData.password = profileEditData.newPassword.trim();
      }

      // Update user
      await dataService.instance.updateUser(currentUser.id, updateData);
      
      // Update current user state
      const updatedUser = {
        ...currentUser,
        name: updateData.name,
        password: updateData.password || currentUser.password
      };
      setCurrentUser(updatedUser);
      
      // Close form and show success message
      closeProfileEdit();
      alert("Profile updated successfully!");
      
      // Reload data to ensure consistency
      await loadData();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert("Error updating profile. Please try again.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Helper functions
  const getDriverName = (code: string) => {
    const driver = drivers.find(d => d.code === code);
    return driver ? driver.name : code;
  };

  const getDriverTeam = (code: string) => {
    const driver = drivers.find(d => d.code === code);
    return driver ? driver.team : "";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).replace(/ /g, '-');
  };

  const getUpcomingRace = () => {
    const now = new Date();
    return races
      .filter(race => new Date(race.date) > now && !race.isCompleted)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  };

  const getCompletedRaces = () => {
    const now = new Date();
    return races.filter(race => 
      race.isCompleted || new Date(race.date) <= now
    );
  };

  const getCurrentUserPrediction = () => {
    if (!currentUser) return null;
    const upcomingRace = getUpcomingRace();
    if (!upcomingRace) return null;
    return upcomingRace.predictions[currentUser.id] || null;
  };

  const handlePick = (driverCode: string) => {
    const prediction = currentPrediction || { first: "", second: "", third: "" };
    
    const isSelected = prediction.first === driverCode || 
                      prediction.second === driverCode || 
                      prediction.third === driverCode;
    
    if (isSelected) {
      const newPrediction = { ...prediction };
      if (newPrediction.first === driverCode) newPrediction.first = "";
      if (newPrediction.second === driverCode) newPrediction.second = "";
      if (newPrediction.third === driverCode) newPrediction.third = "";
      
      setCurrentPrediction(newPrediction);
    } else {
      const newPrediction = { ...prediction };
      
      if (newPrediction.first === "") {
        newPrediction.first = driverCode;
      } else if (newPrediction.second === "") {
        newPrediction.second = driverCode;
      } else if (newPrediction.third === "") {
        newPrediction.third = driverCode;
      } else {
        return;
      }
      
      setCurrentPrediction(newPrediction);
    }
  };

  // Race management
  const addNewRace = async () => {
    if (newRace.name.trim() && newRace.city.trim() && newRace.date.trim()) {
      try {
        setIsLoading(true);
        await dataService.instance.createRace({
          name: newRace.name.trim(),
          city: newRace.city.trim(),
          date: newRace.date.trim()
        });
        
        setNewRace({ name: "", city: "", date: "" });
        setShowAddRace(false);
        await loadData();
      } catch (error) {
        console.error('Error creating race:', error);
        alert("Error creating race. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please fill in all fields!");
    }
  };

  const addRaceResults = async () => {
    if (selectedRaceForResults && raceResults.first && raceResults.second && raceResults.third) {
      try {
        setIsLoading(true);
        await dataService.instance.updateRaceResults(selectedRaceForResults, raceResults);
        
        setRaceResults({ first: "", second: "", third: "" });
        setSelectedRaceForResults("");
        setShowAddResults(false);
        await loadData();
      } catch (error) {
        console.error('Error updating race results:', error);
        alert("Error updating race results. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please select a race and fill in all results!");
    }
  };

  // Prediction management
  const submitPrediction = async () => {
    if (!currentUser || !currentPrediction.first || !currentPrediction.second || !currentPrediction.third) return;
    
    const upcomingRace = getUpcomingRace();
    if (!upcomingRace) return;

    try {
      setIsLoading(true);
      await dataService.instance.submitPrediction(currentUser.id, upcomingRace.id, currentPrediction);
      
      setIsEditingPrediction(false);
      await loadData();
    } catch (error) {
      console.error('Error submitting prediction:', error);
      alert("Error submitting prediction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };



  // Admin functions
  const loginAdmin = () => {
    if (adminUsername === ADMIN_CREDENTIALS.username && adminPassword === ADMIN_CREDENTIALS.password) {
      setIsAdminLoggedIn(true);
      setAdminUsername("");
      setAdminPassword("");
      setShowAdminLogin(false);
    } else {
      alert("Invalid credentials!");
    }
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
  };

  // Admin handler functions
  const handleCreateUser = async () => {
    if (!newUserUsername.trim() || !newUserName.trim() || !newUserPassword.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    if (users.some(u => u.username && u.username.toLowerCase() === newUserUsername.trim().toLowerCase())) {
      alert("Username already exists.");
      return;
    }
    
    try {
      const user = await dataService.instance.createUser({
        username: newUserUsername.trim(),
        name: newUserName.trim(),
        password: newUserPassword.trim()
      });
      
      setCreatedUser(user);
      setNewUserUsername("");
      setNewUserName("");
      setNewUserPassword("");
      await loadData();
    } catch (error) {
      console.error('Error creating user:', error);
      alert("Error creating user. Please try again.");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUserData({ username: user.username, name: user.name, password: user.password });
  };

  const handleSaveEditUser = async (userId: string) => {
    try {
      await dataService.instance.updateUser(userId, editUserData);
      setEditingUserId(null);
      await loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      alert("Error updating user. Please try again.");
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        await dataService.instance.deleteUser(userToDelete.id);
        setUserToDelete(null);
        await loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert("Error deleting user. Please try again.");
      }
    }
  };

  // Helper functions for unified Backfill UI
  const validateBackfillForm = () => {
    if (!selectedUserId) return "Please select a user.";
    if (!selectedRaceId) return "Please select a race.";
    if (!backfillPrediction.first || !backfillPrediction.second || !backfillPrediction.third) {
      return "Please fill in all three positions.";
    }
    
    // Check for duplicate drivers
    const positions = [backfillPrediction.first, backfillPrediction.second, backfillPrediction.third];
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== 3) {
      return "Each position must have a different driver.";
    }
    
    return null;
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedRaceId(null);
    setBackfillPrediction({ first: "", second: "", third: "" });
    setCurrentOperation(null);
  };

  const handleRaceSelection = (raceId: string) => {
    setSelectedRaceId(raceId);
    
    // Check if user has existing prediction for this race
    const existingPrediction = races.find(r => r.id === raceId)?.predictions[selectedUserId!];
    
    if (existingPrediction) {
      // Edit mode: populate with existing values
      setBackfillPrediction({
        first: existingPrediction.first,
        second: existingPrediction.second,
        third: existingPrediction.third
      });
      setCurrentOperation('edit');
    } else {
      // Add mode: clear form
      setBackfillPrediction({ first: "", second: "", third: "" });
      setCurrentOperation('add');
    }
  };

  const resetBackfillForm = () => {
    setSelectedUserId(null);
    setSelectedRaceId(null);
    setBackfillPrediction({ first: "", second: "", third: "" });
    setCurrentOperation(null);
  };

  const handleBackfillPrediction = async () => {
    const validationError = validateBackfillForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    try {
      await dataService.instance.submitPrediction(selectedUserId!, selectedRaceId!, backfillPrediction);
      
      // Show success message with operation type
      const operation = currentOperation === 'edit' ? 'updated' : 'added';
      alert(`Prediction ${operation} successfully!`);
      
      // Reset form
      resetBackfillForm();
      
      // Reload data to update the race list
      await loadData();
    } catch (error) {
      console.error('Error handling prediction:', error);
      alert("Error saving prediction. Please try again.");
    }
  };

  // Remove Race
  const handleDeleteRace = async (raceId: string) => {
    try {
      console.log('Deleting race:', raceId);
      await dataService.instance.deleteRace(raceId);
      console.log('Race deleted successfully, updating local state...');
      
      // Update local state directly instead of reloading data
      setRaces(prevRaces => prevRaces.filter(race => race.id !== raceId));
      console.log('Local state updated');
    } catch (error) {
      console.error('Error deleting race:', error);
      alert("Error deleting race. Please try again.");
    }
  };

  // Remove Results
  const handleRemoveResults = async (raceId: string) => {
    try {
      await dataService.instance.removeRaceResults(raceId);
      
      // Update local state directly instead of reloading data
      setRaces(prevRaces => prevRaces.map(race => 
        race.id === raceId 
          ? { ...race, results: undefined, starWinners: undefined, isCompleted: false }
          : race
      ));
    } catch (error) {
      console.error('Error removing results:', error);
      alert("Error removing results. Please try again.");
    }
  };

  // Export/Import functions for race results
  const exportResultsToCSV = () => {
    const completedRaces = getCompletedRaces().filter(race => race.results);
    
    if (completedRaces.length === 0) {
      alert("No completed races with results to export.");
      return;
    }

    // Create CSV content
    const csvHeaders = "Race ID,Race Name,City,Date,1st Place,2nd Place,3rd Place,Star Winners\n";
    const csvRows = completedRaces.map(race => {
      const starWinners = race.starWinners ? race.starWinners.join(';') : '';
      return `${race.id},"${race.name}","${race.city}","${race.date}","${race.results?.first}","${race.results?.second}","${race.results?.third}","${starWinners}"`;
    }).join('\n');
    
    const csvContent = csvHeaders + csvRows;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `f1_fantasy_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importResultsFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", file.name, file.size, "bytes");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      console.log("File content length:", text.length);
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        alert("Invalid CSV file format.");
        return;
      }

      // Skip header row and process data
      const dataRows = lines.slice(1).filter(line => line.trim());
      console.log("Data rows to process:", dataRows.length);
      const importedRaces: Race[] = [];
      const errors: string[] = [];

      dataRows.forEach((line, index) => {
        try {
          // Parse CSV line (handle quoted values)
          const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const cleanValues = values.map(v => v.replace(/^"|"$/g, '')); // Remove quotes
          
          if (cleanValues.length < 7) {
            errors.push(`Row ${index + 2}: Insufficient data`);
            return;
          }

          const [raceId, raceName, city, date, first, second, third, starWinnersStr] = cleanValues;
          
          // Validate driver codes
          const validDrivers = drivers.map(d => d.code);
          if (!validDrivers.includes(first) || !validDrivers.includes(second) || !validDrivers.includes(third)) {
            errors.push(`Row ${index + 2}: Invalid driver codes`);
            return;
          }

          // Check for duplicate positions
          if (first === second || first === third || second === third) {
            errors.push(`Row ${index + 2}: Duplicate driver positions`);
            return;
          }

          const starWinners = starWinnersStr ? starWinnersStr.split(';').filter(id => id.trim()) : [];
          
          const importedRace: Race = {
            id: raceId,
            name: raceName,
            city: city,
            date: date,
            isCompleted: true,
            results: { first, second, third },
            predictions: {},
            starWinners: starWinners.length > 0 ? starWinners : undefined
          };

          importedRaces.push(importedRace);
          console.log("Imported race:", importedRace);
        } catch (error) {
          errors.push(`Row ${index + 2}: Parse error`);
        }
      });

      if (errors.length > 0) {
        console.log("Import errors:", errors);
        alert(`Import completed with errors:\n${errors.join('\n')}`);
      }

      if (importedRaces.length > 0) {
        try {
          console.log("Importing races to database...");
          await dataService.instance.bulkImportRaces(importedRaces);
          console.log("Successfully imported races:", importedRaces.length);
          alert(`Successfully imported ${importedRaces.length} race results.`);
          
          // Reload data to show the new races
          await loadData();
        } catch (error) {
          console.error("Error importing races:", error);
          alert(`Error importing races: ${error}`);
        }
      }

      // Reset file input
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Navigation tabs
  const navTabs = [
    { key: "fantasy", label: "Fantasy", icon: "🏁" },
    { key: "ranking", label: "Ranking", icon: "🏆" },
    { key: "history", label: "History", icon: "📊" },
    { key: "rules", label: "Rules", icon: "📜" },
    { key: "admin", label: "Admin", icon: "🛠️" },
  ];

  // Initialize prediction state when user or race changes
  useEffect(() => {
    const storedPrediction = getCurrentUserPrediction();
    if (storedPrediction) {
      setCurrentPrediction(storedPrediction);
      setIsEditingPrediction(false);
    } else {
      setCurrentPrediction({ first: "", second: "", third: "" });
      setIsEditingPrediction(false);
    }
  }, [currentUser, races]);

  // Process leaderboard data when races or users change
  useEffect(() => {
    if (races.length > 0 && users.length > 0) {
      const processedData = processRaceBreakdown();
      setProcessedLeaderboardData(processedData);
    }
  }, [races, users]);

  // After: const [users, setUsers] = useState<User[]>([]);
  const filteredUsers = users.filter(
    user => user.username && user.username.trim().toLowerCase() !== "admin"
  );

  // 2. Add handler function
  const handleRecalculateScores = async () => {
    setIsRecalculatingScores(true);
    try {
      // Loop through all completed races
      for (const race of getCompletedRaces().filter(r => r.results)) {
        if (race.results) {
          await dataService.instance.updateRaceResults(race.id, race.results);
        }
      }
      await loadData();
      alert('Scores recalculated for all completed races!');
    } catch (error) {
      alert('Error recalculating scores. See console for details.');
      console.error(error);
    } finally {
      setIsRecalculatingScores(false);
    }
  };

  // New helper functions for race-categorized leaderboard
  const processRaceBreakdown = () => {
    const completedRaces = getCompletedRaces();
    const userRaceStats: { [userId: string]: any } = {};

    // Initialize user stats with calculated totals instead of database values
    users.forEach(user => {
      if (user.username && user.username.trim().toLowerCase() !== "admin") {
        userRaceStats[user.id] = {
          userId: user.id,
          username: user.username,
          name: user.name,
          totalStars: 0, // Will be calculated from actual race data
          racesParticipated: 0, // Will be calculated from actual race data
          raceBreakdown: {},
          recentPerformance: []
        };
      }
    });

    // Process each race
    completedRaces.forEach(race => {
      if (!race.results) return;

      const raceStats = {
        raceId: race.id,
        raceName: race.name,
        raceCity: race.city,
        raceDate: race.date,
        participants: [] as any[]
      };

      // First, collect all user scores for this race
      const userScores: { userId: string, score: number }[] = [];
      Object.entries(race.predictions).forEach(([userId, prediction]) => {
        if (!userRaceStats[userId]) return;
        const score = calculateScore(prediction, race.results!);
        userScores.push({ userId, score });
      });
      // Find the highest score for this race
      const maxScore = userScores.length > 0 ? Math.max(...userScores.map(u => u.score)) : 0;
      // Find all userIds with the highest score
      const starWinners = userScores.filter(u => u.score === maxScore && maxScore > 0).map(u => u.userId);

      // Process each user's prediction for this race
      Object.entries(race.predictions).forEach(([userId, prediction]) => {
        if (!userRaceStats[userId]) return;

        const score = calculateScore(prediction, race.results!);
        const isStarWinner = starWinners.includes(userId);
        const starsEarned = isStarWinner ? 1 : 0;

        const userRaceResult = {
          userId,
          username: userRaceStats[userId].username,
          name: userRaceStats[userId].name,
          prediction,
          actualResults: race.results,
          score,
          starsEarned,
          isStarWinner,
          accuracy: {
            first: prediction.first === race.results!.first,
            second: prediction.second === race.results!.second,
            third: prediction.third === race.results!.third,
            perfectMatch: prediction.first === race.results!.first && 
                         prediction.second === race.results!.second && 
                         prediction.third === race.results!.third
          }
        };

        raceStats.participants.push(userRaceResult);

        // Update user's race breakdown
        userRaceStats[userId].raceBreakdown[race.id] = {
          raceName: race.name,
          raceCity: race.city,
          raceDate: race.date,
          starsEarned,
          score,
          isStarWinner,
          prediction,
          actualResults: race.results
        };

        // Add to recent performance (last 5 races)
        userRaceStats[userId].recentPerformance.push({
          raceId: race.id,
          raceName: race.name,
          starsEarned,
          score,
          date: race.date
        });

        // Update calculated totals
        userRaceStats[userId].totalStars += starsEarned;
        userRaceStats[userId].racesParticipated += 1;
      });

      // Sort participants by score (descending) for this race
      raceStats.participants.sort((a, b) => b.score - a.score);
    });

    // Sort recent performance by date (newest first) and keep last 5
    Object.values(userRaceStats).forEach(user => {
      user.recentPerformance.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      user.recentPerformance = user.recentPerformance.slice(0, 5);
    });

    return Object.values(userRaceStats);
  };

  const sortLeaderboard = (data: any[], view: string, raceFilter?: string) => {
    let sorted = [...data];

    switch (view) {
      case 'overall':
        sorted.sort((a, b) => b.totalStars - a.totalStars || b.racesParticipated - a.racesParticipated);
        break;
    }

    return sorted;
  };



  const getPerformanceIndicator = (score: number) => {
    if (score >= 30) return '🔥'; // Perfect match
    if (score >= 20) return '⭐'; // High score
    if (score >= 10) return '👍'; // Good score
    return '📊'; // Low score
  };

  // Helper functions for progress chart
  const generateProgressChartData = () => {
    const completedRaces = getCompletedRaces()
      .filter(race => race.results)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (completedRaces.length === 0) return [];

    // First pass: calculate star wins (1) or no wins (0) for each user at each race
    const userStarWins: { [userId: string]: { [raceId: string]: number } } = {};
    const userCumulativeStars: { [userId: string]: { [raceId: string]: number } } = {};
    
    processedLeaderboardData.forEach(user => {
      userStarWins[user.userId] = {};
      userCumulativeStars[user.userId] = {};
      let cumulativeStars = 0;
      
      completedRaces.forEach(race => {
        const userRaceData = user.raceBreakdown[race.id];
        const starWon = userRaceData?.isStarWinner ? 1 : 0;
        userStarWins[user.userId][race.id] = starWon;
        cumulativeStars += starWon;
        userCumulativeStars[user.userId][race.id] = cumulativeStars;
      });
    });

    // Second pass: build chart data with cumulative totals
    const chartData = completedRaces.map(race => {
      const raceData: any = {
        race: race.city,
        date: race.date,
        raceName: race.name
      };

      // Add cumulative stars for each user
      processedLeaderboardData.forEach(user => {
        raceData[user.username] = userCumulativeStars[user.userId][race.id] || 0;
      });

      return raceData;
    });

    return chartData;
  };

  const generateStarWinsTableData = () => {
    const completedRaces = getCompletedRaces()
      .filter(race => race.results)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (completedRaces.length === 0) return { tableData: [], races: [] };

    // Calculate star wins and cumulative totals for each user
    const tableData = processedLeaderboardData.map(user => {
      const userData: any = {
        userId: user.userId,
        username: user.username,
        name: user.name
      };

      let cumulativeStars = 0;
      let totalStarWins = 0;
      completedRaces.forEach(race => {
        const userRaceData = user.raceBreakdown[race.id];
        const starWon = userRaceData?.isStarWinner ? 1 : 0;
        userData[race.id] = starWon;
        totalStarWins += starWon;
        cumulativeStars += starWon;
        userData[`${race.id}_cumulative`] = cumulativeStars;
      });

      // Use calculated total instead of user.totalStars
      userData.totalStars = totalStarWins;

      return userData;
    });

    return {
      tableData: tableData.sort((a, b) => b.totalStars - a.totalStars), // Sort by total stars
      races: completedRaces
    };
  };

  const generateUserColors = () => {
    const colors = [
      '#E10800', // Red
      '#0072B2', // Blue
      '#009E73', // Green
      '#F0E442', // Yellow
      '#D55E00', // Orange
      '#CC79A7', // Pink
      '#56B4E9', // Sky Blue
      '#000000', // Black
      '#E69F00', // Gold
      '#999999', // Gray
      '#8B4513', // Brown
      '#9400D3', // Purple
      '#228B22', // Forest Green
      '#FFD700', // Bright Yellow
      '#00CED1', // Turquoise
    ];

    const userColors: { [username: string]: string } = {};
    processedLeaderboardData.forEach((user, index) => {
      userColors[user.username] = colors[index % colors.length];
    });

    return userColors;
  };

  // Helper function to calculate per-position points for display
  const calculatePositionPoints = (prediction: Positions, results: Positions) => {
    const posPoints = { first: 0, second: 0, third: 0 };
    
    // Check for perfect match
    const isPerfect = 
      prediction.first === results.first &&
      prediction.second === results.second &&
      prediction.third === results.third;
    
    if (isPerfect) {
      return { first: 30, second: 20, third: 10 }; // Perfect match: 30+20+10 = 60 total
    }
    
    // Track which drivers have already been matched
    const usedActual = { first: false, second: false, third: false };
    
    // 1st position: 30 points if correct, 5 if in top 3 but wrong
    if (prediction.first === results.first) {
      posPoints.first = 30; usedActual.first = true;
    } else if (prediction.first === results.second && !usedActual.second) {
      posPoints.first = 5; usedActual.second = true;
    } else if (prediction.first === results.third && !usedActual.third) {
      posPoints.first = 5; usedActual.third = true;
    }
    
    // 2nd position: 20 points if correct, 5 if in top 3 but wrong
    if (prediction.second === results.second && !usedActual.second) {
      posPoints.second = 20; usedActual.second = true;
    } else if (prediction.second === results.first && !usedActual.first) {
      posPoints.second = 5; usedActual.first = true;
    } else if (prediction.second === results.third && !usedActual.third) {
      posPoints.second = 5; usedActual.third = true;
    }
    
    // 3rd position: 10 points if correct, 5 if in top 3 but wrong
    if (prediction.third === results.third && !usedActual.third) {
      posPoints.third = 10; usedActual.third = true;
    } else if (prediction.third === results.first && !usedActual.first) {
      posPoints.third = 5; usedActual.first = true;
    } else if (prediction.third === results.second && !usedActual.second) {
      posPoints.third = 5; usedActual.second = true;
    }
    
    return posPoints;
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Show loading state until client-side data is loaded */}
      {!isClient && (
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
      )}

      {/* Main app content - only render after client initialization */}
      {isClient && (
        <>
          {/* Header */}
          <header className="bg-[#E10800] p-4 border-b border-red-800 shadow-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center justify-center w-full">
                <img
                  src="/Punezolanos.png"
                  alt="Punezolanos"
                  className="h-14 w-auto object-contain cursor-pointer"
                  onClick={() => router.push("/drivers")}
                  draggable={false}
                />
              </div>
              {isAdminLoggedIn && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white font-medium">Admin Mode</span>
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <div className="p-4 pb-[180px] bg-gray-50">
            {activeTab === "fantasy" && (
              <div className="space-y-4">
                {/* Removed '🚗 My Fantasy' title and Admin login button */}
                {/* Login/Register Form */}
                {!currentUser ? (
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {isLoginMode ? "Login to Fantasy League" : "Join the Fantasy League"}
                        </h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setIsLoginMode(!isLoginMode);
                            setNewUserName("");
                            setNewUserUsername("");
                            setNewUserPassword("");
                            setLoginUsername("");
                            setLoginPassword("");
                          }}
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          {isLoginMode ? "Create Account" : "Login"}
                        </Button>
                      </div>
                      {isLoginMode ? (
                        // Login Form
                        <div className="space-y-3">
                          <Input
                            value={loginUsername}
                            onChange={(e) => setLoginUsername(e.target.value)}
                            placeholder="Username"
                            className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600 placeholder-gray-500"
                          />
                          <Input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Password"
                            className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600 placeholder-gray-500"
                          />
                          <Button onClick={loginUser} className="w-full bg-red-600 hover:bg-red-700 text-white">
                            Login
                          </Button>
                        </div>
                      ) : (
                        // Registration Form
                        <div className="space-y-3">
                          <Input
                            value={newUserUsername}
                            onChange={(e) => setNewUserUsername(e.target.value)}
                            placeholder="Choose a username"
                            className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600 placeholder-gray-500"
                          />
                          <Input
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Your display name"
                            className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600 placeholder-gray-500"
                          />
                          <Input
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Choose a password"
                            className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600 placeholder-gray-500"
                          />
                          <Button onClick={addUser} className="w-full bg-red-600 hover:bg-red-700 text-white">
                            Create Account
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Current User Info */}
                    <Card className="bg-white border border-gray-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-900">Welcome, {currentUser.name}!</h3>
                            <p className="text-sm text-gray-600">
                              @{currentUser.username}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={openProfileEdit}
                              className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                              Edit Profile
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={logoutUser}
                              className="border-gray-600 text-gray-600 hover:bg-gray-50"
                            >
                              <LogOut className="w-4 h-4 mr-1" />
                              Logout
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Profile Edit Modal */}
                    {showProfileEdit && (
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={closeProfileEdit}
                              className="border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Username (read-only) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                              </label>
                              <Input
                                value={currentUser.username}
                                disabled
                                className="text-gray-500 bg-gray-50 border-gray-300"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Username cannot be changed for security reasons
                              </p>
                            </div>

                            {/* Display Name */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Display Name *
                              </label>
                              <Input
                                value={profileEditData.name}
                                onChange={(e) => setProfileEditData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Your display name"
                                className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600"
                              />
                            </div>

                            {/* Current Password */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Password *
                              </label>
                              <Input
                                type="password"
                                value={profileEditData.currentPassword}
                                onChange={(e) => setProfileEditData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                placeholder="Enter your current password"
                                className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Required to verify your identity
                              </p>
                            </div>

                            {/* New Password (optional) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password (optional)
                              </label>
                              <Input
                                type="password"
                                value={profileEditData.newPassword}
                                onChange={(e) => setProfileEditData(prev => ({ ...prev, newPassword: e.target.value }))}
                                placeholder="Leave blank to keep current password"
                                className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600"
                              />
                            </div>

                            {/* Confirm New Password */}
                            {profileEditData.newPassword && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Confirm New Password *
                                </label>
                                <Input
                                  type="password"
                                  value={profileEditData.confirmPassword}
                                  onChange={(e) => setProfileEditData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  placeholder="Confirm your new password"
                                  className={`text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600 ${
                                    profileEditData.newPassword && profileEditData.confirmPassword && 
                                    profileEditData.newPassword !== profileEditData.confirmPassword 
                                      ? 'border-red-500' : ''
                                  }`}
                                />
                                {profileEditData.newPassword && profileEditData.confirmPassword && 
                                 profileEditData.newPassword !== profileEditData.confirmPassword && (
                                  <p className="text-xs text-red-500 mt-1">
                                    Passwords do not match
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Button 
                                onClick={updateUserProfile}
                                disabled={isUpdatingProfile}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
                              >
                                {isUpdatingProfile ? (
                                  <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                    Updating...
                                  </>
                                ) : (
                                  'Update Profile'
                                )}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={closeProfileEdit}
                                disabled={isUpdatingProfile}
                                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Upcoming Race */}
                    {(() => {
                      const upcomingRace = getUpcomingRace();
                      if (!upcomingRace) {
                        return (
                          <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-6 text-center">
                              <p className="text-gray-600">No upcoming races scheduled.</p>
                              {isAdminLoggedIn && (
                                <Button onClick={() => setShowAddRace(true)} className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                                  Add New Race
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      }

                      const storedPrediction = getCurrentUserPrediction();
                      const hasStoredPrediction = storedPrediction && storedPrediction.first && storedPrediction.second && storedPrediction.third;
                      const isInEditMode = isEditingPrediction || !hasStoredPrediction;

                      return (
                        <Card className="bg-white border border-gray-200 shadow-sm">
                          <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-2 text-gray-900">🏁 {upcomingRace.name}</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              {upcomingRace.city} • {formatDate(upcomingRace.date)}
                            </p>
                            
                            {/* Countdown Clock */}
                            <CountdownClock 
                              raceDate={upcomingRace.date} 
                              onTimeExpired={setIsPredictionTimeExpired}
                            />

                            {/* Warning when predictions are locked */}
                            {isPredictionTimeExpired && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-red-600">⚠️</span>
                                  <span className="text-red-700 font-semibold">Predictions are now locked!</span>
                                </div>
                                <p className="text-red-600 text-sm mt-1">
                                  The race is starting soon. You can no longer submit or edit predictions.
                                </p>
                              </div>
                            )}

                            {hasStoredPrediction && !isInEditMode ? (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-green-600">Your Prediction:</h4>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      setCurrentPrediction(storedPrediction);
                                      setIsEditingPrediction(true);
                                    }}
                                    disabled={isPredictionTimeExpired}
                                    className={`border-red-600 text-red-600 hover:bg-red-50 ${isPredictionTimeExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {isPredictionTimeExpired ? "Predictions Locked" : "Edit Prediction"}
                                  </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  {Object.entries(storedPrediction).map(([pos, code]) => {
                                    const positionLabels = { first: "1st 🥇", second: "2nd 🥈", third: "3rd 🥉" };
                                    const driver = drivers.find(d => d.code === code);
                                    return (
                                      <div key={pos} className="text-center">
                                        <div className="text-xs text-gray-500 mb-1">
                                          {positionLabels[pos as keyof typeof positionLabels]}
                                        </div>
                                        <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                                          <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center bg-white">
                                            {driver?.img ? (
                                              <img 
                                                src={driver.img} 
                                                alt={driver.name}
                                                className="w-full h-full object-cover object-top"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                  target.nextElementSibling?.classList.remove('hidden');
                                                }}
                                              />
                                            ) : null}
                                            <span className={`text-sm font-bold text-gray-900 ${driver?.img ? 'hidden' : ''}`}>{code}</span>
                                          </div>
                                          <div className="text-sm font-bold text-gray-900">{code}</div>
                                          <div className="text-xs text-gray-600">{driver?.name || code}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-gray-900">
                                    {isEditingPrediction ? "Edit Your Prediction:" : "Make Your Prediction:"}
                                  </h4>
                                  {isEditingPrediction && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => {
                                        setCurrentPrediction(storedPrediction || { first: "", second: "", third: "" });
                                        setIsEditingPrediction(false);
                                      }}
                                      className="border-red-600 text-red-600 hover:bg-red-50"
                                    >
                                      Cancel Edit
                                    </Button>
                                  )}
                                </div>
                                <div className={`grid grid-cols-1 gap-3 max-h-60 overflow-y-auto ${isPredictionTimeExpired ? 'pointer-events-none opacity-50' : ''}`}>
                                  {drivers.map((driver) => {
                                    // Check if driver is selected and get their position
                                    const isSelected = currentPrediction && (
                                      currentPrediction.first === driver.code ||
                                      currentPrediction.second === driver.code ||
                                      currentPrediction.third === driver.code
                                    );
                                    let position = "";
                                    if (currentPrediction) {
                                      if (currentPrediction.first === driver.code) position = "1st 🥇";
                                      else if (currentPrediction.second === driver.code) position = "2nd 🥈";
                                      else if (currentPrediction.third === driver.code) position = "3rd 🥉";
                                    }
                                    return (
                                      <div
                                        key={driver.code}
                                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all border ${
                                          isPredictionTimeExpired 
                                            ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                                            : isSelected
                                            ? "border-red-600 bg-red-50 cursor-pointer"
                                            : "border-gray-200 hover:border-gray-300 cursor-pointer"
                                        }`}
                                        onClick={(e) => {
                                          if (isPredictionTimeExpired) return;
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handlePick(driver.code);
                                        }}
                                        onMouseDown={(e) => {
                                          if (isPredictionTimeExpired) return;
                                          e.preventDefault();
                                        }}
                                      >
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-white">
                                          {driver.img ? (
                                            <img 
                                              src={driver.img} 
                                              alt={driver.name}
                                              className="w-full h-full object-cover object-top"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.nextElementSibling?.classList.remove('hidden');
                                              }}
                                            />
                                          ) : null}
                                          <span className={`text-sm font-bold text-gray-900 ${driver.img ? 'hidden' : ''}`}>{driver.code}</span>
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-semibold text-gray-900">{driver.name}</div>
                                          <div className="text-sm text-gray-600">{driver.team}</div>
                                        </div>
                                        {position && (
                                          <div className="text-red-600 font-bold">{position}</div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={submitPrediction}
                                    disabled={!currentPrediction || !currentPrediction.first || !currentPrediction.second || !currentPrediction.third || isPredictionTimeExpired}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
                                  >
                                    {isPredictionTimeExpired ? "Predictions Locked" : (isEditingPrediction ? "Update Prediction" : "Submit Prediction")}
                                  </Button>
                                  {isEditingPrediction && (
                                    <Button 
                                      variant="outline"
                                      onClick={() => {
                                        setCurrentPrediction(storedPrediction || { first: "", second: "", third: "" });
                                        setIsEditingPrediction(false);
                                      }}
                                      className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })()}

                    {/* Past Races */}
                    {getCompletedRaces().length > 0 && (
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-4">📊 Past Races</h3>
                          <div className="space-y-3">
                            {getCompletedRaces().map((race) => {
                              const raceUserPrediction = race.predictions[currentUser.id];
                              const isStarWinner = race.starWinners?.includes(currentUser.id);
                              return (
                                <div key={race.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h4 className="font-semibold">{race.name}</h4>
                                      <p className="text-sm text-gray-600">{race.city} • {formatDate(race.date)}</p>
                                    </div>
                                    {race.results ? (
                                      <div className="flex flex-row items-end gap-4 min-w-[180px]">
                                        {["first", "second", "third"].map((pos) => {
                                          const labels = { first: "1st", second: "2nd", third: "3rd" };
                                          const code = race.results![pos as keyof typeof race.results];
                                          const driver = drivers.find(d => d.code === code);
                                          return (
                                            <div key={pos} className="flex flex-col items-center">
                                              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center bg-white">
                                                {driver?.img ? (
                                                  <img 
                                                    src={driver.img} 
                                                    alt={driver.name}
                                                    className="w-full h-full object-cover object-top"
                                                    onError={(e) => {
                                                      const target = e.target as HTMLImageElement;
                                                      target.style.display = 'none';
                                                      target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                  />
                                                ) : null}
                                                <span className={`text-xs font-bold text-gray-900 ${driver?.img ? 'hidden' : ''}`}>{code}</span>
                                              </div>
                                              <span className="text-xs text-gray-500 mt-1">{labels[pos as keyof typeof labels]}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : null}
                                    {isStarWinner && <Star className="w-5 h-5 text-yellow-400 fill-current ml-2" />}
                                  </div>
                                  {raceUserPrediction && race.results && (
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h5 className="text-sm font-semibold text-blue-400 mb-2">Your Prediction</h5>
                                        <div className="space-y-1">
                                          {Object.entries(raceUserPrediction).map(([pos, code]) => {
                                            const labels = { first: "1st", second: "2nd", third: "3rd" };
                                            return (
                                              <div key={pos} className="text-sm">
                                                {labels[pos as keyof typeof labels]}: {code} - {drivers.find(d => d.code === code)?.name || code}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      <div>
                                        <h5 className="text-sm font-semibold text-green-400 mb-2">Actual Results</h5>
                                        <div className="space-y-1">
                                          {["first", "second", "third"].map((pos) => {
                                            const labels = { first: "1st", second: "2nd", third: "3rd" };
                                            const code = race.results![pos as keyof typeof race.results];
                                            return (
                                              <div key={pos} className="text-sm text-gray-600">
                                                {labels[pos as keyof typeof labels]}: {code} - {drivers.find(d => d.code === code)?.name || code}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Random Driver-Car Pair */}
                <DriverCarPair pair={tabPairs["fantasy"] || null} />
              </div>
            )}
            {activeTab === "ranking" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">🏆 Leaderboard</h2>
                  {isAdminLoggedIn && (
                    <Button onClick={() => setShowAdminLogin(false)} variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout Admin
                    </Button>
                  )}
                </div>

                {/* View Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setLeaderboardView('overall')}
                    className={`px-4 py-2 rounded font-medium border transition-colors duration-150 ${
                      leaderboardView === 'overall'
                        ? 'bg-[#E10800] text-white border-[#E10800] shadow'
                        : 'bg-white text-[#E10800] border-[#E10800] hover:bg-red-50'
                    }`}
                  >
                    Overall
                  </button>
                  <button
                    onClick={() => setLeaderboardView('progress-chart')}
                    className={`px-4 py-2 rounded font-medium border transition-colors duration-150 ${
                      leaderboardView === 'progress-chart'
                        ? 'bg-[#E10800] text-white border-[#E10800] shadow'
                        : 'bg-white text-[#E10800] border-[#E10800] hover:bg-red-50'
                    }`}
                  >
                    Progress Chart
                  </button>
                  <button
                    onClick={() => setLeaderboardView('table-result')}
                    className={`px-4 py-2 rounded font-medium border transition-colors duration-150 ${
                      leaderboardView === 'table-result'
                        ? 'bg-[#E10800] text-white border-[#E10800] shadow'
                        : 'bg-white text-[#E10800] border-[#E10800] hover:bg-red-50'
                    }`}
                  >
                    Table Result
                  </button>
                </div>

                {processedLeaderboardData.length === 0 ? (
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-600">No users yet. Start by making predictions!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Overall Leaderboard View */}
                    {leaderboardView === 'overall' && (
                      <div className="space-y-3">
                        {sortLeaderboard(processedLeaderboardData, 'overall').map((user, index) => (
                          <Card key={user.userId} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">{index + 1}</span>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                    <p className="text-sm text-gray-600">
                                      @{user.username} • {user.racesParticipated} races • {user.totalStars} ⭐
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {Array.from({ length: user.totalStars }, (_, i) => (
                                    <Star key={i} className="w-5 h-5 text-red-600 fill-current" />
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}



                    {/* Progress Chart View */}
                    {leaderboardView === 'progress-chart' && (
                      <div className="space-y-4">
                        <Card className="bg-white border border-gray-200 shadow-sm">
                          <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">📈 Stars Progress Over Time</h3>
                            {(() => {
                              const chartData = generateProgressChartData();
                              const userColors = generateUserColors();
                              
                              if (chartData.length === 0) {
                                return (
                                  <div className="text-center py-8">
                                    <p className="text-gray-600">No completed races with results yet.</p>
                                    <p className="text-sm text-gray-500 mt-2">Complete some races to see the progress chart!</p>
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-4">
                                  <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart
                                        data={chartData}
                                        margin={{
                                          top: 20,
                                          right: 30,
                                          left: 20,
                                          bottom: 20,
                                        }}
                                      >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis 
                                          dataKey="race" 
                                          stroke="#666"
                                          fontSize={12}
                                          angle={-45}
                                          textAnchor="end"
                                          height={80}
                                        />
                                        <YAxis 
                                          stroke="#666"
                                          fontSize={12}
                                          label={{ value: 'Cumulative Stars', angle: -90, position: 'insideLeft', fontSize: 12 }}
                                        />
                                        <Tooltip 
                                          contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                          }}
                                          formatter={(value: any, name: string) => [
                                            `${value} ⭐`, 
                                            `@${name}`
                                          ]}
                                          labelFormatter={(label) => `Race: ${label}`}
                                        />
                                        <Legend 
                                          verticalAlign="top" 
                                          height={36}
                                          wrapperStyle={{
                                            paddingBottom: '10px'
                                          }}
                                          style={{
                                            fontSize: '0.49em'
                                          }}
                                        />
                                        {processedLeaderboardData.map((user) => (
                                          <Line
                                            key={user.username}
                                            type="monotone"
                                            dataKey={user.username}
                                            stroke={userColors[user.username]}
                                            strokeWidth={3}
                                            dot={{ fill: userColors[user.username], strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: userColors[user.username], strokeWidth: 2 }}
                                            connectNulls={true}
                                          />
                                        ))}
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                  
                                  {/* Table Results */}
                                  <div className="mt-10">
                                    <h4 className="text-xl font-bold mb-4 text-gray-800">Table Results</h4>
                                    {(() => {
                                      const completedRaces = getCompletedRaces().filter(race => race.results);
                                      if (completedRaces.length === 0) {
                                        return (
                                          <div className="text-center py-4">
                                            <p className="text-gray-600">No completed races with results yet.</p>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                                          <table className="min-w-max text-xs">
                                            <thead>
                                              <tr>
                                                <th className="px-3 py-2 text-left bg-gray-50 border-b-2 border-gray-200 font-semibold sticky left-0 z-10">User</th>
                                                {completedRaces.map((race) => (
                                                  <th key={race.id} className="px-2 py-2 border-b-2 border-gray-200 text-center align-middle min-w-[120px]">
                                                    <div className="flex flex-col items-center justify-center h-full w-full">
                                                      <span className="font-semibold text-xs text-gray-700 text-center" style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'inline-block', whiteSpace: 'pre-line'}}>
                                                        {race.city}<br/>{formatShortDate(race.date)}
                                                      </span>
                                                    </div>
                                                  </th>
                                                ))}
                                                <th className="px-3 py-2 text-center bg-green-100 border-b-2 border-gray-200 font-semibold">Total Stars</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {/* Real Results Row */}
                                              <tr className="bg-green-100 font-bold">
                                                <td className="px-3 py-2 sticky left-0 z-10 bg-green-100">Race Results</td>
                                                {completedRaces.map((race) => (
                                                  <td key={race.id} className="px-2 py-2 text-center align-top min-w-[120px]">
                                                    {race.results ? (
                                                      <div className="flex flex-col items-center gap-1">
                                                        <div className="flex flex-row gap-1 text-[10px]">
                                                          <span className="font-bold text-gray-700">1st:</span> <span>{race.results.first}</span>
                                                        </div>
                                                        <div className="flex flex-row gap-1 text-[10px]">
                                                          <span className="font-bold text-gray-700">2nd:</span> <span>{race.results.second}</span>
                                                        </div>
                                                        <div className="flex flex-row gap-1 text-[10px]">
                                                          <span className="font-bold text-gray-700">3rd:</span> <span>{race.results.third}</span>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <span className="text-gray-300">—</span>
                                                    )}
                                                  </td>
                                                ))}
                                                <td className="px-3 py-2 text-center bg-green-100">—</td>
                                              </tr>
                                              {/* User Rows */}
                                              {processedLeaderboardData.map((user) => (
                                                <tr key={user.userId} className="border-b hover:bg-gray-50">
                                                  <td className="px-3 py-2 font-medium bg-gray-50 sticky left-0 z-10">{user.name}</td>
                                                  {completedRaces.map((race) => {
                                                    const breakdown = user.raceBreakdown[race.id];
                                                    const results = race.results;
                                                    if (breakdown && results) {
                                                      const posPoints = calculatePositionPoints(breakdown.prediction, results);
                                                      const total = calculateScore(breakdown.prediction, results);
                                                      return (
                                                        <td key={race.id} className="px-2 py-2 text-center align-top min-w-[120px]">
                                                          <div className="flex flex-col items-center gap-1">
                                                            <div className="flex flex-row gap-1 text-[10px]">
                                                              <span className="font-bold text-gray-700">1st:</span> <span>{breakdown.prediction.first}</span>
                                                              <span className="text-gray-500">- {posPoints.first} pts</span>
                                                            </div>
                                                            <div className="flex flex-row gap-1 text-[10px]">
                                                              <span className="font-bold text-gray-700">2nd:</span> <span>{breakdown.prediction.second}</span>
                                                              <span className="text-gray-500">- {posPoints.second} pts</span>
                                                            </div>
                                                            <div className="flex flex-row gap-1 text-[10px]">
                                                              <span className="font-bold text-gray-700">3rd:</span> <span>{breakdown.prediction.third}</span>
                                                              <span className="text-gray-500">- {posPoints.third} pts</span>
                                                            </div>
                                                            <div className="text-xs font-bold text-green-700">= {total} pts</div>
                                                            {breakdown.isStarWinner && <span title="Star Winner" className="text-yellow-500">★</span>}
                                                          </div>
                                                        </td>
                                                      );
                                                    } else {
                                                      return (
                                                        <td key={race.id} className="px-2 py-2 text-center align-top min-w-[120px]">
                                                          <span className="text-gray-300">—</span>
                                                        </td>
                                                      );
                                                    }
                                                  })}
                                                  <td className="px-3 py-2 text-center bg-green-100 font-bold text-red-600">{user.totalStars}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    {/* Table Result View */}
                    {leaderboardView === 'table-result' && (
                      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                        <table className="min-w-max text-xs">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left bg-gray-50 border-b-2 border-gray-200 font-semibold sticky left-0 z-10">User</th>
                              {getCompletedRaces().map((race) => (
                                <th key={race.id} className="px-2 py-2 border-b-2 border-gray-200 text-center align-middle min-w-[120px]">
                                  <div className="flex flex-col items-center justify-center h-full w-full">
                                    <span className="font-semibold text-xs text-gray-700 text-center" style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'inline-block', whiteSpace: 'pre-line'}}>
                                      {race.city}<br/>{formatShortDate(race.date)}
                                    </span>
                                  </div>
                                </th>
                              ))}
                              <th className="px-3 py-2 text-center bg-green-100 border-b-2 border-gray-200 font-semibold">Total Stars</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Real Results Row */}
                            <tr className="bg-green-100 font-bold">
                              <td className="px-3 py-2 sticky left-0 z-10 bg-green-100">Race Results</td>
                              {getCompletedRaces().map((race) => (
                                <td key={race.id} className="px-2 py-2 text-center align-top min-w-[120px]">
                                  {race.results ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="flex flex-row gap-1 text-[10px]">
                                        <span className="font-bold text-gray-700">1st:</span> <span>{race.results.first}</span>
                                      </div>
                                      <div className="flex flex-row gap-1 text-[10px]">
                                        <span className="font-bold text-gray-700">2nd:</span> <span>{race.results.second}</span>
                                      </div>
                                      <div className="flex flex-row gap-1 text-[10px]">
                                        <span className="font-bold text-gray-700">3rd:</span> <span>{race.results.third}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              ))}
                              <td className="px-3 py-2 text-center bg-green-100">—</td>
                            </tr>
                            {/* User Rows */}
                            {processedLeaderboardData.map((user) => (
                              <tr key={user.userId} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium bg-gray-50 sticky left-0 z-10">{user.name}</td>
                                {getCompletedRaces().map((race) => {
                                  const breakdown = user.raceBreakdown[race.id];
                                  const results = race.results;
                                  if (breakdown && results) {
                                    const posPoints = calculatePositionPoints(breakdown.prediction, results);
                                    const total = calculateScore(breakdown.prediction, results);
                                    return (
                                      <td key={race.id} className="px-2 py-2 text-center align-top min-w-[120px]">
                                        <div className="flex flex-col items-center gap-1">
                                          <div className="flex flex-row gap-1 text-[10px]">
                                            <span className="font-bold text-gray-700">1st:</span> <span>{breakdown.prediction.first}</span>
                                            <span className="text-gray-500">- {posPoints.first} pts</span>
                                          </div>
                                          <div className="flex flex-row gap-1 text-[10px]">
                                            <span className="font-bold text-gray-700">2nd:</span> <span>{breakdown.prediction.second}</span>
                                            <span className="text-gray-500">- {posPoints.second} pts</span>
                                          </div>
                                          <div className="flex flex-row gap-1 text-[10px]">
                                            <span className="font-bold text-gray-700">3rd:</span> <span>{breakdown.prediction.third}</span>
                                            <span className="text-gray-500">- {posPoints.third} pts</span>
                                          </div>
                                          <div className="text-xs font-bold text-green-700">= {total} pts</div>
                                          {breakdown.isStarWinner && <span title="Star Winner" className="text-yellow-500">★</span>}
                                        </div>
                                      </td>
                                    );
                                  } else {
                                    return (
                                      <td key={race.id} className="px-2 py-2 text-center align-top min-w-[120px]">
                                        <span className="text-gray-300">—</span>
                                      </td>
                                    );
                                  }
                                })}
                                <td className="px-3 py-2 text-center bg-green-100 font-bold text-red-600">{user.totalStars}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Random Driver-Car Pair */}
                <DriverCarPair pair={tabPairs["ranking"] || null} />
              </div>
            )}
            {activeTab === "history" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">📊 Prediction History</h2>
                {/* Statistics Cards */}
                {currentUser && (() => {
                  const userHistory = getUserPredictionHistory(currentUser.id);
                  const userStats = calculateUserStats(userHistory);
                  return userHistory.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{userStats.totalRaces}</div>
                          <div className="text-xs text-gray-500">Total Races</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{Math.round(userStats.averageScore)}</div>
                          <div className="text-xs text-gray-500">Avg Score</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">{userStats.perfectMatches}</div>
                          <div className="text-xs text-gray-500">Perfect Matches</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{userStats.starWins}</div>
                          <div className="text-xs text-gray-500">Star Wins</div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}
                {/* Filters */}
                {currentUser && (() => {
                  const userHistory = getUserPredictionHistory(currentUser.id);
                  return userHistory.length > 0 && (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-3 text-gray-900">Filters</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <select
                            value={historyFilter.dateRange}
                            onChange={(e) => setHistoryFilter((prev: typeof historyFilter) => ({ ...prev, dateRange: e.target.value }))}
                            className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600"
                          >
                            <option value="all">All Time</option>
                            <option value="last3">Last 3 Races</option>
                            <option value="last5">Last 5 Races</option>
                            <option value="last10">Last 10 Races</option>
                          </select>
                          <select
                            value={historyFilter.performance}
                            onChange={(e) => setHistoryFilter((prev: typeof historyFilter) => ({ ...prev, performance: e.target.value }))}
                            className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600"
                          >
                            <option value="all">All Performance</option>
                            <option value="high">High Score (20+)</option>
                            <option value="low">Low Score (&lt;10)</option>
                            <option value="perfect">Perfect Matches</option>
                          </select>
                          <select
                            value={historyFilter.raceType}
                            onChange={(e) => setHistoryFilter((prev: typeof historyFilter) => ({ ...prev, raceType: e.target.value }))}
                            className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600"
                          >
                            <option value="all">All Races</option>
                            {currentUser && Array.from(new Set(getUserPredictionHistory(currentUser.id).map(h => h.raceCity))).map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                          <select
                            value={historyFilter.driver}
                            onChange={(e) => setHistoryFilter((prev: typeof historyFilter) => ({ ...prev, driver: e.target.value }))}
                            className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600"
                          >
                            <option value="all">All Drivers</option>
                            {drivers.map(driver => (
                              <option key={driver.code} value={driver.code}>{driver.code}</option>
                            ))}
                          </select>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
                {/* Race History List */}
                {currentUser && (() => {
                  const userHistory = getUserPredictionHistory(currentUser.id);
                  const filteredHistory = filterHistory(userHistory, historyFilter);
                  return filteredHistory.length === 0 ? (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                      <CardContent className="p-6 text-center">
                        <p className="text-gray-600">No prediction history yet. Start making predictions to see your history here!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {filteredHistory.map((historyItem) => {
                        const predictionNodes = Object.entries(historyItem.prediction).map(([pos, code]) => {
                          const labels = { first: "1st", second: "2nd", third: "3rd" };
                          const typedPos = pos as 'first' | 'second' | 'third';
                          const isCorrect = historyItem.accuracy[typedPos];
                          return (
                            <div key={pos} className={`text-xs ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              {labels[typedPos]}: {String(code)} - {drivers.find(d => d.code === code)?.name || String(code)} {isCorrect ? '✅' : '❌'}
                            </div>
                          );
                        });
                        
                        return (
                          <Card key={historyItem.raceId} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{historyItem.raceName}</h4>
                                  <p className="text-sm text-gray-600">{historyItem.raceCity} • {formatDate(historyItem.raceDate)}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600">{historyItem.score || 0} pts</div>
                                  {historyItem.isStarWinner && <Star className="w-5 h-5 text-red-600 fill-current" />}
                                </div>
                              </div>
                              {historyItem.actualResults ? (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="text-xs font-semibold text-blue-600 mb-2">Your Prediction</h5>
                                    <div className="space-y-1">
                                      {predictionNodes}
                                    </div>
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-semibold text-green-600 mb-2">Actual Results</h5>
                                    <div className="space-y-1">
                                      {(["first", "second", "third"] as const).map((pos) => {
                                        const labels = { first: "1st", second: "2nd", third: "3rd" };
                                        const code = historyItem.actualResults![pos];
                                        return (
                                          <div key={pos} className="text-xs text-gray-600">
                                            {labels[pos]}: {code} - {drivers.find(d => d.code === code)?.name || code}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </>
                  );
                })()}
                {/* Random Driver-Car Pair */}
                <DriverCarPair pair={tabPairs["history"] || null} />
              </div>
            )}
            {activeTab === "rules" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">📜 How to Play</h2>
                
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 mb-2">🎯 Objective</h3>
                      <p className="text-gray-700">Predict the Top 3 finishers of each Formula 1 race and earn stars for the best predictions!</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-blue-600 mb-2">⭐ Scoring System</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• <strong>Perfect Match:</strong> All 3 positions correct = 60 points (30+20+10)</li>
                        <li>• <strong>1st Place Correct:</strong> 30 points</li>
                        <li>• <strong>2nd Place Correct:</strong> 20 points</li>
                        <li>• <strong>3rd Place Correct:</strong> 10 points</li>
                        <li>• <strong>Driver in Top 3 but Wrong Position:</strong> 5 points</li>
                        <li>• <strong>Star Award:</strong> Only the user(s) with the highest score gets a ⭐</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-green-600 mb-2">🏆 How to Win</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• Submit your predictions before each race</li>
                        <li>• Pick 1st, 2nd, and 3rd place finishers</li>
                        <li>• Earn stars for the best predictions</li>
                        <li>• Climb the leaderboard with the most stars</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-purple-600 mb-2">👑 Admin Features</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• Add new races with dates and locations</li>
                        <li>• Record official race results after each race</li>
                        <li>• Automatic star distribution to winners</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Random Driver-Car Pair */}
                <DriverCarPair pair={tabPairs["rules"] || null} />
              </div>
            )}
            {activeTab === "admin" && (
              <div className="space-y-8">
                
                {!isAdminLoggedIn ? (
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">🔐 Admin Login</h3>
                      <div className="space-y-3">
                        <Input
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          placeholder="Username"
                          className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600 placeholder-gray-500"
                        />
                        <Input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Password"
                          className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600 placeholder-gray-500"
                        />
                        <div className="flex gap-2">
                          <Button onClick={loginAdmin} className="flex-1 bg-[#E10800] text-white hover:bg-red-800 font-medium">
                            Login
                          </Button>
                          <Button onClick={() => setShowAdminLogin(false)} variant="outline" className="flex-1 border-red-600 text-red-600 hover:bg-red-50">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">🛠️ Admin Panel</h2>
                      <Button onClick={logoutAdmin} variant="outline">
                        Logout
                      </Button>
                    </div>

                    {/* Admin Feature Tabs */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {adminFeatures.map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setAdminTab(tab.key)}
                          className={`px-4 py-2 rounded font-medium border transition-colors duration-150 ${
                            adminTab === tab.key
                              ? 'bg-[#E10800] text-white border-[#E10800] shadow'
                              : 'bg-white text-[#E10800] border-[#E10800] hover:bg-red-50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Feature Sections */}
                    {adminTab === 'addRace' && (
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Race</h3>
                          <form className="space-y-3" onSubmit={e => { e.preventDefault(); addNewRace(); }}>
                            <Input value={newRace.name} onChange={e => setNewRace(prev => ({ ...prev, name: e.target.value }))} placeholder="Race Name (e.g., Austrian Grand Prix)" />
                            <Input value={newRace.city} onChange={e => setNewRace(prev => ({ ...prev, city: e.target.value }))} placeholder="City" />
                            <Input type="date" value={newRace.date} onChange={e => setNewRace(prev => ({ ...prev, date: e.target.value }))} />
                            <div className="flex gap-2">
                              <Button type="submit" className="flex-1 bg-[#E10800] text-white hover:bg-red-800 font-medium">Add Race</Button>
                            </div>
                          </form>
                          {/* Races List */}
                          <div className="mt-6">
                            <h4 className="text-md font-semibold text-gray-800 mb-2">All Races</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs border">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="px-2 py-1 text-left">Name</th>
                                    <th className="px-2 py-1 text-left">City</th>
                                    <th className="px-2 py-1 text-left">Date</th>
                                    <th className="px-2 py-1 text-left">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {races.map(race => (
                                    <tr key={race.id} className="border-b">
                                      <td className="px-2 py-1">{race.name}</td>
                                      <td className="px-2 py-1">{race.city}</td>
                                      <td className="px-2 py-1">{formatDate(race.date)}</td>
                                      <td className="px-2 py-1">
                                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-medium" onClick={() => handleDeleteRace(race.id)}>Delete</Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {adminTab === 'addResults' && (
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Race Results</h3>
                            <div className="flex gap-2">
                              <Button 
                                onClick={exportResultsToCSV}
                                variant="outline" 
                                size="sm" 
                                className="border-green-600 text-green-600 hover:bg-green-50 p-2"
                              >
                                <img src="/icons/CSV_export.png" alt="Export CSV" className="w-5 h-5" />
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={importResultsFromCSV}
                                className="hidden"
                              />
                              <Button 
                                onClick={handleImportButtonClick}
                                variant="outline" 
                                size="sm" 
                                className="border-blue-600 text-blue-600 hover:bg-blue-50 p-2"
                              >
                                <img src="/icons/CSV_import.png" alt="Import CSV" className="w-5 h-5" />
                              </Button>
                              <Button
                                onClick={handleRecalculateScores}
                                variant="outline"
                                size="sm"
                                className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 p-2"
                                disabled={isRecalculatingScores}
                              >
                                <img src="/icons/Recalculate.png" alt="Recalculate" className="w-5 h-5" />
                              </Button>
                              {isRecalculatingScores && (
                                <span className="ml-2 flex items-center">
                                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-1"></span>
                                  <span className="text-yellow-600 text-xs">Recalculating...</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <form className="space-y-3" onSubmit={e => { e.preventDefault(); addRaceResults(); }}>
                            <select value={selectedRaceForResults} onChange={e => setSelectedRaceForResults(e.target.value)} className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600">
                              <option value="">Select a race</option>
                              {races.filter(r => !r.isCompleted && new Date(r.date) <= new Date()).map(race => (
                                <option key={race.id} value={race.id}>{race.name} - {formatDate(race.date)}</option>
                              ))}
                            </select>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <select value={raceResults.first} onChange={e => setRaceResults(prev => ({ ...prev, first: e.target.value }))} className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600">
                                <option value="">1st Place</option>
                                {drivers.map(driver => <option key={driver.code} value={driver.code}>{driver.name}</option>)}
                              </select>
                              <select value={raceResults.second} onChange={e => setRaceResults(prev => ({ ...prev, second: e.target.value }))} className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600">
                                <option value="">2nd Place</option>
                                {drivers.map(driver => <option key={driver.code} value={driver.code}>{driver.name}</option>)}
                              </select>
                              <select value={raceResults.third} onChange={e => setRaceResults(prev => ({ ...prev, third: e.target.value }))} className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600">
                                <option value="">3rd Place</option>
                                {drivers.map(driver => <option key={driver.code} value={driver.code}>{driver.name}</option>)}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" className="flex-1 bg-[#E10800] text-white hover:bg-red-800 font-medium">Add Results</Button>
                            </div>
                          </form>
                          {/* Results List */}
                          <div className="mt-6">
                            <h4 className="text-md font-semibold text-gray-800 mb-2">Races with Results</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs border">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="px-2 py-1 text-left">Name</th>
                                    <th className="px-2 py-1 text-left">City</th>
                                    <th className="px-2 py-1 text-left">Date</th>
                                    <th className="px-2 py-1 text-left">Results</th>
                                    <th className="px-2 py-1 text-left">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {getCompletedRaces().filter(race => race.results).map(race => (
                                    <tr key={race.id} className="border-b">
                                      <td className="px-2 py-1">{race.name}</td>
                                      <td className="px-2 py-1">{race.city}</td>
                                      <td className="px-2 py-1">{formatDate(race.date)}</td>
                                      <td className="px-2 py-1">
                                        {race.results ? (
                                          <div>
                                            <div>1st: {race.results.first}</div>
                                            <div>2nd: {race.results.second}</div>
                                            <div>3rd: {race.results.third}</div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">No Results</span>
                                        )}
                                      </td>
                                      <td className="px-2 py-1">
                                        <Button size="sm" className="px-2 py-1 text-sm rounded bg-red-600 hover:bg-red-700 text-white font-medium" onClick={() => handleRemoveResults(race.id)}>Delete</Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {adminTab === 'users' && (
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add / Remove Users</h3>
                          {/* User Creation Form */}
                          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={e => { e.preventDefault(); handleCreateUser(); }}>
                            <Input value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} placeholder="Username" />
                            <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Display Name" />
                            <Input value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Password" type="password" />
                            <Button type="submit" className="bg-[#E10800] text-white hover:bg-red-800 font-medium">Create</Button>
                          </form>
                          {createdUser && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                              <div className="font-semibold text-green-700">User Created!</div>
                              <div>Username: <span className="font-mono">{createdUser.username}</span></div>
                              <div>Password: <span className="font-mono">{createdUser.password}</span></div>
                              <div>Display Name: <span className="font-mono">{createdUser.name}</span></div>
                            </div>
                          )}
                          {/* User List */}
                          <div className="mt-6">
                            <h4 className="text-md font-semibold text-gray-800 mb-2">All Users</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs border">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="px-2 py-1 text-left">Username</th>
                                    <th className="px-2 py-1 text-left">Display Name</th>
                                    <th className="px-2 py-1 text-left">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {users.map(user => (
                                    <tr key={user.id} className="border-b">
                                      <td className="px-2 py-1">{user.username}</td>
                                      <td className="px-2 py-1">{user.name}</td>
                                      <td className="px-2 py-1">
                                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-medium" onClick={() => handleDeleteUser(user)}>Delete</Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          {/* Delete confirmation */}
                          {userToDelete && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="font-semibold text-red-700">Confirm Delete</div>
                              <div>Are you sure you want to delete user <span className="font-mono">{userToDelete.username}</span>?</div>
                              <div className="mt-2 flex gap-2">
                                <Button className="bg-red-600 hover:bg-red-700 text-white font-medium" onClick={confirmDeleteUser}>Delete</Button>
                                <Button variant="outline" className="font-medium" onClick={() => setUserToDelete(null)}>Cancel</Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {adminTab === 'backfill' && (
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Backfill Predictions for Users</h3>
                          
                          {/* Operation Status Indicator */}
                          {currentOperation && (
                            <div className={`text-sm font-medium p-2 rounded-md ${
                              currentOperation === 'edit' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                              {currentOperation === 'edit' ? '✏️ Editing existing prediction' : '➕ Adding new prediction'}
                            </div>
                          )}
                          
                          <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleBackfillPrediction(); }}>
                            <select 
                              className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600" 
                              value={selectedUserId || ""} 
                              onChange={e => handleUserSelection(e.target.value)}
                            >
                              <option value="">Select User</option>
                              {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.name})</option>)}
                            </select>
                            
                            <select 
                              className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600" 
                              value={selectedRaceId || ""} 
                              onChange={e => handleRaceSelection(e.target.value)}
                            >
                              <option value="">Select Race</option>
                              {getCompletedRaces().filter(r => selectedUserId).map(r => {
                                const hasPrediction = r.predictions[selectedUserId!];
                                const status = hasPrediction ? "✏️ Edit" : "➕ Add";
                                return (
                                  <option key={r.id} value={r.id}>
                                    {status} - {r.name} ({formatDate(r.date)})
                                  </option>
                                );
                              })}
                            </select>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <select value={backfillPrediction.first} onChange={e => setBackfillPrediction(p => ({ ...p, first: e.target.value }))} className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600">
                                <option value="">1st Place</option>
                                {drivers.map(driver => <option key={driver.code} value={driver.code}>{driver.name}</option>)}
                              </select>
                              <select value={backfillPrediction.second} onChange={e => setBackfillPrediction(p => ({ ...p, second: e.target.value }))} className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600">
                                <option value="">2nd Place</option>
                                {drivers.map(driver => <option key={driver.code} value={driver.code}>{driver.name}</option>)}
                              </select>
                              <select value={backfillPrediction.third} onChange={e => setBackfillPrediction(p => ({ ...p, third: e.target.value }))} className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600">
                                <option value="">3rd Place</option>
                                {drivers.map(driver => <option key={driver.code} value={driver.code}>{driver.name}</option>)}
                              </select>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button type="submit" className="flex-1 bg-[#E10800] text-white hover:bg-red-800 font-medium">
                                {currentOperation === 'edit' ? 'Update Prediction' : 'Save Prediction'}
                              </Button>
                              {(selectedUserId || selectedRaceId) && (
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="px-4 border-gray-300 text-gray-700 hover:bg-gray-50"
                                  onClick={resetBackfillForm}
                                >
                                  Reset
                                </Button>
                              )}
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    )}


                  </div>
                )}

                {/* Random Driver-Car Pair */}
                <DriverCarPair pair={tabPairs["admin"] || null} />
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-[#E10800] border-t border-red-800 shadow-lg z-50">
            <div className="flex">
              {navTabs.map(tab => (
                <button
                  key={tab.key}
                  className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors ${
                    activeTab === tab.key
                      ? "text-white bg-red-800"
                      : "text-white/80 hover:text-white hover:bg-red-800/50"
                  }`}
                  onClick={() => setActiveTab(tab.key as any)}
                >
                  <span className="text-xs">{tab.icon}</span>
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </>
      )}
    </main>
  );
} 