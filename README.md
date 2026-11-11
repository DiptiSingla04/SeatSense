# 🪑 SeatSense – Smart Campus Space & Seat Management System

> **Solving Campus Seat Availability & Eliminating Phantom Reservations.**

SeatSense is a smart, real-time seat management system for university libraries and seating areas like activity space . Unlike normal booking tools, it focuses on **preventing seat misuse** using smart auto-release rules and QR check-ins.

## 🎯 The Core Problem
1. **Seat Availability:** Student faces problems while finidng seat in sitting zone that wastes time.
2. **Seat Misuse:** some students reserve seats but dont use it for long durations

## 🔑 Key Features
- **Live Seat Map** - easier to find unoccupied seat
- **QR Check-in** - 10 min scan to ensure that seat is occupied or else marked as unoccupied
- **Auto-Release** 
- **Break Mode** - 15 min for relaxation , seat remains occupied
- **Waitlist System** 
- **Usage Analytics** 

## ⚙️ Smart Auto-Release Rules
1. after booking a seat a **10-minute** countdown start.
2. student is supposed to scan qr available on desk.
3. to take break **15-min Break Mode** shall be turned on.
4. Check-in miss or not arriving after break results in auto release of seat.

## 🛠️ Technology Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase
- **Database:** PostgreSQL
- **Auth:** Supabase Auth
- **Live Updates:** Supabase Realtime

## ⚡ How to Run Locally
```bash
git clone https://github.com/tera-naam/seatsense.git
cd seatsense
npm install
npm run dev