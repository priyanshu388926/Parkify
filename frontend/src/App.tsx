import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Wallet, AlertCircle, CheckCircle2, MapPin, Search, User, Mail, Lock, LogOut, IdCard, FileText, Hash } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './lib/parkify-config';
import { findNearestAvailableSlot, type Point } from './lib/astar';
import ParkingMap from './components/ParkingMap';
import './index.css';

declare global {
  interface Window {
    ethereum: any;
  }
}

// Types
interface Slot {
  slotId: number;
  price: string;
  duration: number;
  status: 'available' | 'reserved';
  user: string | null;
  expiresAt: number | null;
}

interface AlertType {
  type: 'success' | 'error';
  message: string;
}

const App: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // New Signup Fields
  const [aadharId, setAadharId] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('Car');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [drivingLicense, setDrivingLicense] = useState<string>('');

  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'profile'>('dashboard');
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingSlotId, setBookingSlotId] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertType | null>(null);
  const [stats, setStats] = useState({ available: 0, reserved: 0 });
  const [nearestSlot, setNearestSlot] = useState<number | null>(null);
  const [path, setPath] = useState<Point[] | null>(null);
  const [slotHours, setSlotHours] = useState<Record<number, number>>({});

  const getHours = (id: number) => slotHours[id] || 1;
  const setHours = (id: number, val: number) => setSlotHours(prev => ({ ...prev, [id]: val }));

  const API_URL = 'http://localhost:4000';

  useEffect(() => {
    if (isLoggedIn) {
      fetchSlots();
      checkIfWalletIsConnected();
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      });
    }
  }, [isLoggedIn]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    const usersRaw = localStorage.getItem('parkify_users');
    const users = usersRaw ? JSON.parse(usersRaw) : [];

    if (isLoginMode) {
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        setShowSplash(true);
        setTimeout(() => setShowSplash(false), 2500);
      } else {
        window.alert("Invalid email or password!");
      }
    } else {
      if (users.find((u: any) => u.email === email)) {
        window.alert("Email already exists! Please log in.");
        return;
      }
      const newUser = { name: username, email, password, aadharId, vehicleType, vehicleNumber, drivingLicense };
      users.push(newUser);
      localStorage.setItem('parkify_users', JSON.stringify(users));
      setCurrentUser(newUser);
      setIsLoggedIn(true);
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 2500);
    }
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/slots`);
      setSlots(res.data);
      
      const available = res.data.filter((s: Slot) => s.status === 'available').length;
      const reserved = res.data.length - available;
      setStats({ available, reserved });
    } catch (err) {
      console.error('Error fetching slots:', err);
      showAlert('error', 'Failed to connect to the backend server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const checkIfWalletIsConnected = async () => {
    // Auto-connect to the Hardhat test account for a smooth demo
    setWalletAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  };

  const connectWallet = async () => {
    setWalletAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    showAlert('success', 'Connected to Local Test Wallet!');
  };

  const findNearest = () => {
    const availableIds = slots.filter(s => s.status === 'available').map(s => s.slotId);
    if (availableIds.length === 0) {
      showAlert('error', 'No parking slots available right now.');
      return;
    }
    
    const nearest = findNearestAvailableSlot(availableIds);
    if (nearest) {
      setNearestSlot(nearest.id);
      setPath(nearest.path);
      showAlert('success', `Guided to Slot #${nearest.id}! Follow the path on the map.`);
    }
  };

  const bookSlot = async (slotId: number, priceWei: string, hours: number) => {
    if (!walletAddress) {
      showAlert('error', 'Please connect your wallet first!');
      return;
    }

    try {
      setBookingSlotId(slotId);
      
      // Bypass MetaMask and sign directly with the Hardhat Private Key for a seamless demo
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const wallet = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

      const totalPrice = BigInt(priceWei) * BigInt(hours);
      const tx = await contract.bookSlot(slotId, hours, { value: totalPrice });
      showAlert('success', 'Transaction sent! Waiting for confirmation...');
      
      const receipt = await tx.wait();
      if (receipt.status !== 1) throw new Error('Transaction failed on-chain');

      await axios.post(`${API_URL}/book-slot`, {
        userId: walletAddress,
        slotId: slotId,
        transactionHash: tx.hash
      });

      showAlert('success', `Slot #${slotId} successfully booked for ${username}!`);
      if (nearestSlot === slotId) {
        setNearestSlot(null);
        setPath(null);
      }
      fetchSlots();
    } catch (err: any) {
      console.error('Booking failed:', err);
      showAlert('error', err.reason || 'Transaction failed');
    } finally {
      setBookingSlotId(null);
    }
  };

  const releaseSlot = async (slotId: number) => {
    if (!walletAddress) return;

    try {
      setBookingSlotId(slotId);
      
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const wallet = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

      const tx = await contract.releaseSlot(slotId);
      showAlert('success', 'Releasing slot...');
      await tx.wait();

      showAlert('success', `Slot #${slotId} successfully freed!`);
      fetchSlots();
    } catch (err: any) {
      console.error('Release failed:', err);
      showAlert('error', err.reason || 'Failed to release slot');
    } finally {
      setBookingSlotId(null);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatPrice = (weiPrice: string) => {
    return ethers.formatEther(weiPrice);
  };

  if (!isLoggedIn) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="login-card"
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Car size={48} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
            <h2>{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {isLoginMode ? 'Login to manage your parking' : 'Sign up to park with crypto'}
            </p>
          </div>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLoginMode && (
              <>
                <div className="input-group">
                  <User size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Full Name" value={username} onChange={(e) => setUsername(e.target.value)} required={!isLoginMode} className="login-input" />
                </div>
                <div className="input-group">
                  <IdCard size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Aadhar ID (12 Digits)" value={aadharId} onChange={(e) => setAadharId(e.target.value)} required={!isLoginMode} className="login-input" />
                </div>
                <div className="input-group" style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Car size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="login-input" style={{ paddingLeft: '3rem', appearance: 'none' }}>
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                      <option value="Truck">Truck</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Hash size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" placeholder="Vehicle No." value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required={!isLoginMode} className="login-input" />
                  </div>
                </div>
                <div className="input-group">
                  <FileText size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Driving License No." value={drivingLicense} onChange={(e) => setDrivingLicense(e.target.value)} required={!isLoginMode} className="login-input" />
                </div>
              </>
            )}
            <div className="input-group">
              <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
            </div>
            <div className="input-group">
              <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '1rem', marginTop: '0.5rem' }}>
              {isLoginMode ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
              <span 
                style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => setIsLoginMode(!isLoginMode)}
              >
                {isLoginMode ? 'Sign Up' : 'Log In'}
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'var(--bg-dark)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} 
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Car size={100} color="#3b82f6" />
            </motion.div>
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              style={{ 
                marginTop: '2rem', 
                fontSize: '4rem', 
                background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}
            >
              Welcome to Parkify
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '1rem' }}
            >
              Initializing blockchain protocols...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="navbar"
      >
        <div className="brand">
          <Car size={32} color="#60a5fa" />
          Parkify
        </div>
        
        {/* Center Navigation Links */}
        <div style={{ display: 'flex', gap: '2rem', flex: 1, justifyContent: 'center' }}>
          {['dashboard', 'bookings', 'profile'].map(tab => (
            <span 
              key={tab}
              style={{ 
                cursor: 'pointer', 
                color: activeTab === tab ? '#fff' : 'var(--text-muted)', 
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                borderBottom: activeTab === tab ? '2px solid #60a5fa' : '2px solid transparent',
                paddingBottom: '0.25rem',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab === 'dashboard' ? 'Live Dashboard' : tab === 'bookings' ? 'My Bookings' : 'My Profile'}
            </span>
          ))}
        </div>

        {/* Right User Actions */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`btn btn-wallet ${walletAddress ? 'connected' : ''}`}
            onClick={connectWallet}
          >
            <Wallet size={18} />
            {walletAddress ? formatAddress(walletAddress) : 'Connect Wallet'}
          </motion.button>

          <div style={{ position: 'relative' }}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.2)' }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <User size={18} color="#fff" />
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{currentUser?.name}</span>
            </motion.div>
            
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{ position: 'absolute', right: 0, top: '120%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.5rem', minWidth: '150px', zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                >
                  <div 
                    style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '0.25rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}
                    onClick={() => {
                      setIsLoggedIn(false);
                      setCurrentUser(null);
                      setShowProfileMenu(false);
                      setActiveTab('dashboard');
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={16} />
                    Log Out
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>

      {activeTab === 'profile' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-panel"
          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', width: '100%' }}>
            <div style={{ background: '#3b82f6', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{currentUser?.name}</h2>
              <span style={{ color: 'var(--text-muted)' }}>Registered User</span>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%' }}>
            <div className="detail-row"><span>Email Address</span><span className="detail-value">{currentUser?.email}</span></div>
            <div className="detail-row"><span>Aadhar ID</span><span className="detail-value">{currentUser?.aadharId || 'Not provided'}</span></div>
            <div className="detail-row"><span>Driving License</span><span className="detail-value">{currentUser?.drivingLicense || 'Not provided'}</span></div>
            <div className="detail-row"><span>Vehicle Type</span><span className="detail-value">{currentUser?.vehicleType || 'Not provided'}</span></div>
            <div className="detail-row"><span>Vehicle Number</span><span className="detail-value">{currentUser?.vehicleNumber || 'Not provided'}</span></div>
            <div className="detail-row"><span>Wallet Connected</span><span className="detail-value" style={{ color: walletAddress ? '#10b981' : '#f59e0b' }}>{walletAddress ? formatAddress(walletAddress) : 'No'}</span></div>
          </div>
        </motion.div>
      ) : (
        <>
          <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="hero"
      >
        <h1>Secure Blockchain Parking</h1>
        <p>Book your parking slot instantly with Ethereum.</p>
        
        {/* Peak time indicator */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="peak-time-banner"
        >
          <AlertCircle size={20} color="#f59e0b" />
          <strong>Heads up!</strong> Peak parking hours are typically <strong>9:00 AM - 11:00 AM</strong> and <strong>5:00 PM - 7:00 PM</strong>.
        </motion.div>
      </motion.section>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="dashboard-panel"
      >
        <div className="stat-group">
          <div className="stat-item">
            <span className="stat-label">Total Slots</span>
            <span className="stat-value">{slots.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Available</span>
            <span className="stat-value" style={{ color: '#34d399' }}>{stats.available}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Reserved</span>
            <span className="stat-value" style={{ color: '#f87171' }}>{stats.reserved}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary" onClick={findNearest} style={{ background: '#10b981' }}>
            <Search size={18} /> Find Nearest Slot
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-wallet" onClick={fetchSlots}>
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {loading ? (
        <div className="center-content">
          <div className="spinner"></div>
          <p>Syncing with blockchain...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="center-content">
          <MapPin size={48} opacity={0.5} />
          <p>No parking slots available.</p>
        </div>
      ) : (
        <>
          <ParkingMap slots={slots} nearestSlotId={nearestSlot} path={path} />
          <div className="slots-container">
          {slots
            .filter(slot => {
              if (activeTab === 'bookings') {
                return slot.status === 'reserved' && walletAddress && slot.user?.toLowerCase() === walletAddress.toLowerCase();
              }
              return true;
            })
            .map((slot, index) => {
            const isBooked = slot.status === 'reserved';
            const isMyBooking = isBooked && walletAddress && slot.user?.toLowerCase() === walletAddress.toLowerCase();
            const isNearest = nearestSlot === slot.slotId;
            
            return (
              <motion.div 
                key={slot.slotId} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`slot-card ${isBooked ? 'booked' : ''} ${isNearest ? 'nearest-highlight' : ''}`}
              >
                {isNearest && <div className="nearest-badge">Closest to Entrance</div>}
                <div className="slot-header">
                  <div className="slot-title">
                    <MapPin size={18} />
                    Slot #{slot.slotId}
                  </div>
                  <span className={`status-badge ${isBooked ? 'status-booked' : 'status-available'}`}>
                    {isBooked ? 'Reserved' : 'Available'}
                  </span>
                </div>
                
                <div className="slot-details">
                  <div className="detail-row">
                    <span>Price</span>
                    <span className="detail-value">{formatPrice(slot.price)} ETH</span>
                  </div>
                  <div className="detail-row">
                    <span>Duration</span>
                    <span className="detail-value">{slot.duration / 3600} hrs</span>
                  </div>
                  {isBooked && (
                    <div className="detail-row">
                      <span>Booked by</span>
                      <span className="detail-value">{isMyBooking ? 'You' : formatAddress(slot.user!)}</span>
                    </div>
                  )}
                  {isBooked && slot.expiresAt && (
                    <div className="detail-row">
                      <span>Expires</span>
                      <span className="detail-value">
                        {new Date(slot.expiresAt * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {!isBooked && (
                    <div className="detail-row" style={{ alignItems: 'center' }}>
                      <span>Book For</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>
                        <input 
                          type="number" 
                          min="1" 
                          max="24" 
                          value={getHours(slot.slotId)} 
                          onChange={(e) => setHours(slot.slotId, Number(e.target.value))}
                          style={{ width: '40px', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>hrs</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  {!isBooked ? (
                    <button className="btn btn-primary" onClick={() => bookSlot(slot.slotId, slot.price, getHours(slot.slotId))} style={{ width: '100%' }}>
                      {bookingSlotId === slot.slotId ? 'Confirming...' : `Book for ${getHours(slot.slotId)} hr${getHours(slot.slotId) > 1 ? 's' : ''}`}
                    </button>
                  ) : isMyBooking ? (
                    <button className="btn" onClick={() => releaseSlot(slot.slotId)} style={{ background: '#ef4444', color: 'white', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                      {bookingSlotId === slot.slotId ? 'Releasing...' : 'Free Slot'}
                    </button>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Occupied</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        </>
      )}

        </>
      )}

      {alert && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {alert.type === 'success' ? <CheckCircle2 size={20} color="#10b981" /> : <AlertCircle size={20} color="#ef4444" />}
          <span>{alert.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
