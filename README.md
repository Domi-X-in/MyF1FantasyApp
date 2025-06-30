# My F1 Fantasy App

A Next.js application for F1 fantasy racing where users can pick their top 3 drivers for race predictions and view all participants' selections.

## Features

- Interactive driver selection interface
- Real-time position assignment (1st 🥇, 2nd 🥈, 3rd 🥉)
- Beautiful dark theme UI with F1 branding
- Smooth animations using Framer Motion
- Responsive design for mobile and desktop
- **NEW**: View all users' picks after submission
- **NEW**: Multiple user support with timestamps
- **NEW**: Option to make additional picks

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom shadcn/ui inspired components
- **Animations**: Framer Motion
- **State Management**: React useState

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. Enter your name in the input field
2. Click on drivers to select your top 3 picks in order
3. Selected drivers will be highlighted with yellow borders
4. Click "Confirm Picks" to see your final selection
5. Your picks will be displayed with smooth animations
6. **NEW**: Click "View All Picks" to see everyone's selections
7. **NEW**: Click "Make Another Pick" to submit picks for another user

## Project Structure

```
my-f1-fantasy-app/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles and CSS variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── button.tsx    # Button component
│   │   ├── card.tsx      # Card components
│   │   └── input.tsx     # Input component
│   └── F1PickerApp.tsx   # Main F1 picker component
├── lib/                  # Utility functions
│   └── utils.ts          # CSS class utilities
└── public/               # Static assets
    └── drivers/          # Driver images (placeholder)
```

## Available Drivers (Updated 2025 Season)

The app includes 20 current F1 drivers:

### Red Bull Racing
- Max Verstappen (VER)
- Yuki Tsunoda (TSU)

### Racing Bulls
- Liam Lawson (LAW)
- Isack Hadjar (HAD)

### Ferrari
- Charles Leclerc (LEC)
- Lewis Hamilton (HAM)

### McLaren
- Lando Norris (NOR)
- Oscar Piastri (PIA)

### Mercedes
- George Russell (RUS)
- Andrea Kimi Antonelli (ANT)

### Aston Martin
- Fernando Alonso (ALO)
- Lance Stroll (STR)

### Alpine
- Pierre Gasly (GAS)
- Franco Colapinto (COL)

### Haas
- Oliver Bearman (BEA)
- Esteban Ocon (OCO)

### Sauber
- Nico Hülkenberg (HUL)
- Gabriel Bortoleto (BOR)

### Williams
- Alexander Albon (ALB)
- Carlos Sainz (SAI)

## Development

- The app uses TypeScript for type safety
- Tailwind CSS for styling with custom CSS variables
- Framer Motion for smooth animations
- Custom UI components built with class-variance-authority
- Local state management for multi-user picks

## Future Enhancements

- Add real driver images
- Implement backend for persistent data storage
- Add race results comparison and scoring
- User authentication and profiles
- Leaderboards and statistics
- Multiple race support
- Real-time updates for live race predictions
