import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Search, RefreshCw, Lock, User, LogOut, MessageSquare, Database, Plus, X, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import contentDb from './data/content.json';

const getPriestInfo = (category) => {
  switch (category) {
    case 'Sree Matam Poojas':
      return { name: 'Sri Venkatesh Bhattar (Shree Matham)', phone: '+919840807718' };
    case 'Meenakshi Sundareswarar Temple Poojas':
      return { name: 'Sri Sundaramurthy Bhattar (Meenakshi Sundareswarar)', phone: '+14803993440' };
    case 'Panduranga Rakhumayi Temple Poojas':
      return { name: 'Sri Vitthal Das (Panduranga Temple)', phone: '+918825789523' };
    case 'Lakshmi Narayan Temple Poojas':
      return { name: 'Sri Narayana Bhattar (Lakshmi Narayan Temple)', phone: '+918618130675' };
    default:
      return { name: 'Ashram Office / General Priest', phone: '+919176967153' };
  }
};

const formatToISTDate = (dateVal) => {
  if (!dateVal) return '';
  
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    
    // yyyy-mm-dd
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      return `${ymdMatch[3]}-${ymdMatch[2]}-${ymdMatch[1]}`;
    }
    
    // dd-mm-yyyy or mm-dd-yyyy
    const dmyMatch = trimmed.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
    if (dmyMatch) {
      const p1 = parseInt(dmyMatch[1], 10);
      const p2 = parseInt(dmyMatch[2], 10);
      const year = dmyMatch[3];
      
      if (p1 > 12) {
        return `${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}-${year}`;
      }
      if (p2 > 12) {
        return `${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}-${year}`;
      }
    }
  }

  try {
    let parsedDate = dateVal;
    if (typeof dateVal === 'string') {
      const trimmed = dateVal.trim();
      const dmyMatch = trimmed.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
      if (dmyMatch) {
        parsedDate = `${dmyMatch[2]}/${dmyMatch[1]}/${dmyMatch[3]}`;
      }
    }
    
    const d = new Date(parsedDate);
    if (isNaN(d.getTime())) {
      return dateVal;
    }
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(d);
    const yyyy = parts.find(p => p.type === 'year').value;
    const mm = parts.find(p => p.type === 'month').value;
    const dd = parts.find(p => p.type === 'day').value;
    return `${dd}-${mm}-${yyyy}`;
  } catch (err) {
    return dateVal;
  }
};

const getTomorrowString = () => {
  const d = new Date();
  const tomorrowInMs = d.getTime() + (24 * 60 * 60 * 1000);
  const tomorrowDate = new Date(tomorrowInMs);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(tomorrowDate);
  const yyyy = parts.find(p => p.type === 'year').value;
  const mm = parts.find(p => p.type === 'month').value;
  const dd = parts.find(p => p.type === 'day').value;
  return `${yyyy}-${mm}-${dd}`;
};

const GOTRAM_OPTIONS = [
  "Kashyapa", "Bharadwaja", "Harita", "Srivatsa", "Vadhula", 
  "Koundinya", "Gautama", "Atri", "Vasishta", "Vishvamitra", 
  "Angirasa", "Jamadagni", "Shandilya", "Naidhruva", "Sankrithi", "Shatamarshana"
];

const NAKSHATRAM_OPTIONS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", 
  "Arudra", "Punarvasu", "Pushya", "Ashlesha", "Magha", 
  "Poorva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", 
  "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Moola", 
  "Poorvashadha", "Uttarashadha", "Shravana", "Dhanishta", 
  "Shatabhisha", "Poorvabhadrapada", "Uttarabhadrapada", "Revati"
];

const RASI_OPTIONS = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", 
  "Simha", "Kanya", "Tula", "Vrishchika", 
  "Dhanus", "Makara", "Kumbha", "Meena"
];

export default function AdminPortal() {
  const [dbData, setDbData] = useState({ transactions: [], bookings: [], donations: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, donations, transactions
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [selectedSheetDate, setSelectedSheetDate] = useState(getTomorrowString());
  const [transactionDateFilter, setTransactionDateFilter] = useState('');

  const [bookingFilters, setBookingFilters] = useState({
    date: '',
    devoteeName: '',
    poojaName: '',
    gothraNakshatra: '',
    poojaDate: '',
    contact: '',
    sankalpam: '',
    txnId: ''
  });

  const [donationFilters, setDonationFilters] = useState({
    date: '',
    donorName: '',
    cause: '',
    minAmount: '',
    contact: '',
    panCard: '',
    address: '',
    txnId: ''
  });

  // Offline Transaction states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordType, setRecordType] = useState('pooja'); // 'pooja' or 'donation'
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' or 'Check'
  const [checkNo, setCheckNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiTxnId, setUpiTxnId] = useState('');
  const [organization, setOrganization] = useState('GA Trust');
  
  // Devotee fields (Pooja)
  const [devoteeName, setDevoteeName] = useState('');
  const [gotram, setGotram] = useState('');
  const [nakshatram, setNakshatram] = useState('');
  const [rasi, setRasi] = useState('');
  const [poojaName, setPoojaName] = useState('');
  const [poojaDate, setPoojaDate] = useState('');
  const [price, setPrice] = useState('');
  const [poojaLocation, setPoojaLocation] = useState('Sree Matam Poojas');
  const [familyMembers, setFamilyMembers] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sankalpam, setSankalpam] = useState('');

  // Donor fields (Donation)
  const [donorName, setDonorName] = useState('');
  const [cause, setCause] = useState('Annadanam');
  const [amount, setAmount] = useState('1000');
  const [panCard, setPanCard] = useState('');
  const [address, setAddress] = useState('');

  // Pre-populate pooja values when component mounts
  useEffect(() => {
    if (contentDb.poojas && contentDb.poojas.length > 0) {
      setPoojaName(contentDb.poojas[0].name);
      setPrice(String(contentDb.poojas[0].price));
      const cat = contentDb.poojas[0].category || 'Sree Matam Poojas';
      setPoojaLocation(cat === 'Paada Pooja & Special Poojas' ? 'Sree Matam Poojas' : cat);
    }
    setPoojaDate(getTomorrowString());
  }, []);

  const handlePoojaChange = (selectedName) => {
    setPoojaName(selectedName);
    const foundPooja = contentDb.poojas.find(p => p.name === selectedName);
    if (foundPooja) {
      setPrice(String(foundPooja.price));
      if (foundPooja.category) {
        const cat = foundPooja.category;
        setPoojaLocation(cat === 'Paada Pooja & Special Poojas' ? 'Sree Matam Poojas' : cat);
      }
    }
  };

  const handleCauseChange = (selectedCause) => {
    setCause(selectedCause);
    if (selectedCause === 'One Day Annadhanam') {
      setAmount('5000');
    } else if (selectedCause === 'Life Time Annadhanam') {
      setAmount('50000');
    } else if (selectedCause === 'Go Samrakshanam') {
      setAmount('2000');
    } else {
      setAmount('1000');
    }
  };

  const resetRecordForm = () => {
    setRecordType('pooja');
    setPaymentMethod('Cash');
    setCheckNo('');
    setBankName('');
    setUpiTxnId('');
    setOrganization('GA Trust');
    setDevoteeName('');
    setGotram('');
    setNakshatram('');
    setRasi('');
    if (contentDb.poojas && contentDb.poojas.length > 0) {
      setPoojaName(contentDb.poojas[0].name);
      setPrice(String(contentDb.poojas[0].price));
      setPoojaLocation(contentDb.poojas[0].category || 'Sree Matam Poojas');
    } else {
      setPoojaName('');
      setPrice('');
      setPoojaLocation('Sree Matam Poojas');
    }
    setPoojaDate(getTomorrowString());
    setFamilyMembers('');
    setEmail('');
    setPhone('');
    setSankalpam('');
    setDonorName('');
    setCause('Annadanam');
    setAmount('1000');
    setPanCard('');
    setAddress('');
  };

  const drawReceiptPage = (doc, data, isFirstPage = true) => {
    if (!isFirstPage) {
      doc.addPage();
    }
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(128, 0, 0); // Temple maroon
    doc.text(data.organization || "GA Trust", 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("31, Sadayappan St, Jeth Nagar, Mandaveli, Chennai, Greater Chennai, Tamil Nadu 600028", 105, 26, { align: "center" });
    doc.text("Email: ashram@gurujithennangur.com | Phone: +91 9176967153", 105, 31, { align: "center" });

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 35, 195, 35);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(128, 0, 0);
    doc.text("OFFICIAL RECEIPT", 105, 45, { align: "center" });

    // Receipt Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Receipt No: ${data.receiptNo}`, 15, 55);
    doc.text(`Date: ${data.dateStr}`, 145, 55);
    doc.text(`Txn ID: ${data.txnId}`, 15, 62);
    doc.text(`Payment Mode: ${data.paymentMethod}`, 145, 62);
    
    let nextY = 69;
    if (data.paymentMethod === 'Check') {
      doc.text(`Bank: ${data.bankName || 'N/A'} | Check No: ${data.checkNo || 'N/A'}`, 15, nextY);
      nextY += 7;
    } else if (data.paymentMethod === 'UPI') {
      doc.text(`UPI Ref ID: ${data.upiTxnId || 'N/A'}`, 15, nextY);
      nextY += 7;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(15, nextY, 195, nextY);
    nextY += 8;

    // Devotee / Donor Details
    doc.setFont("helvetica", "bold");
    doc.text(data.recordType === 'pooja' ? "DEVOTEE DETAILS" : "DONOR DETAILS", 15, nextY);
    doc.setFont("helvetica", "normal");
    nextY += 7;

    if (data.recordType === 'pooja') {
      doc.text(`Name: ${data.devoteeName}`, 15, nextY);
      doc.text(`Pooja Date: ${data.poojaDate}`, 110, nextY);
      nextY += 7;
      doc.text(`Gotram: ${data.gotram || 'N/A'}`, 15, nextY);
      doc.text(`Nakshatram: ${data.nakshatram || 'N/A'} (${data.rasi || 'N/A'})`, 110, nextY);
      nextY += 7;
      doc.text(`Phone: ${data.phone || 'N/A'}`, 15, nextY);
      doc.text(`Email: ${data.email || 'N/A'}`, 110, nextY);
      nextY += 7;
      doc.text(`Family Members: ${data.familyMembers || 'None'}`, 15, nextY);
      nextY += 7;
      doc.text(`Sankalpam: ${data.sankalpam || 'N/A'}`, 15, nextY);
    } else {
      doc.text(`Name: ${data.donorName}`, 15, nextY);
      doc.text(`PAN: ${data.panCard || 'N/A'}`, 110, nextY);
      nextY += 7;
      doc.text(`Phone: ${data.phone || 'N/A'}`, 15, nextY);
      doc.text(`Email: ${data.email || 'N/A'}`, 110, nextY);
      nextY += 7;
      doc.text(`Address: ${data.address || 'N/A'}`, 15, nextY);
    }

    nextY += 5;
    doc.line(15, nextY, 195, nextY);
    nextY += 8;

    // Table Header
    doc.setFont("helvetica", "bold");
    doc.text("Description", 15, nextY);
    doc.text("Amount", 170, nextY);
    nextY += 2;
    doc.line(15, nextY, 195, nextY);
    nextY += 8;

    // Table Rows for all items in the transaction
    doc.setFont("helvetica", "normal");
    const itemsList = data.items || [{
      name: data.poojaName || data.cause,
      type: data.recordType,
      price: data.totalPrice,
      cause: data.cause,
      details: {
        category: data.poojaLocation,
        poojaDate: data.poojaDate
      }
    }];
    
    itemsList.forEach((item) => {
      const categoryLabel = item.details?.category || 'Sree Matam Poojas';
      const cleanCategory = categoryLabel === 'Paada Pooja & Special Poojas' ? 'Sree Matam Poojas' : categoryLabel;
      const desc = item.type === 'pooja' 
        ? `${item.name} (${cleanCategory})` 
        : `Donation for ${item.cause || item.name}`;
      
      doc.text(desc, 15, nextY);
      doc.text(`INR ${item.price.toLocaleString('en-IN')}.00`, 170, nextY);
      nextY += 7;
    });
    
    doc.line(15, nextY, 195, nextY);
    nextY += 10;

    // Total
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount Paid:", 15, nextY);
    doc.text(`INR ${data.totalPrice.toLocaleString('en-IN')}.00`, 170, nextY);

    // Footer
    doc.line(15, 250, 195, 250);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("This is a computer-generated receipt and does not require a physical signature.", 105, 255, { align: "center" });
    doc.text("Thank you for your offering. Radhe Krishna!", 105, 260, { align: "center" });
  };

  const generatePdfReceipt = (data) => {
    try {
      const doc = new jsPDF();
      drawReceiptPage(doc, data, true);
      doc.save(`Receipt_${data.txnId}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  const handlePrintSingleReceipt = (txn) => {
    const item = txn.items[0];
    if (!item) return;
    
    const data = {
      receiptNo: txn.receiptNo,
      txnId: txn.txnId,
      dateStr: formatToISTDate(txn.date),
      paymentMethod: txn.paymentMethod || 'Online',
      checkNo: txn.checkNo,
      bankName: txn.bankName,
      totalPrice: txn.totalPrice,
      recordType: item.type,
      organization: txn.organization || 'GA Trust',
      
      devoteeName: item.details?.devoteeName || item.details?.donorName || 'N/A',
      gotram: item.details?.gotram,
      nakshatram: item.details?.nakshatram,
      rasi: item.details?.rasi,
      poojaDate: formatToISTDate(item.details?.poojaDate || txn.date),
      poojaName: item.name,
      poojaLocation: item.details?.category,
      familyMembers: item.details?.familyMembers,
      email: item.details?.email,
      phone: item.details?.phone,
      sankalpam: item.details?.sankalpam,
      
      donorName: item.details?.donorName || 'N/A',
      cause: item.cause || item.details?.cause,
      panCard: item.details?.panCard,
      address: item.details?.address,
      items: txn.items
    };
    
    generatePdfReceipt(data);
  };

  const downloadAllReceiptsPdf = () => {
    const txnsToExport = filteredTransactions;
    if (txnsToExport.length === 0) {
      alert("No transactions found to export.");
      return;
    }
    
    try {
      const doc = new jsPDF();
      txnsToExport.forEach((txn, index) => {
        const item = txn.items[0];
        if (!item) return;
        
        const data = {
          receiptNo: txn.receiptNo,
          txnId: txn.txnId,
          dateStr: formatToISTDate(txn.date),
          paymentMethod: txn.paymentMethod || 'Online',
          checkNo: txn.checkNo,
          bankName: txn.bankName,
          totalPrice: txn.totalPrice,
          recordType: item.type,
          organization: txn.organization || 'GA Trust',
          
          devoteeName: item.details?.devoteeName || item.details?.donorName || 'N/A',
          gotram: item.details?.gotram,
          nakshatram: item.details?.nakshatram,
          rasi: item.details?.rasi,
          poojaDate: formatToISTDate(item.details?.poojaDate || txn.date),
          poojaName: item.name,
          poojaLocation: item.details?.category,
          familyMembers: item.details?.familyMembers,
          email: item.details?.email,
          phone: item.details?.phone,
          sankalpam: item.details?.sankalpam,
          
          donorName: item.details?.donorName || 'N/A',
          cause: item.cause || item.details?.cause,
          panCard: item.details?.panCard,
          address: item.details?.address,
          items: txn.items
        };
        
        drawReceiptPage(doc, data, index === 0);
      });
      
      doc.save(`All_Ashram_Receipts_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to generate consolidated receipts PDF:', err);
      alert('Failed to generate bulk PDF file.');
    }
  };

  const sendEmailReceipt = (data) => {
    const emailSubject = `Thennangur Ashram Receipt - ${data.txnId}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; color: #333;">
        <div style="background-color: #800000; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-family: Georgia, serif;">${data.organization || 'GA Trust'}</h2>
          <p style="margin: 5px 0 0 0; font-size: 11px; color: #ffd700;">31, Sadayappan St, Jeth Nagar, Mandaveli, Chennai, Greater Chennai, Tamil Nadu 600028</p>
        </div>
        <div style="padding: 24px; line-height: 1.6;">
          <h3 style="color: #800000; border-bottom: 2px solid #800000; padding-bottom: 8px;">Transaction Receipt</h3>
          <p>Radhe Krishna, <strong>${data.recordType === 'pooja' ? data.devoteeName : data.donorName}</strong>.</p>
          <p>We gratefully acknowledge the receipt of your offering. Here are your transaction details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #eee; font-weight: bold;">Receipt No:</td>
              <td style="padding: 10px; border: 1px solid #eee;">${data.receiptNo}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eee; font-weight: bold;">Transaction ID:</td>
              <td style="padding: 10px; border: 1px solid #eee;">${data.txnId}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #eee; font-weight: bold;">Date:</td>
              <td style="padding: 10px; border: 1px solid #eee;">${data.dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eee; font-weight: bold;">Payment Method:</td>
              <td style="padding: 10px; border: 1px solid #eee;">
                ${data.paymentMethod} 
                ${data.paymentMethod === 'Check' ? `(Bank: ${data.bankName}, Check No: ${data.checkNo})` : ''}
                ${data.paymentMethod === 'UPI' ? `(UPI Ref ID: ${data.upiTxnId})` : ''}
              </td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #eee; font-weight: bold;">Offering Details:</td>
              <td style="padding: 10px; border: 1px solid #eee;">${data.recordType === 'pooja' ? `${data.poojaName} (${data.poojaLocation}) on ${data.poojaDate}` : `Donation for ${data.cause}`}</td>
            </tr>
            ${data.recordType === 'pooja' ? `
            <tr>
              <td style="padding: 10px; border: 1px solid #eee; font-weight: bold;">Devotee Gothram/Nakshatram:</td>
              <td style="padding: 10px; border: 1px solid #eee;">Gotram: ${data.gotram || 'N/A'} | Nakshatram: ${data.nakshatram || 'N/A'} (${data.rasi || 'N/A'})</td>
            </tr>
            ` : ''}
            <tr style="background-color: #f9f9f9; font-size: 16px; font-weight: bold;">
              <td style="padding: 12px; border: 1px solid #eee; color: #800000;">Total Amount:</td>
              <td style="padding: 12px; border: 1px solid #eee; color: #800000;">₹ ${data.totalPrice.toLocaleString('en-IN')}.00</td>
            </tr>
          </table>
          
          <div style="background-color: #fff9f0; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #78350f;"><strong>Sankalpam Prayed For:</strong> ${data.recordType === 'pooja' ? (data.sankalpam || 'Family welfare & prosperity') : 'General seva charity fund support'}</p>
          </div>

          <p>Your receipt PDF has been generated and downloaded to your device as well.</p>
          <p>For any queries, please reach out to ashram@gurujithennangur.com or call +91 9176967153.</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="text-align: center; font-size: 12px; color: #666; margin: 0;">This is a simulated system-generated receipt. Thank you for your support. Radhe Krishna!</p>
        </div>
      </div>
    `;

    fetch('/api/send-receipt-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientEmail: data.email,
        subject: emailSubject,
        htmlContent: emailHtml,
        txnId: data.txnId
      })
    })
    .then(res => res.json())
    .then(resData => {
      console.log('Simulated email receipt response:', resData);
    })
    .catch(err => {
      console.error('Failed to request simulated email:', err);
    });
  };

  const handleRecordSubmit = (e) => {
    e.preventDefault();
    
    const year = new Date().getFullYear();
    const localTxns = (() => {
      try {
        return JSON.parse(localStorage.getItem('thennangur_local_txns') || '[]');
      } catch (err) {
        return [];
      }
    })();
    const prefix = organization === 'Gnanananda Seva Samajam' ? 'GSS' : 'GAT';
    const matchingTxns = localTxns.filter(txn => {
      const txnPrefix = (txn.organization === 'Gnanananda Seva Samajam') ? 'GSS' : 'GAT';
      return txnPrefix === prefix && txn.receiptNo && txn.receiptNo.startsWith(`${prefix}-${year}-`);
    });
    let maxNum = 0;
    matchingTxns.forEach(txn => {
      const parts = txn.receiptNo.split('-');
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const receiptNo = `${prefix}-${year}-${maxNum + 1}`;
    const dateStr = formatToISTDate(new Date());
    
    let txnId = '';
    let items = [];
    let totalPrice = 0;
    
    if (recordType === 'pooja') {
      const parsedPrice = parseFloat(price) || 0;
      totalPrice = parsedPrice;
      txnId = `TXN-${paymentMethod === 'Cash' ? 'CSH' : (paymentMethod === 'UPI' ? 'UPI' : 'CHK')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const itemDetails = {
        devoteeName,
        gotram,
        nakshatram,
        rasi,
        poojaDate,
        familyMembers,
        email,
        phone,
        sankalpam,
        category: poojaLocation
      };
      
      items.push({
        id: `local-pooja-${Date.now()}`,
        type: 'pooja',
        name: poojaName,
        price: parsedPrice,
        details: itemDetails
      });
    } else {
      const parsedAmount = parseFloat(amount) || 0;
      totalPrice = parsedAmount;
      txnId = `TXN-${paymentMethod === 'Cash' ? 'CSH' : (paymentMethod === 'UPI' ? 'UPI' : 'CHK')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const itemDetails = {
        donorName,
        email,
        phone,
        panNumber: panCard,
        panCard,
        address
      };
      
      items.push({
        id: `local-donation-${Date.now()}`,
        type: 'donation',
        cause,
        price: parsedAmount,
        details: itemDetails
      });
    }
    
    const localReceipt = {
      receiptNo,
      txnId,
      date: dateStr,
      items,
      totalPrice,
      isLocal: true,
      paymentMethod,
      checkNo: paymentMethod === 'Check' ? checkNo : undefined,
      bankName: paymentMethod === 'Check' ? bankName : undefined,
      upiTxnId: paymentMethod === 'UPI' ? upiTxnId : undefined,
      organization
    };
    
    try {
      const localTxns = JSON.parse(localStorage.getItem('thennangur_local_txns') || '[]');
      localTxns.push(localReceipt);
      localStorage.setItem('thennangur_local_txns', JSON.stringify(localTxns));
      
      // 1. Generate & Download PDF Receipt
      generatePdfReceipt({
        receiptNo,
        txnId,
        dateStr,
        paymentMethod,
        checkNo,
        bankName,
        upiTxnId,
        totalPrice,
        recordType,
        devoteeName,
        gotram,
        nakshatram,
        rasi,
        poojaDate,
        poojaName,
        poojaLocation,
        familyMembers,
        email,
        phone,
        sankalpam,
        donorName,
        cause,
        panCard,
        address,
        organization
      });

      // 2. Send Simulated Email Receipt (if email is provided)
      if (email) {
        sendEmailReceipt({
          receiptNo,
          txnId,
          dateStr,
          paymentMethod,
          checkNo,
          bankName,
          upiTxnId,
          totalPrice,
          recordType,
          devoteeName,
          gotram,
          nakshatram,
          rasi,
          poojaDate,
          poojaName,
          poojaLocation,
          familyMembers,
          email,
          phone,
          sankalpam,
          donorName,
          cause,
          panCard,
          address,
          organization
        });
      }

      alert(`Transaction ${receiptNo} recorded successfully! PDF receipt generated and email queued.`);
      
      // Reset form & Close
      setIsRecordModalOpen(false);
      resetRecordForm();
      
      // Refresh list
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Failed to save transaction.');
    }
  };

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
      
      let modified = false;
      localTxns.forEach(txn => {
        // Fix dynamically if seeded/stored total price is incorrect
        const calculatedTotal = txn.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        if (txn.totalPrice !== calculatedTotal) {
          txn.totalPrice = calculatedTotal;
          modified = true;
        }

        txn.items.forEach(item => {
          if (item.type === 'pooja') {
            // Fix dynamically if seeded/stored pooja name is actually a devotee name
            if (item.name === 'Mr. Harishankar') {
              item.name = 'Panduranga Rakhumayi Archana';
              modified = true;
            } else if (item.name === 'Mr. Raamassubramanian') {
              item.name = 'Panduranga Rakhumayi Abhishekham';
              modified = true;
            }

            const pooja = contentDb.poojas.find(p => p.name === item.name);
            const rawCategory = item.details.category || (pooja ? pooja.category : 'Sree Matam Poojas');
            
            // Normalize categories to the 4 canonical categories used in the Admin Portal
            let itemCategory = 'Sree Matam Poojas';
            const nameLower = item.name.toLowerCase();
            const catLower = rawCategory.toLowerCase();
            
            if (nameLower.includes('lakshmi') || nameLower.includes('anjaneyar') || catLower.includes('lakshmi')) {
              itemCategory = 'Lakshmi Narayan Temple Poojas';
            } else if (catLower.includes('panduranga') || catLower.includes('pandurangan')) {
              itemCategory = 'Panduranga Rakhumayi Temple Poojas';
            } else if (catLower.includes('meenakshi') || catLower.includes('sundareswarar')) {
              itemCategory = 'Meenakshi Sundareswarar Temple Poojas';
            } else {
              // Shree Matham, Sree Matam, Paada Pooja, or anything else
              itemCategory = 'Sree Matam Poojas';
            }
            bookings.push({
              id: item.id,
              txnId: txn.txnId,
              date: formatToISTDate(txn.date),
              poojaName: item.name,
              price: item.price,
              paymentMethod: txn.paymentMethod || 'Online',
              checkNo: txn.checkNo,
              bankName: txn.bankName,
              upiTxnId: txn.upiTxnId,
              category: itemCategory,
              ...item.details,
              poojaDate: formatToISTDate(item.details?.poojaDate || txn.date)
            });
          } else if (item.type === 'donation') {
            donations.push({
              id: item.id,
              txnId: txn.txnId,
              date: formatToISTDate(txn.date),
              cause: item.cause || item.details.cause,
              amount: item.price,
              paymentMethod: txn.paymentMethod || 'Online',
              checkNo: txn.checkNo,
              bankName: txn.bankName,
              upiTxnId: txn.upiTxnId,
              ...item.details
            });
          }
        });
      });
      
      if (modified) {
        try {
          localStorage.setItem('thennangur_local_txns', JSON.stringify(localTxns));
        } catch (err) {
          console.error('Failed to update corrected local transactions:', err);
        }
      }

      setDbData({
        transactions: localTxns.map(txn => ({
          ...txn,
          date: formatToISTDate(txn.date)
        })),
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

  const handleSeedData = () => {
    const seedTransactions = [
      {
        receiptNo: "GAT-2026-1",
        txnId: "TXN-SD1A8F9K2",
        date: "23 August 2026",
        totalPrice: 350,
        isLocal: false,
        paymentMethod: "Online",
        organization: "GA Trust",
        items: [
          {
            id: "seed-1",
            type: "pooja",
            name: "Gho Pooja",
            price: 100,
            details: {
              devoteeName: "Ramanathan Iyer",
              gotram: "Kashyapa",
              nakshatram: "Rohini",
              rasi: "Vrishabha",
              poojaDate: selectedSheetDate,
              familyMembers: "Ramanathan, Priya, Karthik",
              email: "ram@example.com",
              phone: "+919444012345",
              sankalpam: "Family welfare and good health"
            }
          },
          {
            id: "seed-2",
            type: "pooja",
            name: "Ganapathy Homam",
            price: 250,
            details: {
              devoteeName: "Ganesh Subramanian",
              gotram: "Bharadwaja",
              nakshatram: "Hasta",
              rasi: "Kanya",
              poojaDate: selectedSheetDate,
              familyMembers: "Ganesh, Gayathri, Aditya",
              email: "ganesh@example.com",
              phone: "+919840123456",
              sankalpam: "Removal of obstacles and success in new venture"
            }
          }
        ]
      },
      {
        receiptNo: "GAT-2026-2",
        txnId: "TXN-SD2A9B8C7",
        date: "23 August 2026",
        totalPrice: 7000,
        isLocal: false,
        paymentMethod: "Check",
        checkNo: "220194",
        bankName: "HDFC Bank",
        organization: "GA Trust",
        items: [
          {
            id: "seed-3",
            type: "pooja",
            name: "Abhishekam & Archana to all Deities",
            price: 5000,
            details: {
              devoteeName: "Meenakshi Sundaram",
              gotram: "Srivatsa",
              nakshatram: "Swati",
              rasi: "Tula",
              poojaDate: selectedSheetDate,
              familyMembers: "Meenakshi, Sundar, Shivani",
              email: "meena@example.com",
              phone: "+918825700112",
              sankalpam: "Marriage blessings and prosperity"
            }
          },
          {
            id: "seed-4",
            type: "pooja",
            name: "Abhishekam & Archana to a particular Deity",
            price: 2000,
            details: {
              devoteeName: "Srinivasan Raju",
              gotram: "Harita",
              nakshatram: "Rohini",
              rasi: "Vrishabha",
              poojaDate: selectedSheetDate,
              familyMembers: "Srinivasan, Lakshmi, Varun",
              email: "srini@example.com",
              phone: "+918618199887",
              sankalpam: "Good health and longevity for family members"
            }
          }
        ]
      },
      {
        receiptNo: "GSS-2026-1",
        txnId: "TXN-SD3C4D5E6",
        date: "24 August 2026",
        totalPrice: 10400,
        isLocal: false,
        paymentMethod: "Cash",
        organization: "Gnanananda Seva Samajam",
        items: [
          {
            id: "seed-5",
            type: "pooja",
            name: "Panduranga Rakhumayi Archana",
            price: 100,
            details: {
              devoteeName: "Vijayalakshmi Rao",
              gotram: "Koundinya",
              nakshatram: "Revati",
              rasi: "Meena",
              poojaDate: selectedSheetDate,
              familyMembers: "Vijayalakshmi, Mohan",
              email: "viji@example.com",
              phone: "+919876543210",
              sankalpam: "Devotional growth and peace of mind"
            }
          },
          {
            id: "seed-6",
            type: "pooja",
            name: "Panduranga Rakhumayi Archana",
            price: 100,
            details: {
              devoteeName: "Mr. Harishankar",
              gotram: "Vadhula",
              nakshatram: "Anuradha",
              rasi: "Vrishchika",
              poojaDate: selectedSheetDate,
              familyMembers: "Harishankar, Priya, Ananya",
              email: "harishankar@gatrust.org",
              phone: "+919444310136",
              sankalpam: "Welfare of GA Trust activities"
            }
          },
          {
            id: "seed-7",
            type: "pooja",
            name: "Panduranga Rakhumayi Abhishekham",
            price: 5000,
            details: {
              devoteeName: "Ananthakrishnan R",
              gotram: "Gautama",
              nakshatram: "Arudra",
              rasi: "Mithuna",
              poojaDate: selectedSheetDate,
              familyMembers: "Ananth, Radhika, Shweta",
              email: "ananth@example.com",
              phone: "+919840987654",
              sankalpam: "Aaroghya Dridha Gathratha (Good Health)"
            }
          },
          {
            id: "seed-8",
            type: "pooja",
            name: "Panduranga Rakhumayi Abhishekham",
            price: 5000,
            details: {
              devoteeName: "Mr. Raamassubramanian",
              gotram: "Kashyapa",
              nakshatram: "Uttara",
              rasi: "Kanya",
              poojaDate: selectedSheetDate,
              familyMembers: "Raamassubramanian, Lakshmi",
              email: "managingtrustee@gatrust.org",
              phone: "+919176967153",
              sankalpam: "Ashram Goshala development and success"
            }
          },
          {
            id: "seed-9",
            type: "pooja",
            name: "Panduranga Rakhumayi Archana",
            price: 100,
            details: {
              devoteeName: "Balaji Parthasarathy",
              gotram: "Srivatsa",
              nakshatram: "Hasta",
              rasi: "Kanya",
              poojaDate: selectedSheetDate,
              familyMembers: "Balaji, Hema",
              email: "balaji@example.com",
              phone: "+918618100112",
              sankalpam: "Job stability and general welfare"
            }
          },
          {
            id: "seed-10",
            type: "pooja",
            name: "Panduranga Rakhumayi Archana",
            price: 100,
            details: {
              devoteeName: "Siddharth Venkat",
              gotram: "Harita",
              nakshatram: "Rohini",
              rasi: "Vrishabha",
              poojaDate: selectedSheetDate,
              familyMembers: "Siddharth",
              email: "sid@example.com",
              phone: "+919176967153",
              sankalpam: "Clear thinking and success in exams"
            }
          }
        ]
      },
      {
        receiptNo: "GAT-2026-3",
        txnId: "TXN-SD4F5G6H7",
        date: "24 August 2026",
        totalPrice: 2800,
        isLocal: false,
        paymentMethod: "Online",
        organization: "GA Trust",
        items: [
          {
            id: "seed-11",
            type: "pooja",
            name: "Lakshmi Narayana Abhishekham",
            price: 1000,
            details: {
              devoteeName: "Narayanaswamy K",
              gotram: "Bharadwaja",
              nakshatram: "Swati",
              rasi: "Tula",
              poojaDate: selectedSheetDate,
              familyMembers: "Narayana, Rukmani",
              email: "ns@example.com",
              phone: "+919444055443",
              sankalpam: "Family prosperity and debt relief"
            }
          },
          {
            id: "seed-12",
            type: "pooja",
            name: "Anjaneyar Vada Malai",
            price: 750,
            details: {
              devoteeName: "Hanuman Prasad",
              gotram: "Kashyapa",
              nakshatram: "Anuradha",
              rasi: "Vrishchika",
              poojaDate: selectedSheetDate,
              familyMembers: "Prasad, Anjana, Maruti",
              email: "hanu@example.com",
              phone: "+919840807718",
              sankalpam: "Removal of fear and health issues"
            }
          },
          {
            id: "seed-13",
            type: "pooja",
            name: "Anjaneyar Vada Malai",
            price: 750,
            details: {
              devoteeName: "Ramachandran Murthy",
              gotram: "Srivatsa",
              nakshatram: "Rohini",
              rasi: "Vrishabha",
              poojaDate: selectedSheetDate,
              familyMembers: "Ramachandran, Janaki",
              email: "rc@example.com",
              phone: "+918825766554",
              sankalpam: "Overall family safety and peace"
            }
          },
          {
            id: "seed-14",
            type: "pooja",
            name: "Gho Pooja",
            price: 100,
            details: {
              devoteeName: "Kalyanasundaram K",
              gotram: "Koundinya",
              nakshatram: "Swati",
              rasi: "Tula",
              poojaDate: selectedSheetDate,
              familyMembers: "Kalyanasundaram, Rajeshwari",
              email: "kalyan@example.com",
              phone: "+918618130675",
              sankalpam: "Gho Samrakshanam blessing and peaceful home"
            }
          },
          {
            id: "seed-15",
            type: "pooja",
            name: "Gho Pooja",
            price: 100,
            details: {
              devoteeName: "Senthil Kumar",
              gotram: "Bharadwaja",
              nakshatram: "Hasta",
              rasi: "Kanya",
              poojaDate: selectedSheetDate,
              familyMembers: "Senthil, Priya",
              email: "senthil@example.com",
              phone: "+919988776655",
              sankalpam: "Wealth and prosperity"
            }
          },
          {
            id: "seed-16",
            type: "pooja",
            name: "Panduranga Rakhumayi Archana",
            price: 100,
            details: {
              devoteeName: "Aditya Narain",
              gotram: "Harita",
              nakshatram: "Rohini",
              rasi: "Vrishabha",
              poojaDate: selectedSheetDate,
              familyMembers: "Aditya",
              email: "aditya@example.com",
              phone: "+917766554433",
              sankalpam: "Career success and good intellect"
            }
          }
        ]
      },
      {
        receiptNo: "GAT-2026-4",
        txnId: "TXN-SD5D1A2B3",
        date: "25 August 2026",
        totalPrice: 5000,
        isLocal: false,
        paymentMethod: "Cash",
        organization: "GA Trust",
        items: [
          {
            id: "seed-17",
            type: "donation",
            name: "Annadanam Seva Fund",
            price: 5000,
            cause: "Annadanam",
            details: {
              donorName: "Mr. Raamassubramanian",
              email: "managingtrustee@gatrust.org",
              phone: "+919176967153",
              panCard: "AAAAA1111A",
              address: "31, Sadayappan St, Jeth Nagar, Mandaveli, Chennai - 600028"
            }
          }
        ]
      },
      {
        receiptNo: "GSS-2026-2",
        txnId: "TXN-SD6D4E5F6",
        date: "25 August 2026",
        totalPrice: 10000,
        isLocal: false,
        paymentMethod: "Check",
        checkNo: "889922",
        bankName: "State Bank of India",
        organization: "Gnanananda Seva Samajam",
        items: [
          {
            id: "seed-18",
            type: "donation",
            name: "Goshala Seva Support",
            price: 10000,
            cause: "Goshala",
            details: {
              donorName: "Mr. Harishankar",
              email: "harishankar@gatrust.org",
              phone: "+919444310136",
              panCard: "BBBBB2222B",
              address: "31, Sadayappan St, Jeth Nagar, Mandaveli, Chennai - 600028"
            }
          }
        ]
      },
      {
        receiptNo: "GAT-2026-5",
        txnId: "TXN-SD7D7G8H9",
        date: "25 August 2026",
        totalPrice: 25000,
        isLocal: false,
        paymentMethod: "Check",
        checkNo: "334455",
        bankName: "ICICI Bank",
        organization: "GA Trust",
        items: [
          {
            id: "seed-19",
            type: "donation",
            name: "Senior Citizens Home Seva Support",
            price: 25000,
            cause: "Senior Citizens Home",
            details: {
              donorName: "Mr. S Kumaar",
              email: "skumaar@gatrust.org",
              phone: "+919840123456",
              panCard: "CCCCC3333C",
              address: "31, Sadayappan St, Jeth Nagar, Mandaveli, Chennai - 600028"
            }
          }
        ]
      },
      {
        receiptNo: "GSS-2026-3",
        txnId: "TXN-SD8D0I1J2",
        date: "25 August 2026",
        totalPrice: 1500,
        isLocal: false,
        paymentMethod: "Cash",
        organization: "Gnanananda Seva Samajam",
        items: [
          {
            id: "seed-20",
            type: "donation",
            name: "General Seva Fund Support",
            price: 1500,
            cause: "General Seva",
            details: {
              donorName: "Gnanasekar Pandian",
              email: "gp@example.com",
              phone: "+919444012345",
              panCard: "DDDDD4444D",
              address: "12, South Usman Road, T. Nagar, Chennai - 600017"
            }
          }
        ]
      }
    ];

    try {
      const localTxns = JSON.parse(localStorage.getItem('thennangur_local_txns') || '[]');
      const newTxns = [...localTxns, ...seedTransactions];
      localStorage.setItem('thennangur_local_txns', JSON.stringify(newTxns));
      fetchRecords();
      alert(`Successfully seeded test data spanning 23, 24, and 25 August 2026 with Cash, Check, and Online transactions! 20 items added.`);
    } catch (e) {
      console.error(e);
      alert("Failed to seed database.");
    }
  };



  const getPoojaListForCategory = (category, date) => {
    const targetDate = formatToISTDate(date);
    return dbData.bookings.filter(b => {
      return b.category === category && formatToISTDate(b.poojaDate) === targetDate;
    });
  };

  const handleSendConsolidatedWhatsApp = (category, templeName) => {
    const tomorrowStr = getTomorrowString();
    if (selectedSheetDate < tomorrowStr) {
      alert("Consolidated lists can only be sent for tomorrow and future dates.");
      return;
    }

    const list = getPoojaListForCategory(category, selectedSheetDate);
    if (list.length === 0) {
      alert(`No pooja bookings scheduled for ${templeName} on ${selectedSheetDate}.`);
      return;
    }

    const priest = getPriestInfo(category);
    
    const formattedDate = formatToISTDate(selectedSheetDate);

    let message = `*Thennangur Ashram Pooja Offerings*
*Date:* ${formattedDate}
*Temple:* ${templeName}
*Priest:* ${priest.name}

Total Offerings: ${list.length}
---------------------------------------------`;

    // Group bookings by poojaName
    const grouped = {};
    list.forEach(b => {
      if (!grouped[b.poojaName]) {
        grouped[b.poojaName] = [];
      }
      grouped[b.poojaName].push(b);
    });

    Object.keys(grouped).forEach(poojaName => {
      const bookingsForPooja = grouped[poojaName];
      message += `

*${poojaName} (${bookingsForPooja.length} ${bookingsForPooja.length === 1 ? 'offering' : 'offerings'})*`;
      
      bookingsForPooja.forEach((b, idx) => {
        message += `
${idx + 1}. *Devotee:* ${b.devoteeName || 'N/A'}
   - *Gotram:* ${b.gotram || 'N/A'}
   - *Nakshatram:* ${b.nakshatram || 'N/A'} ${b.rasi ? `(${b.rasi})` : ''}
   - *Family Members:* ${b.familyMembers || 'N/A'}
   - *Sankalpam:* ${b.sankalpam || 'N/A'}`;
      });
    });

    message += `

Radhe Krishna.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${priest.phone.replace(/[^0-9+]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrintConsolidatedList = (category, templeName) => {
    const list = getPoojaListForCategory(category, selectedSheetDate);
    if (list.length === 0) {
      alert(`No pooja bookings scheduled for ${templeName} on ${formatToISTDate(selectedSheetDate)}.`);
      return;
    }

    const priest = getPriestInfo(category);
    const formattedDate = formatToISTDate(selectedSheetDate);

    try {
      const doc = new jsPDF();
      
      let pageNumber = 1;
      let y = 20;

      const drawHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(128, 0, 0); // Temple maroon
        doc.text("THENNANGUR ASHRAM POOJA OFFERINGS", 105, y, { align: "center" });
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Temple: ${templeName}   |   Date: ${formattedDate}`, 105, y, { align: "center" });
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.text(`Priest: ${priest.name}   |   Phone: ${priest.phone}`, 105, y, { align: "center" });
        y += 6;

        // Line separator
        doc.setDrawColor(200, 200, 200);
        doc.line(15, y, 195, y);
        y += 10;
      };

      drawHeader();

      // Group bookings by poojaName
      const grouped = {};
      list.forEach(b => {
        if (!grouped[b.poojaName]) {
          grouped[b.poojaName] = [];
        }
        grouped[b.poojaName].push(b);
      });

      Object.keys(grouped).forEach(poojaName => {
        const bookingsForPooja = grouped[poojaName];

        // Check page overflow before rendering pooja header
        if (y > 250) {
          doc.addPage();
          pageNumber++;
          y = 20;
          drawHeader();
        }

        // Pooja Category Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(128, 0, 0);
        doc.text(`${poojaName} (${bookingsForPooja.length} ${bookingsForPooja.length === 1 ? 'offering' : 'offerings'})`, 15, y);
        y += 7;

        bookingsForPooja.forEach((b, idx) => {
          // Check page overflow for each devotee detail block
          if (y > 235) {
            doc.addPage();
            pageNumber++;
            y = 20;
            drawHeader();
            
            // Re-draw Pooja category header on new page to show continuation
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(128, 0, 0);
            doc.text(`${poojaName} (Continued)`, 15, y);
            y += 7;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          doc.text(`${idx + 1}. Devotee: ${b.devoteeName || 'N/A'}`, 18, y);
          y += 5;

          doc.setFont("helvetica", "normal");
          doc.text(`Gotram: ${b.gotram || 'N/A'}`, 22, y);
          doc.text(`Nakshatram: ${b.nakshatram || 'N/A'} ${b.rasi ? `(${b.rasi})` : ''}`, 105, y);
          y += 5;

          doc.text(`Family Members: ${b.familyMembers || 'N/A'}`, 22, y);
          y += 5;

          // Handle long sankalpam wrap
          const sankalpamText = `Sankalpam: ${b.sankalpam || 'N/A'}`;
          const splitSankalpam = doc.splitTextToSize(sankalpamText, 165);
          splitSankalpam.forEach(line => {
            if (y > 270) {
              doc.addPage();
              pageNumber++;
              y = 20;
              drawHeader();
            }
            doc.text(line, 22, y);
            y += 5;
          });

          // Draw a small subtle line between devotees
          doc.setDrawColor(230, 230, 230);
          doc.line(18, y - 2, 192, y - 2);
          y += 4;
        });

        y += 4; // Space between different pooja groupings
      });

      // Add simple page numbering footer on all pages
      const totalPages = pageNumber;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Generated on ${new Date().toLocaleString('en-IN')} - Page ${i} of ${totalPages}`, 105, 285, { align: "center" });
      }

      doc.save(`Pooja_Offerings_${templeName.replace(/\s+/g, '_')}_${formattedDate}.pdf`);
    } catch (err) {
      console.error('Failed to generate consolidated PDF:', err);
      alert('Failed to generate printable PDF.');
    }
  };

  // Stats calculation
  const totalTransactions = dbData.transactions.length;
  const totalAmount = dbData.transactions.reduce((sum, t) => sum + t.totalPrice, 0);
  const totalBookings = dbData.bookings.length;
  const totalDonations = dbData.donations.length;

  // Helper data & filter flags for column filters
  const uniquePoojaNames = Array.from(new Set(dbData.bookings.map(b => b.poojaName))).filter(Boolean);
  const uniqueCauses = Array.from(new Set(dbData.donations.map(d => d.cause))).filter(Boolean);
  
  const isBookingFiltered = Object.values(bookingFilters).some(v => v !== '');
  const isDonationFiltered = Object.values(donationFilters).some(v => v !== '');

  // Filter lists based on global search & column-specific filters
  const filteredBookings = dbData.bookings.filter(b => {
    // Check Date filter
    if (bookingFilters.date && !b.date?.toLowerCase().includes(bookingFilters.date.toLowerCase())) return false;
    // Check Devotee Name
    if (bookingFilters.devoteeName && !b.devoteeName?.toLowerCase().includes(bookingFilters.devoteeName.toLowerCase())) return false;
    // Check Pooja Name
    if (bookingFilters.poojaName && b.poojaName !== bookingFilters.poojaName) return false;
    // Check Gothram / Nakshatram
    if (bookingFilters.gothraNakshatra) {
      const g = b.gotram?.toLowerCase() || '';
      const n = b.nakshatram?.toLowerCase() || '';
      const r = b.rasi?.toLowerCase() || '';
      const search = bookingFilters.gothraNakshatra.toLowerCase();
      if (!g.includes(search) && !n.includes(search) && !r.includes(search)) return false;
    }
    // Check Pooja Date
    if (bookingFilters.poojaDate && formatToISTDate(b.poojaDate) !== formatToISTDate(bookingFilters.poojaDate)) return false;
    // Check Contact (phone / email)
    if (bookingFilters.contact) {
      const p = b.phone || '';
      const e = b.email?.toLowerCase() || '';
      const search = bookingFilters.contact.toLowerCase();
      if (!p.includes(search) && !e.includes(search)) return false;
    }
    // Check Sankalpam
    if (bookingFilters.sankalpam && !b.sankalpam?.toLowerCase().includes(bookingFilters.sankalpam.toLowerCase())) return false;
    // Check Txn ID
    if (bookingFilters.txnId && !b.txnId?.toLowerCase().includes(bookingFilters.txnId.toLowerCase())) return false;
    
    // Also respect global search if any
    if (searchQuery) {
      const globalSearch = searchQuery.toLowerCase();
      const formattedPoojaDate = formatToISTDate(b.poojaDate);
      const match = 
        b.devoteeName?.toLowerCase().includes(globalSearch) ||
        b.poojaName?.toLowerCase().includes(globalSearch) ||
        b.txnId?.toLowerCase().includes(globalSearch) ||
        b.receiptNo?.toLowerCase().includes(globalSearch) ||
        b.phone?.includes(globalSearch) ||
        b.email?.toLowerCase().includes(globalSearch) ||
        b.gotram?.toLowerCase().includes(globalSearch) ||
        b.nakshatram?.toLowerCase().includes(globalSearch) ||
        b.rasi?.toLowerCase().includes(globalSearch) ||
        b.poojaDate?.toLowerCase().includes(globalSearch) ||
        formattedPoojaDate.toLowerCase().includes(globalSearch) ||
        b.date?.toLowerCase().includes(globalSearch);
      if (!match) return false;
    }
    
    return true;
  });

  const filteredDonations = dbData.donations.filter(d => {
    // Check Date filter
    if (donationFilters.date && !d.date?.toLowerCase().includes(donationFilters.date.toLowerCase())) return false;
    // Check Donor Name
    if (donationFilters.donorName && !d.donorName?.toLowerCase().includes(donationFilters.donorName.toLowerCase())) return false;
    // Check Cause / Seva
    if (donationFilters.cause && d.cause !== donationFilters.cause) return false;
    // Check Min Amount
    if (donationFilters.minAmount && d.amount < parseFloat(donationFilters.minAmount)) return false;
    // Check Contact
    if (donationFilters.contact) {
      const p = d.phone || '';
      const e = d.email?.toLowerCase() || '';
      const search = donationFilters.contact.toLowerCase();
      if (!p.includes(search) && !e.includes(search)) return false;
    }
    // Check PAN Card
    if (donationFilters.panCard && !d.panCard?.toLowerCase().includes(donationFilters.panCard.toLowerCase())) return false;
    // Check Address
    if (donationFilters.address && !d.address?.toLowerCase().includes(donationFilters.address.toLowerCase())) return false;
    // Check Txn ID
    if (donationFilters.txnId && !d.txnId?.toLowerCase().includes(donationFilters.txnId.toLowerCase())) return false;

    // Also respect global search if any
    if (searchQuery) {
      const globalSearch = searchQuery.toLowerCase();
      const match = 
        d.donorName?.toLowerCase().includes(globalSearch) ||
        d.cause?.toLowerCase().includes(globalSearch) ||
        d.txnId?.toLowerCase().includes(globalSearch) ||
        d.receiptNo?.toLowerCase().includes(globalSearch) ||
        d.phone?.includes(globalSearch) ||
        d.email?.toLowerCase().includes(globalSearch) ||
        d.panCard?.toLowerCase().includes(globalSearch) ||
        d.address?.toLowerCase().includes(globalSearch) ||
        d.date?.toLowerCase().includes(globalSearch);
      if (!match) return false;
    }

    return true;
  });

  const isTransactionFiltered = transactionDateFilter !== '';

  const filteredTransactions = dbData.transactions.filter(t => {
    // Check Date filter
    if (transactionDateFilter) {
      const targetDate = formatToISTDate(transactionDateFilter);
      const txnDate = formatToISTDate(t.date);
      if (txnDate !== targetDate) return false;
    }

    // Check search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        t.txnId?.toLowerCase().includes(q) ||
        t.receiptNo?.toLowerCase().includes(q) ||
        t.paymentMethod?.toLowerCase().includes(q) ||
        t.date?.toLowerCase().includes(q) ||
        t.items.some(item => {
          const devotee = item.details?.devoteeName || item.details?.donorName || '';
          const poojaDateRaw = item.details?.poojaDate || '';
          const poojaDateFormatted = formatToISTDate(poojaDateRaw);
          const phone = item.details?.phone || '';
          const email = item.details?.email || '';
          const cause = item.cause || '';
          return (
            item.name.toLowerCase().includes(q) ||
            devotee.toLowerCase().includes(q) ||
            poojaDateRaw.toLowerCase().includes(q) ||
            poojaDateFormatted.toLowerCase().includes(q) ||
            phone.includes(q) ||
            email.toLowerCase().includes(q) ||
            cause.toLowerCase().includes(q)
          );
        });
      if (!match) return false;
    }

    return true;
  });

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
            onClick={() => {
              resetRecordForm();
              setIsRecordModalOpen(true);
            }}
            className="bg-temple-saffron-600 hover:bg-temple-saffron-700 text-white border border-temple-saffron-500 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm animate-pulse-hover"
          >
            <Plus size={12} /> Record Cash/Check
          </button>

          <button 
            onClick={fetchRecords}
            className="bg-white hover:bg-temple-stone-100 text-temple-stone-800 border border-temple-stone-300 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw size={12} className="animate-spin-hover" /> Refresh
          </button>
          
          <button 
            onClick={handleSeedData}
            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Database size={12} /> Seed Test Data
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
              min={getTomorrowString()}
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
              <div
                className={`w-full flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  count > 0 
                    ? 'bg-amber-50/60 border-amber-200 text-temple-stone-800 shadow-sm' 
                    : 'bg-temple-stone-50 border-temple-stone-200 text-temple-stone-400 opacity-60'
                }`}
              >
                <div className="flex flex-col items-center text-center w-full">
                  <span className={`font-bold text-[10px] uppercase tracking-wider ${count > 0 ? 'text-temple-stone-500' : 'text-temple-stone-400'}`}>{templeName}</span>
                  <span className={`font-serif font-extrabold text-2xl mt-1 ${count > 0 ? 'text-temple-maroon-800' : 'text-temple-stone-400'}`}>{count} {count === 1 ? 'Pooja' : 'Poojas'}</span>
                  <span className={`text-[10px] mt-1 truncate max-w-full ${count > 0 ? 'text-temple-stone-600' : 'text-temple-stone-400'}`}>{priest.name.split(' (')[0]}</span>
                </div>
                {count > 0 ? (
                  <div className="flex gap-2 w-full mt-3 pt-3 border-t border-amber-200/50">
                    <button
                      onClick={() => handleSendConsolidatedWhatsApp(category, templeName)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-xs cursor-pointer"
                      title={`Send consolidated sheet to: ${priest.name}`}
                    >
                      <MessageSquare size={12} /> WhatsApp
                    </button>
                    <button
                      onClick={() => handlePrintConsolidatedList(category, templeName)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white rounded-lg text-[10px] font-bold transition-colors shadow-xs cursor-pointer"
                      title="Print consolidated daily list to paper"
                    >
                      <Printer size={12} /> Print
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full mt-3 pt-3 border-t border-temple-stone-200/50 opacity-40">
                    <div className="flex-1 text-center py-1 text-[10px] font-medium text-temple-stone-400">
                      No Bookings
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Meenakshi Sundareswarar */}
          {(() => {
            const category = 'Meenakshi Sundareswarar Temple Poojas';
            const templeName = 'Meenakshi Sundareswarar';
            const priest = getPriestInfo(category);
            const count = getPoojaListForCategory(category, selectedSheetDate).length;
            return (
              <div
                className={`w-full flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  count > 0 
                    ? 'bg-amber-50/60 border-amber-200 text-temple-stone-800 shadow-sm' 
                    : 'bg-temple-stone-50 border-temple-stone-200 text-temple-stone-400 opacity-60'
                }`}
              >
                <div className="flex flex-col items-center text-center w-full">
                  <span className={`font-bold text-[10px] uppercase tracking-wider ${count > 0 ? 'text-temple-stone-500' : 'text-temple-stone-400'}`}>{templeName}</span>
                  <span className={`font-serif font-extrabold text-2xl mt-1 ${count > 0 ? 'text-temple-maroon-800' : 'text-temple-stone-400'}`}>{count} {count === 1 ? 'Pooja' : 'Poojas'}</span>
                  <span className={`text-[10px] mt-1 truncate max-w-full ${count > 0 ? 'text-temple-stone-600' : 'text-temple-stone-400'}`}>{priest.name.split(' (')[0]}</span>
                </div>
                {count > 0 ? (
                  <div className="flex gap-2 w-full mt-3 pt-3 border-t border-amber-200/50">
                    <button
                      onClick={() => handleSendConsolidatedWhatsApp(category, templeName)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-xs cursor-pointer"
                      title={`Send consolidated sheet to: ${priest.name}`}
                    >
                      <MessageSquare size={12} /> WhatsApp
                    </button>
                    <button
                      onClick={() => handlePrintConsolidatedList(category, templeName)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white rounded-lg text-[10px] font-bold transition-colors shadow-xs cursor-pointer"
                      title="Print consolidated daily list to paper"
                    >
                      <Printer size={12} /> Print
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full mt-3 pt-3 border-t border-temple-stone-200/50 opacity-40">
                    <div className="flex-1 text-center py-1 text-[10px] font-medium text-temple-stone-400">
                      No Bookings
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Panduranga */}
          {(() => {
            const category = 'Panduranga Rakhumayi Temple Poojas';
            const templeName = 'Panduranga Temple';
            const priest = getPriestInfo(category);
            const count = getPoojaListForCategory(category, selectedSheetDate).length;
            return (
              <div
                className={`w-full flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  count > 0 
                    ? 'bg-amber-50/60 border-amber-200 text-temple-stone-800 shadow-sm' 
                    : 'bg-temple-stone-50 border-temple-stone-200 text-temple-stone-400 opacity-60'
                }`}
              >
                <div className="flex flex-col items-center text-center w-full">
                  <span className={`font-bold text-[10px] uppercase tracking-wider ${count > 0 ? 'text-temple-stone-500' : 'text-temple-stone-400'}`}>{templeName}</span>
                  <span className={`font-serif font-extrabold text-2xl mt-1 ${count > 0 ? 'text-temple-maroon-800' : 'text-temple-stone-400'}`}>{count} {count === 1 ? 'Pooja' : 'Poojas'}</span>
                  <span className={`text-[10px] mt-1 truncate max-w-full ${count > 0 ? 'text-temple-stone-600' : 'text-temple-stone-400'}`}>{priest.name.split(' (')[0]}</span>
                </div>
                {count > 0 ? (
                  <div className="flex gap-2 w-full mt-3 pt-3 border-t border-amber-200/50">
                    <button
                      onClick={() => handleSendConsolidatedWhatsApp(category, templeName)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-xs cursor-pointer"
                      title={`Send consolidated sheet to: ${priest.name}`}
                    >
                      <MessageSquare size={12} /> WhatsApp
                    </button>
                    <button
                      onClick={() => handlePrintConsolidatedList(category, templeName)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white rounded-lg text-[10px] font-bold transition-colors shadow-xs cursor-pointer"
                      title="Print consolidated daily list to paper"
                    >
                      <Printer size={12} /> Print
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full mt-3 pt-3 border-t border-temple-stone-200/50 opacity-40">
                    <div className="flex-1 text-center py-1 text-[10px] font-medium text-temple-stone-400">
                      No Bookings
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Lakshmi Narayan */}
          {(() => {
            const category = 'Lakshmi Narayan Temple Poojas';
            const templeName = 'Lakshmi Narayan Temple';
            const priest = getPriestInfo(category);
            const count = getPoojaListForCategory(category, selectedSheetDate).length;
            return (
              <div
                className={`w-full flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  count > 0 
                    ? 'bg-amber-50/60 border-amber-200 text-temple-stone-800 shadow-sm' 
                    : 'bg-temple-stone-50 border-temple-stone-200 text-temple-stone-400 opacity-60'
                }`}
              >
                <div className="flex flex-col items-center text-center w-full">
                  <span className={`font-bold text-[10px] uppercase tracking-wider ${count > 0 ? 'text-temple-stone-500' : 'text-temple-stone-400'}`}>{templeName}</span>
                  <span className={`font-serif font-extrabold text-2xl mt-1 ${count > 0 ? 'text-temple-maroon-800' : 'text-temple-stone-400'}`}>{count} {count === 1 ? 'Pooja' : 'Poojas'}</span>
                  <span className={`text-[10px] mt-1 truncate max-w-full ${count > 0 ? 'text-temple-stone-600' : 'text-temple-stone-400'}`}>{priest.name.split(' (')[0]}</span>
                </div>
                {count > 0 ? (
                  <div className="flex gap-2 w-full mt-3 pt-3 border-t border-amber-200/50">
                    <button
                      onClick={() => handleSendConsolidatedWhatsApp(category, templeName)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-xs cursor-pointer"
                      title={`Send consolidated sheet to: ${priest.name}`}
                    >
                      <MessageSquare size={12} /> WhatsApp
                    </button>
                    <button
                      onClick={() => handlePrintConsolidatedList(category, templeName)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white rounded-lg text-[10px] font-bold transition-colors shadow-xs cursor-pointer"
                      title="Print consolidated daily list to paper"
                    >
                      <Printer size={12} /> Print
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full mt-3 pt-3 border-t border-temple-stone-200/50 opacity-40">
                    <div className="flex-1 text-center py-1 text-[10px] font-medium text-temple-stone-400">
                      No Bookings
                    </div>
                  </div>
                )}
              </div>
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

          {/* Search bar & Filter reset */}
          <div className="flex items-center gap-2 max-w-sm w-full">
            {(activeTab === 'bookings' && isBookingFiltered) && (
              <button
                onClick={() => setBookingFilters({
                  date: '',
                  devoteeName: '',
                  poojaName: '',
                  gothraNakshatra: '',
                  poojaDate: '',
                  contact: '',
                  sankalpam: '',
                  txnId: ''
                })}
                className="text-[10px] text-temple-maroon-800 hover:underline font-bold whitespace-nowrap cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            {(activeTab === 'donations' && isDonationFiltered) && (
              <button
                onClick={() => setDonationFilters({
                  date: '',
                  donorName: '',
                  cause: '',
                  minAmount: '',
                  contact: '',
                  panCard: '',
                  address: '',
                  txnId: ''
                })}
                className="text-[10px] text-temple-maroon-800 hover:underline font-bold whitespace-nowrap cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            {(activeTab === 'transactions' && isTransactionFiltered) && (
              <button
                onClick={() => setTransactionDateFilter('')}
                className="text-[10px] text-temple-maroon-800 hover:underline font-bold whitespace-nowrap cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <div className="relative flex-1">
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
                    <tr className="bg-temple-stone-50 border-b border-temple-stone-200">
                      <td className="p-2">
                        <input
                          type="text"
                          value={bookingFilters.date}
                          onChange={e => setBookingFilters({ ...bookingFilters, date: e.target.value })}
                          placeholder="Filter date..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={bookingFilters.devoteeName}
                          onChange={e => setBookingFilters({ ...bookingFilters, devoteeName: e.target.value })}
                          placeholder="Filter name..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={bookingFilters.poojaName}
                          onChange={e => setBookingFilters({ ...bookingFilters, poojaName: e.target.value })}
                          className="w-full px-1 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white cursor-pointer"
                        >
                          <option value="">All Poojas</option>
                          {uniquePoojaNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={bookingFilters.gothraNakshatra}
                          onChange={e => setBookingFilters({ ...bookingFilters, gothraNakshatra: e.target.value })}
                          placeholder="Filter gothra/nakshatram..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="date"
                          value={bookingFilters.poojaDate}
                          onChange={e => setBookingFilters({ ...bookingFilters, poojaDate: e.target.value })}
                          className="w-full px-1 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white cursor-pointer"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={bookingFilters.contact}
                          onChange={e => setBookingFilters({ ...bookingFilters, contact: e.target.value })}
                          placeholder="Filter contact..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={bookingFilters.sankalpam}
                          onChange={e => setBookingFilters({ ...bookingFilters, sankalpam: e.target.value })}
                          placeholder="Filter sankalpam..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={bookingFilters.txnId}
                          onChange={e => setBookingFilters({ ...bookingFilters, txnId: e.target.value })}
                          placeholder="Filter Txn ID..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
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
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-temple-maroon-800">{b.txnId}</div>
                            <div className="mt-1 flex flex-col gap-1">
                              {b.paymentMethod === 'Cash' && (
                                <span className="w-fit bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold px-1 py-0.5 rounded">Cash</span>
                              )}
                              {b.paymentMethod === 'Check' && (
                                <span className="w-fit bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-bold px-1 py-0.5 rounded" title={`${b.bankName || 'N/A'} - Chk# ${b.checkNo || 'N/A'}`}>
                                  Check ({b.checkNo || 'N/A'})
                                </span>
                              )}
                              {b.paymentMethod === 'UPI' && (
                                <span className="w-fit bg-purple-50 border border-purple-200 text-purple-700 text-[9px] font-bold px-1 py-0.5 rounded" title={`UPI Ref: ${b.upiTxnId || 'N/A'}`}>
                                  UPI ({b.upiTxnId || 'N/A'})
                                </span>
                              )}
                              {(b.paymentMethod === 'Online' || !b.paymentMethod) && (
                                <span className="w-fit bg-temple-stone-100 border border-temple-stone-200 text-temple-stone-700 text-[9px] font-bold px-1 py-0.5 rounded">Online</span>
                              )}
                            </div>
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
                    <tr className="bg-temple-stone-50 border-b border-temple-stone-200">
                      <td className="p-2">
                        <input
                          type="text"
                          value={donationFilters.date}
                          onChange={e => setDonationFilters({ ...donationFilters, date: e.target.value })}
                          placeholder="Filter date..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={donationFilters.donorName}
                          onChange={e => setDonationFilters({ ...donationFilters, donorName: e.target.value })}
                          placeholder="Filter donor..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={donationFilters.cause}
                          onChange={e => setDonationFilters({ ...donationFilters, cause: e.target.value })}
                          className="w-full px-1 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white cursor-pointer"
                        >
                          <option value="">All Causes</option>
                          {uniqueCauses.map(cause => (
                            <option key={cause} value={cause}>{cause}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={donationFilters.minAmount}
                          onChange={e => setDonationFilters({ ...donationFilters, minAmount: e.target.value })}
                          placeholder="Min ₹..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={donationFilters.contact}
                          onChange={e => setDonationFilters({ ...donationFilters, contact: e.target.value })}
                          placeholder="Filter contact..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={donationFilters.panCard}
                          onChange={e => setDonationFilters({ ...donationFilters, panCard: e.target.value })}
                          placeholder="Filter PAN..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={donationFilters.address}
                          onChange={e => setDonationFilters({ ...donationFilters, address: e.target.value })}
                          placeholder="Filter address..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={donationFilters.txnId}
                          onChange={e => setDonationFilters({ ...donationFilters, txnId: e.target.value })}
                          placeholder="Filter Txn ID..."
                          className="w-full px-2 py-1 text-[11px] border border-temple-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-temple-saffron-500 bg-white"
                        />
                      </td>
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
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-temple-maroon-800">{d.txnId}</div>
                            <div className="mt-1 flex flex-col gap-1">
                              {d.paymentMethod === 'Cash' && (
                                <span className="w-fit bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold px-1 py-0.5 rounded">Cash</span>
                              )}
                              {d.paymentMethod === 'Check' && (
                                <span className="w-fit bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-bold px-1 py-0.5 rounded" title={`${d.bankName || 'N/A'} - Chk# ${d.checkNo || 'N/A'}`}>
                                  Check ({d.checkNo || 'N/A'})
                                </span>
                              )}
                              {d.paymentMethod === 'UPI' && (
                                <span className="w-fit bg-purple-50 border border-purple-200 text-purple-700 text-[9px] font-bold px-1 py-0.5 rounded" title={`UPI Ref: ${d.upiTxnId || 'N/A'}`}>
                                  UPI ({d.upiTxnId || 'N/A'})
                                </span>
                              )}
                              {(d.paymentMethod === 'Online' || !d.paymentMethod) && (
                                <span className="w-fit bg-temple-stone-100 border border-temple-stone-200 text-temple-stone-700 text-[9px] font-bold px-1 py-0.5 rounded">Online</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 3: Transactions */}
              {activeTab === 'transactions' && (
                <div className="p-4 space-y-4 text-left">
                  {/* Transaction Date Filter */}
                  <div className="bg-temple-stone-50 border border-temple-stone-200 rounded-xl p-4 shadow-xs max-w-md">
                    <label className="block text-[11px] font-bold uppercase text-temple-stone-700 mb-1">
                      Filter by Transaction Date
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="date"
                        value={transactionDateFilter}
                        onChange={e => setTransactionDateFilter(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-temple-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-temple-saffron-500 bg-white cursor-pointer"
                      />
                      {transactionDateFilter && (
                        <button
                          onClick={() => setTransactionDateFilter('')}
                          className="px-2.5 py-1.5 text-xs bg-temple-stone-200 hover:bg-temple-stone-300 text-temple-stone-700 font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredTransactions.length > 0 && (
                    <div className="flex justify-between items-center bg-temple-stone-50 border border-temple-stone-200 rounded-xl px-4 py-3 mb-2 shadow-xs">
                      <span className="font-bold text-temple-stone-700 text-xs">
                        Showing {filteredTransactions.length} receipts
                      </span>
                      <button
                        onClick={downloadAllReceiptsPdf}
                        className="flex items-center gap-1.5 text-xs bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                        <Printer size={14} />
                        Print All Receipts (Combined PDF)
                      </button>
                    </div>
                  )}
                  <div className="divide-y divide-temple-stone-200 space-y-4">
                    {filteredTransactions.length === 0 ? (
                      <p className="text-center text-temple-stone-500 py-10">No transactions recorded.</p>
                    ) : (
                      filteredTransactions.map(t => (
                        <div key={t.txnId} className="bg-temple-stone-50/50 border border-temple-stone-200 rounded-lg p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-serif font-bold text-temple-maroon-900">{t.receiptNo}</span>
                              <span className="text-[10px] font-mono bg-temple-stone-200 text-temple-stone-700 px-1.5 py-0.5 rounded font-bold">{t.txnId}</span>
                              {t.paymentMethod === 'Cash' && (
                                <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-semibold">Cash Payment</span>
                              )}
                              {t.paymentMethod === 'Check' && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-semibold" title={`${t.bankName || 'N/A'} - Chk# ${t.checkNo || 'N/A'}`}>
                                  Check Payment ({t.checkNo || 'N/A'})
                                </span>
                              )}
                              {t.paymentMethod === 'UPI' && (
                                <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-semibold" title={`UPI Ref: ${t.upiTxnId || 'N/A'}`}>
                                  UPI Payment ({t.upiTxnId || 'N/A'})
                                </span>
                              )}
                              {(t.paymentMethod === 'Online' || !t.paymentMethod) && (
                                <span className="text-[10px] bg-temple-stone-100 text-temple-stone-700 border border-temple-stone-200 px-1.5 py-0.5 rounded font-semibold">Online Gateway</span>
                              )}
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
                            <button
                              onClick={() => handlePrintSingleReceipt(t)}
                              className="flex items-center gap-1.5 text-[11px] bg-white hover:bg-temple-stone-100 text-temple-maroon-800 border border-temple-stone-300 font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-xs"
                            >
                              <Printer size={13} />
                              Print Receipt
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Off-line / Admin Record Transaction Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col font-sans">
            {/* Header */}
            <div className="bg-temple-maroon-800 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase text-temple-saffron-300 font-bold tracking-wider">Office Registry</span>
                <h3 className="font-serif font-bold text-xl">Record Offline Transaction</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRecordSubmit} className="p-6 space-y-5 overflow-y-auto flex-grow text-xs text-left">
              
              {/* Transaction Type & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-temple-stone-50 p-4 rounded-xl border border-temple-stone-200">
                <div className="space-y-1 col-span-1">
                  <label className="block font-bold uppercase text-temple-stone-700">Transaction Type *</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setRecordType('pooja')}
                      className={`flex-1 py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                        recordType === 'pooja'
                          ? 'bg-temple-maroon-800 text-white border-temple-maroon-900 shadow-sm'
                          : 'bg-white text-temple-stone-700 border-temple-stone-300 hover:bg-temple-stone-50 cursor-pointer'
                      }`}
                    >
                      Pooja Booking
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordType('donation')}
                      className={`flex-1 py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                        recordType === 'donation'
                          ? 'bg-temple-maroon-800 text-white border-temple-maroon-900 shadow-sm'
                          : 'bg-white text-temple-stone-700 border-temple-stone-300 hover:bg-temple-stone-50 cursor-pointer'
                      }`}
                    >
                      Donation / Seva
                    </button>
                  </div>
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="block font-bold uppercase text-temple-stone-700">Payment Method *</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Cash')}
                      className={`flex-1 py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                        paymentMethod === 'Cash'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                          : 'bg-white text-temple-stone-700 border-temple-stone-300 hover:bg-temple-stone-50 cursor-pointer'
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Check')}
                      className={`flex-1 py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                        paymentMethod === 'Check'
                          ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                          : 'bg-white text-temple-stone-700 border-temple-stone-300 hover:bg-temple-stone-50 cursor-pointer'
                      }`}
                    >
                      Deposited Check
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`flex-1 py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                        paymentMethod === 'UPI'
                          ? 'bg-purple-700 text-white border-purple-800 shadow-sm'
                          : 'bg-white text-temple-stone-700 border-temple-stone-300 hover:bg-temple-stone-50 cursor-pointer'
                      }`}
                    >
                      UPI
                    </button>
                  </div>
                </div>

                <div className="space-y-1 col-span-1 sm:col-span-2">
                  <label className="block font-bold uppercase text-temple-stone-700">Receipt Organization *</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setOrganization('GA Trust')}
                      className={`flex-1 py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                        organization === 'GA Trust'
                          ? 'bg-temple-maroon-800 text-white border-temple-maroon-900 shadow-sm'
                          : 'bg-white text-temple-stone-700 border-temple-stone-300 hover:bg-temple-stone-50 cursor-pointer'
                      }`}
                    >
                      GA Trust
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrganization('Gnanananda Seva Samajam')}
                      className={`flex-1 py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                        organization === 'Gnanananda Seva Samajam'
                          ? 'bg-temple-maroon-800 text-white border-temple-maroon-900 shadow-sm'
                          : 'bg-white text-temple-stone-700 border-temple-stone-300 hover:bg-temple-stone-50 cursor-pointer'
                      }`}
                    >
                      Gnanananda Seva Samajam
                    </button>
                  </div>
                </div>
              </div>

              {/* Check details if Deposited Check */}
              {paymentMethod === 'Check' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                  <div className="col-span-1">
                    <label className="block font-bold uppercase text-blue-900 mb-1">Check Number *</label>
                    <input
                      type="text"
                      required
                      value={checkNo}
                      onChange={(e) => setCheckNo(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-white focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block font-bold uppercase text-blue-900 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. SBI, HDFC, ICICI"
                      className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* UPI details if UPI Payment */}
              {paymentMethod === 'UPI' && (
                <div className="grid grid-cols-1 gap-4 bg-purple-50/50 p-4 rounded-xl border border-purple-200">
                  <div className="col-span-1">
                    <label className="block font-bold uppercase text-purple-900 mb-1">UPI Reference / Transaction ID *</label>
                    <input
                      type="text"
                      required
                      value={upiTxnId}
                      onChange={(e) => setUpiTxnId(e.target.value)}
                      placeholder="e.g. 12-digit UPI UTR number or transaction reference ID"
                      className="w-full p-2 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Type-Specific Fields: Pooja Booking */}
              {recordType === 'pooja' && (
                <div className="space-y-4">
                  <h4 className="font-serif font-bold text-sm text-temple-maroon-800 border-b border-temple-stone-150 pb-1">Devotee & Offering Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Devotee Name *</label>
                      <input
                        type="text"
                        required
                        value={devoteeName}
                        onChange={(e) => setDevoteeName(e.target.value)}
                        placeholder="Devotee name (Sankalpam Karthe)"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Select Pooja from List</label>
                      <select
                        onChange={(e) => handlePoojaChange(e.target.value)}
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Choose Pooja or Type Custom --</option>
                        {contentDb.poojas.map(p => (
                          <option key={p.id} value={p.name}>{p.name} (₹{p.price})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Pooja Name (Custom or Selected) *</label>
                      <input
                        type="text"
                        required
                        value={poojaName}
                        onChange={(e) => setPoojaName(e.target.value)}
                        placeholder="Pooja name"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="col-span-1 space-y-2">
                      <div>
                        <label className="block font-bold uppercase text-temple-stone-700 mb-1">Select Gotram</label>
                        <select
                          onChange={(e) => setGotram(e.target.value)}
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Choose Gotram --</option>
                          {GOTRAM_OPTIONS.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={gotram}
                          onChange={(e) => setGotram(e.target.value)}
                          placeholder="Or type Gotram..."
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 space-y-2">
                      <div>
                        <label className="block font-bold uppercase text-temple-stone-700 mb-1">Select Nakshatram</label>
                        <select
                          onChange={(e) => setNakshatram(e.target.value)}
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Choose Nakshatram --</option>
                          {NAKSHATRAM_OPTIONS.map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={nakshatram}
                          onChange={(e) => setNakshatram(e.target.value)}
                          placeholder="Or type Nakshatram..."
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 space-y-2">
                      <div>
                        <label className="block font-bold uppercase text-temple-stone-700 mb-1">Select Rasi</label>
                        <select
                          onChange={(e) => setRasi(e.target.value)}
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Choose Rasi --</option>
                          {RASI_OPTIONS.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={rasi}
                          onChange={(e) => setRasi(e.target.value)}
                          placeholder="Or type Rasi..."
                          className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Pooja Date *</label>
                      <input
                        type="date"
                        required
                        value={poojaDate}
                        onChange={(e) => setPoojaDate(e.target.value)}
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Amount in Rupees"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Pooja Location / Temple *</label>
                      <select
                        value={poojaLocation}
                        onChange={(e) => setPoojaLocation(e.target.value)}
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="Sree Matam Poojas">Shree Matham</option>
                        <option value="Meenakshi Sundareswarar Temple Poojas">Meenakshi Sundareswarar</option>
                        <option value="Panduranga Rakhumayi Temple Poojas">Panduranga Temple</option>
                        <option value="Lakshmi Narayan Temple Poojas">Lakshmi Narayan Temple</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Family Members</label>
                      <input
                        type="text"
                        value={familyMembers}
                        onChange={(e) => setFamilyMembers(e.target.value)}
                        placeholder="Names of family members (comma separated)"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Devotee phone number"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Devotee email address"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Sankalpam Description</label>
                      <input
                        type="text"
                        value={sankalpam}
                        onChange={(e) => setSankalpam(e.target.value)}
                        placeholder="Family welfare, health, etc."
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-550 bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Type-Specific Fields: Charity Donation */}
              {recordType === 'donation' && (
                <div className="space-y-4">
                  <h4 className="font-serif font-bold text-sm text-temple-maroon-800 border-b border-temple-stone-150 pb-1">Donor & Cause Details</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Donor Name *</label>
                      <input
                        type="text"
                        required
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Donor full name"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Select Cause from List</label>
                      <select
                        onChange={(e) => handleCauseChange(e.target.value)}
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Choose Cause or Type Custom --</option>
                        <option value="Annadanam">Annadanam (Feeding Seva)</option>
                        <option value="One Day Annadhanam">One Day Annadhanam (₹5,000)</option>
                        <option value="Life Time Annadhanam">Life Time Annadhanam (₹50,000)</option>
                        <option value="Goshala Seva">Goshala Seva (Cow Care)</option>
                        <option value="Go Samrakshanam">Go Samrakshanam (₹2,000)</option>
                        <option value="Guruji Medical Centre">Guruji Medical Centre (Healthcare)</option>
                        <option value="Senior Citizens Home">Senior Citizens Home (Elder Care)</option>
                        <option value="Temple Maintenance & General Fund">Temple Maintenance & General Fund</option>
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Cause / Seva Name (Custom or Selected) *</label>
                      <input
                        type="text"
                        required
                        value={cause}
                        onChange={(e) => setCause(e.target.value)}
                        placeholder="Cause name"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Donation amount in Rupees"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">PAN Card Number</label>
                      <input
                        type="text"
                        value={panCard}
                        onChange={(e) => setPanCard(e.target.value.toUpperCase())}
                        maxLength={10}
                        placeholder="10-digit PAN (for 80G tax exemption)"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Donor phone number"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block font-bold uppercase text-temple-stone-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Donor email address"
                        className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="block font-bold uppercase text-temple-stone-700 mb-1">Residential Address</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Postal address for sending prasadam/receipt"
                      rows={2}
                      className="w-full p-2 border border-temple-stone-300 rounded focus:ring-2 focus:ring-temple-saffron-500 bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-temple-stone-200">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="bg-white hover:bg-temple-stone-100 text-temple-stone-800 border border-temple-stone-300 font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-temple-maroon-800 hover:bg-temple-maroon-900 text-white font-bold px-5 py-2 rounded-lg cursor-pointer transition-colors shadow-md"
                >
                  Record & Log Transaction
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
