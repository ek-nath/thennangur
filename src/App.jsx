import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Phone, Mail, MapPin, Calendar, BookOpen, Heart, 
  Image as ImageIcon, HelpCircle, FileText, ChevronLeft, ChevronRight, 
  Search, Shield, CheckCircle, Download, ExternalLink, Compass, Clock, Award, Coffee
} from 'lucide-react';
import contentDb from './data/content.json';

// Gallery images array
const GALLERY_IMAGES = Array.from({ length: 35 }, (_, i) => ({
  src: `/images/gallery/G${i + 1}.jpeg`,
  alt: `Sacred Moment ${i + 1}`
}));

// Helper to format date strings for Google Calendar
// Format: 30 Mar 2026 or 01 Apr 2026 or 01–03 May 2026
function getGoogleCalendarUrl(event) {
  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent("Guruji Swami Haridhos Giri Ashram, Thennangur, Tamil Nadu 604408");
  const details = encodeURIComponent(`Festival celebration at Thennangur Ashram. Join us in Namasankirtan and receiving the blessings of Lord Panduranga and Sri Guruji. Details: ${event.title}`);
  
  let startDateStr = '';
  let endDateStr = '';
  
  // Extract date numbers and month
  // Typical formats: "30 Mar 2026 · Monday" or "30 Mar – 07 Apr 2026 · Mon–Tue"
  const datePart = event.date.split(' · ')[0];
  const yearMatch = event.date.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : '2026';
  
  const months = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };
  
  let monthAbbrev = '';
  Object.keys(months).forEach(m => {
    if (datePart.includes(m)) monthAbbrev = m;
  });
  
  const monthNum = months[monthAbbrev] || '01';
  
  if (datePart.includes('–')) {
    // Range: e.g. "30 Mar – 07 Apr 2026" or "01–03 May 2026"
    const parts = datePart.split('–').map(p => p.trim());
    if (parts[0] && parts[1]) {
      const startDay = parts[0].replace(/[^\d]/g, '').padStart(2, '0');
      
      // If second part has a month, use it
      let endMonthNum = monthNum;
      let endDay = '';
      
      let secondPartMonth = '';
      Object.keys(months).forEach(m => {
        if (parts[1].includes(m)) secondPartMonth = m;
      });
      
      if (secondPartMonth) {
        endMonthNum = months[secondPartMonth];
        endDay = parts[1].replace(/[^\d]/g, '').padStart(2, '0');
      } else {
        endDay = parts[1].replace(/[^\d]/g, '').padStart(2, '0');
      }
      
      startDateStr = `${year}${monthNum}${startDay}`;
      // Google calendar end date is exclusive, add 1 day or keep same
      const nextDay = parseInt(endDay, 10) + 1;
      endDateStr = `${year}${endMonthNum}${String(nextDay).padStart(2, '0')}`;
    }
  } else {
    // Single Day: e.g. "30 Mar 2026"
    const day = datePart.replace(/[^\d]/g, '').padStart(2, '0');
    startDateStr = `${year}${monthNum}${day}`;
    const nextDay = parseInt(day, 10) + 1;
    endDateStr = `${year}${monthNum}${String(nextDay).padStart(2, '0')}`;
  }
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}&location=${location}`;
}

const TEMPLE_METADATA = {
  'panduranga-rakhumayi-temple': {
    heroImage: '/images/temples/panduranga-outside.jpg',
    deity: 'Lord Panduranga & Rakhumayi Devi',
    style: 'Chalukya & Dravidian Gopurams',
    highlight: '12ft Lord Vitthal & 10ft Rakhumayi',
    established: '1996 Consecration',
    subtitle: 'Dakshina Pandharpur'
  },
  'shree-matham': {
    heroImage: '/images/temples/shree-matham-temple.jpg',
    deity: 'Maha Shodasi & Holy Samadhies',
    style: 'Spiritual Complex / Ashram Core',
    highlight: 'Goddess Maha Shodasi & Gurus Samadhi',
    established: 'Thennangur Ashram Sanctuary',
    subtitle: 'Heart of the Ashram'
  },
  'maha-shodasi-temple': {
    heroImage: '/images/temples/maha-shodasi.jpg',
    deity: 'Goddess Maha Shodasi (16-handed)',
    style: 'Sri Vidya & Saktha Margam Architecture',
    highlight: 'First 16-handed Idol in the World',
    established: '1996 Consecration',
    subtitle: 'Supreme Mother Tripurasundari'
  },
  'meenakshi-sundareshwar-temple': {
    heroImage: '/images/temples/meenakshi-outside.jpg',
    deity: 'Goddess Meenakshi & Sundareshwar',
    style: 'Classical South-Indian Dravidian',
    highlight: 'Dakshina Halasyam Birthplace Site',
    established: '1996 Consecration',
    subtitle: 'Birthplace of Sri Meenakshi'
  },
  'lakshmi-narayan-temple': {
    heroImage: '/images/temples/lakshmi-narayan-temple-main.jpg',
    deity: 'Lord Narayana & Goddess Lakshmi',
    style: 'Traditional Rebuilt Temple (1985)',
    highlight: 'Oldest Sannidhi in Thennangur',
    established: '1987 Re-consecration',
    subtitle: 'Ancient Sannidhi of Abundance'
  }
};

const TEMPLE_TIMINGS = {
  'panduranga-rakhumayi-temple': [
    { time: '6:00 AM', event: 'Suprabhatam' },
    { time: '10:30 AM', event: 'Prarthana and Deepa Jyoti' },
    { time: '12:00 PM - 4:00 PM', event: 'Temple Closed for afternoon' },
    { time: '6:30 PM', event: 'Deepa Aradhanai' },
    { time: '8:00 PM', event: 'Panduranga Rakhumayi Temple Closes' }
  ],
  'shree-matham': [
    { time: '5:30 AM', event: 'Suprabhatam and Gho Pooja' },
    { time: '6:15 AM', event: 'Prarthana and Deepa Jyoti' },
    { time: '6:30 AM', event: 'Ganapathy Homam/Abhishekham' },
    { time: '7:00 AM', event: 'Pada Pooja and Swami Gnanananda Sannidhi Pooja' },
    { time: '7:30 AM', event: 'Guruji Brindavan and Namaji Adhishthan Pooja' },
    { time: '9:00 AM', event: 'Naivedyam and Deepa Aradhanai' },
    { time: '12:00 PM - 4:00 PM', event: 'Temple Closed for afternoon' },
    { time: '4:30 PM', event: 'Navavarna Pooja in Maha Shodasi Adhisthanam' },
    { time: '7:30 PM', event: 'Deepa Aradhanai' },
    { time: '8:00 PM', event: 'Shree Matham closes' }
  ],
  'maha-shodasi-temple': [
    { time: '5:30 AM', event: 'Suprabhatam and Gho Pooja' },
    { time: '6:15 AM', event: 'Prarthana and Deepa Jyoti' },
    { time: '6:30 AM', event: 'Ganapathy Homam/Abhishekham' },
    { time: '7:00 AM', event: 'Pada Pooja and Swami Gnanananda Sannidhi Pooja' },
    { time: '7:30 AM', event: 'Guruji Brindavan and Namaji Adhishthan Pooja' },
    { time: '9:00 AM', event: 'Naivedyam and Deepa Aradhanai' },
    { time: '12:00 PM - 4:00 PM', event: 'Temple Closed for afternoon' },
    { time: '4:30 PM', event: 'Navavarna Pooja in Maha Shodasi Adhisthanam' },
    { time: '7:30 PM', event: 'Deepa Aradhanai' },
    { time: '8:00 PM', event: 'Shree Matham closes' }
  ],
  'meenakshi-sundareshwar-temple': [
    { time: '6:00 AM', event: 'Suprabhatam' },
    { time: '6:30 AM', event: 'Abhishekham to all deities' },
    { time: '7:30 AM', event: 'Naivedyam and Deepa Aradhanai' },
    { time: '12:00 PM - 4:00 PM', event: 'Temple Closed for afternoon' },
    { time: '6:00 PM', event: 'Naivedyam and Deepa Aradhanai' },
    { time: '8:00 PM', event: 'Meenakshi Sundareshwar Temple Closes' }
  ],
  'lakshmi-narayan-temple': [
    { time: '6:00 AM', event: 'Suprabhatam Vishwa Roopam' },
    { time: '10:30 AM', event: 'Maha Naivedyam and Deepa Aradhanai' },
    { time: '12:00 PM - 4:00 PM', event: 'Temple Closed for afternoon' },
    { time: '6:30 PM', event: 'Deepa Aradhanai' },
    { time: '8:00 PM', event: 'Lakshmi Narayan Temple Closes' }
  ]
};

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { src: '/images/slider/slide1.jpg', title: 'Guruji Swami Haridhos Giri Ashram', subtitle: 'Thennangur' },
    { src: '/images/slider/slide2.jpg', title: 'Meenakshi Sundareshwar Temple', subtitle: 'Thennangur' },
    { src: '/images/slider/slide3.jpg', title: 'Panduranga Rakhumayi Temple', subtitle: 'Thennangur' },
    { src: '/images/slider/slide4.jpg', title: 'Guruji Brindavanam', subtitle: 'Thennangur' }
  ];

  // Pooja states
  const [poojaSearch, setPoojaSearch] = useState('');
  const [poojaCategory, setPoojaCategory] = useState('All');
  const [selectedPooja, setSelectedPooja] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    devoteeName: '', gotram: '', nakshatram: '', rasi: '',
    poojaDate: '', familyMembers: '', email: '', phone: '', sankalpam: ''
  });
  
  // Donation states
  const [donationForm, setDonationForm] = useState({
    cause: 'Annadanam',
    amount: '1000',
    customAmount: '',
    donorName: '',
    email: '',
    phone: '',
    panNumber: '',
    address: ''
  });
  
  // Checkout & Receipt states
  const [paymentStep, setPaymentStep] = useState(0); // 0: None, 1: Process, 2: Receipt
  const [receiptData, setReceiptData] = useState(null);
  
  // Event Calendar states
  const [eventSearch, setEventSearch] = useState('');
  const [eventMonth, setEventMonth] = useState('All');
  
  // Gallery lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Temples page custom states
  const [activeTempleTab, setActiveTempleTab] = useState('overview');
  const [templeLightboxIndex, setTempleLightboxIndex] = useState(null);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
      setMobileMenuOpen(false);
      window.scrollTo(0, 0);
      setActiveTempleTab('overview');
      setTempleLightboxIndex(null);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global image path fix for GitHub Pages subfolder hosting
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';
    if (base === '/') return;
    
    const fixImages = () => {
      document.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('/images/')) {
          img.setAttribute('src', base + src.substring(1));
        }
      });
    };
    
    fixImages();
    
    const observer = new MutationObserver(fixImages);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    });
    
    return () => observer.disconnect();
  }, [route]);

  // Auto-slide carousel
  useEffect(() => {
    if (route !== '#/') return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [route]);

  // Handle Pooja booking submit
  const handlePoojaSubmit = (e) => {
    e.preventDefault();
    setPaymentStep(1); // Go to payment simulation
  };

  // Handle Donation submit
  const handleDonationSubmit = (e) => {
    e.preventDefault();
    setPaymentStep(1); // Go to payment simulation
  };

  const completePayment = (type) => {
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const txnId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    if (type === 'pooja') {
      setReceiptData({
        type: 'pooja',
        receiptNo: `GA-PJB-2026-${randNum}`,
        txnId,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        poojaName: selectedPooja.name,
        price: selectedPooja.price,
        details: { ...bookingForm }
      });
    } else {
      const finalAmt = donationForm.amount === 'custom' ? donationForm.customAmount : donationForm.amount;
      setReceiptData({
        type: 'donation',
        receiptNo: `GA-DON-2026-${randNum}`,
        txnId,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        cause: donationForm.cause,
        price: parseInt(finalAmt, 10),
        details: { ...donationForm }
      });
    }
    setPaymentStep(2); // Go to receipt screen
  };

  const resetPortals = () => {
    setSelectedPooja(null);
    setPaymentStep(0);
    setReceiptData(null);
    setBookingForm({
      devoteeName: '', gotram: '', nakshatram: '', rasi: '',
      poojaDate: '', familyMembers: '', email: '', phone: '', sankalpam: ''
    });
    setDonationForm({
      cause: 'Annadanam',
      amount: '1000',
      customAmount: '',
      donorName: '',
      email: '',
      phone: '',
      panNumber: '',
      address: ''
    });
  };

  // Helper to get active route components
  const isRoute = (path) => {
    if (path === '#/') return route === '#/' || route === '';
    return route.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-temple-stone-50 text-temple-stone-900 selection:bg-temple-saffron-500 selection:text-white">
      
      {/* 1. TOP INFORMATION BANNER */}
      <div className="bg-temple-maroon-900 text-temple-stone-100 text-xs py-2 px-4 border-b border-temple-saffron-600/30 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="tel:+919176967153" className="flex items-center gap-1 hover:text-temple-saffron-400 transition-colors">
              <Phone size={12} /> +91 9176967153
            </a>
            <a href="mailto:ashram@gurujithennangur.com" className="flex items-center gap-1 hover:text-temple-saffron-400 transition-colors">
              <Mail size={12} /> ashram@gurujithennangur.com
            </a>
            <span className="flex items-center gap-1 text-temple-saffron-300">
              <Clock size={12} /> Daily Darshan: 6:00 AM - 8:00 PM
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#/pooja-booking" className="bg-temple-saffron-600 hover:bg-temple-saffron-700 text-white font-semibold px-3 py-1 rounded transition-colors duration-200">
              Book Pooja
            </a>
            <a href="#/donations" className="bg-white hover:bg-temple-stone-100 text-temple-maroon-900 font-semibold px-3 py-1 rounded transition-colors duration-200">
              Donate Seva
            </a>
          </div>
        </div>
      </div>

      {/* 2. HEADER AND STICKY NAVIGATION */}
      <header className="bg-white border-b border-temple-stone-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            
            {/* Logo and branding */}
            <div className="flex items-center">
              <a href="#/" className="flex items-center gap-3 group">
                <div className="h-14 w-14 bg-temple-maroon-900 rounded-full flex items-center justify-center p-1 shadow-md border border-temple-saffron-600/30 transition-transform duration-300 group-hover:scale-105">
                  <img 
                    src="/images/logo.png" 
                    alt="Thennangur Logo" 
                    className="h-full w-auto object-contain"
                    onError={(e) => {
                      e.target.src = '/images/radhe-krishna-logo.png'; // Fallback
                    }}
                  />
                </div>
                <div>
                  <h1 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-temple-maroon-800 leading-tight">
                    THENNANGUR
                  </h1>
                  <p className="text-[10px] sm:text-xs font-sans tracking-widest text-temple-saffron-600 uppercase font-semibold">
                    Swami Haridhos Giri Ashram
                  </p>
                </div>
              </a>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              <a href="#/" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 ${isRoute('#/') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>Home</a>
              <a href="#/history" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 ${isRoute('#/history') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>History</a>
              
              {/* Temples dropdown trigger or inline links */}
              <div className="relative group py-2">
                <a href="#/temples" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 flex items-center gap-1 ${isRoute('#/temples') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>
                  Temples
                </a>
                <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <a href="#/temples/panduranga-rakhumayi-temple" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800 font-medium">Panduranga Rakhumayi</a>
                    <a href="#/temples/meenakshi-sundareshwar-temple" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800 font-medium">Meenakshi Sundareshwar</a>
                    <a href="#/temples/lakshmi-narayan-temple" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800 font-medium">Lakshmi Narayan Temple</a>
                    
                    {/* Shree Matham Sub-Dropdown */}
                    <div className="relative group/sub">
                      <div className="flex items-center justify-between w-full px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800 cursor-pointer font-medium">
                        <span>Shree Matham</span>
                        <ChevronRight size={14} className="text-temple-stone-400 group-hover/sub:text-temple-maroon-800" />
                      </div>
                      <div className="absolute left-full top-0 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 z-50">
                        <div className="py-1">
                          <a href="#/temples/maha-shodasi-temple" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Maha Shodasi Temple</a>
                          <a href="#/ashram/swami-haridhos-giri-brindavan" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Swami Haridhos Giri Brindavanam</a>
                          <a href="#/ashram/swami-namananda-giri-adhisthanam" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Swami Namananda Giri Adishthanam</a>
                          <a href="#/ashram/sathguru-gnanananda-giri" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Sathguru Gnanananda Giri Sannidhi</a>
                          <a href="#/ashram/guruji-mani-mandapam" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Guruji Mani Mandapam</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gurus dropdown */}
              <div className="relative group py-2">
                <a href="#/ashram" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 flex items-center gap-1 ${isRoute('#/ashram') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>
                  Gurus
                </a>
                <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <a href="#/ashram/sathguru-gnanananda-giri" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Sathguru Gnanananda Giri</a>
                    <a href="#/ashram/swami-haridhos-giri" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Swami Haridhos Giri (Guruji)</a>
                    <a href="#/ashram/swami-namananda-giri-adhisthanam" className="block px-4 py-2 text-sm text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Swami Namananda Giri (Namaji)</a>
                  </div>
                </div>
              </div>

              <a href="#/pooja-booking" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 ${isRoute('#/pooja-booking') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>Bookings</a>
              <a href="#/donations" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 ${isRoute('#/donations') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>Donations</a>
              <a href="#/welfare" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 ${isRoute('#/welfare') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>Welfare</a>
              <a href="#/events" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 ${isRoute('#/events') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>Calendar</a>
              <a href="#/gallery" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 ${isRoute('#/gallery') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>Gallery</a>
              <a href="#/facilities" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 ${isRoute('#/facilities') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>Facilities</a>
              <a href="#/contact" className={`px-2 xl:px-3 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors duration-200 ${isRoute('#/contact') ? 'border-temple-saffron-500 text-temple-maroon-800' : 'border-transparent text-temple-stone-800 hover:text-temple-maroon-800 hover:border-temple-stone-200'}`}>Contact</a>
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-temple-stone-800 hover:text-temple-maroon-800 hover:bg-temple-stone-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-temple-saffron-500"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
            
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-temple-stone-200 max-h-[calc(100vh-5rem)] overflow-y-auto shadow-inner">
            <div className="px-2 pt-2 pb-4 space-y-1">
              <a href="#/" className="block px-3 py-2 rounded-md text-base font-medium text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Home</a>
              <a href="#/history" className="block px-3 py-2 rounded-md text-base font-medium text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">History & Heritage</a>
              
              <div className="border-t border-temple-stone-100 my-1 pt-1">
                <span className="block px-3 py-1 text-xs font-bold text-temple-saffron-600 uppercase tracking-wider">Temples</span>
                <a href="#/temples/panduranga-rakhumayi-temple" className="block pl-6 pr-3 py-2 rounded-md text-base font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Panduranga Rakhumayi</a>
                <a href="#/temples/meenakshi-sundareshwar-temple" className="block pl-6 pr-3 py-2 rounded-md text-base font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Meenakshi Sundareshwar</a>
                <a href="#/temples/lakshmi-narayan-temple" className="block pl-6 pr-3 py-2 rounded-md text-base font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Lakshmi Narayan Temple</a>
                
                {/* Shree Matham Mobile Section */}
                <div className="my-1">
                  <a href="#/temples/shree-matham" className="block pl-6 pr-3 py-2 rounded-md text-base font-semibold text-temple-maroon-800 hover:bg-temple-stone-50">Shree Matham Complex</a>
                  <div className="pl-4 border-l-2 border-temple-stone-200 ml-8 space-y-1.5 mt-1">
                    <a href="#/temples/maha-shodasi-temple" className="block pl-3 pr-3 py-1 rounded-md text-sm font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Maha Shodasi Temple</a>
                    <a href="#/ashram/swami-haridhos-giri-brindavan" className="block pl-3 pr-3 py-1 rounded-md text-sm font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Swami Haridhos Giri Brindavanam</a>
                    <a href="#/ashram/swami-namananda-giri-adhisthanam" className="block pl-3 pr-3 py-1 rounded-md text-sm font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Swami Namananda Giri Adishthanam</a>
                    <a href="#/ashram/sathguru-gnanananda-giri" className="block pl-3 pr-3 py-1 rounded-md text-sm font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Sathguru Gnanananda Giri Sannidhi</a>
                    <a href="#/ashram/guruji-mani-mandapam" className="block pl-3 pr-3 py-1 rounded-md text-sm font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Guruji Mani Mandapam</a>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-temple-stone-100 my-1 pt-1">
                <span className="block px-3 py-1 text-xs font-bold text-temple-saffron-600 uppercase tracking-wider">Gurus & Ashram</span>
                <a href="#/ashram/sathguru-gnanananda-giri" className="block pl-6 pr-3 py-2 rounded-md text-base font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Sathguru Gnanananda Giri</a>
                <a href="#/ashram/swami-haridhos-giri" className="block pl-6 pr-3 py-2 rounded-md text-base font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Swami Haridhos Giri</a>
                <a href="#/ashram/swami-namananda-giri-adhisthanam" className="block pl-6 pr-3 py-2 rounded-md text-base font-medium text-temple-stone-700 hover:bg-temple-stone-50 hover:text-temple-maroon-800">Swami Namananda Giri</a>
              </div>

              <a href="#/pooja-booking" className="block px-3 py-2 rounded-md text-base font-medium text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Pooja Bookings</a>
              <a href="#/donations" className="block px-3 py-2 rounded-md text-base font-medium text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Donations & Sevas</a>
              <a href="#/welfare" className="block px-3 py-2 rounded-md text-base font-medium text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Social Welfare</a>
              <a href="#/events" className="block px-3 py-2 rounded-md text-base font-medium text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Festivals Calendar</a>
              <a href="#/gallery" className="block px-3 py-2 rounded-md text-base font-medium text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Gallery</a>
              <a href="#/facilities" className="block px-3 py-2 rounded-md text-base font-medium text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Facilities</a>
              <a href="#/contact" className="block px-3 py-2 rounded-md text-base font-medium text-temple-stone-800 hover:bg-temple-stone-100 hover:text-temple-maroon-800">Contact Us</a>
            </div>
          </div>
        )}
      </header>

      {/* 3. MAIN DYNAMIC BODY VIEW */}
      <main className="flex-grow">

        {/* ========================================================
            HOME ROUTE (#/ or #) 
            ======================================================== */}
        {isRoute('#/') && (
          <div>
            {/* HERO SLIDER (LCP optimized) */}
            <div className="relative h-[65vh] sm:h-[80vh] overflow-hidden bg-temple-stone-900">
              {slides.map((slide, idx) => (
                <div 
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img 
                    src={slide.src} 
                    alt={slide.title} 
                    className="w-full h-full object-cover opacity-80"
                    // FETCH PRIORITY OPTIMIZATION
                    // High priority for index 0 (the initial image which loads on LCP), low + lazy for the rest
                    fetchpriority={idx === 0 ? "high" : "low"}
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                  {/* Text Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex flex-col justify-end p-6 sm:p-12 md:p-24 z-20">
                    <div className="max-w-3xl">
                      <span className="text-temple-saffron-400 font-bold uppercase tracking-widest text-xs sm:text-sm">{slide.subtitle}</span>
                      <h2 className="text-white text-3xl sm:text-5xl font-serif font-bold mt-2 leading-tight drop-shadow-md">
                        {slide.title}
                      </h2>
                      <div className="mt-6 flex flex-wrap gap-4">
                        <a href="#/history" className="bg-temple-saffron-600 hover:bg-temple-saffron-700 text-white font-semibold px-6 py-3 rounded-md shadow transition duration-200">
                          Explore Sthala Puranam
                        </a>
                        <a href="#/pooja-booking" className="bg-transparent hover:bg-white/10 text-white border-2 border-white/60 hover:border-white font-semibold px-6 py-3 rounded-md transition duration-200">
                          Book Pooja Online
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Carousel Indicators */}
              <div className="absolute bottom-6 right-6 flex gap-2 z-30">
                {slides.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-3 w-3 rounded-full border border-white transition-all ${idx === currentSlide ? 'bg-temple-saffron-500 scale-125' : 'bg-white/40'}`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* WELCOME SECTION */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center gap-2 text-temple-saffron-600 font-semibold tracking-wider text-sm uppercase">
                    <Compass size={18} /> Welcome to the Abode of Devotion
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800 leading-tight">
                    Guruji Swami Haridhos Giri Ashram, Thennangur
                  </h2>
                  <div className="w-20 h-1 bg-temple-saffron-500"></div>
                  <p className="text-temple-stone-800 leading-relaxed text-lg">
                    Swami Haridhos Giri, an illustrious spiritual master, founded this spiritual sanctuary in the historic village of Thennangur, Tamil Nadu. Nestled between Kanchipuram and Vandavasi, the ashram stands as a vibrant beacon of Sanatana Dharma, propagated through the divine path of Namasankirtan (chanting of the Lord's holy names).
                  </p>
                  <p className="text-temple-stone-700 leading-relaxed">
                    Once a village drought-ridden and cursed, Thennangur was redeemed by the arrival of Sri Guruji. Today, it hosts majestic temples, a hospital, a goshala sheltering over 50 cows, a home for elders, and a Vedic school, serving both spiritual seekers and local communities.
                  </p>
                  <div className="pt-4 flex flex-wrap gap-4">
                    <a href="#/history" className="text-temple-maroon-800 hover:text-temple-saffron-600 font-semibold flex items-center gap-1 group">
                      Read full History <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="absolute inset-0 bg-temple-saffron-500 rounded-2xl transform rotate-3 translate-x-2 translate-y-2 z-0 opacity-20"></div>
                  <div className="relative bg-white p-2 rounded-2xl border border-temple-stone-200 shadow-xl z-10 overflow-hidden">
                    <img 
                      src="/images/ashram/thennangur-aerial.jpg" 
                      alt="Thennangur Ashram Aerial View" 
                      className="rounded-xl w-full h-auto object-cover max-h-[350px]"
                      loading="lazy"
                    />
                    <div className="p-4 bg-temple-stone-100 rounded-b-xl border-t border-temple-stone-200 mt-2 text-center">
                      <span className="text-xs font-serif text-temple-saffron-700 italic">"Dakshina Halasyam — The birth place of Sri Meenakshi"</span>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* TEMPLES GRID SECTION */}
            <section className="bg-temple-stone-100 py-16 sm:py-24 border-y border-temple-stone-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                  <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs sm:text-sm">Divine Sannidhies</span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">
                    The Sacred Temples of Thennangur
                  </h2>
                  <div className="w-24 h-1 bg-temple-saffron-500 mx-auto"></div>
                  <p className="text-temple-stone-700">
                    In the ashram complex, Sri Guruji consecrated four distinct and architecturally unique temples representing different aspects of the Supreme Divine.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Temple 1 */}
                  <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src="/images/temples/panduranga-outside.jpg" 
                        alt="Panduranga Rakhumayi Temple" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 bg-temple-maroon-900 text-temple-saffron-300 text-xs px-2 py-1 rounded font-semibold font-serif">12ft Deity</div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="font-serif text-lg font-bold text-temple-maroon-800">Panduranga Rakhumayi</h3>
                        <p className="text-sm text-temple-stone-700 line-clamp-3">
                          A magnificent North-Indian styled temple housing stunning 12ft and 10ft idols of Lord Panduranga and Rakhumayi Devi. Consecrated based on a divine dream.
                        </p>
                      </div>
                      <div className="pt-6">
                        <a href="#/temples/panduranga-rakhumayi-temple" className="text-temple-saffron-600 hover:text-temple-maroon-800 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Explore Temple &rarr;
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Temple 2 */}
                  <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src="/images/temples/shree-matham-temple.jpg" 
                        alt="Shree Matham" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 bg-temple-maroon-900 text-temple-saffron-300 text-xs px-2 py-1 rounded font-semibold font-serif">Ashram Core</div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="font-serif text-lg font-bold text-temple-maroon-800">Shree Matham</h3>
                        <p className="text-sm text-temple-stone-700 line-clamp-3">
                          The spiritual core of Thennangur Ashram. It houses the world-unique Maha Shodasi Temple, Sathguru Gnanananda Giri Sannidhi, Swami Haridhos Giri Brindavanam, and Swami Namananda Giri Adishthanam.
                        </p>
                      </div>
                      <div className="pt-6">
                        <a href="#/temples/shree-matham" className="text-temple-saffron-600 hover:text-temple-maroon-805 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Explore Shree Matham &rarr;
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Temple 3 */}
                  <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src="/images/temples/meenakshi-outside.jpg" 
                        alt="Meenakshi Sundareshwar Temple" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 bg-temple-maroon-900 text-temple-saffron-300 text-xs px-2 py-1 rounded font-semibold font-serif">Kalyanam site</div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="font-serif text-lg font-bold text-temple-maroon-800">Meenakshi Sundareshwar</h3>
                        <p className="text-sm text-temple-stone-700 line-clamp-3">
                          Built in South-Indian style at the birth site of Goddess Meenakshi (Dakshina Halasyam). Adorned with beautiful carvings.
                        </p>
                      </div>
                      <div className="pt-6">
                        <a href="#/temples/meenakshi-sundareshwar-temple" className="text-temple-saffron-600 hover:text-temple-maroon-800 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Explore Temple &rarr;
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Temple 4 */}
                  <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src="/images/temples/lakshmi-narayan.jpg" 
                        alt="Lakshmi Narayan Temple" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 bg-temple-maroon-900 text-temple-saffron-300 text-xs px-2 py-1 rounded font-semibold font-serif">Oldest Temple</div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="font-serif text-lg font-bold text-temple-maroon-800">Lakshmi Narayan Temple</h3>
                        <p className="text-sm text-temple-stone-700 line-clamp-3">
                          The oldest temple in Thennangur. Dilapidated and rebuilt by Guruji in 1985, bringing Lord Vishnu and Goddess Mahalakshmi together.
                        </p>
                      </div>
                      <div className="pt-6">
                        <a href="#/temples/lakshmi-narayan-temple" className="text-temple-saffron-600 hover:text-temple-maroon-800 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Explore Temple &rarr;
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* GURUS BIOGRAPHY PREVIEW */}
            <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs sm:text-sm">The Spiritual Lineage</span>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">Our Revered Gurus</h2>
                <div className="w-16 h-1 bg-temple-saffron-500 mx-auto"></div>
                <p className="text-temple-stone-600 text-sm">Followers of the path of Namasankirtan, guiding us towards spiritual liberation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Guru 1 */}
                <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 p-6 text-center hover:shadow-lg transition-shadow">
                  <img 
                    src="/images/guruji/swami-haridhos-giri.jpg" 
                    alt="Swami Haridhos Giri" 
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-temple-saffron-100"
                    loading="lazy"
                  />
                  <h3 className="font-serif text-lg font-bold text-temple-maroon-800 mt-4">Swami Haridhos Giri</h3>
                  <p className="text-xs text-temple-saffron-600 font-semibold uppercase tracking-wider mt-1">Founder Master (Guruji)</p>
                  <p className="text-sm text-temple-stone-700 mt-3 line-clamp-3">
                    Spiritual master and founder of the Swami Haridhos Giri Ashram. He traveled the world propagating Namasankirtan and rebuilt Thennangur.
                  </p>
                  <a href="#/ashram/swami-haridhos-giri" className="inline-block mt-4 text-xs font-bold text-temple-maroon-800 hover:text-temple-saffron-600 uppercase border-b border-temple-maroon-800 hover:border-temple-saffron-600 pb-0.5">
                    Read Biography
                  </a>
                </div>

                {/* Guru 2 */}
                <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 p-6 text-center hover:shadow-lg transition-shadow">
                  <img 
                    src="/images/gnanananda/gnanananda-portrait.jpg" 
                    alt="Sathguru Gnanananda Giri" 
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-temple-saffron-100"
                    loading="lazy"
                  />
                  <h3 className="font-serif text-lg font-bold text-temple-maroon-800 mt-4">Sathguru Gnanananda Giri</h3>
                  <p className="text-xs text-temple-saffron-600 font-semibold uppercase tracking-wider mt-1">Paramaguru</p>
                  <p className="text-sm text-temple-stone-700 mt-3 line-clamp-3">
                    Spiritual Master of Swami Haridhos Giri, and the focal inspiration of the ashram's daily traditions, meditation, and Veda recitation.
                  </p>
                  <a href="#/ashram/sathguru-gnanananda-giri" className="inline-block mt-4 text-xs font-bold text-temple-maroon-800 hover:text-temple-saffron-600 uppercase border-b border-temple-maroon-800 hover:border-temple-saffron-600 pb-0.5">
                    Read Biography
                  </a>
                </div>

                {/* Guru 3 */}
                <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 p-6 text-center hover:shadow-lg transition-shadow">
                  <img 
                    src="/images/gnanananda/namananda-portrait.jpg" 
                    alt="Swami Namananda Giri" 
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-temple-saffron-100"
                    loading="lazy"
                  />
                  <h3 className="font-serif text-lg font-bold text-temple-maroon-800 mt-4">Swami Namananda Giri</h3>
                  <p className="text-xs text-temple-saffron-600 font-semibold uppercase tracking-wider mt-1">Successor Master (Namaji)</p>
                  <p className="text-sm text-temple-stone-700 mt-3 line-clamp-3">
                    The chief disciple and successor who looked after the rituals and administration of the ashram with pure devotion till 2009.
                  </p>
                  <a href="#/ashram/swami-namananda-giri-adhisthanam" className="inline-block mt-4 text-xs font-bold text-temple-maroon-800 hover:text-temple-saffron-600 uppercase border-b border-temple-maroon-800 hover:border-temple-saffron-600 pb-0.5">
                    Read Biography
                  </a>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS & TRANSACTION LINKS */}
            <section className="bg-spiritual-gradient text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-temple-saffron-500">
              <div className="max-w-7xl mx-auto text-center space-y-8">
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-saffron-300">Participate in Temple Sevas & Poojas</h2>
                <p className="text-temple-stone-100 max-w-2xl mx-auto">
                  Receive the blessings of Lord Panduranga and Sri Guruji. Book a pooja archana in your family's name or support our social welfare programs like feeding the poor (Annadanam) and sheltering cows (Goshala).
                </p>
                <div className="flex flex-wrap justify-center gap-6 pt-4">
                  <a href="#/pooja-booking" className="bg-temple-saffron-600 hover:bg-temple-saffron-500 text-white font-bold px-8 py-4 rounded-lg shadow-lg flex items-center gap-2 group transition-all duration-300">
                    <Award size={20} /> Book Online Pooja <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </a>
                  <a href="#/donations" className="bg-white hover:bg-temple-stone-100 text-temple-maroon-900 font-bold px-8 py-4 rounded-lg shadow-lg flex items-center gap-2 group transition-all duration-300">
                    <Heart size={20} /> Donate to Charity/Seva <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </section>

            {/* UPCOMING FESTIVALS PREVIEW */}
            <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
                <div className="space-y-2">
                  <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs">Auspicious Times</span>
                  <h2 className="text-3xl font-serif font-bold text-temple-maroon-800">Upcoming Festivals</h2>
                </div>
                <a href="#/events" className="text-temple-maroon-800 hover:text-temple-saffron-600 font-semibold flex items-center gap-1 group">
                  View Full Calendar <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {contentDb.events.slice(0, 3).map((event) => (
                  <div key={event.id} className="bg-white rounded-xl shadow border border-temple-stone-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        loading="lazy"
                      />
                      {event.isSpecial && (
                        <span className="absolute top-3 left-3 bg-temple-saffron-600 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">Major Festival</span>
                      )}
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs text-temple-saffron-600 font-semibold">{event.monthGroup}</span>
                        <h3 className="font-serif font-bold text-temple-maroon-800 text-lg leading-snug">{event.title}</h3>
                        <p className="text-xs text-temple-stone-600 flex items-center gap-1">
                          <Calendar size={12} /> {event.date}
                        </p>
                      </div>
                      <div className="pt-2 flex justify-between items-center">
                        <a 
                          href={getGoogleCalendarUrl(event)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-temple-maroon-800 hover:text-temple-saffron-600 font-semibold flex items-center gap-1 border border-temple-stone-300 rounded px-2.5 py-1.5 hover:bg-temple-stone-50 transition-colors"
                        >
                          Add to Calendar <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            HISTORY / STHALA PURANAM ROUTE (#/history) 
            ======================================================== */}
        {isRoute('#/history') && (
          <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6">
            <div className="space-y-6 mb-12 text-center">
              <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs sm:text-sm">Sthala Puranam</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">History & Heritage of Thennangur</h2>
              <div className="w-24 h-1 bg-temple-saffron-500 mx-auto"></div>
            </div>

            {/* Vintage style story header */}
            <div className="bg-temple-stone-100 border-l-4 border-temple-maroon-800 p-6 rounded-r-xl shadow-sm mb-12 space-y-3">
              <p className="text-sm font-serif text-temple-saffron-700 italic">"May you all suffer due to famine, and let there be no water..."</p>
              <p className="text-sm text-temple-stone-700">
                125 years ago, a curse turned Thennangur into a parched, desolate land. The redemption lay in wait for the birth of a great Gnani, who would return to his place of birth and transform it into a divine oasis. This is the story of Sri Guruji's compassionate grace.
              </p>
            </div>

            <div className="prose" dangerouslySetInnerHTML={{ __html: contentDb.pages['sthala-puranam'].html }} />

            {/* TIMELINE OF REDEMPTION */}
            <div className="mt-16 border-t border-temple-stone-200 pt-16">
              <h3 className="text-2xl font-serif font-bold text-temple-maroon-800 text-center mb-12">The Timeline of Grace</h3>
              
              <div className="relative border-l-2 border-temple-saffron-500 ml-4 md:ml-32 pl-6 space-y-12">
                {/* Event 1 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 bg-temple-maroon-800 border-2 border-temple-saffron-500 rounded-full h-4 w-4"></div>
                  <div className="md:absolute md:-left-36 md:top-0 text-sm font-serif font-bold text-temple-saffron-600">~120 Years Ago</div>
                  <h4 className="font-serif font-semibold text-lg text-temple-maroon-800">The Curse of Famine</h4>
                  <p className="text-sm text-temple-stone-700 mt-1">
                    An angered visiting Sanyasi curses the village with a water drought after being berated and denied hospitality. He foretells redemption only by the birth of a future great Gnani.
                  </p>
                </div>

                {/* Event 2 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 bg-temple-maroon-800 border-2 border-temple-saffron-500 rounded-full h-4 w-4"></div>
                  <div className="md:absolute md:-left-36 md:top-0 text-sm font-serif font-bold text-temple-saffron-600">1984</div>
                  <h4 className="font-serif font-semibold text-lg text-temple-maroon-800">Trust Foundation</h4>
                  <p className="text-sm text-temple-stone-700 mt-1">
                    Swami Haridhos Giri (Guruji), having received spiritual master initiation, establishes the GA Trust to manage spiritual and welfare plans.
                  </p>
                </div>

                {/* Event 3 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 bg-temple-maroon-800 border-2 border-temple-saffron-500 rounded-full h-4 w-4"></div>
                  <div className="md:absolute md:-left-36 md:top-0 text-sm font-serif font-bold text-temple-saffron-600">1985</div>
                  <h4 className="font-serif font-semibold text-lg text-temple-maroon-800">The Return of Guruji</h4>
                  <p className="text-sm text-temple-stone-700 mt-1">
                    While traveling, Guruji spots a signboard of his birth village "Thennangur" and visits. Seeing its dilapidated state and hearing of the curse, he prays and begins plans to construct the ashram and restore the village.
                  </p>
                </div>

                {/* Event 4 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 bg-temple-maroon-800 border-2 border-temple-saffron-500 rounded-full h-4 w-4"></div>
                  <div className="md:absolute md:-left-36 md:top-0 text-sm font-serif font-bold text-temple-saffron-600">1996</div>
                  <h4 className="font-serif font-semibold text-lg text-temple-maroon-800">Kumbhabhishekam (Consecration)</h4>
                  <p className="text-sm text-temple-stone-700 mt-1">
                    The majestic Panduranga Rakhumayi Temple, Meenakshi Sundareshwar Temple, and Maha Shodasi Temple are completed. The grand Kumbhabhishekam consecration takes place, restoring prosperity and ending the curse.
                  </p>
                </div>

                {/* Event 5 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 bg-temple-maroon-800 border-2 border-temple-saffron-500 rounded-full h-4 w-4"></div>
                  <div className="md:absolute md:-left-36 md:top-0 text-sm font-serif font-bold text-temple-saffron-600">Present Day</div>
                  <h4 className="font-serif font-semibold text-lg text-temple-maroon-800">Thriving Sacred Hub</h4>
                  <p className="text-sm text-temple-stone-700 mt-1">
                    The GA Trust runs the hospital, senior citizens home, goshala, and provides livelihood and water to thousands of local families under the guidance of managing trustees.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TEMPLES DYNAMIC DETAILS ROUTE (#/temples) 
            ======================================================== */}
        {isRoute('#/temples') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            
            {/* If a specific temple is selected */}
            {route.includes('/') && route.split('/').length > 2 ? (
              (() => {
                const templeId = route.split('/')[2];
                const page = contentDb.pages[templeId];
                if (!page) return <div className="text-center py-12 font-serif text-lg">Temple page not found.</div>;
                
                // Find matching poojas
                const relatedPoojas = contentDb.poojas.filter(p => 
                  p.category.toLowerCase().includes(templeId.split('-')[0]) || 
                  (templeId.includes('lakshmi') && p.name.toLowerCase().includes('lakshmi'))
                );

                const meta = TEMPLE_METADATA[templeId] || {
                  heroImage: page.images?.[0]?.src || '/images/temples/panduranga-outside.jpg',
                  deity: 'Presiding Deities',
                  style: 'Traditional Architecture',
                  highlight: 'Spiritual Sanctuary',
                  established: 'Thennangur Ashram',
                  subtitle: 'Dakshina Pandharpur'
                };

                const uniqueImages = [];
                const seenSrc = new Set();
                if (page.images) {
                  page.images.forEach(img => {
                    const src = img.src.trim();
                    if (!seenSrc.has(src)) {
                      seenSrc.add(src);
                      uniqueImages.push(img);
                    }
                  });
                }

                const timings = TEMPLE_TIMINGS[templeId] || [];

                return (
                  <div className="space-y-8">
                    {/* Back Link */}
                    <div>
                      <a href="#/temples" className="inline-flex items-center gap-1 text-sm font-semibold text-temple-maroon-800 hover:text-temple-saffron-600 transition-colors">
                        <ChevronLeft size={16} /> Back to All Temples
                      </a>
                    </div>

                    {/* Cinematic Temple Hero Banner */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[45vh] min-h-[300px] flex flex-col justify-end bg-temple-stone-900 border border-temple-stone-200">
                      <img 
                        src={meta.heroImage} 
                        alt={page.title} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
                      
                      <div className="relative p-6 sm:p-10 space-y-3 z-10 max-w-4xl text-white">
                        <span className="text-temple-saffron-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
                          {meta.subtitle}
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-wide drop-shadow-md">
                          {page.title}
                        </h2>
                        
                        {/* Quick Stats Grid */}
                        <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/20 mt-4 text-xs sm:text-sm font-sans text-temple-stone-100">
                          <div>
                            <span className="block text-temple-saffron-300 font-semibold uppercase text-[10px] tracking-wider">Presiding Deity</span>
                            <span className="font-serif">{meta.deity}</span>
                          </div>
                          <div>
                            <span className="block text-temple-saffron-300 font-semibold uppercase text-[10px] tracking-wider">Architectural Style</span>
                            <span>{meta.style}</span>
                          </div>
                          <div>
                            <span className="block text-temple-saffron-300 font-semibold uppercase text-[10px] tracking-wider">Key Highlight</span>
                            <span>{meta.highlight}</span>
                          </div>
                          <div>
                            <span className="block text-temple-saffron-300 font-semibold uppercase text-[10px] tracking-wider">Heritage & Era</span>
                            <span>{meta.established}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-temple-stone-200 bg-white p-2 rounded-xl shadow-sm gap-2">
                      <button
                        onClick={() => setActiveTempleTab('overview')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold tracking-wide transition-all ${
                          activeTempleTab === 'overview'
                            ? 'bg-temple-maroon-800 text-white shadow'
                            : 'text-temple-stone-600 hover:bg-temple-stone-100 hover:text-temple-maroon-850'
                        }`}
                      >
                        <Compass size={18} />
                        Sthala Puranam
                      </button>
                      <button
                        onClick={() => setActiveTempleTab('gallery')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold tracking-wide transition-all ${
                          activeTempleTab === 'gallery'
                            ? 'bg-temple-maroon-800 text-white shadow'
                            : 'text-temple-stone-600 hover:bg-temple-stone-100 hover:text-temple-maroon-850'
                        }`}
                      >
                        <ImageIcon size={18} />
                        Sacred Gallery
                      </button>
                      <button
                        onClick={() => setActiveTempleTab('poojas')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold tracking-wide transition-all ${
                          activeTempleTab === 'poojas'
                            ? 'bg-temple-maroon-800 text-white shadow'
                            : 'text-temple-stone-600 hover:bg-temple-stone-100 hover:text-temple-maroon-850'
                        }`}
                      >
                        <Clock size={18} />
                        Darshan & Poojas
                      </button>
                    </div>

                    {/* Tab Content Panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* Left Column - Main Tab Content */}
                      <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-temple-stone-200 shadow-sm min-h-[400px]">
                        {activeTempleTab === 'overview' && (
                          <div className="space-y-6">
                            <h3 className="font-serif text-2xl font-bold text-temple-maroon-800 pb-2 border-b border-temple-stone-150">
                              Sacred History & Details
                            </h3>
                            <div className="prose prose-no-images text-justify font-sans leading-relaxed" dangerouslySetInnerHTML={{ __html: page.html }} />
                          </div>
                        )}

                        {activeTempleTab === 'gallery' && (
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-serif text-2xl font-bold text-temple-maroon-800">
                                Sacred Gallery
                              </h3>
                              <p className="text-xs text-temple-stone-500 mt-1">
                                Click on any image to open the full-screen virtual Darshan lightbox.
                              </p>
                            </div>
                            
                            {uniqueImages.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {uniqueImages.map((img, index) => (
                                  <div 
                                    key={index}
                                    onClick={() => setTempleLightboxIndex(index)}
                                    className="aspect-square rounded-xl overflow-hidden border border-temple-stone-200 bg-temple-stone-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow group relative"
                                  >
                                    <img 
                                      src={img.src} 
                                      alt={img.alt || "Temple view"} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <span className="text-white text-xs font-semibold bg-temple-maroon-900/80 px-3 py-1.5 rounded-full border border-white/20">
                                        View Darshan
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12 text-temple-stone-500 font-medium">No gallery images found for this temple.</div>
                            )}
                          </div>
                        )}

                        {activeTempleTab === 'poojas' && (
                          <div className="space-y-8">
                            {/* Darshan & Daily Programmes */}
                            <div className="space-y-4">
                              <h3 className="font-serif text-2xl font-bold text-temple-maroon-800 pb-2 border-b border-temple-stone-150">
                                Daily Programmes & Timings
                              </h3>
                              <div className="overflow-hidden rounded-xl border border-temple-stone-200 shadow-inner bg-temple-stone-50">
                                <table className="min-w-full divide-y divide-temple-stone-200">
                                  <thead className="bg-temple-stone-100">
                                    <tr>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-temple-saffron-700 uppercase tracking-wider">
                                        Time
                                      </th>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-temple-saffron-700 uppercase tracking-wider">
                                        Ritual / Seva
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-temple-stone-150">
                                    {timings.map((t, idx) => (
                                      <tr key={idx} className={t.event.toLowerCase().includes('closed') ? 'bg-temple-maroon-50/30' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-temple-maroon-900 font-serif">
                                          {t.time}
                                        </td>
                                        <td className={`px-6 py-4 text-sm text-temple-stone-800 ${t.event.toLowerCase().includes('closed') ? 'italic font-medium text-temple-stone-600' : ''}`}>
                                          {t.event}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Temple Specific Poojas */}
                            <div className="space-y-4 pt-4 border-t border-temple-stone-200">
                              <h3 className="font-serif text-2xl font-bold text-temple-maroon-800">
                                Available Sannidhi Poojas
                              </h3>
                              {relatedPoojas.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {relatedPoojas.map(p => (
                                    <div key={p.id} className="bg-temple-stone-50 border border-temple-stone-200 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                                      <div className="space-y-1">
                                        <h4 className="font-serif font-bold text-temple-maroon-900 text-lg leading-tight">{p.name}</h4>
                                        <div className="flex gap-2 items-center">
                                          <span className="text-xs font-bold text-temple-saffron-600 bg-temple-saffron-50 px-2 py-0.5 rounded border border-temple-saffron-100">
                                            ₹{p.price.toLocaleString('en-IN')}
                                          </span>
                                          {p.schedule && (
                                            <span className="text-[10px] text-temple-stone-500 font-semibold uppercase">{p.schedule}</span>
                                          )}
                                        </div>
                                        {p.description && (
                                          <p className="text-xs text-temple-stone-600 pt-1 line-clamp-3 leading-relaxed">{p.description}</p>
                                        )}
                                      </div>
                                      <button 
                                        onClick={() => {
                                          setSelectedPooja(p);
                                          setPaymentStep(0);
                                          window.location.hash = '#/pooja-booking';
                                        }}
                                        className="bg-temple-saffron-600 hover:bg-temple-saffron-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors text-center w-full"
                                      >
                                        Book Pooja
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-temple-stone-500 bg-temple-stone-100 p-4 rounded-lg border border-dashed border-temple-stone-200">
                                  No dedicated online bookings are currently active for this specific sannidhi. You can browse general poojas below.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Permanent Sidebar Widgets */}
                      <div className="lg:col-span-4 space-y-8">
                        {/* Quick Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-temple-stone-200 p-6 space-y-6">
                          <h3 className="font-serif font-bold text-xl text-temple-maroon-800 border-b border-temple-stone-200 pb-2 flex items-center gap-2">
                            <Clock size={20} className="text-temple-saffron-600" /> Darshan Timings
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-temple-stone-100 pb-2">
                              <span className="font-semibold text-temple-stone-700">Opening Hours</span>
                              <span className="text-temple-maroon-900 font-medium">6:00 AM - 8:00 PM</span>
                            </div>
                            <div className="flex justify-between border-b border-temple-stone-100 pb-2">
                              <span className="font-semibold text-temple-stone-700">Daily Abhishekam</span>
                              <span className="text-temple-maroon-900 font-medium">Daily morning hours</span>
                            </div>
                            <div className="flex justify-between border-b border-temple-stone-100 pb-2">
                              <span className="font-semibold text-temple-stone-700">Recess Time</span>
                              <span className="text-temple-maroon-900 font-medium">12:00 PM - 4:00 PM</span>
                            </div>
                            <p className="text-xs text-temple-stone-500">
                              *Times may differ slightly on special festival days and solar/lunar eclipses.
                            </p>
                          </div>
                        </div>

                        {/* Interactive Seva Booking Widget */}
                        <div className="bg-temple-maroon-900 text-white rounded-2xl shadow-lg p-6 space-y-6 relative overflow-hidden">
                          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                          <h3 className="font-serif font-bold text-xl text-temple-saffron-300 border-b border-white/10 pb-2 flex items-center gap-2">
                            <Heart size={20} className="text-temple-saffron-400 animate-pulse" /> Participate in Seva
                          </h3>
                          <p className="text-sm text-temple-stone-100 leading-relaxed">
                            Support the sacred traditions and welfare efforts of Thennangur Ashram. Perform an online archana or feed the poor.
                          </p>
                          <div className="space-y-3 pt-2">
                            <a 
                              href="#/pooja-booking" 
                              className="block bg-temple-saffron-600 hover:bg-temple-saffron-550 text-white text-center font-bold py-3 rounded-lg text-sm shadow transition-all"
                            >
                              Book General Pooja Seva
                            </a>
                            <a 
                              href="#/donations" 
                              className="block bg-white hover:bg-temple-stone-100 text-temple-maroon-900 text-center font-bold py-3 rounded-lg text-sm transition-all"
                            >
                              Donate to Annadanam / Goshala
                            </a>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Lightbox Modal */}
                    {templeLightboxIndex !== null && uniqueImages.length > 0 && (
                      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4">
                        {/* Close button */}
                        <button 
                          onClick={() => setTempleLightboxIndex(null)}
                          className="absolute top-6 right-6 text-white hover:text-temple-saffron-400 p-2 focus:outline-none transition-colors"
                          aria-label="Close virtual Darshan"
                        >
                          <X size={36} />
                        </button>
                        
                        {/* Navigation - Prev */}
                        <button 
                          onClick={() => setTempleLightboxIndex((templeLightboxIndex - 1 + uniqueImages.length) % uniqueImages.length)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-temple-saffron-400 p-3 bg-black/40 hover:bg-black/70 rounded-full transition-all focus:outline-none"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={36} />
                        </button>
                        
                        {/* Image & Alt */}
                        <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center p-2">
                          <img 
                            src={uniqueImages[templeLightboxIndex].src} 
                            alt={uniqueImages[templeLightboxIndex].alt || "Sacred Darshan"} 
                            className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-white/10"
                          />
                          {uniqueImages[templeLightboxIndex].alt && (
                            <p className="text-white text-center mt-4 font-serif text-lg tracking-wider bg-temple-maroon-900/90 px-6 py-2 rounded-lg border border-temple-saffron-600/30 max-w-lg">
                              {uniqueImages[templeLightboxIndex].alt}
                            </p>
                          )}
                          <div className="text-temple-stone-400 text-xs mt-2">
                            {templeLightboxIndex + 1} of {uniqueImages.length}
                          </div>
                        </div>
                        
                        {/* Navigation - Next */}
                        <button 
                          onClick={() => setTempleLightboxIndex((templeLightboxIndex + 1) % uniqueImages.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-temple-saffron-400 p-3 bg-black/40 hover:bg-black/70 rounded-full transition-all focus:outline-none"
                          aria-label="Next image"
                        >
                          <ChevronRight size={36} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              // General Temples Page Hub
              <div className="space-y-12">
                {/* Cinematic Header */}
                <div className="relative rounded-2xl overflow-hidden bg-temple-maroon-900 text-white shadow-xl">
                  {/* Background pattern overlay */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-temple-maroon-950 via-temple-maroon-900/90 to-transparent"></div>
                  
                  <div className="relative max-w-3xl p-8 sm:p-12 md:p-16 space-y-4">
                    <span className="text-temple-saffron-400 font-bold uppercase tracking-widest text-xs sm:text-sm">Divine Sanctuary</span>
                    <h2 className="text-3xl sm:text-5xl font-serif font-bold leading-tight drop-shadow-md">
                      Sacred Temples of Thennangur
                    </h2>
                    <div className="w-20 h-1 bg-temple-saffron-500"></div>
                    <p className="text-temple-stone-200 text-sm sm:text-base leading-relaxed">
                      Conceived and consecrated by Sri Guruji Swami Haridhos Giri, our ashram complex houses four distinct temples. Each represents a unique school of spiritual architecture and philosophy, serving as centers of worship, meditation, and Namasankirtan.
                    </p>
                  </div>
                </div>

                {/* Elegant Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                  {/* Card 1: Panduranga */}
                  <div className="bg-white rounded-2xl shadow-md border border-temple-stone-200 overflow-hidden flex flex-col group hover:shadow-xl hover:border-temple-saffron-300/30 transition-all duration-300">
                    <div className="relative h-72 overflow-hidden bg-temple-stone-100">
                      <img 
                        src="/images/temples/panduranga-outside.jpg" 
                        alt="Panduranga Rakhumayi Temple" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                      <span className="absolute top-4 right-4 bg-temple-maroon-900 text-temple-saffron-300 text-xs font-bold px-3 py-1.5 rounded-lg font-serif border border-temple-saffron-600/30 shadow">
                        12ft High Deity
                      </span>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
                      <div className="space-y-2">
                        <span className="text-xs text-temple-saffron-600 font-bold uppercase tracking-wider">Dakshina Pandharpur</span>
                        <h3 className="font-serif text-2xl font-bold text-temple-maroon-800 group-hover:text-temple-maroon-900">
                          Panduranga Rakhumayi Temple
                        </h3>
                        <p className="text-sm text-temple-stone-700 leading-relaxed line-clamp-3">
                          Replicating the spiritual design of Pandharpur, this temple was built following a divine dream of Swami Haridhos Giri. It houses magnificent 12ft and 10ft idols of Lord Panduranga and Rakhumayi Devi, adorned in beautiful silver alankarams.
                        </p>
                      </div>
                      <a 
                        href="#/temples/panduranga-rakhumayi-temple" 
                        className="group flex items-center justify-between w-full bg-temple-stone-100 group-hover:bg-temple-maroon-800 group-hover:text-white px-5 py-3.5 rounded-xl font-bold text-sm text-temple-maroon-800 transition-all duration-300 border border-temple-stone-200 group-hover:border-transparent"
                      >
                        <span>Explore Sthala Puranam & Darshan</span>
                        <ChevronRight size={16} className="transform transition-transform group-hover:translate-x-1" />
                      </a>
                    </div>
                  </div>

                  {/* Card 2: Shree Matham */}
                  <div className="bg-white rounded-2xl shadow-md border border-temple-stone-200 overflow-hidden flex flex-col group hover:shadow-xl hover:border-temple-saffron-300/30 transition-all duration-300">
                    <div className="relative h-72 overflow-hidden bg-temple-stone-100">
                      <img 
                        src="/images/temples/shree-matham-temple.jpg" 
                        alt="Shree Matham" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                      <span className="absolute top-4 right-4 bg-temple-maroon-900 text-temple-saffron-300 text-xs font-bold px-3 py-1.5 rounded-lg font-serif border border-temple-saffron-600/30 shadow">
                        Spiritual Complex
                      </span>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
                      <div className="space-y-2">
                        <span className="text-xs text-temple-saffron-600 font-bold uppercase tracking-wider">Ashram Core</span>
                        <h3 className="font-serif text-2xl font-bold text-temple-maroon-800 group-hover:text-temple-maroon-900">
                          Shree Matham
                        </h3>
                        <p className="text-sm text-temple-stone-700 leading-relaxed line-clamp-3">
                          Serving as the sacred core of the Thennangur Ashram complex, Shree Matham houses the world-unique Maha Shodasi Temple, Sathguru Gnanananda Giri Sannidhi, Swami Haridhos Giri Brindavanam, and Swami Namananda Giri Adishthanam.
                        </p>
                      </div>
                      <a 
                        href="#/temples/shree-matham" 
                        className="group flex items-center justify-between w-full bg-temple-stone-100 group-hover:bg-temple-maroon-800 group-hover:text-white px-5 py-3.5 rounded-xl font-bold text-sm text-temple-maroon-800 transition-all duration-300 border border-temple-stone-200 group-hover:border-transparent"
                      >
                        <span>Explore Shrines & Darshan</span>
                        <ChevronRight size={16} className="transform transition-transform group-hover:translate-x-1" />
                      </a>
                    </div>
                  </div>

                  {/* Card 3: Meenakshi Sundareshwar */}
                  <div className="bg-white rounded-2xl shadow-md border border-temple-stone-200 overflow-hidden flex flex-col group hover:shadow-xl hover:border-temple-saffron-300/30 transition-all duration-300">
                    <div className="relative h-72 overflow-hidden bg-temple-stone-100">
                      <img 
                        src="/images/temples/meenakshi-outside.jpg" 
                        alt="Meenakshi Sundareshwar Temple" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                      <span className="absolute top-4 right-4 bg-temple-maroon-900 text-temple-saffron-300 text-xs font-bold px-3 py-1.5 rounded-lg font-serif border border-temple-saffron-600/30 shadow">
                        South Dravidian Style
                      </span>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
                      <div className="space-y-2">
                        <span className="text-xs text-temple-saffron-600 font-bold uppercase tracking-wider">Dakshina Halasyam</span>
                        <h3 className="font-serif text-2xl font-bold text-temple-maroon-800 group-hover:text-temple-maroon-900">
                          Meenakshi Sundareshwar Temple
                        </h3>
                        <p className="text-sm text-temple-stone-700 leading-relaxed line-clamp-3">
                          Built at the historic birthplace of Goddess Meenakshi, this South-Indian style temple depicts the divine wedding of Shiva and Parvathy. It features unique Bana Lingam and rare shrines of Navagrahas with their consorts.
                        </p>
                      </div>
                      <a 
                        href="#/temples/meenakshi-sundareshwar-temple" 
                        className="group flex items-center justify-between w-full bg-temple-stone-100 group-hover:bg-temple-maroon-800 group-hover:text-white px-5 py-3.5 rounded-xl font-bold text-sm text-temple-maroon-800 transition-all duration-300 border border-temple-stone-200 group-hover:border-transparent"
                      >
                        <span>Explore Sthala Puranam & Darshan</span>
                        <ChevronRight size={16} className="transform transition-transform group-hover:translate-x-1" />
                      </a>
                    </div>
                  </div>

                  {/* Card 4: Lakshmi Narayan */}
                  <div className="bg-white rounded-2xl shadow-md border border-temple-stone-200 overflow-hidden flex flex-col group hover:shadow-xl hover:border-temple-saffron-300/30 transition-all duration-300">
                    <div className="relative h-72 overflow-hidden bg-temple-stone-100">
                      <img 
                        src="/images/temples/lakshmi-narayan.jpg" 
                        alt="Lakshmi Narayan Temple" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                      <span className="absolute top-4 right-4 bg-temple-maroon-900 text-temple-saffron-300 text-xs font-bold px-3 py-1.5 rounded-lg font-serif border border-temple-saffron-600/30 shadow">
                        Oldest Rebuilt Temple
                      </span>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
                      <div className="space-y-2">
                        <span className="text-xs text-temple-saffron-600 font-bold uppercase tracking-wider">Veda & Shastra Center</span>
                        <h3 className="font-serif text-2xl font-bold text-temple-maroon-800 group-hover:text-temple-maroon-900">
                          Lakshmi Narayan Temple
                        </h3>
                        <p className="text-sm text-temple-stone-700 leading-relaxed line-clamp-3">
                          Originally an ancient Shiva-Vishnu temple that had fallen to decay, Sri Guruji rebuilt it in 1985 to restore prosperity to the village. Consecrating Goddess Lakshmi alongside Lord Narayana, it marks the historic dawn of Thennangur Ashram.
                        </p>
                      </div>
                      <a 
                        href="#/temples/lakshmi-narayan-temple" 
                        className="group flex items-center justify-between w-full bg-temple-stone-100 group-hover:bg-temple-maroon-800 group-hover:text-white px-5 py-3.5 rounded-xl font-bold text-sm text-temple-maroon-800 transition-all duration-300 border border-temple-stone-200 group-hover:border-transparent"
                      >
                        <span>Explore Sthala Puranam & Darshan</span>
                        <ChevronRight size={16} className="transform transition-transform group-hover:translate-x-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            ASHRAM / GURUS BIOGRAPHIES ROUTE (#/ashram) 
            ======================================================== */}
        {isRoute('#/ashram') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Specific Guru selected */}
            {route.includes('/') && route.split('/').length > 2 ? (
              (() => {
                const guruId = route.split('/')[2];
                const page = contentDb.pages[guruId];
                if (!page) return <div className="text-center py-12 font-serif text-lg">Guru page not found.</div>;
                
                // Get guru portrait mapping
                let imgUrl = '/images/guruji/swami-haridhos-giri.jpg';
                if (guruId.includes('gnanananda')) imgUrl = '/images/gnanananda/gnanananda-portrait.jpg';
                else if (guruId.includes('namananda')) imgUrl = '/images/gnanananda/namananda-portrait.jpg';
                else if (guruId.includes('brindavan')) imgUrl = '/images/ashram/swami-haridhos-giri-brindavan.jpg';
                else if (guruId.includes('mandapam')) imgUrl = '/images/temples/guruji-mani-mandapam.jpg';

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Sidebar with portrait */}
                    <div className="lg:col-span-4 space-y-6">
                      <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 p-6 text-center">
                        <img 
                          src={imgUrl} 
                          alt={page.title} 
                          className="w-48 h-48 rounded-full mx-auto object-cover border-4 border-temple-saffron-100 shadow-md"
                          loading="lazy"
                        />
                        <h3 className="font-serif text-xl font-bold text-temple-maroon-800 mt-4">{page.title}</h3>
                        <p className="text-xs text-temple-saffron-600 font-bold uppercase mt-1">Spiritual Lineage</p>
                        <div className="w-12 h-0.5 bg-temple-saffron-500 mx-auto my-3"></div>
                        <p className="text-xs text-temple-stone-500">Swami Haridhos Giri Ashram, Thennangur</p>
                      </div>

                      <div className="bg-temple-stone-100 rounded-xl p-6 border border-temple-stone-200 space-y-3 text-sm">
                        <h4 className="font-serif font-bold text-temple-maroon-800">Radhe Krishna</h4>
                        <p className="text-temple-stone-700">
                          "Namasankirtan is the easiest path to salvation in Kali Yuga." - Sri Guruji
                        </p>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-6">
                      <a href="#/" className="text-sm text-temple-maroon-800 hover:text-temple-saffron-600 font-semibold flex items-center gap-1">
                        &larr; Back to Home
                      </a>
                      <h2 className="text-3xl font-serif font-bold text-temple-maroon-800">
                        Biography: {page.title}
                      </h2>
                      <div className="w-16 h-1 bg-temple-saffron-500"></div>
                      
                      <div className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
                    </div>

                  </div>
                );
              })()
            ) : (
              // General Gurus Page List
              <div className="space-y-12">
                <div className="text-center space-y-3">
                  <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs">Auspicious Lineage</span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">Our Spiritual Masters</h2>
                  <div className="w-16 h-1 bg-temple-saffron-500 mx-auto"></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Master 1 */}
                    <div className="bg-white rounded-xl shadow border border-temple-stone-200 overflow-hidden flex flex-col items-center p-8 text-center space-y-4">
                      <img src="/images/guruji/swami-haridhos-giri.jpg" alt="Swami Haridhos Giri" className="w-40 h-40 rounded-full object-cover border-4 border-temple-saffron-100" />
                      <h3 className="font-serif text-xl font-bold text-temple-maroon-800">Swami Haridhos Giri (Guruji)</h3>
                      <p className="text-sm text-temple-stone-600">
                        The founder master of Thennangur Ashram. An incredible master who popularized Namasankirtan, traveled widely, and transformed a cursed village into a spiritual legacy.
                      </p>
                      <a href="#/ashram/swami-haridhos-giri" className="bg-temple-maroon-850 hover:bg-temple-maroon-900 text-white text-sm font-semibold px-6 py-2 rounded-lg transition-colors">
                        View Biography
                      </a>
                    </div>

                    {/* Master 2 */}
                    <div className="bg-white rounded-xl shadow border border-temple-stone-200 overflow-hidden flex flex-col items-center p-8 text-center space-y-4">
                      <img src="/images/gnanananda/gnanananda-portrait.jpg" alt="Sathguru Gnanananda Giri" className="w-40 h-40 rounded-full object-cover border-4 border-temple-saffron-100" />
                      <h3 className="font-serif text-xl font-bold text-temple-maroon-800">Sathguru Gnanananda Giri</h3>
                      <p className="text-sm text-temple-stone-600">
                        The great Master of Swami Haridhos Giri. His teachings of self-realization, meditation, and chanting lay at the foundational heart of the Ashram's daily operations.
                      </p>
                      <a href="#/ashram/sathguru-gnanananda-giri" className="bg-temple-maroon-850 hover:bg-temple-maroon-900 text-white text-sm font-semibold px-6 py-2 rounded-lg transition-colors">
                        View Biography
                      </a>
                    </div>

                    {/* Master 3 */}
                    <div className="bg-white rounded-xl shadow border border-temple-stone-200 overflow-hidden flex flex-col items-center p-8 text-center space-y-4">
                      <img src="/images/gnanananda/namananda-portrait.jpg" alt="Swami Namananda Giri" className="w-40 h-40 rounded-full object-cover border-4 border-temple-saffron-100" />
                      <h3 className="font-serif text-xl font-bold text-temple-maroon-800">Swami Namananda Giri (Namaji)</h3>
                      <p className="text-sm text-temple-stone-600">
                        Chief disciple and direct administrative successor to Swami Haridhos Giri. He strictly maintained Ashram traditions, poojas, and charitable activities.
                      </p>
                      <a href="#/ashram/swami-namananda-giri-adhisthanam" className="bg-temple-maroon-850 hover:bg-temple-maroon-900 text-white text-sm font-semibold px-6 py-2 rounded-lg transition-colors">
                        View Biography
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            POOJA BOOKING ROUTE (#/pooja-booking) 
            ======================================================== */}
        {isRoute('#/pooja-booking') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {paymentStep === 0 && (
              <div className="space-y-12">
                
                {/* Intro and Filters */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                  <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs">Sacred Sevas</span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">Online Pooja Booking</h2>
                  <div className="w-20 h-1 bg-temple-saffron-500 mx-auto"></div>
                  <p className="text-temple-stone-700 text-sm">
                    Select a pooja below to offer prayers. Provide devotee details such as Name, Gotram, and Star. You will receive an instant official receipt and automated WhatsApp confirmation.
                  </p>
                  
                  {/* Search and Category Filter Controls */}
                  <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5 relative">
                      <Search className="absolute left-3 top-3 text-temple-stone-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search for pooja (e.g. Archana, Homam)..." 
                        value={poojaSearch}
                        onChange={(e) => setPoojaSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-temple-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-temple-saffron-500 bg-white"
                      />
                    </div>
                    <div className="md:col-span-7 flex flex-wrap gap-2 justify-end">
                      {['All', 'Sree Matam', 'Panduranga', 'Meenakshi', 'Lakshmi'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setPoojaCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            poojaCategory === cat 
                              ? 'bg-temple-maroon-800 text-white border-temple-maroon-800 shadow' 
                              : 'bg-white text-temple-stone-750 border-temple-stone-250 hover:bg-temple-stone-50'
                          }`}
                        >
                          {cat === 'All' ? 'All Sannidhies' : cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Poojas Grid */}
                {(() => {
                  const filtered = contentDb.poojas.filter(p => {
                    const matchSearch = p.name.toLowerCase().includes(poojaSearch.toLowerCase()) || p.description.toLowerCase().includes(poojaSearch.toLowerCase());
                    const matchCat = poojaCategory === 'All' || p.category.toLowerCase().includes(poojaCategory.toLowerCase()) || (poojaCategory === 'Sree Matam' && p.category.toLowerCase().includes('matam'));
                    return matchSearch && matchCat;
                  });

                  if (filtered.length === 0) {
                    return <div className="text-center py-12 text-temple-stone-500 font-serif">No poojas found matching your filters.</div>;
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filtered.map(pooja => (
                        <div key={pooja.id} className="bg-white rounded-xl shadow-md border border-temple-stone-200 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow group">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[10px] font-bold text-temple-saffron-600 tracking-wider bg-temple-saffron-50 px-2 py-0.5 rounded uppercase">
                                {pooja.category.split(' Poojas')[0]}
                              </span>
                              {pooja.schedule && (
                                <span className="text-[10px] font-semibold text-temple-stone-500 flex items-center gap-0.5">
                                  <Clock size={10} /> {pooja.schedule}
                                </span>
                              )}
                            </div>
                            <h3 className="font-serif font-bold text-lg text-temple-maroon-800 leading-snug group-hover:text-temple-maroon-900 transition-colors">
                              {pooja.name}
                            </h3>
                            <p className="text-sm text-temple-stone-600 line-clamp-3">
                              {pooja.description || 'Seek divine blessings by performing this ritual, carrying the pure tradition of Swami Haridhos Giri Ashram.'}
                            </p>
                          </div>

                          <div className="pt-6 border-t border-temple-stone-100 mt-6 flex justify-between items-center">
                            <span className="font-serif font-bold text-lg text-temple-stone-800">
                              ₹{pooja.price.toLocaleString('en-IN')}
                            </span>
                            <button
                              onClick={() => setSelectedPooja(pooja)}
                              className="bg-temple-saffron-600 hover:bg-temple-saffron-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
                            >
                              Book Pooja
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

              </div>
            )}

            {/* POOJA BOOKING FORM MODAL */}
            {selectedPooja && paymentStep === 0 && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
                  
                  {/* Header */}
                  <div className="bg-temple-maroon-800 text-white p-6 flex justify-between items-center">
                    <div>
                      <span className="text-xs uppercase text-temple-saffron-300 font-bold tracking-wider">{selectedPooja.category}</span>
                      <h3 className="font-serif font-bold text-xl">{selectedPooja.name}</h3>
                    </div>
                    <button onClick={resetPortals} className="text-white/80 hover:text-white"><X size={24} /></button>
                  </div>

                  {/* Body Form */}
                  <form onSubmit={handlePoojaSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div>
                        <label className="block text-xs font-bold uppercase text-temple-stone-700 mb-1">Devotee Name *</label>
                        <input 
                          type="text" 
                          required
                          value={bookingForm.devoteeName}
                          onChange={(e) => setBookingForm({...bookingForm, devoteeName: e.target.value})}
                          placeholder="Devotee name (Sankalpam Karthe)"
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-temple-stone-700 mb-1">Pooja Date *</label>
                        <input 
                          type="date" 
                          required
                          value={bookingForm.poojaDate}
                          onChange={(e) => setBookingForm({...bookingForm, poojaDate: e.target.value})}
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-temple-stone-700 mb-1">Gotram (Lineage)</label>
                        <input 
                          type="text" 
                          value={bookingForm.gotram}
                          onChange={(e) => setBookingForm({...bookingForm, gotram: e.target.value})}
                          placeholder="e.g. Kashyapa, Bharadwaja"
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-temple-stone-700 mb-1">Nakshatram (Birth Star)</label>
                        <input 
                          type="text" 
                          value={bookingForm.nakshatram}
                          onChange={(e) => setBookingForm({...bookingForm, nakshatram: e.target.value})}
                          placeholder="e.g. Rohini, Revathi"
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-temple-stone-700 mb-1">Rasi (Zodiac)</label>
                        <input 
                          type="text" 
                          value={bookingForm.rasi}
                          onChange={(e) => setBookingForm({...bookingForm, rasi: e.target.value})}
                          placeholder="e.g. Mesha, Rishaba"
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-temple-stone-700 mb-1">WhatsApp / Phone *</label>
                        <input 
                          type="tel" 
                          required
                          value={bookingForm.phone}
                          onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                          placeholder="Confirmations sent here"
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none"
                        />
                      </div>

                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-temple-stone-700 mb-1">Email Address *</label>
                      <input 
                        type="email" 
                        required
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                        placeholder="For digital receipts"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-temple-stone-700 mb-1">Other Family Members (Names & Stars)</label>
                      <textarea 
                        rows={2}
                        value={bookingForm.familyMembers}
                        onChange={(e) => setBookingForm({...bookingForm, familyMembers: e.target.value})}
                        placeholder="Add details of family members to include in the archana"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-temple-stone-700 mb-1">Special Sankalpam Purpose (Optional)</label>
                      <input 
                        type="text" 
                        value={bookingForm.sankalpam}
                        onChange={(e) => setBookingForm({...bookingForm, sankalpam: e.target.value})}
                        placeholder="e.g. Birthday, Wedding Anniversary, Good Health"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none"
                      />
                    </div>

                    {/* Cost Info */}
                    <div className="bg-temple-stone-100 p-4 rounded-lg flex justify-between items-center border border-temple-stone-200 mt-2">
                      <span className="font-semibold text-temple-stone-750 text-sm">Total Dakshina Amount:</span>
                      <span className="text-xl font-bold font-serif text-temple-maroon-800">₹{selectedPooja.price.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-temple-stone-200">
                      <button 
                        type="button" 
                        onClick={resetPortals}
                        className="flex-1 py-3 border border-temple-stone-300 rounded-lg text-temple-stone-850 font-bold hover:bg-temple-stone-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-3 bg-temple-saffron-600 hover:bg-temple-saffron-700 text-white rounded-lg font-bold shadow-md transition-colors"
                      >
                        Proceed to Pay
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* PAYMENT GATEWAY SIMULATION */}
            {paymentStep === 1 && (
              <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-temple-stone-200 overflow-hidden my-12">
                <div className="bg-temple-maroon-800 p-6 text-white text-center">
                  <div className="flex justify-center mb-2"><Shield size={36} className="text-temple-saffron-300" /></div>
                  <h3 className="font-serif font-bold text-lg">GA Trust Secure Gateway</h3>
                  <p className="text-xs text-temple-stone-200 mt-1">Secured by 256-bit SSL encryption</p>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="bg-temple-stone-50 p-4 rounded-lg border border-temple-stone-150 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-temple-stone-600">Merchant:</span>
                      <span className="font-bold text-temple-stone-800">GA Trust Thennangur</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-temple-stone-600">Service:</span>
                      <span className="font-bold text-temple-stone-800">
                        {selectedPooja ? `Pooja Booking: ${selectedPooja.name}` : `Charitable Donation: ${donationForm.cause}`}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-temple-stone-200 font-semibold text-base text-temple-maroon-800">
                      <span>Total Amount:</span>
                      <span>
                        ₹{selectedPooja 
                          ? selectedPooja.price.toLocaleString('en-IN') 
                          : parseInt(donationForm.amount === 'custom' ? donationForm.customAmount : donationForm.amount, 10).toLocaleString('en-IN')
                        }
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="block text-xs font-bold text-temple-stone-700 uppercase tracking-wider">Select Payment Mode</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button className="border border-temple-saffron-500 bg-temple-saffron-50 text-temple-saffron-700 p-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1">
                        <span>UPI / GPay</span>
                      </button>
                      <button className="border border-temple-stone-200 hover:bg-temple-stone-50 p-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1">
                        <span>Card</span>
                      </button>
                      <button className="border border-temple-stone-200 hover:bg-temple-stone-50 p-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1">
                        <span>NetBanking</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => completePayment(selectedPooja ? 'pooja' : 'donation')}
                    className="w-full bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold py-3 rounded-lg shadow-md transition-colors"
                  >
                    Simulate Successful Payment
                  </button>
                  <button
                    onClick={() => setPaymentStep(0)}
                    className="w-full text-center text-xs text-temple-stone-500 hover:text-temple-stone-800 py-1"
                  >
                    Cancel & Go Back
                  </button>
                </div>
              </div>
            )}

            {/* DIGITAL RECEIPT SCREEN */}
            {paymentStep === 2 && receiptData && (
              <div className="max-w-2xl mx-auto my-12 space-y-6">
                
                {/* Visual success notice */}
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center p-3 bg-green-50 text-green-600 rounded-full border border-green-200 shadow-md">
                    <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-green-700">Payment Processed Successfully!</h2>
                  <p className="text-sm text-temple-stone-600 max-w-md mx-auto">
                    Your contribution has been recorded in the temple records. A copy of the receipt has been emailed to you.
                  </p>
                </div>

                {/* Printable Certificate/Receipt */}
                <div className="bg-white border-4 border-double border-temple-saffron-600 p-8 rounded-xl shadow-xl space-y-6 font-sans relative overflow-hidden print:border-0 print:shadow-none">
                  
                  {/* Subtle Background OM Symbol watermarked */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none text-[250px] font-bold text-temple-maroon-800">
                    ॐ
                  </div>

                  {/* Receipt Header */}
                  <div className="text-center border-b-2 border-temple-saffron-200 pb-6 space-y-2">
                    <span className="text-sm tracking-widest text-temple-saffron-600 uppercase font-semibold">Radhe Krishna</span>
                    <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-temple-maroon-800">G.A. TRUST — THENNANGUR ASHRAM</h3>
                    <p className="text-xs text-temple-stone-600">
                      Swami Haridhos Giri Ashram Complex, Vandavasi Taluk, Tamil Nadu 604408
                    </p>
                    <p className="text-[10px] text-temple-stone-500">Regd. Charity No: GA-1984/THN</p>
                  </div>

                  {/* Receipt Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-xs border-b border-temple-stone-150 pb-4">
                    <div>
                      <p className="text-temple-stone-500 font-semibold uppercase tracking-wider">Receipt Number</p>
                      <p className="font-bold text-temple-stone-900 mt-1">{receiptData.receiptNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-temple-stone-500 font-semibold uppercase tracking-wider">Transaction Date</p>
                      <p className="font-bold text-temple-stone-900 mt-1">{receiptData.date}</p>
                    </div>
                    <div>
                      <p className="text-temple-stone-500 font-semibold uppercase tracking-wider">Transaction ID</p>
                      <p className="font-mono text-temple-stone-850 mt-1">{receiptData.txnId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-temple-stone-500 font-semibold uppercase tracking-wider">Status</p>
                      <p className="font-bold text-green-600 mt-1 uppercase">✓ Confirmed</p>
                    </div>
                  </div>

                  {/* Devotee / Cause details */}
                  <div className="space-y-4">
                    <h4 className="font-serif font-bold text-temple-maroon-800 text-sm border-l-2 border-temple-saffron-500 pl-2 uppercase tracking-wide">
                      Transaction Summary
                    </h4>

                    {receiptData.type === 'pooja' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-temple-stone-50 p-4 rounded border border-temple-stone-200">
                        <div>
                          <span className="text-xs text-temple-stone-500">Devotee Name:</span>
                          <p className="font-bold text-temple-stone-950">{receiptData.details.devoteeName}</p>
                        </div>
                        <div>
                          <span className="text-xs text-temple-stone-500">Pooja Ritual:</span>
                          <p className="font-bold text-temple-maroon-800">{receiptData.poojaName}</p>
                        </div>
                        {receiptData.details.gotram && (
                          <div>
                            <span className="text-xs text-temple-stone-500">Gotram:</span>
                            <p className="font-medium text-temple-stone-800">{receiptData.details.gotram}</p>
                          </div>
                        )}
                        {receiptData.details.nakshatram && (
                          <div>
                            <span className="text-xs text-temple-stone-500">Nakshatram / Star:</span>
                            <p className="font-medium text-temple-stone-800">{receiptData.details.nakshatram}</p>
                          </div>
                        )}
                        {receiptData.details.rasi && (
                          <div>
                            <span className="text-xs text-temple-stone-500">Rasi:</span>
                            <p className="font-medium text-temple-stone-800">{receiptData.details.rasi}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-temple-stone-500">Scheduled Date:</span>
                          <p className="font-medium text-temple-stone-800">
                            {new Date(receiptData.details.poojaDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        {receiptData.details.familyMembers && (
                          <div className="sm:col-span-2">
                            <span className="text-xs text-temple-stone-500">Family Members:</span>
                            <p className="text-xs text-temple-stone-800 mt-0.5">{receiptData.details.familyMembers}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-temple-stone-50 p-4 rounded border border-temple-stone-200">
                        <div>
                          <span className="text-xs text-temple-stone-500">Donor Name:</span>
                          <p className="font-bold text-temple-stone-950">{receiptData.details.donorName}</p>
                        </div>
                        <div>
                          <span className="text-xs text-temple-stone-500">Charity Seva Cause:</span>
                          <p className="font-bold text-temple-maroon-800">{receiptData.cause}</p>
                        </div>
                        {receiptData.details.panNumber && (
                          <div>
                            <span className="text-xs text-temple-stone-500">PAN Exemption Number:</span>
                            <p className="font-mono font-medium text-temple-stone-850 uppercase">{receiptData.details.panNumber}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-temple-stone-500">Tax Relief:</span>
                          <p className="font-semibold text-green-700">Eligible under Section 80G</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Financial Statement */}
                  <div className="border-t border-temple-stone-250 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-temple-stone-600 text-center sm:text-left">
                      <p className="font-semibold">Payment Confirmed</p>
                      <p className="mt-0.5 text-[10px]">Automated digital signature. May the blessings of Lord Panduranga bring prosperity.</p>
                    </div>
                    <div className="bg-temple-maroon-50 border border-temple-maroon-200 rounded px-6 py-3 text-center sm:text-right">
                      <span className="text-xs text-temple-maroon-900 font-semibold uppercase block">Amount Paid</span>
                      <span className="text-2xl font-bold font-serif text-temple-maroon-800">
                        ₹{receiptData.price.toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  </div>

                </div>

                {/* Print/Reset Actions */}
                <div className="flex gap-4 print:hidden">
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 py-3 bg-white hover:bg-temple-stone-100 border border-temple-stone-300 rounded-lg font-bold text-temple-stone-850 flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Download size={18} /> Print / Save PDF Receipt
                  </button>
                  <button 
                    onClick={resetPortals}
                    className="flex-1 py-3 bg-temple-saffron-600 hover:bg-temple-saffron-700 text-white rounded-lg font-bold shadow-md transition-colors text-center"
                  >
                    Go Back / Done
                  </button>
                </div>

                {/* WhatsApp notification simulation preview */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 text-xs text-green-800 print:hidden items-center">
                  <div className="bg-green-100 text-green-600 p-2 rounded-full"><Coffee size={18} /></div>
                  <div>
                    <span className="font-bold block text-green-900">WhatsApp Notification Sent:</span>
                    <p className="mt-0.5 italic">
                      "Radhe Krishna {receiptData.type === 'pooja' ? receiptData.details.devoteeName : receiptData.details.donorName}! Your {receiptData.type === 'pooja' ? `booking for ${receiptData.poojaName}` : `donation of ₹${receiptData.price} to ${receiptData.cause}`} is successfully confirmed at Thennangur Ashram. Receipt: {receiptData.receiptNo}. Prasadam tracking details will be sent shortly."
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ========================================================
            DONATIONS ROUTE (#/donations) 
            ======================================================== */}
        {isRoute('#/donations') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {paymentStep === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left Column: Storytelling / Transparency */}
                <div className="lg:col-span-6 space-y-8">
                  <div className="space-y-4">
                    <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs">Charitable Support</span>
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">Support Our Sevas</h2>
                    <div className="w-16 h-1 bg-temple-saffron-500"></div>
                    <p className="text-temple-stone-700">
                      Contributions made to the GA Trust directly fund temple rituals, cow sanctuaries, healthcare centers, and educational projects. Your support ensures the legacy of Sri Guruji is carried on.
                    </p>
                  </div>

                  {/* Seva causes description cards */}
                  <div className="space-y-4">
                    
                    {/* Annadanam */}
                    <div className="bg-white p-4 rounded-xl border border-temple-stone-200 flex gap-4 shadow-sm">
                      <div className="bg-temple-saffron-50 p-2 rounded-lg text-temple-saffron-600 h-10 w-10 flex items-center justify-center flex-shrink-0">
                        <Coffee size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-temple-maroon-800">Annadanam (Food Drive)</h4>
                        <p className="text-xs text-temple-stone-700">
                          "Serve food for all." Daily free feeding of hundreds of pilgrims, local villagers, and ashram visitors in the Annadhana Hall.
                        </p>
                      </div>
                    </div>

                    {/* Goshala */}
                    <div className="bg-white p-4 rounded-xl border border-temple-stone-200 flex gap-4 shadow-sm">
                      <div className="bg-temple-saffron-50 p-2 rounded-lg text-temple-saffron-600 h-10 w-10 flex items-center justify-center flex-shrink-0">
                        <Compass size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-temple-maroon-800">Goshala Seva (Cow Care)</h4>
                        <p className="text-xs text-temple-stone-700">
                          Protective shelter for over 50 cows. Your donation helps feed, maintain, and provide veterinary care for the sacred cows.
                        </p>
                      </div>
                    </div>

                    {/* Medical centre */}
                    <div className="bg-white p-4 rounded-xl border border-temple-stone-200 flex gap-4 shadow-sm">
                      <div className="bg-temple-saffron-50 p-2 rounded-lg text-temple-saffron-600 h-10 w-10 flex items-center justify-center flex-shrink-0">
                        <Heart size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-temple-maroon-800">Guruji Medical Centre</h4>
                        <p className="text-xs text-temple-stone-700">
                          A local hospital providing free or highly subsidized outpatient care, medicines, and medical camps for 20+ surrounding drought-prone villages.
                        </p>
                      </div>
                    </div>

                    {/* Senior home */}
                    <div className="bg-white p-4 rounded-xl border border-temple-stone-200 flex gap-4 shadow-sm">
                      <div className="bg-temple-saffron-50 p-2 rounded-lg text-temple-saffron-600 h-10 w-10 flex items-center justify-center flex-shrink-0">
                        <FileText size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-temple-maroon-800">Senior Citizens Home</h4>
                        <p className="text-xs text-temple-stone-700">
                          Free boarding, nutritious meals, medical supervision, and spiritual nourishment for elders in their twilight years in a peaceful ashram environment.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Column: Donation Form */}
                <div className="lg:col-span-6">
                  <div className="bg-white rounded-2xl shadow-xl border border-temple-stone-200 p-8 space-y-6">
                    <h3 className="font-serif font-bold text-xl text-temple-maroon-800 border-b border-temple-stone-200 pb-2">Donation Form</h3>
                    
                    <form onSubmit={handleDonationSubmit} className="space-y-6">
                      
                      {/* Cause selection */}
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-temple-stone-700 uppercase tracking-wider">Select Cause / Initiative *</span>
                        <select 
                          value={donationForm.cause}
                          onChange={(e) => setDonationForm({...donationForm, cause: e.target.value})}
                          className="w-full p-2.5 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                        >
                          <option value="Annadanam">Annadanam (Feeding Seva)</option>
                          <option value="Goshala Seva">Goshala Seva (Cow Care)</option>
                          <option value="Guruji Medical Centre">Guruji Medical Centre (Healthcare)</option>
                          <option value="Senior Citizens Home">Senior Citizens Home (Elder Care)</option>
                          <option value="Temple Maintenance & General Fund">Temple Maintenance & General Fund</option>
                        </select>
                      </div>

                      {/* Amount Selection */}
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-temple-stone-700 uppercase tracking-wider">Select Amount (INR) *</span>
                        <div className="grid grid-cols-3 gap-2">
                          {['500', '1000', '2500', '5000', '10000'].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setDonationForm({...donationForm, amount: amt})}
                              className={`py-2 rounded-lg font-serif font-bold transition-all border ${
                                donationForm.amount === amt 
                                  ? 'bg-temple-maroon-850 text-white border-temple-maroon-850 shadow' 
                                  : 'bg-white text-temple-stone-800 border-temple-stone-300 hover:bg-temple-stone-50'
                              }`}
                            >
                              ₹{parseInt(amt, 10).toLocaleString('en-IN')}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setDonationForm({...donationForm, amount: 'custom'})}
                            className={`py-2 rounded-lg font-semibold transition-all border ${
                              donationForm.amount === 'custom' 
                                ? 'bg-temple-maroon-850 text-white border-temple-maroon-850 shadow' 
                                : 'bg-white text-temple-stone-800 border-temple-stone-300 hover:bg-temple-stone-50'
                            }`}
                          >
                            Custom
                          </button>
                        </div>

                        {donationForm.amount === 'custom' && (
                          <div className="pt-2 relative">
                            <span className="absolute left-3 top-5 text-sm text-temple-stone-600 font-bold">₹</span>
                            <input 
                              type="number" 
                              required
                              min="100"
                              placeholder="Enter custom amount (Min. ₹100)"
                              value={donationForm.customAmount}
                              onChange={(e) => setDonationForm({...donationForm, customAmount: e.target.value})}
                              className="w-full pl-7 pr-3 py-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* Donor info */}
                      <div className="space-y-4">
                        <span className="block text-xs font-bold text-temple-stone-700 uppercase tracking-wider border-b border-temple-stone-150 pb-1">Donor Details</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-temple-stone-650 mb-1">Donor Full Name *</label>
                            <input 
                              type="text" 
                              required
                              value={donationForm.donorName}
                              onChange={(e) => setDonationForm({...donationForm, donorName: e.target.value})}
                              placeholder="Full name"
                              className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-temple-stone-650 mb-1">PAN Card Number (for 80G tax benefit)</label>
                            <input 
                              type="text" 
                              value={donationForm.panNumber}
                              onChange={(e) => setDonationForm({...donationForm, panNumber: e.target.value.toUpperCase()})}
                              placeholder="e.g. ABCDE1234F"
                              className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none text-sm uppercase"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-temple-stone-650 mb-1">Email Address *</label>
                            <input 
                              type="email" 
                              required
                              value={donationForm.email}
                              onChange={(e) => setDonationForm({...donationForm, email: e.target.value})}
                              placeholder="For digital 80G receipt"
                              className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-temple-stone-650 mb-1">Phone Number *</label>
                            <input 
                              type="tel" 
                              required
                              value={donationForm.phone}
                              onChange={(e) => setDonationForm({...donationForm, phone: e.target.value})}
                              placeholder="WhatsApp number"
                              className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-temple-stone-650 mb-1">Donor Address</label>
                          <textarea 
                            rows={2}
                            value={donationForm.address}
                            onChange={(e) => setDonationForm({...donationForm, address: e.target.value})}
                            placeholder="Residential Address"
                            className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 focus:outline-none text-sm"
                          />
                        </div>
                      </div>

                      {/* Exemption Disclaimer */}
                      <div className="bg-green-50 border border-green-200 rounded p-3 text-xs text-green-800 flex gap-2 items-start">
                        <Shield size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Tax Exemption Exemption:</span>
                          <p className="mt-0.5 text-green-700">
                            All donations to G.A. Trust are eligible for tax relief deductions under Section 80G of the Income Tax Act. Provide your PAN details to ensure automatic sync with your IT filings.
                          </p>
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold rounded-lg shadow-md transition-colors"
                      >
                        Submit Donation of ₹{donationForm.amount === 'custom' ? parseInt(donationForm.customAmount || '0', 10).toLocaleString('en-IN') : parseInt(donationForm.amount, 10).toLocaleString('en-IN')}
                      </button>

                    </form>
                  </div>
                </div>

              </div>
            )}

            {/* Simulated Payment for donation & receipt screens */}
            {paymentStep === 1 && (
              <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-temple-stone-200 overflow-hidden my-12 w-full">
                <div className="bg-temple-maroon-800 p-6 text-white text-center">
                  <div className="flex justify-center mb-2"><Shield size={36} className="text-temple-saffron-300" /></div>
                  <h3 className="font-serif font-bold text-lg">GA Trust Secure Gateway</h3>
                  <p className="text-xs text-temple-stone-200 mt-1">Secured by 256-bit SSL encryption</p>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="bg-temple-stone-50 p-4 rounded-lg border border-temple-stone-150 space-y-2 text-sm text-temple-stone-900">
                    <div className="flex justify-between">
                      <span className="text-temple-stone-600">Merchant:</span>
                      <span className="font-bold">GA Trust Thennangur</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-temple-stone-600">Service:</span>
                      <span className="font-bold">
                        Charitable Donation: {donationForm.cause}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-temple-stone-200 font-semibold text-base text-temple-maroon-800">
                      <span>Total Amount:</span>
                      <span>
                        ₹{parseInt(donationForm.amount === 'custom' ? donationForm.customAmount : donationForm.amount, 10).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="block text-xs font-bold text-temple-stone-700 uppercase tracking-wider">Select Payment Mode</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" className="border border-temple-saffron-500 bg-temple-saffron-50 text-temple-saffron-700 p-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1">
                        <span>UPI / GPay</span>
                      </button>
                      <button type="button" className="border border-temple-stone-200 hover:bg-temple-stone-50 p-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1">
                        <span>Card</span>
                      </button>
                      <button type="button" className="border border-temple-stone-200 hover:bg-temple-stone-50 p-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1">
                        <span>NetBanking</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => completePayment('donation')}
                    className="w-full bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold py-3 rounded-lg shadow-md transition-colors"
                  >
                    Simulate Successful Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStep(0)}
                    className="w-full text-center text-xs text-temple-stone-500 hover:text-temple-stone-850 py-1"
                  >
                    Cancel & Go Back
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 2 && receiptData && (
              <div className="max-w-2xl mx-auto my-12 space-y-6 w-full">
                
                {/* Visual success notice */}
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center p-3 bg-green-50 text-green-600 rounded-full border border-green-200 shadow-md">
                    <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-green-700">Payment Processed Successfully!</h2>
                  <p className="text-sm text-temple-stone-600 max-w-md mx-auto">
                    Your contribution has been recorded in the temple records. A copy of the receipt has been emailed to you.
                  </p>
                </div>

                {/* Printable Certificate/Receipt */}
                <div className="bg-white border-4 border-double border-temple-saffron-600 p-8 rounded-xl shadow-xl space-y-6 font-sans relative overflow-hidden print:border-0 print:shadow-none">
                  
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none text-[250px] font-bold text-temple-maroon-800">
                    ॐ
                  </div>

                  {/* Receipt Header */}
                  <div className="text-center border-b-2 border-temple-saffron-200 pb-6 space-y-2 text-temple-stone-900">
                    <span className="text-sm tracking-widest text-temple-saffron-600 uppercase font-semibold">Radhe Krishna</span>
                    <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-temple-maroon-800">G.A. TRUST — THENNANGUR ASHRAM</h3>
                    <p className="text-xs text-temple-stone-600">
                      Swami Haridhos Giri Ashram Complex, Vandavasi Taluk, Tamil Nadu 604408
                    </p>
                    <p className="text-[10px] text-temple-stone-500">Regd. Charity No: GA-1984/THN</p>
                  </div>

                  {/* Receipt Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-xs border-b border-temple-stone-150 pb-4 text-temple-stone-900">
                    <div>
                      <p className="text-temple-stone-500 font-semibold uppercase tracking-wider">Receipt Number</p>
                      <p className="font-bold mt-1">{receiptData.receiptNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-temple-stone-500 font-semibold uppercase tracking-wider">Transaction Date</p>
                      <p className="font-bold mt-1">{receiptData.date}</p>
                    </div>
                    <div>
                      <p className="text-temple-stone-500 font-semibold uppercase tracking-wider">Transaction ID</p>
                      <p className="font-mono mt-1">{receiptData.txnId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-temple-stone-500 font-semibold uppercase tracking-wider">Status</p>
                      <p className="font-bold text-green-600 mt-1 uppercase">✓ Confirmed</p>
                    </div>
                  </div>

                  {/* Devotee / Cause details */}
                  <div className="space-y-4">
                    <h4 className="font-serif font-bold text-temple-maroon-800 text-sm border-l-2 border-temple-saffron-500 pl-2 uppercase tracking-wide">
                      Transaction Summary
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-temple-stone-50 p-4 rounded border border-temple-stone-200 text-temple-stone-900">
                      <div>
                        <span className="text-xs text-temple-stone-500">Donor Name:</span>
                        <p className="font-bold">{receiptData.details.donorName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-temple-stone-500">Charity Seva Cause:</span>
                        <p className="font-bold text-temple-maroon-800">{receiptData.cause}</p>
                      </div>
                      {receiptData.details.panNumber && (
                        <div>
                          <span className="text-xs text-temple-stone-500">PAN Exemption Number:</span>
                          <p className="font-mono font-medium uppercase">{receiptData.details.panNumber}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-temple-stone-500">Tax Relief:</span>
                        <p className="font-semibold text-green-700 font-sans">Eligible under Section 80G</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Statement */}
                  <div className="border-t border-temple-stone-250 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-temple-stone-900">
                    <div className="text-xs text-temple-stone-600 text-center sm:text-left">
                      <p className="font-semibold">Payment Confirmed</p>
                      <p className="mt-0.5 text-[10px]">Automated digital signature. May the blessings of Lord Panduranga bring prosperity.</p>
                    </div>
                    <div className="bg-temple-maroon-50 border border-temple-maroon-200 rounded px-6 py-3 text-center sm:text-right">
                      <span className="text-xs text-temple-maroon-900 font-semibold uppercase block">Amount Paid</span>
                      <span className="text-2xl font-bold font-serif text-temple-maroon-800">
                        ₹{receiptData.price.toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  </div>

                </div>

                {/* Print/Reset Actions */}
                <div className="flex gap-4 print:hidden">
                  <button 
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-3 bg-white hover:bg-temple-stone-100 border border-temple-stone-300 rounded-lg font-bold text-temple-stone-850 flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Download size={18} /> Print / Save PDF Receipt
                  </button>
                  <button 
                    type="button"
                    onClick={resetPortals}
                    className="flex-1 py-3 bg-temple-saffron-600 hover:bg-temple-saffron-700 text-white rounded-lg font-bold shadow-md transition-colors text-center"
                  >
                    Go Back / Done
                  </button>
                </div>

                {/* WhatsApp notification simulation preview */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 text-xs text-green-800 print:hidden items-center">
                  <div className="bg-green-100 text-green-600 p-2 rounded-full"><Coffee size={18} /></div>
                  <div>
                    <span className="font-bold block text-green-900 font-sans">WhatsApp Notification Sent:</span>
                    <p className="mt-0.5 italic">
                      "Radhe Krishna {receiptData.details.donorName}! Your donation of ₹{receiptData.price.toLocaleString('en-IN')} to {receiptData.cause} is successfully confirmed at Thennangur Ashram. Receipt: {receiptData.receiptNo}. May the grace of Lord Panduranga be with you."
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ========================================================
            SOCIAL WELFARE ROUTE (#/welfare) 
            ======================================================== */}
        {isRoute('#/welfare') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
            
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs">Community Impact</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">Social Welfare & Charity Initiatives</h2>
              <div className="w-16 h-1 bg-temple-saffron-500 mx-auto"></div>
              <p className="text-temple-stone-700">
                In line with Sri Guruji's vision that devotion must manifest as service to humanity, the GA Trust runs multiple non-profit social welfare schemes which form a lifeline for Thennangur and 20+ surrounding villages.
              </p>
            </div>

            {/* Detailed Welfare Cards */}
            <div className="space-y-12">
              {/* Initiative 1: Medical Centre */}
              <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-5 h-64 lg:h-auto overflow-hidden">
                  <img src="/images/ashram/ SadguruBhavan1.jpg" alt="Guruji Medical Centre" className="w-full h-full object-cover" onError={(e) => e.target.src = '/images/slider/slide4.jpg'} />
                </div>
                <div className="lg:col-span-7 p-8 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <span className="text-xs uppercase font-bold tracking-widest text-temple-saffron-600">Healthcare</span>
                    <h3 className="font-serif text-2xl font-bold text-temple-maroon-800">Guruji Medical Centre & Hospital</h3>
                    <div className="w-12 h-0.5 bg-temple-saffron-500"></div>
                    <p className="text-sm text-temple-stone-750">
                      Located in Thennangur village, this hospital serves as a critical healthcare center for surrounding rural communities. The clinic provides subsidised or free primary care, medicines, outpatient procedures, and periodic specialty camps. It has saved numerous lives in this water-scarce drought-prone zone.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <a href="#/donations" onClick={() => setDonationForm({...donationForm, cause: 'Guruji Medical Centre'})} className="bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold text-xs px-4 py-2.5 rounded shadow">Donate to Hospital</a>
                  </div>
                </div>
              </div>

              {/* Initiative 2: Goshala */}
              <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-5 h-64 lg:h-auto overflow-hidden lg:order-last">
                  <img src="/images/ashram/Goshala.jpg" alt="Ashram Goshala" className="w-full h-full object-cover" />
                </div>
                <div className="lg:col-span-7 p-8 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <span className="text-xs uppercase font-bold tracking-widest text-temple-saffron-600">Gho-Samrakshanam</span>
                    <h3 className="font-serif text-2xl font-bold text-temple-maroon-800">Ashram Goshala (Cow Sanctuary)</h3>
                    <div className="w-12 h-0.5 bg-temple-saffron-500"></div>
                    <p className="text-sm text-temple-stone-750">
                      Caring for cows is considered a highly sacred duty in scriptures. The GA Trust has built a grand Goshala that shelters over 50 rescued and retired cows. They are fed nutritional fodder, given clean shelter, and cared for by full-time staff. The milk collected is offered in worship at the sannidhies and used in the ashram kitchen for Annadhanam.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <a href="#/donations" onClick={() => setDonationForm({...donationForm, cause: 'Goshala Seva'})} className="bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold text-xs px-4 py-2.5 rounded shadow">Support Goshala Seva</a>
                  </div>
                </div>
              </div>

              {/* Initiative 3: Senior Citizens Home */}
              <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-5 h-64 lg:h-auto overflow-hidden">
                  <img src="/images/ashram/LakshmiBhavan.jpg" alt="Senior Citizens Home" className="w-full h-full object-cover" />
                </div>
                <div className="lg:col-span-7 p-8 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <span className="text-xs uppercase font-bold tracking-widest text-temple-saffron-600">Elder Care</span>
                    <h3 className="font-serif text-2xl font-bold text-temple-maroon-800">Home for Senior Citizens</h3>
                    <div className="w-12 h-0.5 bg-temple-saffron-500"></div>
                    <p className="text-sm text-temple-stone-750">
                      The ashram houses a senior citizens home offering a safe shelter and warm community environment for old aged devotees. The trust provides free lodging, nutritious vegetarian meals, round-the-clock medical monitoring, and participation in spiritual bhajan and temple programs, helping them spend their elderly life with dignity and peace.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <a href="#/donations" onClick={() => setDonationForm({...donationForm, cause: 'Senior Citizens Home'})} className="bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold text-xs px-4 py-2.5 rounded shadow">Support Senior Citizens Home</a>
                  </div>
                </div>
              </div>

              {/* Initiative 4: Annadanam */}
              <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-5 h-64 lg:h-auto overflow-hidden lg:order-last">
                  <img src="/images/slider/slide1.jpg" alt="Annadhana Hall" className="w-full h-full object-cover" />
                </div>
                <div className="lg:col-span-7 p-8 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <span className="text-xs uppercase font-bold tracking-widest text-temple-saffron-600">Feeding Seva</span>
                    <h3 className="font-serif text-2xl font-bold text-temple-maroon-800">Daily Annadhana Hall</h3>
                    <div className="w-12 h-0.5 bg-temple-saffron-500"></div>
                    <p className="text-sm text-temple-stone-750">
                      "Satisfying the hunger of any living being is the ultimate seva." Daily hot, nutritious, satvik meals are served to hundreds of visiting devotees, sadhus, local laborers, and kids at the dedicated Annadhana Hall. No one is ever turned away empty-handed from Thennangur.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <a href="#/donations" onClick={() => setDonationForm({...donationForm, cause: 'Annadanam'})} className="bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold text-xs px-4 py-2.5 rounded shadow">Donate Annadanam Seva</a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            EVENTS & FESTIVALS CALENDAR ROUTE (#/events) 
            ======================================================== */}
        {isRoute('#/events') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs">Calendar of Events</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">Festivals & Darshan Timings</h2>
              <div className="w-16 h-1 bg-temple-saffron-500 mx-auto"></div>
              <p className="text-temple-stone-700">
                Join our spiritual celebrations. Below is a comprehensive filterable calendar of festivals for the current Tamil Year, along with daily Darshan timings at the various Sannidhies.
              </p>
            </div>

            {/* Daily programmes / timings */}
            <div className="bg-white rounded-xl shadow-md border border-temple-stone-200 p-8 space-y-6">
              <h3 className="font-serif font-bold text-2xl text-temple-maroon-800 border-b border-temple-stone-200 pb-2">Daily Darshan Timings</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <h4 className="font-serif font-bold text-temple-saffron-700">Shree Matham</h4>
                  <p className="text-xs text-temple-stone-600 mt-1">Daily morning programs, Guru Pada poojas, and evening Namasankirtan.</p>
                  <span className="block mt-3 text-sm font-semibold text-temple-stone-900 bg-temple-stone-100 p-2 rounded text-center">5.30 AM - 8.00 PM</span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-temple-saffron-700">Panduranga Temple</h4>
                  <p className="text-xs text-temple-stone-600 mt-1">Devotees darshan of the 12ft Panduranga. Thursday abhishekam.</p>
                  <span className="block mt-3 text-sm font-semibold text-temple-stone-900 bg-temple-stone-100 p-2 rounded text-center">6.00 AM - 8.00 PM</span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-temple-saffron-700">Meenakshi Temple</h4>
                  <p className="text-xs text-temple-stone-600 mt-1">Darshan of Goddess Meenakshi. Navarathri and special kalyana sevas.</p>
                  <span className="block mt-3 text-sm font-semibold text-temple-stone-900 bg-temple-stone-100 p-2 rounded text-center">6.00 AM - 8.00 PM</span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-temple-saffron-700">Lakshmi Narayan</h4>
                  <p className="text-xs text-temple-stone-600 mt-1">Darshan at the oldest village temple of Lakshmi Narayana.</p>
                  <span className="block mt-3 text-sm font-semibold text-temple-stone-900 bg-temple-stone-100 p-2 rounded text-center">6.00 AM - 8.00 PM</span>
                </div>
              </div>
            </div>

            {/* Monthly Calendar Filter Controls */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-temple-stone-200">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-3 text-temple-stone-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search festivals (e.g. Navarathri)..." 
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-temple-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-temple-saffron-500 bg-white"
                  />
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {['All', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027'].map(mon => (
                    <button
                      key={mon}
                      onClick={() => setEventMonth(mon)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        eventMonth === mon 
                          ? 'bg-temple-maroon-800 text-white border-temple-maroon-800 shadow' 
                          : 'bg-white text-temple-stone-750 border-temple-stone-250 hover:bg-temple-stone-50'
                      }`}
                    >
                      {mon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Cards Grid */}
              {(() => {
                const filtered = contentDb.events.filter(e => {
                  const matchSearch = e.title.toLowerCase().includes(eventSearch.toLowerCase()) || e.date.toLowerCase().includes(eventSearch.toLowerCase());
                  const matchMonth = eventMonth === 'All' || e.monthGroup.toLowerCase().includes(eventMonth.toLowerCase()) || e.date.toLowerCase().includes(eventMonth.split(' ')[0].toLowerCase());
                  return matchSearch && matchMonth;
                });

                if (filtered.length === 0) {
                  return <div className="text-center py-12 text-temple-stone-500 font-serif">No festivals found matching your search.</div>;
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filtered.map(event => (
                      <div key={event.id} className={`bg-white rounded-xl shadow overflow-hidden flex flex-col justify-between border hover:shadow-md transition-shadow duration-200 ${event.isSpecial ? 'border-temple-saffron-400 ring-1 ring-temple-saffron-200' : 'border-temple-stone-200'}`}>
                        <div>
                          <div className="h-40 overflow-hidden relative bg-temple-stone-100">
                            <img src={event.image} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                            {event.isSpecial && (
                              <span className="absolute top-2.5 left-2.5 bg-temple-saffron-600 text-white text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow">Major festival</span>
                            )}
                          </div>
                          <div className="p-5 space-y-2">
                            <span className="text-[10px] text-temple-saffron-600 font-bold uppercase tracking-wider">{event.monthGroup}</span>
                            <h4 className="font-serif font-bold text-temple-maroon-850 text-base leading-snug">{event.title}</h4>
                            <p className="text-xs text-temple-stone-600 flex items-center gap-1 font-medium">
                              <Calendar size={12} className="text-temple-stone-400" /> {event.date}
                            </p>
                          </div>
                        </div>

                        <div className="p-5 pt-0 border-t border-temple-stone-100 mt-4 flex items-center justify-between">
                          <a 
                            href={getGoogleCalendarUrl(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-temple-maroon-800 hover:text-temple-saffron-600 font-semibold flex items-center gap-1 hover:underline"
                          >
                            Add to Calendar <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>

          </div>
        )}

        {/* ========================================================
            MEDIA GALLERY ROUTE (#/gallery) 
            ======================================================== */}
        {isRoute('#/gallery') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs">Visual Devotion</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">Media Gallery</h2>
              <div className="w-16 h-1 bg-temple-saffron-500 mx-auto"></div>
              <p className="text-temple-stone-700">
                Sacred moments, deities, architectures, and festival celebrations captured at Guruji Swami Haridhos Giri Ashram, Thennangur. Click on any image to view details in high resolution.
              </p>
            </div>

            {/* Masonry / Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {GALLERY_IMAGES.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className="bg-white p-1 rounded-lg border border-temple-stone-200 shadow-sm cursor-pointer overflow-hidden group hover:shadow-md hover:border-temple-saffron-400 transition-all duration-200"
                >
                  <div className="aspect-square w-full overflow-hidden bg-temple-stone-100 rounded">
                    <img 
                      src={img.src} 
                      alt={img.alt} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* LIGHTBOX MODAL */}
            {lightboxIndex !== null && (
              <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 select-none">
                <button 
                  onClick={() => setLightboxIndex(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>

                {/* Left navigation */}
                <button 
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>

                {/* High-res Image */}
                <div className="max-w-4xl max-h-[85vh] flex flex-col items-center gap-4 text-center">
                  <img 
                    src={GALLERY_IMAGES[lightboxIndex].src} 
                    alt={GALLERY_IMAGES[lightboxIndex].alt} 
                    className="max-w-full max-h-[75vh] object-contain rounded border border-white/10 shadow-2xl"
                  />
                  <span className="text-white font-serif tracking-wider text-sm">
                    {GALLERY_IMAGES[lightboxIndex].alt} ({lightboxIndex + 1} of {GALLERY_IMAGES.length})
                  </span>
                </div>

                {/* Right navigation */}
                <button 
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % GALLERY_IMAGES.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            FACILITIES ROUTE (#/facilities) 
            ======================================================== */}
        {isRoute('#/facilities') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
            
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs">Ashram Lodging & Halls</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">Facilities & Infrastructure</h2>
              <div className="w-16 h-1 bg-temple-saffron-500 mx-auto"></div>
              <p className="text-temple-stone-700">
                To serve visiting pilgrims, overseas devotees, and spiritual seekers, the Ashram complex houses multiple halls, guest rooms, and cottages.
              </p>
            </div>

            {/* Accommodation (Parsed from accommodation.md) */}
            <div className="space-y-8">
              <h3 className="font-serif font-bold text-2xl text-temple-maroon-800 border-b border-temple-stone-200 pb-2">Guest Lodging & Accommodations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Saraswati Bhavan */}
                <div className="bg-white border border-temple-stone-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <img src="/images/ashram/SadguruBhavan1.jpg" alt="Saraswati Bhavan" className="h-48 w-full object-cover" />
                  <div className="p-6 space-y-3 flex-grow">
                    <h4 className="font-serif font-bold text-lg text-temple-maroon-800">Saraswati Bhavan</h4>
                    <p className="text-xs text-temple-stone-700">
                      Located adjacent to Lakshmi Bhavan, the Saraswati Bhavan complex contains well-furnished single and double room units specifically intended for short stays of visiting NRI and overseas devotees.
                    </p>
                  </div>
                </div>

                {/* Lakshmi Bhavan */}
                <div className="bg-white border border-temple-stone-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <img src="/images/ashram/LakshmiBhavan.jpg" alt="Lakshmi Bhavan" className="h-48 w-full object-cover" />
                  <div className="p-6 space-y-3 flex-grow">
                    <h4 className="font-serif font-bold text-lg text-temple-maroon-800">Lakshmi Bhavan</h4>
                    <p className="text-xs text-temple-stone-700">
                      A massive building complex containing 50 self-contained rooms and a large dormitory. Built to house devotees during large festivals (Sathguru Aradhana, Guruji Mahapooja).
                    </p>
                  </div>
                </div>

                {/* Sant Nagar cottages */}
                <div className="bg-white border border-temple-stone-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <img src="/images/ashram/Cottages3.jpg" alt="Sant Nagar" className="h-48 w-full object-cover" />
                  <div className="p-6 space-y-3 flex-grow">
                    <h4 className="font-serif font-bold text-lg text-temple-maroon-800">Sant Nagar Cottages</h4>
                    <p className="text-xs text-temple-stone-700">
                      A peaceful gated colony of a dozen well-furnished individual family cottages, featuring a large Shiva statue at the gate. Ideal for families visiting from far.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic tabs for Namasankirtan Mandapam, Swami Haridas Hall */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-temple-stone-200 pt-16">
              
              {/* Mandapam */}
              <div className="bg-white border border-temple-stone-200 rounded-xl p-8 space-y-4">
                <span className="text-[10px] bg-temple-saffron-50 text-temple-saffron-700 border border-temple-saffron-200 font-bold px-2 py-0.5 rounded uppercase">Chanting Hall</span>
                <h3 className="font-serif font-bold text-2xl text-temple-maroon-800">{contentDb.pages['namasankirtan-mandapam'].title}</h3>
                <div className="w-12 h-0.5 bg-temple-saffron-500"></div>
                <div className="text-sm text-temple-stone-750 space-y-3 leading-relaxed">
                  <p>
                    A colossal hall constructed for continuous bhajan sessions. With exceptional acoustics and a spiritual atmosphere, it serves as the center for regular Sampradhaya Namasankirtanam.
                  </p>
                  <a href="#/ashram" className="text-xs text-temple-maroon-800 font-bold hover:underline block pt-2">READ ABOUT THE GURU LINEAGE &rarr;</a>
                </div>
              </div>

              {/* Hall */}
              <div className="bg-white border border-temple-stone-200 rounded-xl p-8 space-y-4">
                <span className="text-[10px] bg-temple-saffron-50 text-temple-saffron-700 border border-temple-saffron-200 font-bold px-2 py-0.5 rounded uppercase">Auditorium</span>
                <h3 className="font-serif font-bold text-2xl text-temple-maroon-800">{contentDb.pages['swami-haridas-giri-hall'].title}</h3>
                <div className="w-12 h-0.5 bg-temple-saffron-500"></div>
                <div className="text-sm text-temple-stone-750 space-y-3 leading-relaxed">
                  <p>
                    A large community hall named in honor of Swami Haridas Giri. Used for spiritual concerts, lectures, weddings, community welfare campaigns, and lodging extensions during grand festival weeks.
                  </p>
                  <a href="#/contact" className="text-xs text-temple-maroon-800 font-bold hover:underline block pt-2">GET BOOKING DETAILS &rarr;</a>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================
            CONTACT US ROUTE (#/contact) 
            ======================================================== */}
        {isRoute('#/contact') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-temple-saffron-600 font-bold uppercase tracking-widest text-xs">Reach Out</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-temple-maroon-800">Contact & Directions</h2>
              <div className="w-16 h-1 bg-temple-saffron-500 mx-auto"></div>
              <p className="text-temple-stone-700">
                Plan your visit, write to the admin, or speak with our office representatives for accommodation bookings or event schedules.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Contact Info & Directions */}
              <div className="lg:col-span-5 bg-white border border-temple-stone-200 rounded-xl p-8 space-y-8 flex flex-col justify-between">
                
                <div className="space-y-6">
                  <h3 className="font-serif font-bold text-xl text-temple-maroon-800 border-b border-temple-stone-200 pb-2 flex items-center gap-2">
                    <Compass size={20} className="text-temple-saffron-600" /> Ashram Office Address
                  </h3>
                  <div className="space-y-4 text-sm text-temple-stone-850">
                    <div className="flex gap-2 items-start">
                      <MapPin size={18} className="text-temple-maroon-800 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-temple-stone-900">Thennangur Ashram (GA Trust)</p>
                        <p>Vandavasi Taluk, Thiruvannamalai District,</p>
                        <p>Tamil Nadu, Pincode 604408, India</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Mail size={18} className="text-temple-maroon-800" />
                      <a href="mailto:ashram@gurujithennangur.com" className="hover:text-temple-saffron-600 underline font-medium">ashram@gurujithennangur.com</a>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Phone size={18} className="text-temple-maroon-800 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1 font-medium">
                        <a href="tel:+919176967153" className="hover:text-temple-saffron-600">+91 9176967153</a>
                        <a href="tel:+919444310136" className="hover:text-temple-saffron-600">+91 9444310136</a>
                        <a href="tel:+914424952498" className="hover:text-temple-saffron-600">+91 44 2495 2498 (Chennai Office)</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-temple-stone-200 pt-6">
                  <h4 className="font-serif font-bold text-temple-maroon-850 text-sm">How to Reach (Vandavasi SH-116)</h4>
                  <p className="text-xs text-temple-stone-650 leading-relaxed">
                    Thennangur is located 6 kms from Vandavasi and about 35 kms from Kanchipuram. Served frequently by buses from Kanchipuram and Vandavasi. Directly connected by bus route 104 and 148 from Chennai (110 km away).
                  </p>
                </div>

              </div>

              {/* Form or Map integration */}
              <div className="lg:col-span-7 bg-white border border-temple-stone-200 rounded-xl p-8 flex flex-col justify-between">
                <h3 className="font-serif font-bold text-xl text-temple-maroon-800 border-b border-temple-stone-200 pb-2 mb-6">Send an Inquiry</h3>
                
                <form onSubmit={(e) => { e.preventDefault(); alert("Thank you! Your message has been submitted. The admin of Thennangur will contact you soon."); }} className="space-y-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-temple-stone-700 mb-1">Your Full Name *</label>
                        <input type="text" required placeholder="Full Name" className="w-full p-2.5 border border-temple-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-temple-saffron-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-temple-stone-700 mb-1">Email Address *</label>
                        <input type="email" required placeholder="email@address.com" className="w-full p-2.5 border border-temple-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-temple-saffron-500" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-temple-stone-700 mb-1">Subject</label>
                      <input type="text" placeholder="Inquiry Subject" className="w-full p-2.5 border border-temple-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-temple-saffron-500" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-temple-stone-700 mb-1">Message *</label>
                      <textarea rows={4} required placeholder="Your detailed query or booking request..." className="w-full p-2.5 border border-temple-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-temple-saffron-500" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold py-3 rounded-lg shadow-sm transition-colors mt-6">
                    Submit Message to Admin
                  </button>
                </form>

              </div>
            </div>

            {/* Google Map location integration */}
            <div className="rounded-xl overflow-hidden shadow-md border border-temple-stone-200 h-[350px]">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3895.8459427357497!2d79.66442651481682!3d12.493339191181283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a52d38beaaaab6f%3A0xea8a7dfcb4b9a117!2sSri%20Panduranga%20Rakhumayi%20Temple%20Thennangur!5e0!3m2!1sen!2sin!4v1655845000000!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                title="Thennangur Temple Map Location"
              />
            </div>

          </div>
        )}

        {/* DYNAMIC FALLBACK ROUTE FOR POLICY PAGES & OTHER MARKDOWN FILES */}
        {!isRoute('#/') && 
         !isRoute('#/history') && 
         !isRoute('#/temples') && 
         !isRoute('#/ashram') && 
         !isRoute('#/pooja-booking') && 
         !isRoute('#/donations') && 
         !isRoute('#/welfare') && 
         !isRoute('#/events') && 
         !isRoute('#/gallery') && 
         !isRoute('#/facilities') && 
         !isRoute('#/contact') && (
          (() => {
            const cleanRoute = route.replace('#/', '').replace('#', '');
            const parts = cleanRoute.split('/');
            const pageKey = parts[parts.length - 1];
            const page = contentDb.pages[pageKey];
            if (!page) {
              return (
                <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
                  <h2 className="text-3xl font-serif font-bold text-temple-maroon-800">Page Not Found</h2>
                  <p className="text-temple-stone-600">The requested section or page does not exist. Please return to the homepage.</p>
                  <a href="#/" className="inline-block bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition-colors">
                    Go to Home
                  </a>
                </div>
              );
            }
            return (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-6">
                <h2 className="text-3xl font-serif font-bold text-temple-maroon-800 border-b border-temple-stone-200 pb-4">
                  {page.title}
                </h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
              </div>
            );
          })()
        )}

      </main>

      {/* 4. FOOTER SECTION */}
      <footer className="bg-temple-stone-900 text-temple-stone-100 border-t-2 border-temple-saffron-500 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-bold text-temple-saffron-400">Thennangur Ashram</h4>
            <p className="text-xs text-temple-stone-300 leading-relaxed">
              Propagating Sanatana Dharma through the path of Namasankirtan, serving humanity through charities, and maintaining divine sannidhies established by Swami Haridhos Giri.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="http://www.facebook.com/BhagavathaSammelanaSamajam/" target="_blank" rel="noopener noreferrer" className="hover:text-temple-saffron-400 transition-colors">Facebook</a>
              <a href="http://www.youtube.com/c/GnananandaMandaliChennai" target="_blank" rel="noopener noreferrer" className="hover:text-temple-saffron-400 transition-colors">YouTube</a>
              <a href="http://www.twitter.com/GnananandaC/" target="_blank" rel="noopener noreferrer" className="hover:text-temple-saffron-400 transition-colors">Twitter (X)</a>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-temple-saffron-400">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#/history" className="hover:text-temple-saffron-300 transition-colors">Sthala Puranam</a></li>
              <li><a href="#/pooja-booking" className="hover:text-temple-saffron-300 transition-colors">Pooja Bookings</a></li>
              <li><a href="#/donations" className="hover:text-temple-saffron-300 transition-colors">Donations / Sevas</a></li>
              <li><a href="#/events" className="hover:text-temple-saffron-300 transition-colors">Festivals Calendar</a></li>
              <li><a href="#/gallery" className="hover:text-temple-saffron-300 transition-colors">Media Gallery</a></li>
              <li><a href="#/facilities" className="hover:text-temple-saffron-300 transition-colors">Accommodation</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-temple-saffron-400">Our Temples</h4>
            <ul className="space-y-2">
              <li><a href="#/temples/panduranga-rakhumayi-temple" className="hover:text-temple-saffron-300 transition-colors">Panduranga Rakhumayi</a></li>
              <li><a href="#/temples/shree-matham" className="hover:text-temple-saffron-300 transition-colors">Shree Matham</a></li>
              <li><a href="#/temples/meenakshi-sundareshwar-temple" className="hover:text-temple-saffron-300 transition-colors">Meenakshi Sundareshwar</a></li>
              <li><a href="#/temples/lakshmi-narayan-temple" className="hover:text-temple-saffron-300 transition-colors">Lakshmi Narayan Sannidhi</a></li>
            </ul>
          </div>

          <div className="space-y-4 text-xs">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-temple-saffron-400">Charitable Trust</h4>
            <p className="text-[11px] text-temple-stone-300">
              Administered by G.A. Trust, Chennai/Thennangur. Donations are tax-exempt under Section 80G.
            </p>
            <div className="space-y-1 text-temple-stone-400">
              <p>Managing Trustee: Raamassubramanian</p>
              <p>Secretary: Harishankar</p>
            </div>
          </div>

        </div>

        {/* Bottom footer bar */}
        <div className="border-t border-temple-stone-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-temple-stone-400 gap-4 max-w-7xl mx-auto">
          <p>© 2026 G.A. Trust Thennangur. All Rights Reserved. Radhe Krishna.</p>
          <div className="flex gap-4">
            <a href="#/pages/privacy-policy" className="hover:text-temple-stone-100 transition-colors">Privacy Policy</a>
            <a href="#/pages/refund-policy" className="hover:text-temple-stone-100 transition-colors">Refund Policy</a>
            <a href="#/pages/terms-of-services" className="hover:text-temple-stone-100 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
