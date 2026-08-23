import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Search, RefreshCw } from 'lucide-react';

export default function AdminPortal() {
  const [dbData, setDbData] = useState({ transactions: [], bookings: [], donations: [] });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, donations, transactions
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      // First check health
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        setIsConnected(true);
        const recordsRes = await fetch('/api/records');
        if (recordsRes.ok) {
          const data = await recordsRes.json();
          setDbData(data);
        }
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      console.warn('Backend server is offline or unreachable. Loading local storage data.', error);
      setIsConnected(false);
      
      // Load local storage fallback
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
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleClearRecords = async () => {
    if (!window.confirm('Are you sure you want to clear all booking and donation records? This action cannot be undone.')) {
      return;
    }
    
    setIsClearing(true);
    if (isConnected) {
      try {
        await fetch('/api/records/clear', { method: 'POST' });
      } catch (error) {
        console.error('Failed to clear server records:', error);
      }
    } else {
      localStorage.removeItem('thennangur_local_txns');
    }
    
    await fetchRecords();
    setIsClearing(false);
    alert('Database cleared successfully!');
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
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            isConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-600 animate-pulse' : 'bg-amber-500'}`}></span>
            {isConnected ? 'Connected to Backend' : 'Offline / Local Storage'}
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-temple-stone-200">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-temple-stone-500">
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
