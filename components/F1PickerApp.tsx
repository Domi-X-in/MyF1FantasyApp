"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";

const drivers = [
    {
      code: "VER",
      name: "Max Verstappen",
      team: "Red Bull Racing",
      img: "/drivers/verstappen.png",
    },
    {
      code: "TSU",
      name: "Yuki Tsunoda",
      team: "Red Bull Racing",
      img: "/drivers/tsunoda.png",
    },
    {
      code: "LAW",
      name: "Liam Lawson",
      team: "Racing Bulls",
      img: "/drivers/lawson.png",
    },
    {
      code: "HAD",
      name: "Isack Hadjar",
      team: "Racing Bulls",
      img: "/drivers/hadjar.png",
    },
    {
      code: "LEC",
      name: "Charles Leclerc",
      team: "Ferrari",
      img: "/drivers/leclerc.png",
    },
    {
      code: "HAM",
      name: "Lewis Hamilton",
      team: "Ferrari",
      img: "/drivers/hamilton.png",
    },
    {
      code: "NOR",
      name: "Lando Norris",
      team: "McLaren",
      img: "/drivers/norris.png",
    },
    {
      code: "PIA",
      name: "Oscar Piastri",
      team: "McLaren",
      img: "/drivers/piastri.png",
    },
    {
      code: "RUS",
      name: "George Russell",
      team: "Mercedes",
      img: "/drivers/russell.png",
    },
    {
      code: "ANT",
      name: "Andrea Kimi Antonelli",
      team: "Mercedes",
      img: "/drivers/antonelli.png",
    },
    {
      code: "ALO",
      name: "Fernando Alonso",
      team: "Aston Martin",
      img: "/drivers/alonso.png",
    },
    {
      code: "STR",
      name: "Lance Stroll",
      team: "Aston Martin",
      img: "/drivers/stroll.png",
    },
    {
      code: "GAS",
      name: "Pierre Gasly",
      team: "Alpine",
      img: "/drivers/gasly.png",
    },
    {
      code: "COL",
      name: "Franco Colapinto",
      team: "Alpine",
      img: "/drivers/colapinto.png",
    },
    {
      code: "BEA",
      name: "Oliver Bearman",
      team: "Haas",
      img: "/drivers/bearman.png",
    },
    {
      code: "OCO",
      name: "Esteban Ocon",
      team: "Haas",
      img: "/drivers/ocon.png",
    },
    {
      code: "HUL",
      name: "Nico Hülkenberg",
      team: "Sauber",
      img: "/drivers/hulkenberg.png",
    },
    {
      code: "BOR",
      name: "Gabriel Bortoleto",
      team: "Sauber",
      img: "/drivers/bortoleto.png",
    },
    {
      code: "ALB",
      name: "Alexander Albon",
      team: "Williams",
      img: "/drivers/albon.png",
    },
    {
      code: "SAI",
      name: "Carlos Sainz",
      team: "Williams",
      img: "/drivers/sainz.png",
    },
  ];

interface Positions {
    first: string;
    second: string;
    third: string;
}

interface UserPick {
    id: string;
    name: string;
    positions: Positions;
    timestamp: Date;
}

export default function F1PickerApp() {
    const [name, setName] = useState("");
    const [positions, setPositions] = useState<Positions>({ first: "", second: "", third: "" });
    const [submitted, setSubmitted] = useState(false);
    const [allUserPicks, setAllUserPicks] = useState<UserPick[]>([]);
    const [showAllPicks, setShowAllPicks] = useState(false);

    const handlePick = (driverCode: string) => {
        const order = ["first", "second", "third"];
        const alreadySelected = Object.values(positions).includes(driverCode);
        if (alreadySelected) {
            setPositions((prev) => {
                const updated = { ...prev };
                for (let key in updated) {
                    if (updated[key as keyof Positions] === driverCode) updated[key as keyof Positions] = "";
                }
                return updated;
            });
        } else {
            const nextSlot = order.find((pos) => positions[pos as keyof Positions] === "");
            if (nextSlot) {
                setPositions((prev) => ({ ...prev, [nextSlot]: driverCode }));
            }
        }
    };

    const handleSubmit = () => {
        if (name && positions.first && positions.second && positions.third) {
            const newUserPick: UserPick = {
                id: Date.now().toString(),
                name,
                positions: { ...positions },
                timestamp: new Date(),
            };
            
            setAllUserPicks(prev => [...prev, newUserPick]);
            setSubmitted(true);
        }
    };

    const handleNewPick = () => {
        setName("");
        setPositions({ first: "", second: "", third: "" });
        setSubmitted(false);
    };

    const getPosition = (code: string) => {
        for (let [pos, val] of Object.entries(positions)) {
            if (val === code) {
                const positionMap = {
                    first: "1st 🥇",
                    second: "2nd 🥈", 
                    third: "3rd 🥉"
                };
                return positionMap[pos as keyof typeof positionMap] || "";
            }
        }
        return "";
    };

    const getDriverName = (code: string) => {
        const driver = drivers.find(d => d.code === code);
        return driver ? driver.name : code;
    };

    const getDriverTeam = (code: string) => {
        const driver = drivers.find(d => d.code === code);
        return driver ? driver.team : "";
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    return (
        <main className="min-h-screen bg-neutral-900 text-white p-4">
            <header className="flex justify-between items-center mb-4">
                <div className="text-2xl font-bold text-red-500">F1 75</div>
                <div className="text-sm">Latest</div>
            </header>

            <section className="mb-4">
                <h2 className="text-lg font-semibold">Austria - Red Bull Ring, Spielberg</h2>
                <p className="text-sm">Race | 15:00 | 29 Jun</p>
            </section>

            {!submitted ? (
                <section className="bg-neutral-800 p-4 rounded-xl">
                    <p className="mb-2">What is your name?</p>
                    <Input
                        className="mb-4 text-black"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                    />

                    <p className="mb-2">Pick your top 3 drivers in order:</p>
                    <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto">
                        {drivers.map((driver) => (
                            <div
                                key={driver.code}
                                className={`flex items-center space-x-4 p-2 rounded-xl cursor-pointer transition-all border ${Object.values(positions).includes(driver.code) ? "border-yellow-400 bg-yellow-900" : "border-neutral-700"}`}
                                onClick={() => handlePick(driver.code)}
                            >
                                <div className="w-10 h-10 bg-neutral-600 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">{driver.code}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold">{driver.code} - {driver.name}</div>
                                    <div className="text-sm text-neutral-400">{driver.team}</div>
                                </div>
                                {getPosition(driver.code) && (
                                    <div className="text-yellow-300 font-bold">{getPosition(driver.code)}</div>
                                )}
                            </div>
                        ))}
                    </div>

                    <Button className="mt-4 w-full" onClick={handleSubmit}>
                        Confirm Picks
                    </Button>
                </section>
            ) : (
                <div className="space-y-6">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-neutral-800 p-6 rounded-xl"
                    >
                        <h2 className="text-xl font-bold text-yellow-400 mb-2">🏁 Hello {name}!</h2>
                        <p className="mb-4">Your picks:</p>
                        <ul className="space-y-2">
                            {Object.entries(positions).map(([pos, code]) => {
                                const driver = drivers.find((d) => d.code === code);
                                if (!driver) return null;
                                const positionLabels = {
                                    first: "1st 🥇",
                                    second: "2nd 🥈",
                                    third: "3rd 🥉"
                                };
                                return (
                                    <li key={code} className="flex items-center space-x-3">
                                        <span className="w-20 font-bold">{positionLabels[pos as keyof typeof positionLabels]}</span>
                                        <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-bold">{driver.code}</span>
                                        </div>
                                        <span>{driver.name}</span>
                                    </li>
                                );
                            })}
                        </ul>
                        
                        <div className="flex gap-2 mt-6">
                            <Button onClick={handleNewPick} variant="outline" className="flex-1">
                                Make Another Pick
                            </Button>
                            <Button onClick={() => setShowAllPicks(!showAllPicks)} className="flex-1">
                                {showAllPicks ? "Hide All Picks" : "View All Picks"}
                            </Button>
                        </div>
                    </motion.section>

                    {showAllPicks && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-neutral-800 p-6 rounded-xl"
                        >
                            <h3 className="text-lg font-bold text-blue-400 mb-4">All Users' Picks ({allUserPicks.length})</h3>
                            
                            {allUserPicks.length === 0 ? (
                                <p className="text-neutral-400">No picks submitted yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {allUserPicks.map((userPick) => (
                                        <Card key={userPick.id} className="bg-neutral-700 border-neutral-600">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-semibold text-lg">{userPick.name}</h4>
                                                    <span className="text-xs text-neutral-400">
                                                        {formatTime(userPick.timestamp)}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 gap-3">
                                                    {Object.entries(userPick.positions).map(([pos, code]) => {
                                                        const positionLabels = {
                                                            first: "1st 🥇",
                                                            second: "2nd 🥈",
                                                            third: "3rd 🥉"
                                                        };
                                                        return (
                                                            <div key={pos} className="text-center">
                                                                <div className="text-xs text-neutral-400 mb-1">
                                                                    {positionLabels[pos as keyof typeof positionLabels]}
                                                                </div>
                                                                <div className="bg-neutral-600 rounded-lg p-2">
                                                                    <div className="text-sm font-bold mb-1">{code}</div>
                                                                    <div className="text-xs text-neutral-300">
                                                                        {getDriverName(code)}
                                                                    </div>
                                                                    <div className="text-xs text-neutral-400">
                                                                        {getDriverTeam(code)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    )}
                </div>
            )}
        </main>
    );
} 