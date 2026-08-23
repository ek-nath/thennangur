import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Search, RefreshCw, Lock, User, LogOut, MessageSquare } from 'lucide-react';
import contentDb from './data/content.json';

const getPriestInfo = (category) => {
  switch (category) {
    case 'Sree Matam Poojas':
      return { name: 'Sri Venkatesh Bhattar (Shree Matham)', phone: '+919840807718' };
    case 'Meenakshi Sundareshwar Temple Poojas':
      return { name: 'Sri Sundaramurthy Bhattar (Meenakshi Sundareshwar)', phone: '+14803993440' };
    case 'Panduranga Rakhumayi Temple Poojas':
      return { name: 'Sri Vitthal Das (Panduranga Temple)', phone: '+918825789523' };
    case 'Lakshmi Narayan Temple Poojas':
      return { name: 'Sri Narayana Bhattar (Lakshmi Narayan Temple)', phone: '+918618130675' };
    default:
      return { name: 'Ashram Office / General Priest', phone: '+919176967153' };
  }
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AdminPortal() {
  const [dbData, setDbData] = useState({ transactions: [], bookings: [], donations: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, donations, transactions
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [selectedSheetDate, setSelectedSheetDate] = useState(getTodayString());

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('thennangur_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const fetchRecords = () => {
    setIsLoading(true);
    try {
      const localTxns = JSON.parse(localStorage.getItem('thennangur_local_txns') || '[]');
      const bookings = [];
      const donations = [];
      
      localTxns.forEach(txn => {
        txn.items.forEach(item => {
          if (item.type === 'pooja') {
            bookings.push({
              id: item.id,
              txnId: txn.txnId,
              date: txn.date,
              poojaName: item.name,
              price: item.price,
              ...item.details
            });
          } else if (item.type === 'donation') {
            donations.push({
              id: item.id,
              txnId: txn.txnId,
              date: txn.date,
              cause: item.cause || item.details.cause,
              amount: item.price,
              ...item.details
            });
          }
        });
      });
      
      setDbData({
        transactions: localTxns,
        bookings,
        donations
      });
    } catch (e) {
      console.error('Failed to parse local transactions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecords();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    // Pure in-browser authentication
    if (username === 'admin' && password === 'admin') {
      sessionStorage.setItem('thennangur_admin_auth', 'true');
      sessionStorage.setItem('thennangur_admin_token', 'local-token');
      setIsAuthenticated(true);
    } else {
      setLoginError('Invalid username or password');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('thennangur_admin_auth');
    sessionStorage.removeItem('thennangur_admin_token');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  const handleClearRecords = () => {
    if (!window.confirm('Are you sure you want to clear all booking and donation records? This action cannot be undone.')) {
      return;
    }
    
    setIsClearing(true);
    localStorage.removeItem('thennangur_local_txns');
    fetchRecords();
    setIsClearing(false);
    alert('Ledger cleared successfully!');
  };

  const handleSendWhatsApp = (booking) => {
    const pooja = contentDb.poojas.find(p => p.name === booking.poojaName);
    const category = pooja ? pooja.category : '';
    const priest = getPriestInfo(category);

    const message = `*Thennangur Ashram Pooja Offering*

*Pooja:* ${booking.poojaName}
*Pooja Date:* ${booking.poojaDate || 'N/A'}

*Devotee Details:*
- *Name:* ${booking.devoteeName || 'N/A'}
- *Gotram:* ${booking.gotram || 'N/A'}
- *Nakshatram:* ${booking.nakshatram || 'N/A'} ${booking.rasi ? `(${booking.rasi})` : ''}
- *Family Members:* ${booking.familyMembers || 'N/A'}
- *Sankalpam:* ${booking.sankalpam || 'N/A'}
- *Contact Phone:* ${booking.phone || 'N/A'}

Radhe Krishna.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${priest.phone.replace(/[^0-9+]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const getPoojaListForCategory = (category, date) => {
    return dbData.bookings.filter(b => {
      const pooja = contentDb.poojas.find(p => p.name === b.poojaName);
      const bCategory = pooja ? pooja.category : '';
      return bCategory === category && b.poojaDate === date;
    });
  };

  const handleSendConsolidatedWhatsApp = (category, templeName) => {
    const list = getPoojaListForCategory(category, selectedSheetDate);
    if (list.length === 0) {
      alert(`No pooja bookings scheduled for ${templeName} on ${selectedSheetDate}.`);
      return;
    }

    const priest = getPriestInfo(category);
    
    const formattedDate = new Date(selectedSheetDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    let message = `*Thennangur Ashram Pooja Offerings*
*Date:* ${formattedDate}
*Temple:* ${templeName}
*Priest:* ${priest.name}

Total Offerings: ${list.length}
---------------------------------------------`;

    list.forEach((b, idx) => {
      message += `

${idx + 1}. *${b.poojaName}*
   - *Devotee:* ${b.devoteeName || 'N/A'}
   - *Gotram:* ${b.gotram || 'N/A'}
   - *Nakshatram:* ${b.nakshatram || 'N/A'} ${b.rasi ? `(${b.rasi})` : ''}
   - *Family Members:* ${b.familyMembers || 'N/A'}
   - *Sankalpam:* ${b.sankalpam || 'N/A'}
   - *Contact Phone:* ${b.phone || 'N/A'}`;
    });

    message += `

Radhe Krishna.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${priest.phone.replace(/[^0-9+]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Stats calculation
  const totalTransactions = dbData.transactions.length;
  const totalAmount = dbData.transactions.reduce((sum, t) => sum + t.totalPrice, 0);
  const totalBookings = dbData.bookings.length;
  const totalDonations = dbData.donations.length;

  // Filter lists based on search
  const filteredBookings = dbData.bookings.filter(b => 
    b.devoteeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.poojaName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.txnId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone?.includes(searchQuery)
  );

  const filteredDonations = dbData.donations.filter(d => 
    d.donorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.cause?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.txnId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone?.includes(searchQuery)
  );

  const filteredTransactions = dbData.transactions.filter(t => 
    t.txnId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.receiptNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-temple-stone-50 font-sans">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-temple-stone-200 my-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-temple-maroon-900 rounded-full flex items-center justify-center p-1.5 shadow-md border border-temple-saffron-600/30">
              <Shield className="h-6 w-6 text-temple-saffron-300" />
            </div>
            <h2 className="mt-4 text-center text-2xl sm:text-3xl font-serif font-bold text-temple-maroon-800">
              Admin Access Gate
            </h2>
            <p className="mt-2 text-center text-xs text-temple-stone-600">
              Authorized personnel only. Please sign in to view the ashram register ledger.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs font-semibold text-center">
                {loginError}
              </div>
            )}
            <div className="rounded-md shadow-sm space-y-4">
              <div className="relative">
                <label htmlFor="username" className="sr-only">Username</label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-temple-stone-400">
                  <User size={16} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border border-temple-stone-300 placeholder-temple-stone-400 text-temple-stone-900 focus:outline-none focus:ring-2 focus:ring-temple-saffron-500 focus:border-temple-saffron-500 focus:z-10 text-sm"
                  placeholder="Username"
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-temple-stone-400">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border border-temple-stone-300 placeholder-temple-stone-400 text-temple-stone-900 focus:outline-none focus:ring-2 focus:ring-temple-saffron-500 focus:border-temple-saffron-500 focus:z-10 text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-temple-maroon-800 hover:bg-temple-maroon-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-maroon-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isLoggingIn ? 'Verifying...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-temple-stone-200 pb-5 gap-4">
        <div>
          <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs">Ashram Office</span>
          <h2 className="text-3xl font-serif font-bold text-temple-maroon-800 flex items-center gap-2">
            <Shield size={28} className="text-temple-saffron-600" /> Admin Register Portal
          </h2>
          <p className="text-sm text-temple-stone-600 mt-1">
            Monitor, filter, and verify online Pooja Bookings and Charity Donations.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse"></span>
            Browser Local Storage
          </div>

          <button 
            onClick={fetchRecords}
            className="bg-white hover:bg-temple-stone-100 text-temple-stone-800 border border-temple-stone-300 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw size={12} className="animate-spin-hover" /> Refresh
          </button>
          
          <button 
            disabled={isClearing || dbData.transactions.length === 0}
            onClick={handleClearRecords}
            className="bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 border border-red-200 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 size={12} /> Clear Database
          </button>

          <button 
            onClick={handleLogout}
            className="bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <LogOut size={12} /> Logout
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-temple-stone-200 rounded-xl p-5 shadow-sm space-y-2">
          <div className="text-xs font-bold text-temple-stone-500 uppercase tracking-wider">Total Revenue</div>
          <div className="text-3xl font-bold text-temple-maroon-800">₹ {totalAmount.toLocaleString('en-IN')}</div>
          <div className="text-xs text-temple-stone-600">Simulated transactions amount</div>
        </div>
        {/* Card 2 */}
        <div className="bg-white border border-temple-stone-200 rounded-xl p-5 shadow-sm space-y-2">
          <div className="text-xs font-bold text-temple-stone-500 uppercase tracking-wider">Total Checkouts</div>
          <div className="text-3xl font-bold text-temple-maroon-800">{totalTransactions}</div>
          <div className="text-xs text-temple-stone-600">Completed checkout sessions</div>
        </div>
        {/* Card 3 */}
        <div className="bg-white border border-temple-stone-200 rounded-xl p-5 shadow-sm space-y-2">
          <div className="text-xs font-bold text-temple-stone-500 uppercase tracking-wider">Pooja Bookings</div>
          <div className="text-3xl font-bold text-temple-maroon-800">{totalBookings}</div>
          <div className="text-xs text-temple-stone-600">Devotees scheduled for pooja</div>
        </div>
        {/* Card 4 */}
        <div className="bg-white border border-temple-stone-200 rounded-xl p-5 shadow-sm space-y-2">
          <div className="text-xs font-bold text-temple-stone-500 uppercase tracking-wider">Charity Donations</div>
          <div className="text-3xl font-bold text-temple-maroon-800">{totalDonations}</div>
          <div className="text-xs text-temple-stone-600">Causes supported (Annadanam, etc.)</div>
        </div>
      </div>

      {/* Consolidated Daily Dispatch Section */}
      <div className="bg-white border border-temple-stone-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-temple-stone-100 pb-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-temple-maroon-800 flex items-center gap-2">
              <MessageSquare size={20} className="text-emerald-600" /> Consolidated Priest Dispatch
            </h3>
            <p className="text-xs text-temple-stone-600 mt-0.5">
              Select a date to view poojas scheduled and send a consolidated WhatsApp list to the respective temple priest.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-temple-stone-700 whitespace-nowrap">Perform Date:</label>
            <input
              type="date"
              value={selectedSheetDate}
              onChange={(e) => setSelectedSheetDate(e.target.value)}
              className="border border-temple-stone-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-temple-saffron-500 bg-white"
            />
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Shree Matham */}
          {(() => {
            const category = 'Sree Matam Poojas';
            const templeName = 'Shree Matham';
            const priest = getPriestInfo(category);
            const count = getPoojaListForCategory(category, selectedSheetDate).length;
            return (
              <button
                onClick={() => handleSendConsolidatedWhatsApp(category, templeName)}
                disabled={count === 0}
                className={`w-full flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  count > 0 
                    ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 text-emerald-800 shadow-sm' 
                    : 'bg-temple-stone-50 border-temple-stone-200 text-temple-stone-400 cursor-not-allowed opacity-60'
                }`}
                title={count > 0 ? `Send consolidated sheet to: ${priest.name}` : `No bookings for this date`}
              >
                <span className="font-bold text-[10px] uppercase tracking-wider text-center">{templeName}</span>
                <span className="font-serif font-extrabold text-2xl mt-1">{count} {count === 1 ? 'Pooja' : 'Poojas'}</span>
                <span className="text-[10px] opacity-75 mt-1 truncate max-w-full">{priest.name.split(' (')[0]}</span>
              </button>
            );
          })()}

          {/* Meenakshi Sundareshwar */}
          {(() => {
            const category = 'Meenakshi Sundareshwar Temple Poojas';
            const templeName = 'Meenakshi Sundareshwar';
            const priest = getPriestInfo(category);
            const count = getPoojaListForCategory(category, selectedSheetDate).length;
            return (
              <button
                onClick={() => handleSendConsolidatedWhatsApp(category, templeName)}
                disabled={count === 0}
                className={`w-full flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  count > 0 
                    ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 text-emerald-800 shadow-sm' 
                    : 'bg-temple-stone-50 border-temple-stone-200 text-temple-stone-400 cursor-not-allowed opacity-60'
                }`}
                title={count > 0 ? `Send consolidated sheet to: ${priest.name}` : `No bookings for this date`}
              >
                <span className="font-bold text-[10px] uppercase tracking-wider text-center">{templeName}</span>
                <span className="font-serif font-extrabold text-2xl mt-1">{count} {count === 1 ? 'Pooja' : 'Poojas'}</span>
                <span className="text-[10px] opacity-75 mt-1 truncate max-w-full">{priest.name.split(' (')[0]}</span>
              </button>
            );
          })()}

          {/* Panduranga */}
          {(() => {
            const category = 'Panduranga Rakhumayi Temple Poojas';
            const templeName = 'Panduranga Temple';
            const priest = getPriestInfo(category);
            const count = getPoojaListForCategory(category, selectedSheetDate).length;
            return (
              <button
                onClick={() => handleSendConsolidatedWhatsApp(category, templeName)}
                disabled={count === 0}
                className={`w-full flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  count > 0 
                    ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 text-emerald-800 shadow-sm' 
                    : 'bg-temple-stone-50 border-temple-stone-200 text-temple-stone-400 cursor-not-allowed opacity-60'
                }`}
                title={count > 0 ? `Send consolidated sheet to: ${priest.name}` : `No bookings for this date`}
              >
                <span className="font-bold text-[10px] uppercase tracking-wider text-center">{templeName}</span>
                <span className="font-serif font-extrabold text-2xl mt-1">{count} {count === 1 ? 'Pooja' : 'Poojas'}</span>
                <span className="text-[10px] opacity-75 mt-1 truncate max-w-full">{priest.name.split(' (')[0]}</span>
              </button>
            );
          })()}

          {/* Lakshmi Narayan */}
          {(() => {
            const category = 'Lakshmi Narayan Temple Poojas';
            const templeName = 'Lakshmi Narayan Temple';
            const priest = getPriestInfo(category);
            const count = getPoojaListForCategory(category, selectedSheetDate).length;
            return (
              <button
                onClick={() => handleSendConsolidatedWhatsApp(category, templeName)}
                disabled={count === 0}
                className={`w-full flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  count > 0 
                    ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 text-emerald-800 shadow-sm' 
                    : 'bg-temple-stone-50 border-temple-stone-200 text-temple-stone-400 cursor-not-allowed opacity-60'
                }`}
                title={count > 0 ? `Send consolidated sheet to: ${priest.name}` : `No bookings for this date`}
              >
                <span className="font-bold text-[10px] uppercase tracking-wider text-center">{templeName}</span>
                <span className="font-serif font-extrabold text-2xl mt-1">{count} {count === 1 ? 'Pooja' : 'Poojas'}</span>
                <span className="text-[10px] opacity-75 mt-1 truncate max-w-full">{priest.name.split(' (')[0]}</span>
              </button>
            );
          })()}
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="bg-white border border-temple-stone-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Tab Selector & Search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-temple-stone-200 p-4 gap-4 bg-temple-stone-50/50">
          <div className="flex bg-temple-stone-200/60 p-0.5 rounded-lg text-xs font-bold self-start">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${activeTab === 'bookings' ? 'bg-white text-temple-maroon-900 shadow-sm' : 'text-temple-stone-600 hover:text-temple-stone-900'}`}
            >
              Pooja Bookings ({totalBookings})
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${activeTab === 'donations' ? 'bg-white text-temple-maroon-900 shadow-sm' : 'text-temple-stone-600 hover:text-temple-stone-900'}`}
            >
              Donations & Sevas ({totalDonations})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${activeTab === 'transactions' ? 'bg-white text-temple-maroon-900 shadow-sm' : 'text-temple-stone-600 hover:text-temple-stone-900'}`}
            >
              Receipts Log ({totalTransactions})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-temple-stone-400" />
            <input
              type="text"
              placeholder="Search register..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-temple-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-temple-saffron-500 bg-white"
            />
          </div>
        </div>

        {/* Tables */}
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-temple-stone-500 gap-2">
              <span className="w-8 h-8 border-4 border-temple-saffron-500 border-t-transparent rounded-full animate-spin"></span>
              <p className="text-xs font-bold">Fetching records from ashram ledger...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Bookings */}
              {activeTab === 'bookings' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-temple-stone-100 text-temple-stone-700 border-b border-temple-stone-200 font-bold uppercase tracking-wider">
                      <th className="p-4">Date</th>
                      <th className="p-4">Devotee Name</th>
                      <th className="p-4">Pooja Name</th>
                      <th className="p-4">Gothram / Nakshatram</th>
                      <th className="p-4">Pooja Date</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Sankalpam</th>
                      <th className="p-4">Txn ID</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-temple-stone-200">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-8 text-center text-temple-stone-500">
                          No pooja bookings found.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-temple-stone-50/50">
                          <td className="p-4 font-semibold text-temple-stone-600 whitespace-nowrap">{b.date}</td>
                          <td className="p-4 font-bold text-temple-stone-900">{b.devoteeName}</td>
                          <td className="p-4"><span className="bg-temple-saffron-50 border border-temple-saffron-200 text-temple-saffron-700 px-2 py-0.5 rounded font-semibold">{b.poojaName}</span></td>
                          <td className="p-4">
                            <div><span className="font-semibold text-temple-stone-500">G:</span> {b.gotram || 'N/A'}</div>
                            <div><span className="font-semibold text-temple-stone-500">N:</span> {b.nakshatram || 'N/A'} ({b.rasi || 'N/A'})</div>
                          </td>
                          <td className="p-4 font-semibold whitespace-nowrap">{b.poojaDate}</td>
                          <td className="p-4">
                            <div>{b.phone}</div>
                            <div className="text-[10px] text-temple-stone-500 lowercase">{b.email}</div>
                          </td>
                          <td className="p-4 max-w-xs truncate text-wrap" title={b.sankalpam}>{b.sankalpam || '-'}</td>
                          <td className="p-4 font-mono font-bold text-temple-maroon-800 whitespace-nowrap">{b.txnId}</td>
                          <td className="p-4 whitespace-nowrap">
                            {(() => {
                              const pooja = contentDb.poojas.find(p => p.name === b.poojaName);
                              const category = pooja ? pooja.category : '';
                              const priest = getPriestInfo(category);
                              return (
                                <button
                                  onClick={() => handleSendWhatsApp(b)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                  title={`Send to: ${priest.name} (${priest.phone})`}
                                >
                                  <MessageSquare size={10} /> WhatsApp Priest
                                </button>
                              );
                            })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 2: Donations */}
              {activeTab === 'donations' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-temple-stone-100 text-temple-stone-700 border-b border-temple-stone-200 font-bold uppercase tracking-wider">
                      <th className="p-4">Date</th>
                      <th className="p-4">Donor Name</th>
                      <th className="p-4">Cause / Seva</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">PAN Card</th>
                      <th className="p-4">Address</th>
                      <th className="p-4">Txn ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-temple-stone-200">
                    {filteredDonations.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-temple-stone-500">
                          No donations found.
                        </td>
                      </tr>
                    ) : (
                      filteredDonations.map(d => (
                        <tr key={d.id} className="hover:bg-temple-stone-50/50">
                          <td className="p-4 font-semibold text-temple-stone-600 whitespace-nowrap">{d.date}</td>
                          <td className="p-4 font-bold text-temple-stone-900">{d.donorName}</td>
                          <td className="p-4"><span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded font-semibold">{d.cause}</span></td>
                          <td className="p-4 font-bold text-temple-stone-900">₹ {d.amount?.toLocaleString('en-IN')}</td>
                          <td className="p-4">
                            <div>{d.phone}</div>
                            <div className="text-[10px] text-temple-stone-500 lowercase">{d.email}</div>
                          </td>
                          <td className="p-4 uppercase font-mono font-semibold">{d.panNumber || '-'}</td>
                          <td className="p-4 max-w-xs truncate text-wrap" title={d.address}>{d.address || '-'}</td>
                          <td className="p-4 font-mono font-bold text-temple-maroon-800 whitespace-nowrap">{d.txnId}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 3: Transactions */}
              {activeTab === 'transactions' && (
                <div className="divide-y divide-temple-stone-200 p-4 space-y-4">
                  {filteredTransactions.length === 0 ? (
                    <p className="text-center text-temple-stone-500 py-10">No transactions recorded.</p>
                  ) : (
                    filteredTransactions.map(t => (
                      <div key={t.txnId} className="bg-temple-stone-50/50 border border-temple-stone-200 rounded-lg p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif font-bold text-temple-maroon-900">{t.receiptNo}</span>
                            <span className="text-[10px] font-mono bg-temple-stone-200 text-temple-stone-700 px-1.5 py-0.5 rounded font-bold">{t.txnId}</span>
                            {t.isLocal && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">Local Storage</span>}
                          </div>
                          <div className="text-xs text-temple-stone-600 font-semibold">Processed on {t.date}</div>
                          
                          {/* Items listed */}
                          <div className="space-y-1 mt-2">
                            <div className="text-[10px] uppercase font-bold text-temple-stone-500">Cart Contents:</div>
                            {t.items.map((item, idx) => (
                              <div key={idx} className="text-xs text-temple-stone-850 flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'pooja' ? 'bg-temple-saffron-500' : 'bg-emerald-500'}`}></span>
                                <span className="font-bold">{item.name}</span>
                                <span className="text-temple-stone-500">(₹ {item.price})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end justify-between self-stretch gap-2">
                          <div className="text-lg font-serif font-bold text-temple-maroon-800">
                            Total: ₹ {t.totalPrice?.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
