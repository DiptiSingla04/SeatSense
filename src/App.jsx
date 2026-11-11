import "./App.css";
import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  QrCode, 
  Clock, 
  Coffee, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  User, 
  ChevronRight,
  Sparkles,
  BarChart3,
  ShieldAlert
} from 'lucide-react';

// --- INITIAL SEAT LAYOUT MATRIX (16 Seats) ---
const INITIAL_SEATS = [
  { id: 'A1', status: 'available', floor: '1st Floor', zone: 'Quiet Zone' },
  { id: 'A2', status: 'available', floor: '1st Floor', zone: 'Quiet Zone' },
  { id: 'A3', status: 'occupied', reservedBy: 'Student #402', floor: '1st Floor', zone: 'Quiet Zone' },
  { id: 'A4', status: 'occupied', reservedBy: 'Student #189', floor: '1st Floor', zone: 'Quiet Zone' },
  { id: 'B1', status: 'available', floor: '1st Floor', zone: 'Collaborative' },
  { id: 'B2', status: 'reserved', reservedBy: 'Pending Arrival', windowExpiry: 480, floor: '1st Floor', zone: 'Collaborative' },
  { id: 'B3', status: 'available', floor: '1st Floor', zone: 'Collaborative' },
  { id: 'B4', status: 'unavailable', floor: '1st Floor', zone: 'Maintenance' },
  { id: 'C1', status: 'available', floor: '2nd Floor', zone: 'Silent Study' },
  { id: 'C2', status: 'break', reservedBy: 'Student #301', breakExpiry: 720, floor: '2nd Floor', zone: 'Silent Study' },
  { id: 'C3', status: 'available', floor: '2nd Floor', zone: 'Silent Study' },
  { id: 'C4', status: 'available', floor: '2nd Floor', zone: 'Silent Study' },
  { id: 'D1', status: 'occupied', reservedBy: 'Student #512', floor: '2nd Floor', zone: 'Tech Hub' },
  { id: 'D2', status: 'occupied', reservedBy: 'Student #204', floor: '2nd Floor', zone: 'Tech Hub' },
  { id: 'D3', status: 'available', floor: '2nd Floor', zone: 'Tech Hub' },
  { id: 'D4', status: 'available', floor: '2nd Floor', zone: 'Tech Hub' },
];

export default function App() {
  const [seats, setSeats] = useState(INITIAL_SEATS);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [activeSession, setActiveSession] = useState(null); // { seatId, status: 'RESERVED' | 'OCCUPIED' | 'BREAK', timer: number }
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'admin'
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [notification, setNotification] = useState(null);

  // Auto-Release Timer logic for Active Sessions & System Timers
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Update active session timers
      setActiveSession((prev) => {
        if (!prev) return null;
        if (prev.timer <= 1) {
          // Time expired! Auto-release seat
          handleAutoRelease(prev.seatId, prev.status);
          return null;
        }
        return { ...prev, timer: prev.timer - 1 };
      });

      // 2. Decrement mock timers for non-user seats (simulating real-time auto-release)
      setSeats((prevSeats) =>
        prevSeats.map((seat) => {
          if (seat.status === 'reserved' && seat.windowExpiry > 0) {
            if (seat.windowExpiry <= 1) {
              return { ...seat, status: 'available', reservedBy: null, windowExpiry: null };
            }
            return { ...seat, windowExpiry: seat.windowExpiry - 1 };
          }
          if (seat.status === 'break' && seat.breakExpiry > 0) {
            if (seat.breakExpiry <= 1) {
              return { ...seat, status: 'available', reservedBy: null, breakExpiry: null };
            }
            return { ...seat, breakExpiry: seat.breakExpiry - 1 };
          }
          return seat;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAutoRelease = (seatId, reasonStatus) => {
    setSeats((prev) =>
      prev.map((s) => (s.id === seatId ? { ...s, status: 'available', reservedBy: null } : s))
    );
    const msg =
      reasonStatus === 'RESERVED'
        ? `10-min check-in window expired for Seat ${seatId}. Seat released.`
        : `Break timer expired for Seat ${seatId}. Seat auto-released!`;
    showToast(msg, 'warning');
  };

  // Student Actions
  const reserveSeat = (seat) => {
    if (activeSession) {
      showToast('You already have an active reservation or session.', 'warning');
      return;
    }
    if (seat.status !== 'available') return;

    const windowTime = 600; // 10 minutes (600 seconds)
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seat.id
          ? { ...s, status: 'reserved', reservedBy: 'You', windowExpiry: windowTime }
          : s
      )
    );
    setActiveSession({ seatId: seat.id, status: 'RESERVED', timer: windowTime });
    setSelectedSeat(null);
    showToast(`Seat ${seat.id} reserved! Scan QR at desk within 10 mins to check in.`, 'success');
  };

  const handleQRCheckIn = () => {
    if (!activeSession || activeSession.status !== 'RESERVED') {
      showToast('No pending reservation to check into.', 'warning');
      return;
    }

    if (qrInput.trim().toUpperCase() === activeSession.seatId) {
      setSeats((prev) =>
        prev.map((s) =>
          s.id === activeSession.seatId
            ? { ...s, status: 'occupied', reservedBy: 'You', windowExpiry: null }
            : s
        )
      );
      setActiveSession({ seatId: activeSession.seatId, status: 'OCCUPIED', timer: null });
      setScanModalOpen(false);
      setQrInput('');
      showToast(`Checked in successfully to Seat ${activeSession.seatId}!`, 'success');
    } else {
      showToast('Invalid QR Code. Please scan the correct QR code on your desk.', 'error');
    }
  };

  const startBreak = () => {
    if (!activeSession || activeSession.status !== 'OCCUPIED') return;
    const breakTime = 900; // 15 minutes (900 seconds)
    setSeats((prev) =>
      prev.map((s) =>
        s.id === activeSession.seatId
          ? { ...s, status: 'break', reservedBy: 'You (On Break)', breakExpiry: breakTime }
          : s
      )
    );
    setActiveSession({ seatId: activeSession.seatId, status: 'BREAK', timer: breakTime });
    showToast('Break mode active. Return and end break within 15 mins.', 'info');
  };

  const endBreak = () => {
    if (!activeSession || activeSession.status !== 'BREAK') return;
    setSeats((prev) =>
      prev.map((s) =>
        s.id === activeSession.seatId
          ? { ...s, status: 'occupied', reservedBy: 'You', breakExpiry: null }
          : s
      )
    );
    setActiveSession({ seatId: activeSession.seatId, status: 'OCCUPIED', timer: null });
    showToast('Welcome back! Session restored to active.', 'success');
  };

  const endSession = () => {
    if (!activeSession) return;
    setSeats((prev) =>
      prev.map((s) =>
        s.id === activeSession.seatId
          ? { ...s, status: 'available', reservedBy: null, windowExpiry: null, breakExpiry: null }
          : s
      )
    );
    setActiveSession(null);
    showToast('Seat released. Thank you for using SeatSense!', 'info');
  };

  const formatTime = (seconds) => {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Smart Recommendation Feature
  const availableCount = seats.filter((s) => s.status === 'available').length;
  const isMainLibraryCrowded = availableCount <= 3;
  const recommendedZone = isMainLibraryCrowded ? 'Activity Center (2nd Floor)' : 'Main Quiet Zone';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-all border ${
            notification.type === 'error'
              ? 'bg-red-900/90 border-red-500 text-red-100'
              : notification.type === 'warning'
              ? 'bg-amber-900/90 border-amber-500 text-amber-100'
              : notification.type === 'success'
              ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100'
              : 'bg-blue-900/90 border-blue-500 text-blue-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
            <MapPin className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              SeatSense
            </h1>
            <p className="text-xs text-slate-400">Campus Space & Anti-Misuse System</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'map' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Map
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'admin' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Admin Dashboard
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'map' ? (
          <>
            {/* Left Column: Interactive Seat Grid (2 Columns wide) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Smart Recommendation Banner */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Smart Recommendation</h4>
                  <p className="text-sm text-slate-200 mt-0.5">
                    {isMainLibraryCrowded ? (
                      <>
                        Main Library is <span className="text-amber-400 font-medium">high capacity</span>. We suggest checking seats at <span className="text-emerald-400 font-semibold">{recommendedZone}</span>.
                      </>
                    ) : (
                      <>
                        Ample seats available! Recommended zone for quiet study: <span className="text-emerald-400 font-semibold">{recommendedZone}</span>.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-around text-xs gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400"></span>
                  <span className="text-slate-300">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-400 animate-pulse"></span>
                  <span className="text-slate-300">Reserved (10m Check-in Window)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 border border-red-400"></span>
                  <span className="text-slate-300">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-400"></span>
                  <span className="text-slate-300">On Break (15m Max)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600"></span>
                  <span className="text-slate-400">Unavailable</span>
                </div>
              </div>

              {/* Seat Map Panel */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-semibold text-slate-200">Library Floor Map</h2>
                    <p className="text-xs text-slate-400">Select an available seat to initiate reservation</p>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                    {availableCount} / {seats.length} Seats Free
                  </div>
                </div>

                {/* 4x4 Seat Matrix */}
                <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                  {seats.map((seat) => {
                    const isSelected = selectedSeat?.id === seat.id;
                    const isMySeat = activeSession?.seatId === seat.id;

                    let bgClass = 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-emerald-500 cursor-pointer';
                    if (seat.status === 'available') {
                      bgClass = isSelected 
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/50' 
                        : 'bg-emerald-950/30 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/40 cursor-pointer';
                    } else if (seat.status === 'reserved') {
                      bgClass = 'bg-amber-950/30 border-amber-600/50 text-amber-300 cursor-not-allowed';
                    } else if (seat.status === 'occupied') {
                      bgClass = 'bg-red-950/30 border-red-600/50 text-red-300 cursor-not-allowed';
                    } else if (seat.status === 'break') {
                      bgClass = 'bg-blue-950/30 border-blue-600/50 text-blue-300 cursor-not-allowed';
                    } else if (seat.status === 'unavailable') {
                      bgClass = 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50';
                    }

                    return (
                      <button
                        key={seat.id}
                        disabled={seat.status !== 'available' && !isMySeat}
                        onClick={() => setSelectedSeat(seat)}
                        className={`h-20 rounded-xl border flex flex-col items-center justify-center p-2 relative transition-all ${bgClass}`}
                      >
                        {isMySeat && (
                          <span className="absolute -top-1 -right-1 bg-teal-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                            YOU
                          </span>
                        )}
                        <span className="text-base font-bold">{seat.id}</span>
                        <span className="text-[10px] capitalize opacity-80 mt-1">
                          {seat.status === 'reserved' ? 'Checking In' : seat.status}
                        </span>

                        {/* Status indicators */}
                        {seat.status === 'reserved' && (
                          <span className="text-[9px] text-amber-400 font-mono mt-0.5">
                            {formatTime(seat.windowExpiry || activeSession?.timer)}
                          </span>
                        )}
                        {seat.status === 'break' && (
                          <span className="text-[9px] text-blue-400 font-mono mt-0.5">
                            {formatTime(seat.breakExpiry || activeSession?.timer)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Active Session & Action Panel */}
            <div className="space-y-4">
              {/* Active Session Card (If User Has Reserved/Occupied a Seat) */}
              {activeSession ? (
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-teal-500/30 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Active Session
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-teal-950 text-teal-300 border border-teal-500/40">
                      Seat {activeSession.seatId}
                    </span>
                  </div>

                  {/* Status: Pending QR Check-in */}
                  {activeSession.status === 'RESERVED' && (
                    <div className="space-y-3">
                      <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-center">
                        <p className="text-xs text-amber-300 font-medium">Check-In Window Expiring In</p>
                        <p className="text-3xl font-mono font-bold text-amber-400 my-1">
                          {formatTime(activeSession.timer)}
                        </p>
                        <p className="text-[11px] text-amber-200/70">Scan QR at seat to avoid auto-release.</p>
                      </div>

                      <button
                        onClick={() => setScanModalOpen(true)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                      >
                        <QrCode className="w-4 h-4" /> Scan Seat QR Code
                      </button>
                    </div>
                  )}

                  {/* Status: Active Occupied */}
                  {activeSession.status === 'OCCUPIED' && (
                    <div className="space-y-3">
                      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-300">Checked In & Active</p>
                          <p className="text-[11px] text-slate-400">Seat is marked occupied on live map.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={startBreak}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Coffee className="w-3.5 h-3.5 text-blue-400" /> Take Break (15m)
                        </button>
                        <button
                          onClick={endSession}
                          className="bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-800/40 font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Leave Seat
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status: On Break */}
                  {activeSession.status === 'BREAK' && (
                    <div className="space-y-3">
                      <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-center">
                        <p className="text-xs text-blue-300 font-medium">Break Period Remaining</p>
                        <p className="text-3xl font-mono font-bold text-blue-400 my-1">
                          {formatTime(activeSession.timer)}
                        </p>
                        <p className="text-[11px] text-blue-200/70">Return before timer expires to retain seat.</p>
                      </div>

                      <button
                        onClick={endBreak}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" /> I'm Back (End Break)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Seat Selection Card */
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-emerald-400" /> Seat Details & Booking
                  </h3>

                  {selectedSeat ? (
                    <div className="space-y-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-slate-100">Seat {selectedSeat.id}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                            Available
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 space-y-1">
                          <p>Location: <span className="text-slate-200">{selectedSeat.floor}</span></p>
                          <p>Zone: <span className="text-slate-200">{selectedSeat.zone}</span></p>
                        </div>
                      </div>

                      <button
                        onClick={() => reserveSeat(selectedSeat)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/20"
                      >
                        Reserve Seat {selectedSeat.id}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 space-y-2">
                      <MapPin className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-xs">Select any green seat on the floor map to inspect and reserve.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Anti-Misuse Rules Card */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> SeatSense Anti-Misuse Rules
                </h4>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                  <li><strong className="text-slate-300">10-Min Arrival Window:</strong> Must scan physical QR code at table within 10 mins or seat is released.</li>
                  <li><strong className="text-slate-300">15-Min Break Limit:</strong> Step away using Break Mode. Exceeding timer returns seat to public pool.</li>
                  <li><strong className="text-slate-300">No Bag Squatting:</strong> Unattended seats without active sessions can be reported to library admins.</li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          /* Admin Dashboard Tab */
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400">Total Capacity</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">{seats.length} Seats</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400">Current Occupancy</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {Math.round((seats.filter(s => s.status === 'occupied').length / seats.length) * 100)}%
                </p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400">Auto-Released Today</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">14 Seats</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400">Avg Study Duration</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">1h 42m</p>
              </div>
            </div>

            {/* Mock Analytics Panel */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" /> Space Utilization & Peak Hour Logs
                </h3>
                <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">Realtime Analytics</span>
              </div>
              
              <div className="space-y-3">
                {seats.map((seat) => (
                  <div key={seat.id} className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 px-4 py-2.5 rounded-xl text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-200 w-8">{seat.id}</span>
                      <span className="text-slate-400">{seat.zone} ({seat.floor})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">{seat.reservedBy || 'Unoccupied'}</span>
                      <span className={`px-2 py-0.5 rounded capitalize font-medium ${
                        seat.status === 'available' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                        seat.status === 'occupied' ? 'bg-red-950 text-red-300 border border-red-800/40' :
                        seat.status === 'reserved' ? 'bg-amber-950 text-amber-300 border border-amber-800/40' :
                        'bg-blue-950 text-blue-300 border border-blue-800/40'
                      }`}>
                        {seat.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QR Code Scanner Simulation Modal */}
      {scanModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 relative shadow-2xl">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-100">Scan Seat QR Code</h3>
              <p className="text-xs text-slate-400">
                To confirm physical arrival, enter seat code printed on your desk (Try: <span className="text-emerald-400 font-mono font-bold">{activeSession?.seatId}</span>)
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter Seat Code (e.g. B2)"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-center uppercase tracking-widest font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setScanModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQRCheckIn}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition-all"
                >
                  Confirm Check-in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}