import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, MessageSquare, Edit, Trash2, PhoneCall, Calendar, Tag, User, MapPin } from 'lucide-react';

export default function JobCardView({ jobId, onSelectView, apiBaseUrl, token }) {
  const [jc, setJc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/jobcards/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          
          // Secure array parsing
          let products = [];
          if (Array.isArray(data.products)) {
            products = data.products;
          } else if (typeof data.products === 'string') {
            try {
              products = JSON.parse(data.products);
            } catch (e) {
              console.error('Error parsing products JSON', e);
            }
          }

          let labour = [];
          if (Array.isArray(data.labour)) {
            labour = data.labour;
          } else if (typeof data.labour === 'string') {
            try {
              labour = JSON.parse(data.labour);
            } catch (e) {
              console.error('Error parsing labour JSON', e);
            }
          }

          setJc({
            ...data,
            products,
            labour
          });
        } else {
          setError('Failed to fetch job card details');
        }
      } catch (err) {
        setError('Network error while loading job card');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [jobId]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!jc) return;

    // Sanitize phone number (remove spaces, symbols)
    let phone = jc.mobile.replace(/\D/g, '');
    
    // Add country code 91 if not present and is a 10-digit number
    if (phone.length === 10) {
      phone = '91' + phone;
    }

    // Format WhatsApp message text
    let message = `🚗 *RANGEWAY AUTO UPGRADES* 🚗\n`;
    message += `📍 Cp Tower, Opp: Treeg Villas, Calicut Road, Patterkulam, Manjeri, Kerala - 676122\n`;
    message += `📞 Mob: 8089097832\n\n`;
    message += `*JOB CARD DETAILS*\n`;
    message += `-------------------------------------------\n`;
    message += `*JC No:* ${jc.jc_no}\n`;
    message += `*Reg No:* ${jc.reg_no.toUpperCase()}\n`;
    message += `*Model:* ${jc.model}\n`;
    message += `*Date:* ${new Date(jc.date).toLocaleDateString('en-IN')}\n`;
    message += `*Customer:* ${jc.customer_name}\n`;
    if (jc.mobile) message += `*Mobile:* ${jc.mobile}\n`;
    message += `-------------------------------------------\n\n`;

    if (jc.products && jc.products.length > 0) {
      message += `*PRODUCTS / PARTS*\n`;
      jc.products.forEach((p, idx) => {
        message += `${idx + 1}. ${p.particulars} ${p.code ? `(CODE: ${p.code})` : ''} x${p.qty} @ Rs.${p.rate} = Rs.${p.amount}\n`;
      });
      message += `-------------------------------------------\n\n`;
    }

    if (jc.labour && jc.labour.length > 0) {
      message += `*LABOUR / SERVICES*\n`;
      jc.labour.forEach((l, idx) => {
        message += `${idx + 1}. ${l.particulars} x${l.qty} @ Rs.${l.rate} = Rs.${l.amount}\n`;
      });
      message += `-------------------------------------------\n\n`;
    }

    message += `*FINANCIAL SUMMARY*\n`;
    message += `*Subtotal:* Rs. ${parseFloat(jc.total_amount || 0).toFixed(2)}\n`;
    message += `*Est. Service Charge:* Rs. ${parseFloat(jc.estimate_service_charge || 0).toFixed(2)}\n`;
    message += `*Tax:* Rs. ${parseFloat(jc.tax || 0).toFixed(2)}\n`;
    message += `*GRAND TOTAL:* Rs. ${parseFloat(jc.grand_total || 0).toFixed(2)}\n\n`;

    if (jc.advisor_name) message += `*Advisor:* ${jc.advisor_name}\n`;
    if (jc.service_advise) message += `*Service Advice:* ${jc.service_advise}\n`;
    message += `-------------------------------------------\n`;
    message += `Thank you for choosing Rangeway Auto Upgrades!`;

    // Encode text message and open WhatsApp URL
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darkest text-white flex flex-col items-center justify-center p-20 gap-4">
        <div className="h-10 w-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand-textMuted text-sm font-semibold">Loading details...</p>
      </div>
    );
  }

  if (error || !jc) {
    return (
      <div className="min-h-screen bg-brand-darkest text-white p-8">
        <div className="max-w-md mx-auto p-6 bg-brand-card border border-brand-border rounded-xl text-center">
          <p className="text-red-400 font-semibold mb-4">{error || 'Job card not found'}</p>
          <button
            onClick={() => onSelectView('dashboard')}
            className="px-4 py-2 rounded bg-brand-orange hover:bg-brand-orangeHover text-white font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darkest text-white pb-20">
      
      {/* Navigation & Actions Header Bar */}
      <header className="no-print sticky top-0 z-40 bg-brand-card/90 backdrop-blur-md border-b border-brand-border py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectView('dashboard')}
            className="p-2 rounded bg-brand-input border border-brand-border hover:border-brand-orange text-brand-textMain hover:text-white transition duration-200"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-bold font-outfit uppercase tracking-wider text-white">
            Job Card Details
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition duration-200 shadow-md shadow-emerald-600/10 flex-1 sm:flex-none"
            title="Share WhatsApp"
          >
            <MessageSquare size={15} />
            <span className="hidden sm:inline">Share WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 text-xs font-semibold rounded bg-brand-input border border-brand-border hover:border-brand-orange text-brand-textMain hover:text-white transition duration-200 flex-1 sm:flex-none"
            title="Print Card"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Print Card</span>
          </button>
          <button
            onClick={() => onSelectView('edit', jc.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 text-xs font-semibold rounded bg-brand-input border border-brand-border hover:border-blue-500 text-brand-textMain hover:text-white transition duration-200 flex-1 sm:flex-none"
            title="Edit"
          >
            <Edit size={15} />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* PREMIUM SCREEN CARD */}
        <section className="no-print bg-brand-card border border-brand-border p-6 sm:p-8 rounded-2xl shadow-2xl space-y-8 relative overflow-hidden">
          
          {/* Brand Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-brand-border pb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <img src="/logo.jpg" alt="Rangeway Logo" className="h-10 sm:h-12 w-auto object-contain rounded shrink-0" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold font-outfit uppercase tracking-wider text-white leading-tight">Rangeway Auto Upgrades</h1>
                <p className="text-[10px] sm:text-xs text-brand-orange uppercase tracking-widest font-bold mt-0.5">Job Card Invoice</p>
              </div>
            </div>
            <div className="text-left md:text-right text-xs text-brand-textMuted space-y-1">
              <p className="font-semibold text-white">Cp Tower, Opp: Treeg Villas,</p>
              <p>Calicut Road, Patterkulam, Manjeri,</p>
              <p>Kerala - 676122</p>
              <p className="font-semibold text-white">Mob: 8089097832</p>
            </div>
          </div>

          {/* Job Card Grid Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-brand-input/30 p-4 rounded-xl border border-brand-border/40">
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase">Job Card No.</p>
              <p className="font-bold text-white mt-0.5">{jc.jc_no}</p>
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase">Reg. No.</p>
              <p className="font-bold text-brand-orange mt-0.5 uppercase">{jc.reg_no}</p>
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase">Model</p>
              <p className="font-semibold text-white mt-0.5">{jc.model}</p>
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase">Date</p>
              <p className="font-semibold text-white mt-0.5">{formatDate(jc.date)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase">Engine No.</p>
              <p className="text-white mt-0.5">{jc.engine_no || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase">Service Type</p>
              <p className="text-white mt-0.5">{jc.service_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase">Customer Name</p>
              <p className="font-medium text-white mt-0.5">{jc.customer_name}</p>
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase">Customer Mobile</p>
              <p className="text-white mt-0.5 flex items-center gap-1.5">
                <PhoneCall size={12} className="text-brand-orange" />
                <span>{jc.mobile}</span>
              </p>
            </div>
            {jc.address && (
              <div className="col-span-2 sm:col-span-4 mt-2 pt-2 border-t border-brand-border/30">
                <p className="text-xs text-brand-textMuted font-semibold uppercase">Address</p>
                <p className="text-white mt-0.5">{jc.address}</p>
              </div>
            )}
          </div>

          {/* Demands & Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-brand-input/20 border border-brand-border/40 p-4 rounded-xl">
              <h4 className="text-xs font-semibold text-brand-orange uppercase tracking-wider border-b border-brand-border/50 pb-1.5 mb-2">Customer Demands</h4>
              <p className="text-sm text-brand-textMain whitespace-pre-line leading-relaxed">{jc.customer_demands || 'No specific demands recorded.'}</p>
            </div>
            <div className="bg-brand-input/20 border border-brand-border/40 p-4 rounded-xl">
              <h4 className="text-xs font-semibold text-brand-orange uppercase tracking-wider border-b border-brand-border/50 pb-1.5 mb-2">Action Taken</h4>
              <p className="text-sm text-brand-textMain whitespace-pre-line leading-relaxed">{jc.action_taken || 'No repairs logged yet.'}</p>
            </div>
          </div>

          {/* Products Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-brand-orange uppercase tracking-wider">Products List</h4>
            {(!jc.products || jc.products.length === 0) ? (
              <p className="text-xs text-brand-textMuted italic">No parts or products used.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-brand-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-input text-brand-textMuted text-xs font-semibold uppercase">
                      <th className="py-2.5 px-4 w-12 text-center">Sl</th>
                      <th className="py-2.5 px-4 w-28">Code</th>
                      <th className="py-2.5 px-4">Particulars</th>
                      <th className="py-2.5 px-4 w-16 text-center">Qty</th>
                      <th className="py-2.5 px-4 w-24 text-right">Rate</th>
                      <th className="py-2.5 px-4 w-28 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {jc.products.map((p, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-2.5 px-4 text-center text-brand-textMuted font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-brand-textMain">{p.code || 'N/A'}</td>
                        <td className="py-2.5 px-4 text-brand-textMain">{p.particulars}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{p.qty}</td>
                        <td className="py-2.5 px-4 text-right font-mono">Rs.{parseFloat(p.rate || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-white">Rs.{parseFloat(p.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Labour Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-brand-orange uppercase tracking-wider">Labour Details</h4>
            {(!jc.labour || jc.labour.length === 0) ? (
              <p className="text-xs text-brand-textMuted italic">No technical services logged.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-brand-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-input text-brand-textMuted text-xs font-semibold uppercase">
                      <th className="py-2.5 px-4 w-12 text-center">Sl</th>
                      <th className="py-2.5 px-4">Particulars</th>
                      <th className="py-2.5 px-4 w-16 text-center">Qty</th>
                      <th className="py-2.5 px-4 w-24 text-right">Rate</th>
                      <th className="py-2.5 px-4 w-28 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {jc.labour.map((l, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-2.5 px-4 text-center text-brand-textMuted font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-4 text-brand-textMain">{l.particulars}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{l.qty}</td>
                        <td className="py-2.5 px-4 text-right font-mono">Rs.{parseFloat(l.rate || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-white">Rs.{parseFloat(l.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Financial Summary Calculation Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-brand-border pt-6">
            <div className="text-xs text-brand-textMuted space-y-1.5">
              {jc.advisor_name && (
                <p><span className="font-semibold text-brand-orange">Advisor:</span> <span className="text-white font-medium">{jc.advisor_name}</span></p>
              )}
              {jc.service_advise && (
                <div className="mt-2">
                  <p className="font-semibold text-brand-orange">Service Advisor Notes:</p>
                  <p className="text-brand-textMain leading-relaxed italic mt-0.5">"{jc.service_advise}"</p>
                </div>
              )}
            </div>

            <div className="bg-brand-input/50 border border-brand-border/60 p-4 rounded-xl w-full sm:max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Subtotal:</span>
                <span className="font-mono font-medium">Rs.{parseFloat(jc.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Est. Service Charge:</span>
                <span className="font-mono font-medium">Rs.{parseFloat(jc.estimate_service_charge || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Tax (VAT/GST):</span>
                <span className="font-mono font-medium">Rs.{parseFloat(jc.tax || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-brand-border/80 pt-2.5 flex justify-between font-bold">
                <span className="text-brand-orange uppercase">Grand Total:</span>
                <span className="font-mono text-emerald-400">Rs.{parseFloat(jc.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* STATIC PRINT LAYOUT (Visible only during printing: hidden in desktop browser UI by print-only class) */}
        <section className="print-only print-card p-6 border-2 border-black max-w-4xl mx-auto text-black font-sans leading-relaxed">
          
          {/* Logo Header */}
          <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Rangeway Logo" className="h-10 w-auto object-contain rounded shrink-0" />
              <div>
                <h1 className="text-base sm:text-xl font-bold font-outfit uppercase tracking-wider text-black leading-tight">Rangeway Auto Upgrades</h1>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-black">Job Card</p>
              </div>
            </div>
            <div className="text-right text-[10px] text-black">
              <p className="font-bold">Cp Tower, Opp: Treeg Villas,</p>
              <p>Calicut Road, Patterkulam, Manjeri,</p>
              <p>Kerala - 676122</p>
              <p className="font-bold">Mob: 8089097832</p>
            </div>
          </div>

          {/* Details Table */}
          <table className="print-table text-xs mb-4">
            <tbody>
              <tr>
                <td className="font-semibold w-1/4">JC No.</td>
                <td className="w-1/4 font-bold">{jc.jc_no}</td>
                <td className="font-semibold w-1/4">Reg. No.</td>
                <td className="w-1/4 font-bold uppercase">{jc.reg_no}</td>
              </tr>
              <tr>
                <td className="font-semibold">Model</td>
                <td>{jc.model}</td>
                <td className="font-semibold">Date</td>
                <td>{formatDate(jc.date)}</td>
              </tr>
              <tr>
                <td className="font-semibold">Service Type</td>
                <td>{jc.service_type || 'N/A'}</td>
                <td className="font-semibold">Engine No.</td>
                <td>{jc.engine_no || 'N/A'}</td>
              </tr>
              <tr>
                <td className="font-semibold">Customer Name</td>
                <td colSpan="3" className="font-bold">{jc.customer_name}</td>
              </tr>
              <tr>
                <td className="font-semibold">Address</td>
                <td colSpan="3">{jc.address || 'N/A'}</td>
              </tr>
              <tr>
                <td className="font-semibold">Phone</td>
                <td>{jc.phone || 'N/A'}</td>
                <td className="font-semibold">Mobile</td>
                <td className="font-bold">{jc.mobile}</td>
              </tr>
            </tbody>
          </table>

          {/* Demands & Actions Taken */}
          <table className="print-table text-xs mb-4">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <th className="w-1/2 text-left">Customer Demands</th>
                <th className="w-1/2 text-left">Action Taken</th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="h-24 whitespace-pre-line leading-relaxed border-r border-black">{jc.customer_demands || 'N/A'}</td>
                <td className="h-24 whitespace-pre-line leading-relaxed">{jc.action_taken || 'N/A'}</td>
              </tr>
            </tbody>
          </table>

          {/* Products List Table */}
          <h4 className="text-[11px] font-bold uppercase mb-1.5 text-black">Products List</h4>
          <table className="print-table text-xs mb-4">
            <thead>
              <tr className="bg-gray-100 font-bold text-[10px]">
                <th className="py-1 w-8 text-center">Sl</th>
                <th className="py-1 w-24 text-left">Code</th>
                <th className="py-1 text-left">Particulars</th>
                <th className="py-1 w-12 text-center">Qty</th>
                <th className="py-1 w-20 text-right">Rate</th>
                <th className="py-1 w-24 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(!jc.products || jc.products.length === 0) ? (
                <tr>
                  <td colSpan="6" className="text-center italic py-2">No spare parts/products logged.</td>
                </tr>
              ) : (
                jc.products.map((p, idx) => (
                  <tr key={idx}>
                    <td className="text-center py-1">{idx + 1}</td>
                    <td className="font-mono py-1">{p.code || '-'}</td>
                    <td className="py-1">{p.particulars}</td>
                    <td className="text-center py-1">{p.qty}</td>
                    <td className="text-right py-1">Rs.{parseFloat(p.rate || 0).toFixed(2)}</td>
                    <td className="text-right py-1 font-bold">Rs.{parseFloat(p.amount || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Labour Table */}
          <h4 className="text-[11px] font-bold uppercase mb-1.5 text-black">Labour details</h4>
          <table className="print-table text-xs mb-4">
            <thead>
              <tr className="bg-gray-100 font-bold text-[10px]">
                <th className="py-1 w-8 text-center">Sl</th>
                <th className="py-1 text-left">Particulars</th>
                <th className="py-1 w-12 text-center">Qty</th>
                <th className="py-1 w-20 text-right">Rate</th>
                <th className="py-1 w-24 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(!jc.labour || jc.labour.length === 0) ? (
                <tr>
                  <td colSpan="5" className="text-center italic py-2">No labor charges logged.</td>
                </tr>
              ) : (
                jc.labour.map((l, idx) => (
                  <tr key={idx}>
                    <td className="text-center py-1">{idx + 1}</td>
                    <td className="py-1">{l.particulars}</td>
                    <td className="text-center py-1">{l.qty}</td>
                    <td className="text-right py-1">Rs.{parseFloat(l.rate || 0).toFixed(2)}</td>
                    <td className="text-right py-1 font-bold">Rs.{parseFloat(l.amount || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Totals panel */}
          <div className="flex justify-between items-start mt-6">
            <div className="text-[10px] w-1/2 space-y-2">
              <p><span className="font-bold">Advisor Name:</span> {jc.advisor_name || 'N/A'}</p>
              {jc.service_advise && (
                <div className="mt-1 border border-black/40 p-1.5 rounded">
                  <p className="font-bold">Service Advice:</p>
                  <p className="italic">"{jc.service_advise}"</p>
                </div>
              )}
            </div>

            <table className="w-1/2 text-xs border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-right font-semibold">Total Amount:</td>
                  <td className="border border-black py-1 px-2 text-right font-mono font-bold w-28">Rs.{parseFloat(jc.total_amount || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-right font-semibold">Est. Service Charge:</td>
                  <td className="border border-black py-1 px-2 text-right font-mono font-bold">Rs.{parseFloat(jc.estimate_service_charge || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-right font-semibold">Tax:</td>
                  <td className="border border-black py-1 px-2 text-right font-mono font-bold">Rs.{parseFloat(jc.tax || 0).toFixed(2)}</td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td className="border-2 border-black py-1.5 px-2 text-right">Grant Total:</td>
                  <td className="border-2 border-black py-1.5 px-2 text-right font-mono">Rs.{parseFloat(jc.grand_total || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature lines */}
          <div className="mt-16 flex justify-between items-center text-xs px-2">
            <div className="border-t border-black w-40 text-center pt-1 font-semibold">
              Customer Signature
            </div>
            <div className="border-t border-black w-40 text-center pt-1 font-semibold">
              Advisor Signature
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
