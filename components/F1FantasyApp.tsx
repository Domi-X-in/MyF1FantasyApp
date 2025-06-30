"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trophy, Car, BookOpen, Crown, Star, LogIn, LogOut, History } from "lucide-react";

// Driver data
const drivers = [
  { code: "VER", name: "Max Verstappen",        team: "Red Bull Racing",  img: "/drivers/2025redbullracingmaxver01right.avif" },
  { code: "TSU", name: "Yuki Tsunoda",          team: "Red Bull Racing",  img: "/drivers/2025redbullracingyuktsu01right.avif" },
  { code: "LAW", name: "Liam Lawson",           team: "Racing Bulls",     img: "/drivers/2025racingbullslialaw01right.avif" },
  { code: "HAD", name: "Isack Hadjar",          team: "Racing Bulls",     img: "/drivers/2025racingbullsisahad01right.avif" },
  { code: "LEC", name: "Charles Leclerc",       team: "Ferrari",          img: "/drivers/2025ferrarichalec01right.avif" },
  { code: "HAM", name: "Lewis Hamilton",        team: "Ferrari",          img: "/drivers/2025ferrarilewham01right.avif" },
  { code: "NOR", name: "Lando Norris",          team: "McLaren",          img: "/drivers/2025mclarenlannor01right.avif" },
  { code: "PIA", name: "Oscar Piastri",         team: "McLaren",          img: "/drivers/2025mclarenoscpia01right.avif" },
  { code: "RUS", name: "George Russell",        team: "Mercedes",         img: "/drivers/2025mercedesgeorus01right.avif" },
  { code: "ANT", name: "Andrea Kimi Antonelli", team: "Mercedes",         img: "/drivers/2025mercedesandant01right.avif" },
  { code: "ALO", name: "Fernando Alonso",       team: "Aston Martin",     img: "/drivers/2025astonmartinferalo01right.avif" },
  { code: "STR", name: "Lance Stroll",          team: "Aston Martin",     img: "/drivers/2025astonmartinlanstr01right.avif" },
  { code: "GAS", name: "Pierre Gasly",          team: "Alpine",           img: "/drivers/2025alpinepiegas01right.avif" },
  { code: "COL", name: "Franco Colapinto",      team: "Alpine",           img: "/drivers/2025alpinefracol01right.avif" },
  { code: "HUL", name: "Nico Hulkenberg",       team: "Kick Sauber",      img: "/drivers/2025kicksaubernichul01right.avif" },
  { code: "BOR", name: "Gabriel Bortoleto",     team: "Kick Sauber",      img: "/drivers/2025kicksaubergabbor01right.avif" },
  { code: "ALB", name: "Alexander Albon",       team: "Williams",         img: "/drivers/2025williamsalealb01right.avif" },
  { code: "SAI", name: "Carlos Sainz",          team: "Williams",         img: "/drivers/2025williamscarsai01right.avif" },
  { code: "BEA", name: "Oliver Bearman",        team: "Haas",             img: "/drivers/2025haasolibea01right.avif" },
  { code: "EST", name: "Esteban Ocon",          team: "Haas",             img: "/drivers/2025haasestoco01right.avif" },
];

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

// Types
interface Positions {
  first: string;
  second: string;
  third: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  password: string; // In a real app, this should be hashed
  stars: number;
  racesParticipated: number;
}

interface Race {
  id: string;
  name: string;
  city: string;
  date: string;
  isCompleted: boolean;
  results?: Positions;
  predictions: { [userId: string]: Positions };
  starWinners?: string[];
}

interface AdminCredentials {
  username: string;
  password: string;
}

// New interfaces for enhanced history tracking
interface PredictionHistory {
  raceId: string;
  raceName: string;
  raceCity: string;
  raceDate: string;
  prediction: Positions;
  actualResults?: Positions;
  score?: number;
  isStarWinner: boolean;
  accuracy: {
    first: boolean;
    second: boolean;
    third: boolean;
    perfectMatch: boolean;
  };
}

interface UserStats {
  totalRaces: number;
  totalScore: number;
  averageScore: number;
  perfectMatches: number;
  starWins: number;
  accuracyByPosition: {
    first: number;
    second: number;
    third: number;
  };
  favoriteDrivers: Array<{
    driverCode: string;
    predictedCount: number;
    correctCount: number;
  }>;
}

interface HistoryFilter {
  dateRange: "all" | "last3" | "last5" | "last10";
  raceType: "all" | string;
  performance: "all" | "high" | "low" | "perfect";
  driver: "all" | string;
}

// Admin credentials
const ADMIN_CREDENTIALS: AdminCredentials = {
  username: "Admin",
  password: "dd090982"
};

// Data storage
const STORAGE_KEYS = {
  USERS: "f1_fantasy_users",
  RACES: "f1_fantasy_races",
  CURRENT_USER: "f1_fantasy_current_user",
  ADMIN_LOGGED_IN: "f1_fantasy_admin_logged_in"
};

// Utility functions
const getStoredData = (key: string, defaultValue: any): any => {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const setStoredData = (key: string, data: any): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
};

// Scoring function
const calculateScore = (prediction: Positions, results: Positions): number => {
  // Perfect match: 1st, 2nd, 3rd in exact order
  if (prediction.first === results.first && 
      prediction.second === results.second && 
      prediction.third === results.third) {
    return 100; // Perfect match gets highest score
  }
  
  let score = 0;
  
  // Exact position matches
  if (prediction.first === results.first) score += 30;
  if (prediction.second === results.second) score += 30;
  if (prediction.third === results.third) score += 30;
  
  // Driver in top 3 but wrong position
  if (prediction.first === results.second || prediction.first === results.third) score += 10;
  if (prediction.second === results.first || prediction.second === results.third) score += 10;
  if (prediction.third === results.first || prediction.third === results.second) score += 10;
  
  return score;
};

export default function F1FantasyApp() {
  // State
  const [activeTab, setActiveTab] = useState<"ranking" | "fantasy" | "history" | "rules" | "admin">("fantasy");
  const [users, setUsers] = useState<User[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);
  
  // User input states
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // Prediction states - separated for better management
  const [currentPrediction, setCurrentPrediction] = useState<Positions>({ first: "", second: "", third: "" });
  const [isEditingPrediction, setIsEditingPrediction] = useState(false);
  
  // History states
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>({
    dateRange: "all",
    raceType: "all",
    performance: "all",
    driver: "all"
  });
  const [selectedHistoryRace, setSelectedHistoryRace] = useState<string | null>(null);
  
  // Admin states
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAddRace, setShowAddRace] = useState(false);
  const [showAddResults, setShowAddResults] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<{ username: string; name: string; password: string }>({ username: "", name: "", password: "" });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [backfillPrediction, setBackfillPrediction] = useState<Positions>({ first: "", second: "", third: "" });
  
  // File input ref for CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New race/result states
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

  const tabKeys = ["fantasy", "ranking", "history", "rules", "admin"];
  const [tabPairs, setTabPairs] = useState<{ [key: string]: { driver: any; carImage: string } }>({});

  // Shuffle and assign unique pairs on mount
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

  // Admin handler functions
  const handleCreateUser = () => {
    if (!newUserUsername.trim() || !newUserName.trim() || !newUserPassword.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    if (users.some(u => u.username && u.username.toLowerCase() === newUserUsername.trim().toLowerCase())) {
      alert("Username already exists.");
      return;
    }
    const user: User = {
      id: Date.now().toString(),
      username: newUserUsername.trim(),
      name: newUserName.trim(),
      password: newUserPassword.trim(),
      stars: 0,
      racesParticipated: 0
    };
    setUsers(prev => [...prev, user]);
    setCurrentUser(user.id);
    setNewUserUsername("");
    setNewUserName("");
    setNewUserPassword("");
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUserData({ username: user.username, name: user.name, password: user.password });
  };
  const handleSaveEditUser = (userId: string) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, ...editUserData } : u
    ));
    setEditingUserId(null);
  };
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };
  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    }
  };
  const handleBackfillPrediction = () => {
    if (!selectedUserId || !selectedRaceId || !backfillPrediction.first || !backfillPrediction.second || !backfillPrediction.third) {
      alert("Please select user, race, and all positions.");
      return;
    }
    setRaces(prev => prev.map(race => {
      if (race.id === selectedRaceId) {
        return {
          ...race,
          predictions: {
            ...race.predictions,
            [selectedUserId]: { ...backfillPrediction }
          }
        };
      }
      return race;
    }));
    setBackfillPrediction({ first: "", second: "", third: "" });
    setSelectedRaceId(null);
    setSelectedUserId(null);
  };

  // Navigation tabs
  const navTabs = [
    { key: "fantasy", label: "Fantasy", icon: "🏁" },
    { key: "ranking", label: "Ranking", icon: "🏆" },
    { key: "history", label: "History", icon: "📊" },
    { key: "rules", label: "Rules", icon: "📜" },
  ];
  if (isAdminLoggedIn) {
    navTabs.push({ key: "admin", label: "Admin", icon: "🛠️" });
  }

  // Initialize client-side data after mount
  useEffect(() => {
    setIsClient(true);
    setUsers(getStoredData(STORAGE_KEYS.USERS, []));
    setRaces(getStoredData(STORAGE_KEYS.RACES, []));
    setCurrentUser(getStoredData(STORAGE_KEYS.CURRENT_USER, null));
    setIsAdminLoggedIn(getStoredData(STORAGE_KEYS.ADMIN_LOGGED_IN, false));
  }, []);

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

  // Persist data to localStorage
  useEffect(() => {
    setStoredData(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    setStoredData(STORAGE_KEYS.RACES, races);
  }, [races]);

  useEffect(() => {
    setStoredData(STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);

  useEffect(() => {
    setStoredData(STORAGE_KEYS.ADMIN_LOGGED_IN, isAdminLoggedIn);
  }, [isAdminLoggedIn]);

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
    // Use a consistent format that doesn't depend on locale
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC' // Ensure consistent timezone
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getUpcomingRace = () => {
    return races.find(race => !race.isCompleted);
  };

  const getCompletedRaces = () => {
    return races.filter(race => race.isCompleted);
  };

  // User management
  const addUser = () => {
    if (newUserUsername.trim() && newUserPassword.trim() && newUserName.trim()) {
      // Check if username already exists - handle users without username field
      const existingUser = users.find(u => 
        u.username && u.username.toLowerCase() === newUserUsername.trim().toLowerCase()
      );
      if (existingUser) {
        alert("Username already exists!");
        return;
      }

      const newUser: User = {
        id: Date.now().toString(),
        username: newUserUsername.trim(),
        name: newUserName.trim(),
        password: newUserPassword.trim(), // In a real app, this should be hashed
        stars: 0,
        racesParticipated: 0
      };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser.id);
      setNewUserName("");
      setNewUserUsername("");
      setNewUserPassword("");
      setIsLoginMode(true);
    } else {
      alert("Please fill in all fields!");
    }
  };

  const loginUser = () => {
    if (loginUsername.trim() && loginPassword.trim()) {
      const user = users.find(u => 
        u.username && u.username.toLowerCase() === loginUsername.trim().toLowerCase() && 
        u.password === loginPassword.trim()
      );
      
      if (user) {
        setCurrentUser(user.id);
        setLoginUsername("");
        setLoginPassword("");
        setShowLoginForm(false);
      } else {
        alert("Invalid username or password!");
      }
    } else {
      alert("Please enter both username and password!");
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setShowLoginForm(false);
  };

  // Migration helper for existing users
  const migrateExistingUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && !user.username) {
      // Create a temporary username for legacy users
      const tempUsername = `user_${user.id.slice(-6)}`;
      const updatedUser = {
        ...user,
        username: tempUsername,
        password: "changeme123" // Temporary password
      };
      
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      setCurrentUser(userId);
      alert(`Welcome back! Your temporary login is:\nUsername: ${tempUsername}\nPassword: changeme123\n\nPlease create a new account with your preferred username.`);
    }
  };

  const handlePick = (driverCode: string) => {
    // Ensure we have a valid prediction object
    const prediction = currentPrediction || { first: "", second: "", third: "" };
    
    // Check if driver is already selected
    const isSelected = prediction.first === driverCode || 
                      prediction.second === driverCode || 
                      prediction.third === driverCode;
    
    if (isSelected) {
      // Remove the driver
      const newPrediction = { ...prediction };
      if (newPrediction.first === driverCode) newPrediction.first = "";
      if (newPrediction.second === driverCode) newPrediction.second = "";
      if (newPrediction.third === driverCode) newPrediction.third = "";
      
      setCurrentPrediction(newPrediction);
    } else {
      // Add the driver to the first empty slot
      const newPrediction = { ...prediction };
      
      if (newPrediction.first === "") {
        newPrediction.first = driverCode;
      } else if (newPrediction.second === "") {
        newPrediction.second = driverCode;
      } else if (newPrediction.third === "") {
        newPrediction.third = driverCode;
      } else {
        // All positions filled, cannot add more drivers
        return;
      }
      
      setCurrentPrediction(newPrediction);
    }
  };

  const submitPrediction = () => {
    if (!currentUser || !currentPrediction || !currentPrediction.first || !currentPrediction.second || !currentPrediction.third) return;
    
    const upcomingRace = getUpcomingRace();
    if (!upcomingRace) return;

    const updatedRaces = races.map(race => {
      if (race.id === upcomingRace.id) {
        return {
          ...race,
          predictions: {
            ...race.predictions,
            [currentUser]: { ...currentPrediction }
          }
        };
      }
      return race;
    });

    setRaces(updatedRaces);
    setIsEditingPrediction(false);
    // Don't clear currentPrediction here - let the useEffect handle it
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

  const addNewRace = () => {
    if (newRace.name && newRace.city && newRace.date) {
      const race: Race = {
        id: Date.now().toString(),
        name: newRace.name,
        city: newRace.city,
        date: newRace.date,
        isCompleted: false,
        predictions: {}
      };
      setRaces(prev => [...prev, race]);
      setNewRace({ name: "", city: "", date: "" });
      setShowAddRace(false);
    }
  };

  const addRaceResults = () => {
    if (!selectedRaceForResults || !raceResults.first || !raceResults.second || !raceResults.third) return;

    const updatedRaces = races.map(race => {
      if (race.id === selectedRaceForResults) {
        // Calculate scores and determine star winners
        const predictions = Object.entries(race.predictions);
        const scores = predictions.map(([userId, prediction]) => ({
          userId,
          score: calculateScore(prediction, raceResults)
        }));

        const maxScore = Math.max(...scores.map(s => s.score));
        const starWinners = scores.filter(s => s.score === maxScore).map(s => s.userId);

        // Update user stars
        const updatedUsers = users.map(user => {
          if (starWinners.includes(user.id)) {
            return { ...user, stars: user.stars + 1, racesParticipated: user.racesParticipated + 1 };
          } else if (race.predictions[user.id]) {
            return { ...user, racesParticipated: user.racesParticipated + 1 };
          }
          return user;
        });

        setUsers(updatedUsers);

        return {
          ...race,
          isCompleted: true,
          results: { ...raceResults },
          starWinners
        };
      }
      return race;
    });

    setRaces(updatedRaces);
    setRaceResults({ first: "", second: "", third: "" });
    setSelectedRaceForResults("");
    setShowAddResults(false);
  };

  // Get current user's prediction for upcoming race
  const getCurrentUserPrediction = () => {
    const upcomingRace = getUpcomingRace();
    if (!upcomingRace || !currentUser) return null;
    return upcomingRace.predictions[currentUser];
  };

  // New helper functions for history
  const getPredictionAccuracy = (prediction: Positions, results: Positions) => {
    return {
      first: prediction.first === results.first,
      second: prediction.second === results.second,
      third: prediction.third === results.third,
      perfectMatch: prediction.first === results.first && 
                   prediction.second === results.second && 
                   prediction.third === results.third
    };
  };

  const getUserPredictionHistory = (userId: string): PredictionHistory[] => {
    if (!userId) return [];
    
    return getCompletedRaces()
      .filter(race => race.predictions[userId])
      .map(race => {
        const prediction = race.predictions[userId];
        const accuracy = race.results ? getPredictionAccuracy(prediction, race.results) : {
          first: false,
          second: false,
          third: false,
          perfectMatch: false
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

  const calculateUserStats = (history: PredictionHistory[]): UserStats => {
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

    // Calculate accuracy by position
    const accuracyByPosition = {
      first: history.filter(h => h.accuracy.first).length,
      second: history.filter(h => h.accuracy.second).length,
      third: history.filter(h => h.accuracy.third).length
    };

    // Calculate favorite drivers
    const driverStats: { [key: string]: { predicted: number; correct: number } } = {};
    
    history.forEach(h => {
      [h.prediction.first, h.prediction.second, h.prediction.third].forEach(driverCode => {
        if (!driverStats[driverCode]) {
          driverStats[driverCode] = { predicted: 0, correct: 0 };
        }
        driverStats[driverCode].predicted++;
        
        if (h.actualResults && 
            (h.actualResults.first === driverCode || 
             h.actualResults.second === driverCode || 
             h.actualResults.third === driverCode)) {
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

  const filterHistory = (history: PredictionHistory[], filters: HistoryFilter): PredictionHistory[] => {
    let filtered = [...history];

    // Filter by date range
    if (filters.dateRange !== "all") {
      const now = new Date();
      const limit = parseInt(filters.dateRange.replace("last", ""));
      const cutoffDate = new Date(now.getTime() - (limit * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(h => new Date(h.raceDate) >= cutoffDate);
    }

    // Filter by race type (city)
    if (filters.raceType !== "all") {
      filtered = filtered.filter(h => h.raceCity === filters.raceType);
    }

    // Filter by performance
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

    // Filter by driver
    if (filters.driver !== "all") {
      filtered = filtered.filter(h => 
        h.prediction.first === filters.driver ||
        h.prediction.second === filters.driver ||
        h.prediction.third === filters.driver
      );
    }

    return filtered;
  };

  // Render functions
  const renderRankingTab = () => (
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

      {users.length === 0 ? (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No users yet. Start by making predictions!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users
            .sort((a, b) => b.stars - a.stars || b.racesParticipated - a.racesParticipated)
            .map((user, index) => (
              <Card key={user.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">
                          {user.username ? `@${user.username}` : "Legacy User"} • {user.racesParticipated} races • {user.stars} ⭐
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: user.stars }, (_, i) => (
                        <Star key={i} className="w-5 h-5 text-red-600 fill-current" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Random Driver-Car Pair */}
      <DriverCarPair pair={tabPairs["ranking"] || null} />
    </div>
  );

  const renderFantasyTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">🚗 My Fantasy</h2>
        {!isAdminLoggedIn && (
          <Button onClick={() => setShowAdminLogin(true)} variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50">
            <LogIn className="w-4 h-4 mr-2" />
            Admin
          </Button>
        )}
      </div>

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

            {/* Migration notice for existing users */}
            {users.length > 0 && users.some(u => !u.username) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Existing Users:</strong> We've updated our login system. If you have an existing account, 
                  you'll need to create a new account with a username and password.
                </p>
              </div>
            )}

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
                  <h3 className="font-semibold text-gray-900">Welcome, {users.find(u => u.id === currentUser)?.name}!</h3>
                  <p className="text-sm text-gray-600">
                    {users.find(u => u.id === currentUser)?.username ? 
                      `@${users.find(u => u.id === currentUser)?.username}` : 
                      "Legacy User"
                    } • {users.find(u => u.id === currentUser)?.stars} ⭐ • {users.find(u => u.id === currentUser)?.racesParticipated} races
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={logoutUser} className="border-red-600 text-red-600 hover:bg-red-50">
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

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
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          Edit Prediction
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
                                  <span className={`text-sm font-bold text-gray-900 ${driver?.img ? 'hidden' : ''}`}>
                                    {code}
                                  </span>
                                </div>
                                <div className="text-sm font-bold text-gray-900">{code}</div>
                                <div className="text-xs text-gray-600">{driver?.name || getDriverName(code)}</div>
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
                      <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
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
                              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all border ${
                                isSelected
                                  ? "border-red-600 bg-red-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePick(driver.code);
                              }}
                              onMouseDown={(e) => {
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
                                      // Fallback to driver code if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <span className={`text-sm font-bold text-gray-900 ${driver.img ? 'hidden' : ''}`}>
                                  {driver.code}
                                </span>
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
                          disabled={!currentPrediction || !currentPrediction.first || !currentPrediction.second || !currentPrediction.third}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
                        >
                          {isEditingPrediction ? "Update Prediction" : "Submit Prediction"}
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
                    const raceUserPrediction = race.predictions[currentUser];
                    const isStarWinner = race.starWinners?.includes(currentUser);
                    
                    return (
                      <div key={race.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{race.name}</h4>
                            <p className="text-sm text-gray-600">{race.city} • {formatDate(race.date)}</p>
                          </div>
                          <div className="flex flex-row items-end gap-4 min-w-[180px]">
                            {race.results && ["first", "second", "third"].map((pos, idx) => {
                              const code = race.results![pos as keyof Positions];
                              const driver = drivers.find(d => d.code === code);
                              const labels = ["1st", "2nd", "3rd"];
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
                                  <span className="text-xs text-gray-500 mt-1">{labels[idx]}</span>
                                </div>
                              );
                            })}
                          </div>
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
                                      {labels[pos as keyof typeof labels]}: {code} - {getDriverName(code)}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-green-400 mb-2">Actual Results</h5>
                              <div className="space-y-1">
                                {Object.entries(race.results).map(([pos, code]) => {
                                  const labels = { first: "1st", second: "2nd", third: "3rd" };
                                  return (
                                    <div key={pos} className="text-sm text-gray-600">
                                      {labels[pos as keyof typeof labels]}: {code} - {getDriverName(code)}
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
  );

  const renderRulesTab = () => (
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
              <li>• <strong>Perfect Match:</strong> All 3 positions correct = 30 points</li>
              <li>• <strong>Position Match:</strong> Each correct position = 10 points</li>
              <li>• <strong>Driver in Top 3:</strong> Driver in top 3 but wrong position = 3 points</li>
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
  );

  const renderHistoryTab = () => {
    if (!currentUser) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">📊 Prediction History</h2>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Please log in to view your prediction history.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const userHistory = getUserPredictionHistory(currentUser);
    const userStats = calculateUserStats(userHistory);
    const filteredHistory = filterHistory(userHistory, historyFilter);

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">📊 Prediction History</h2>
        
        {/* Statistics Cards */}
        {userHistory.length > 0 && (
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
        )}

        {/* Filters */}
        {userHistory.length > 0 && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-gray-900">Filters</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select
                  value={historyFilter.dateRange}
                  onChange={(e) => setHistoryFilter(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600"
                >
                  <option value="all">All Time</option>
                  <option value="last3">Last 3 Races</option>
                  <option value="last5">Last 5 Races</option>
                  <option value="last10">Last 10 Races</option>
                </select>
                
                <select
                  value={historyFilter.performance}
                  onChange={(e) => setHistoryFilter(prev => ({ ...prev, performance: e.target.value as any }))}
                  className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600"
                >
                  <option value="all">All Performance</option>
                  <option value="high">High Score (20+)</option>
                  <option value="low">Low Score (&lt;10)</option>
                  <option value="perfect">Perfect Matches</option>
                </select>
                
                <select
                  value={historyFilter.raceType}
                  onChange={(e) => setHistoryFilter(prev => ({ ...prev, raceType: e.target.value }))}
                  className="p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600"
                >
                  <option value="all">All Races</option>
                  {Array.from(new Set(userHistory.map(h => h.raceCity))).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                
                <select
                  value={historyFilter.driver}
                  onChange={(e) => setHistoryFilter(prev => ({ ...prev, driver: e.target.value }))}
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
        )}

        {/* Race History List */}
        {userHistory.length === 0 ? (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">No prediction history yet. Start making predictions to see your history here!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((historyItem) => (
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
                  
                  {historyItem.actualResults && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-semibold text-blue-600 mb-2">Your Prediction</h5>
                        <div className="space-y-1">
                          {Object.entries(historyItem.prediction).map(([pos, code]) => {
                            const labels = { first: "1st", second: "2nd", third: "3rd" };
                            const isCorrect = historyItem.accuracy[pos as keyof typeof historyItem.accuracy];
                            return (
                              <div key={pos} className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {labels[pos as keyof typeof labels]}: {code} - {getDriverName(code)} {isCorrect ? '✅' : '❌'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-green-600 mb-2">Actual Results</h5>
                        <div className="space-y-1">
                          {Object.entries(historyItem.actualResults).map(([pos, code]) => {
                            const labels = { first: "1st", second: "2nd", third: "3rd" };
                            return (
                              <div key={pos} className="text-sm text-gray-600">
                                {labels[pos as keyof typeof labels]}: {code} - {getDriverName(code)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Random Driver-Car Pair */}
        <DriverCarPair pair={tabPairs["history"] || null} />
      </div>
    );
  };

  // Admin Tab main entry point
  const renderAdminTab = () => {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">🛠️ Admin Panel</h2>
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
                <Input value={newRace.city} onChange={e => setNewRace(prev => ({ ...prev, city: e.target.value }))} placeholder="City (e.g., Spielberg)" />
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
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    📤 Export CSV
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
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    📥 Import CSV
                  </Button>
                </div>
              </div>
              <form className="space-y-3" onSubmit={e => { e.preventDefault(); addRaceResults(); }}>
                <select value={selectedRaceForResults} onChange={e => setSelectedRaceForResults(e.target.value)} className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600">
                  <option value="">Select a race</option>
                  {races.filter(race => !race.isCompleted).map(race => (
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
                      {races.filter(race => race.isCompleted && race.results).map(race => (
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
              <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleBackfillPrediction(); }}>
                <select className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600" value={selectedUserId || ""} onChange={e => setSelectedUserId(e.target.value)}>
                  <option value="">Select User</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.name})</option>)}
                </select>
                <select className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900 text-sm focus:border-red-600 focus:ring-red-600" value={selectedRaceId || ""} onChange={e => setSelectedRaceId(e.target.value)}>
                  <option value="">Select Race</option>
                  {races.filter(r => r.isCompleted && selectedUserId && !r.predictions[selectedUserId]).map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({formatDate(r.date)})</option>
                  ))}
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
                  <Button type="submit" className="flex-1 bg-[#E10800] text-white hover:bg-red-800 font-medium">Save</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Admin modals
  const renderAdminLogin = () => (
    <div className="fixed inset-0 bg-[#E10800] bg-opacity-100 flex items-center justify-center p-4 z-50">
      <Card className="bg-white w-full max-w-md">
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
    </div>
  );

  const renderAddRaceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-white w-full max-w-md">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">🏁 Add New Race</h3>
          <div className="space-y-3">
            <Input
              value={newRace.name}
              onChange={(e) => setNewRace(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Race Name (e.g., Austrian Grand Prix)"
              className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600 placeholder-gray-500"
            />
            <Input
              value={newRace.city}
              onChange={(e) => setNewRace(prev => ({ ...prev, city: e.target.value }))}
              placeholder="City (e.g., Spielberg)"
              className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600 placeholder-gray-500"
            />
            <Input
              type="date"
              value={newRace.date}
              onChange={(e) => setNewRace(prev => ({ ...prev, date: e.target.value }))}
              className="text-gray-900 bg-white border-gray-300 focus:border-red-600 focus:ring-red-600"
            />
            <div className="flex gap-2">
              <Button onClick={addNewRace} className="flex-1">
                Add Race
              </Button>
              <Button onClick={() => setShowAddRace(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAddResultsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-white w-full max-w-md">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">🏆 Add Race Results</h3>
          <div className="space-y-3">
            <select
              value={selectedRaceForResults}
              onChange={(e) => setSelectedRaceForResults(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900"
            >
              <option value="">Select a race</option>
              {races.filter(race => !race.isCompleted).map(race => (
                <option key={race.id} value={race.id}>
                  {race.name} - {formatDate(race.date)}
                </option>
              ))}
            </select>
            
            {selectedRaceForResults && (
              <div className="space-y-3">
                <h4 className="font-semibold">Select Top 3 Finishers:</h4>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {drivers.map((driver) => (
                    <div
                      key={driver.code}
                      className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-all border ${
                        Object.values(raceResults).includes(driver.code)
                          ? "border-red-600 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      onClick={() => {
                        const order = ["first", "second", "third"];
                        const alreadySelected = Object.values(raceResults).includes(driver.code);
                        
                        if (alreadySelected) {
                          setRaceResults(prev => {
                            const updated = { ...prev };
                            for (let key in updated) {
                              if (updated[key as keyof Positions] === driver.code) {
                                updated[key as keyof Positions] = "";
                              }
                            }
                            return updated;
                          });
                        } else {
                          const nextSlot = order.find(pos => raceResults[pos as keyof Positions] === "");
                          if (nextSlot) {
                            setRaceResults(prev => ({ ...prev, [nextSlot]: driver.code }));
                          }
                        }
                      }}
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-900">{driver.code}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{driver.name}</div>
                        <div className="text-xs text-gray-600">{driver.team}</div>
                      </div>
                      {(() => {
                        const pos = Object.entries(raceResults).find(([_, code]) => code === driver.code);
                        if (pos) {
                          const labels = { first: "1st 🥇", second: "2nd 🥈", third: "3rd 🥉" };
                          return <div className="text-red-600 font-bold text-sm">{labels[pos[0] as keyof typeof labels]}</div>;
                        }
                        return null;
                      })()}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={addRaceResults}
                    disabled={!raceResults.first || !raceResults.second || !raceResults.third}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    Submit Results
                  </Button>
                  <Button onClick={() => setShowAddResults(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Remove Race
  const handleDeleteRace = (raceId: string) => {
    setRaces(prev => prev.filter(race => race.id !== raceId));
  };

  // Remove Results
  const handleRemoveResults = (raceId: string) => {
    setRaces(prev => prev.map(race => {
      if (race.id === raceId) {
        // Remove results and mark as not completed
        const { results, starWinners, ...rest } = race;
        return { ...rest, isCompleted: false };
      }
      return race;
    }));
    // Optionally, you may want to update user stars here if you want to revert star awards
  };

  // Export/Import functions for race results
  const exportResultsToCSV = () => {
    const completedRaces = races.filter(race => race.isCompleted && race.results);
    
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
    reader.onload = (e) => {
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
        // Merge with existing races, replacing any with same ID
        const existingRaceIds = new Set(races.map(r => r.id));
        const newRaces = races.filter(r => !importedRaces.some(ir => ir.id === r.id));
        setRaces([...newRaces, ...importedRaces]);
        console.log("Successfully imported races:", importedRaces.length);
        alert(`Successfully imported ${importedRaces.length} race results.`);
      }

      // Reset file input
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Show loading state until client-side data is loaded */}
      {!isClient && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading F1 Punezolanos Fantasy...</p>
          </div>
        </div>
      )}

      {/* Main app content - only render after client initialization */}
      {isClient && (
        <>
          {/* Header */}
          <header className="bg-[#E10800] p-4 border-b border-red-800 shadow-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-white" />
                <h1 className="text-xl font-bold text-white">F1 Punezolanos Fantasy</h1>
              </div>
              {isAdminLoggedIn && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white font-medium">Admin Mode</span>
                  <Button 
                    onClick={logoutAdmin} 
                    size="sm" 
                    className="bg-transparent border border-white text-white hover:bg-white hover:text-[#E10800] transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <div className="p-4 pb-[180px] bg-gray-50">
            {activeTab === "ranking" && renderRankingTab()}
            {activeTab === "fantasy" && renderFantasyTab()}
            {activeTab === "rules" && renderRulesTab()}
            {activeTab === "history" && renderHistoryTab()}
            {activeTab === "admin" && isAdminLoggedIn && renderAdminTab()}
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

          {/* Modals */}
          {showAdminLogin && renderAdminLogin()}
          {showAddRace && renderAddRaceModal()}
          {showAddResults && renderAddResultsModal()}
        </>
      )}
    </main>
  );
}