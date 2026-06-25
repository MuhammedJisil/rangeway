import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, LogOut, FileText, ClipboardList, TrendingUp, IndianRupee, Sheet, CheckCircle, AlertCircle, Loader2, Calendar } from 'lucide-react';

export default function Dashboard({ onLogout, onSelectView, apiBaseUrl, token, user }) {
  const [jobCards, setJobCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [exportType, setExportType] = useState(null); // null | 'current_month' | 'all'
  const [exportMessage, setExportMessage] = useState('');
  const [stats, setStats] = useState({
    totalCount: 0,
    grandTotalSum: 0,
    serviceChargeSum: 0,
    taxSum: 0
  });

  const fetchJobCards = async (search = '') => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/jobcards?search=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setJobCards(data);
        
        // Calculate statistics based on fetched cards (or all if not filtered, but doing it on current filtered list is standard, or we calculate on load)
        const counts = data.length;
        const totalSum = data.reduce((acc, curr) => acc + (parseFloat(curr.grand_total) || 0), 0);
        const serviceSum = data.reduce((acc, curr) => acc + (parseFloat(curr.estimate_service_charge) || 0), 0);
        const taxSum = data.reduce((acc, curr) => acc + (parseFloat(curr.tax) || 0), 0);
        
        setStats({
          totalCount: counts,
          grandTotalSum: totalSum,
          serviceChargeSum: serviceSum,
          taxSum: taxSum
        });
      }
    } catch (error) {
      console.error('Error fetching job cards', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards(searchQuery);
  }, [searchQuery]);

  const handleDelete = async (id, jcNo) => {
    if (!window.confirm(`Are you sure you want to delete Job Card ${jcNo}?`)) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/jobcards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchJobCards(searchQuery);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete job card');
      }
    } catch (error) {
      console.error('Error deleting job card', error);
      alert('Network error while deleting job card');
    }
  };

  const handleExportToSheets = async (filterType = 'all') => {
    setExportStatus('loading');
    setExportType(filterType);
    setExportMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/export/sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filter: filterType })
      });
      const data = await response.json();
      if (response.ok) {
        setExportStatus('success');
        setExportMessage(data.message);
        // Open the sheet in a new tab
        if (data.sheetUrl) {
          window.open(data.sheetUrl, '_blank');
        }
        // Reset after 4 seconds
        setTimeout(() => {
          setExportStatus('idle');
          setExportType(null);
        }, 4000);
      } else {
        setExportStatus('error');
        setExportMessage(data.message || 'Export failed. Please try again.');
        setTimeout(() => {
          setExportStatus('idle');
          setExportType(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setExportMessage('Network error. Could not connect to the server.');
      setTimeout(() => {
        setExportStatus('idle');
        setExportType(null);
      }, 5000);
    }
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

  return (
    <div className="min-h-screen bg-brand-darkest text-white pb-12">
      {/* Header Bar */}
      <header className="no-print sticky top-0 z-40 bg-brand-card/90 backdrop-blur-md border-b border-brand-border py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Rangeway" className="h-9 sm:h-10 w-auto object-contain rounded shrink-0" />
          <div className="hidden sm:block">
            <h2 className="text-lg font-bold font-outfit uppercase tracking-wider text-white">Rangeway Auto Upgrades</h2>
            <p className="text-[10px] text-brand-textMuted -mt-1 uppercase tracking-widest font-semibold">Service Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs text-brand-textMuted font-semibold uppercase">Logged in as</p>
            <p className="text-sm font-semibold text-brand-orange">{user.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-brand-input border border-brand-border hover:border-brand-orange text-brand-textMain hover:text-white transition duration-200"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8">
        
        {/* Stats / Numbers section */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-brand-card border border-brand-border p-5 rounded-xl flex items-center gap-4">
            <div className="p-3.5 rounded-lg bg-brand-orange/10 text-brand-orange">
              <ClipboardList size={22} />
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase tracking-wider">Total Cards</p>
              <h3 className="text-2xl font-bold font-outfit mt-0.5">{stats.totalCount}</h3>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border p-5 rounded-xl flex items-center gap-4">
            <div className="p-3.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase tracking-wider">Est. Revenue</p>
              <h3 className="text-2xl font-bold font-outfit mt-0.5 flex items-center">
                <IndianRupee size={18} className="mr-0.5 text-brand-textMuted" />
                {stats.grandTotalSum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border p-5 rounded-xl flex items-center gap-4">
            <div className="p-3.5 rounded-lg bg-blue-500/10 text-blue-400">
              <IndianRupee size={22} />
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase tracking-wider">Service Charge</p>
              <h3 className="text-2xl font-bold font-outfit mt-0.5 flex items-center">
                <IndianRupee size={18} className="mr-0.5 text-brand-textMuted" />
                {stats.serviceChargeSum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border p-5 rounded-xl flex items-center gap-4">
            <div className="p-3.5 rounded-lg bg-purple-500/10 text-purple-400">
              <FileText size={22} />
            </div>
            <div>
              <p className="text-xs text-brand-textMuted font-semibold uppercase tracking-wider">Total Taxes</p>
              <h3 className="text-2xl font-bold font-outfit mt-0.5 flex items-center">
                <IndianRupee size={18} className="mr-0.5 text-brand-textMuted" />
                {stats.taxSum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
            </div>
          </div>
        </section>

        {/* Action Controls Section */}
        <section className="bg-brand-card border border-brand-border p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg w-full">
            <Search className="absolute left-3.5 top-3.5 text-brand-textMuted" size={18} />
            <input
              type="text"
              placeholder="Search by Customer, Mobile, JC No, Reg No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-brand-input border border-brand-border text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-orange transition duration-200"
            />
          </div>

          <div className="flex flex-row items-center gap-2 sm:gap-3 w-auto">
            {/* Export Month to Google Sheets button */}
            <button
              id="export-month-btn"
              onClick={() => handleExportToSheets('current_month')}
              disabled={exportStatus === 'loading'}
              className={`flex items-center justify-center gap-2 px-3 py-3 sm:px-4 rounded-lg font-semibold transition duration-200 border ${
                exportStatus === 'success' && exportType === 'current_month'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : exportStatus === 'error' && exportType === 'current_month'
                  ? 'bg-red-600/20 border-red-500 text-red-400'
                  : 'bg-brand-input border-brand-border hover:border-green-500 hover:text-green-400 text-brand-textMain'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {exportStatus === 'loading' && exportType === 'current_month' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : exportStatus === 'success' && exportType === 'current_month' ? (
                <CheckCircle size={18} />
              ) : exportStatus === 'error' && exportType === 'current_month' ? (
                <AlertCircle size={18} />
              ) : (
                <Calendar size={18} className="text-brand-orange" />
              )}
              <span className="text-xs sm:text-sm">
                {exportStatus === 'loading' && exportType === 'current_month' ? (
                  <span>Exporting...</span>
                ) : exportStatus === 'success' && exportType === 'current_month' ? (
                  <span>Exported!</span>
                ) : exportStatus === 'error' && exportType === 'current_month' ? (
                  <span>Failed</span>
                ) : (
                  <>
                    <span className="inline sm:hidden">Month</span>
                    <span className="hidden sm:inline">Export This Month</span>
                  </>
                )}
              </span>
            </button>

            {/* Export All to Google Sheets button */}
            <button
              id="export-all-btn"
              onClick={() => handleExportToSheets('all')}
              disabled={exportStatus === 'loading'}
              className={`flex items-center justify-center gap-2 px-3 py-3 sm:px-4 rounded-lg font-semibold transition duration-200 border ${
                exportStatus === 'success' && exportType === 'all'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : exportStatus === 'error' && exportType === 'all'
                  ? 'bg-red-600/20 border-red-500 text-red-400'
                  : 'bg-brand-input border-brand-border hover:border-green-500 hover:text-green-400 text-brand-textMain'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {exportStatus === 'loading' && exportType === 'all' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : exportStatus === 'success' && exportType === 'all' ? (
                <CheckCircle size={18} />
              ) : exportStatus === 'error' && exportType === 'all' ? (
                <AlertCircle size={18} />
              ) : (
                <Sheet size={18} className="text-emerald-400" />
              )}
              <span className="text-xs sm:text-sm">
                {exportStatus === 'loading' && exportType === 'all' ? (
                  <span>Exporting...</span>
                ) : exportStatus === 'success' && exportType === 'all' ? (
                  <span>Exported!</span>
                ) : exportStatus === 'error' && exportType === 'all' ? (
                  <span>Failed</span>
                ) : (
                  <>
                    <span className="inline sm:hidden">All</span>
                    <span className="hidden sm:inline">Export All Data</span>
                  </>
                )}
              </span>
            </button>

            <button
              onClick={() => onSelectView('add')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-orange hover:bg-brand-orangeHover text-white font-semibold shadow-lg shadow-brand-orange/20 transition duration-200"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Job Card</span>
            </button>
          </div>
        </section>

        {/* Export status message */}
        {(exportStatus === 'success' || exportStatus === 'error') && exportMessage && (
          <div className={`px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border ${
            exportStatus === 'success'
              ? 'bg-emerald-600/10 border-emerald-600/30 text-emerald-400'
              : 'bg-red-600/10 border-red-600/30 text-red-400'
          }`}>
            {exportStatus === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {exportMessage}
          </div>
        )}

        {/* Content Table / List */}
        <section className="bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="h-10 w-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
              <p className="text-brand-textMuted text-sm font-semibold">Loading job cards...</p>
            </div>
          ) : jobCards.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <ClipboardList size={48} className="text-brand-textMuted opacity-40" />
              <h4 className="text-lg font-bold mt-2 text-white">No Job Cards Found</h4>
              <p className="text-brand-textMuted text-sm max-w-sm">No job cards match your query or none have been created yet. Click 'Add Job Card' to create your first card.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-input border-b border-brand-border text-brand-textMuted text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">JC No.</th>
                      <th className="py-4 px-6">Reg. No.</th>
                      <th className="py-4 px-6">Customer Name</th>
                      <th className="py-4 px-6">Mobile</th>
                      <th className="py-4 px-6">Model</th>
                      <th className="py-4 px-6 text-right">Grand Total</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {jobCards.map((jc) => (
                      <tr key={jc.id} className="hover:bg-brand-input/30 transition duration-150">
                        <td className="py-4 px-6 text-sm whitespace-nowrap">{formatDate(jc.date)}</td>
                        <td className="py-4 px-6 text-sm font-bold text-white whitespace-nowrap">{jc.jc_no}</td>
                        <td className="py-4 px-6 text-sm font-semibold text-brand-orange whitespace-nowrap">{jc.reg_no}</td>
                        <td className="py-4 px-6 text-sm font-medium whitespace-nowrap">{jc.customer_name}</td>
                        <td className="py-4 px-6 text-sm text-brand-textMuted whitespace-nowrap">{jc.mobile}</td>
                        <td className="py-4 px-6 text-sm whitespace-nowrap">{jc.model}</td>
                        <td className="py-4 px-6 text-sm text-right font-bold text-emerald-400 whitespace-nowrap">
                          Rs. {parseFloat(jc.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => onSelectView('view', jc.id)}
                              className="p-2 rounded bg-brand-input hover:bg-brand-orange/10 hover:text-brand-orange text-brand-textMuted transition duration-150"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => onSelectView('edit', jc.id)}
                              className="p-2 rounded bg-brand-input hover:bg-blue-500/10 hover:text-blue-400 text-brand-textMuted transition duration-150"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(jc.id, jc.jc_no)}
                              className="p-2 rounded bg-brand-input hover:bg-red-500/10 hover:text-red-400 text-brand-textMuted transition duration-150"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE GRID VIEW */}
              <div className="md:hidden divide-y divide-brand-border/40">
                {jobCards.map((jc) => (
                  <div key={jc.id} className="p-5 space-y-4 hover:bg-brand-input/10 transition duration-150">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{jc.jc_no}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange font-semibold">{jc.reg_no}</span>
                        </div>
                        <p className="text-xs text-brand-textMuted mt-1">{formatDate(jc.date)}</p>
                      </div>
                      <span className="text-base font-bold text-emerald-400">
                        Rs. {parseFloat(jc.grand_total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-brand-textMuted font-semibold">Customer</p>
                        <p className="font-medium text-white">{jc.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-brand-textMuted font-semibold">Model</p>
                        <p className="font-medium text-white">{jc.model}</p>
                      </div>
                      <div>
                        <p className="text-brand-textMuted font-semibold">Mobile</p>
                        <p className="text-white">{jc.mobile}</p>
                      </div>
                      <div>
                        <p className="text-brand-textMuted font-semibold">Service Type</p>
                        <p className="text-white truncate">{jc.service_type || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => onSelectView('view', jc.id)}
                        className="flex-1 py-2 rounded bg-brand-input hover:bg-brand-orange/10 hover:text-brand-orange text-brand-textMuted text-xs font-semibold flex items-center justify-center gap-1.5 transition duration-150"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => onSelectView('edit', jc.id)}
                        className="flex-1 py-2 rounded bg-brand-input hover:bg-blue-500/10 hover:text-blue-400 text-brand-textMuted text-xs font-semibold flex items-center justify-center gap-1.5 transition duration-150"
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(jc.id, jc.jc_no)}
                        className="py-2 px-3 rounded bg-brand-input hover:bg-red-500/10 hover:text-red-400 text-brand-textMuted transition duration-150"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
