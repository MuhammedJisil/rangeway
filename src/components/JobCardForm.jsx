import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, ArrowLeft, ClipboardList, Package, Hammer, FileText } from 'lucide-react';

export default function JobCardForm({ jobId, onSelectView, apiBaseUrl, token, user }) {
  const isEditMode = !!jobId;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    jc_no: '',
    reg_no: '',
    model: '',
    service_type: '',
    engine_no: '',
    date: new Date().toISOString().split('T')[0],
    customer_name: '',
    address: '',
    phone: '',
    mobile: '',
    customer_demands: '',
    action_taken: '',
    products: [], // { code, particulars, qty, rate, amount }
    labour: [],   // { particulars, qty, rate, amount }
    estimate_service_charge: '',
    tax: '',
    total_amount: 0.00,
    grand_total: 0.00,
    advisor_name: user ? user.name : '',
    service_advise: ''
  });

  // Fetch job card if in edit mode
  useEffect(() => {
    if (isEditMode) {
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

            let formattedDate = new Date().toISOString().split('T')[0];
            if (data.date) {
              try {
                formattedDate = new Date(data.date).toISOString().split('T')[0];
              } catch (dateErr) {
                console.error("Invalid date value", data.date);
              }
            }

            const formattedProducts = products.map(p => ({
              ...p,
              rate: (p.rate === 0 || p.rate === '0' || p.rate === '0.00') ? '' : p.rate
            }));
            const formattedLabour = labour.map(l => ({
              ...l,
              rate: (l.rate === 0 || l.rate === '0' || l.rate === '0.00') ? '' : l.rate
            }));

            setFormData({
              ...data,
              products: formattedProducts,
              labour: formattedLabour,
              date: formattedDate,
              estimate_service_charge: data.estimate_service_charge && parseFloat(data.estimate_service_charge) !== 0 ? parseFloat(data.estimate_service_charge) : '',
              tax: data.tax && parseFloat(data.tax) !== 0 ? parseFloat(data.tax) : '',
              total_amount: parseFloat(data.total_amount) || 0.00,
              grand_total: parseFloat(data.grand_total) || 0.00
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
    } else {
      // Auto-generate a unique JC number if creating new
      const timestamp = Date.now().toString().slice(-4);
      const random = Math.floor(Math.random() * 90 + 10);
      setFormData(prev => ({
        ...prev,
        jc_no: `JC-${new Date().getFullYear().toString().slice(-2)}${random}${timestamp}`
      }));
    }
  }, [jobId]);

  // Recalculate totals whenever products, labour, tax, or estimate service charge change
  useEffect(() => {
    const productsTotal = formData.products.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const labourTotal = formData.labour.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    const subTotal = productsTotal + labourTotal;
    const estService = parseFloat(formData.estimate_service_charge) || 0;
    const taxAmt = parseFloat(formData.tax) || 0;
    const gTotal = subTotal + estService + taxAmt;

    setFormData(prev => ({
      ...prev,
      total_amount: subTotal,
      grand_total: gTotal
    }));
  }, [formData.products, formData.labour, formData.estimate_service_charge, formData.tax]);

  const preventNonNumeric = (allowDecimal = false) => (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const allowedKeys = ['Backspace', 'Tab', 'Enter', 'Escape', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;
    if (/^[0-9]$/.test(e.key)) return;
    if (allowDecimal && e.key === '.' && !e.target.value.includes('.')) return;
    e.preventDefault();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'phone' || name === 'mobile') {
      finalValue = value.replace(/\D/g, '');
    } else {
      const requiredCapitalized = ['jc_no', 'reg_no', 'model', 'customer_name'];
      finalValue = requiredCapitalized.includes(name) ? value.toUpperCase() : value;
    }
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  // --- PRODUCTS HANDLERS ---
  const addProductRow = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { code: '', particulars: '', qty: 1, rate: '', amount: 0 }]
    }));
  };

  const removeProductRow = (index) => {
    const updated = [...formData.products];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, products: updated }));
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...formData.products];
    updated[index][field] = value;

    // Recalculate amount if qty or rate changed
    if (field === 'qty' || field === 'rate') {
      const q = parseFloat(updated[index].qty) || 0;
      const r = parseFloat(updated[index].rate) || 0;
      updated[index].amount = parseFloat((q * r).toFixed(2));
    }
    setFormData(prev => ({ ...prev, products: updated }));
  };

  // --- LABOUR HANDLERS ---
  const addLabourRow = () => {
    setFormData(prev => ({
      ...prev,
      labour: [...prev.labour, { particulars: '', qty: 1, rate: '', amount: 0 }]
    }));
  };

  const removeLabourRow = (index) => {
    const updated = [...formData.labour];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, labour: updated }));
  };

  const handleLabourChange = (index, field, value) => {
    const updated = [...formData.labour];
    updated[index][field] = value;

    // Recalculate amount if qty or rate changed
    if (field === 'qty' || field === 'rate') {
      const q = parseFloat(updated[index].qty) || 0;
      const r = parseFloat(updated[index].rate) || 0;
      updated[index].amount = parseFloat((q * r).toFixed(2));
    }
    setFormData(prev => ({ ...prev, labour: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.jc_no || !formData.reg_no || !formData.model || !formData.customer_name || !formData.mobile) {
      setError('Please fill out all required fields: JC No, Reg No, Model, Customer Name, and Mobile Phone.');
      window.scrollTo(0, 0);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = isEditMode ? `${apiBaseUrl}/jobcards/${jobId}` : `${apiBaseUrl}/jobcards`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error occurred while saving job card');
      }

      // Redirect back to dashboard on success
      onSelectView('dashboard');
    } catch (err) {
      setError(err.message || 'Error saving job card. Please verify your data and try again.');
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-darkest text-white pb-16">
      {/* Header Panel */}
      <header className="sticky top-0 z-40 bg-brand-card/90 backdrop-blur-md border-b border-brand-border py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectView('dashboard')}
            className="p-2 rounded bg-brand-input border border-brand-border hover:border-brand-orange text-brand-textMain hover:text-white transition duration-200"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-bold font-outfit uppercase tracking-wider text-white">
            {isEditMode ? 'Edit Job Card' : 'Create Job Card'}
          </h2>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded bg-brand-orange hover:bg-brand-orangeHover text-white font-semibold transition duration-200 shadow-lg shadow-brand-orange/20 disabled:opacity-50"
        >
          {loading ? (
            <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <Save size={16} />
              <span>Save Job Card</span>
            </>
          )}
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 mt-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: Customer & Vehicle Info */}
          <section className="bg-brand-card border border-brand-border p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-orange flex items-center gap-2 border-b border-brand-border pb-2.5">
              <ClipboardList size={16} />
              <span>Job Card & Customer Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                  Job Card No. <span className="text-brand-orange">*</span>
                </label>
                <input
                  type="text"
                  name="jc_no"
                  value={formData.jc_no}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                  Registration No. <span className="text-brand-orange">*</span>
                </label>
                <input
                  type="text"
                  name="reg_no"
                  value={formData.reg_no}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                  Vehicle Model <span className="text-brand-orange">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                  Service Type
                </label>
                <input
                  type="text"
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                  Engine No.
                </label>
                <input
                  type="text"
                  name="engine_no"
                  value={formData.engine_no}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                  Customer Name <span className="text-brand-orange">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                  Customer Mobile <span className="text-brand-orange">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                  Customer Phone (Landline)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                Customer Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200 resize-y"
              />
            </div>
          </section>

          {/* SECTION 2: Customer Demands & Action Taken */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-brand-card border border-brand-border p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-orange flex items-center gap-2 border-b border-brand-border pb-2.5">
                <FileText size={16} />
                <span>Customer Demands</span>
              </h3>
              <textarea
                name="customer_demands"
                value={formData.customer_demands}
                onChange={handleChange}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200 resize-y"
              />
            </div>

            <div className="bg-brand-card border border-brand-border p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-orange flex items-center gap-2 border-b border-brand-border pb-2.5">
                <FileText size={16} />
                <span>Action Taken</span>
              </h3>
              <textarea
                name="action_taken"
                value={formData.action_taken}
                onChange={handleChange}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200 resize-y"
              />
            </div>
          </section>

          {/* SECTION 3: PRODUCTS LIST */}
          <section className="bg-brand-card border border-brand-border p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-2.5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-orange flex items-center gap-2">
                <Package size={16} />
                <span>Products List</span>
              </h3>
              <button
                type="button"
                onClick={addProductRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-input border border-brand-border hover:border-brand-orange text-xs text-brand-textMain hover:text-white transition duration-150 font-semibold"
              >
                <Plus size={14} />
                <span>Add Product</span>
              </button>
            </div>

            {formData.products.length === 0 ? (
              <p className="text-sm text-brand-textMuted py-4 text-center bg-brand-input/20 rounded border border-dashed border-brand-border">No products added. Click 'Add Product' to list spare parts or products used.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="text-brand-textMuted text-xs font-semibold uppercase border-b border-brand-border pb-2">
                      <th className="py-2 px-1 w-32">Product Code</th>
                      <th className="py-2 px-3">Particulars / Details</th>
                      <th className="py-2 px-2 w-20">Qty</th>
                      <th className="py-2 px-2 w-28">Rate (Rs)</th>
                      <th className="py-2 px-2 w-32 text-right">Amount (Rs)</th>
                      <th className="py-2 px-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30">
                    {formData.products.map((item, idx) => (
                      <tr key={idx} className="align-middle">
                        <td className="py-2 px-1">
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => handleProductChange(idx, 'code', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-brand-input border border-brand-border text-white text-sm focus:outline-none focus:border-brand-orange"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.particulars}
                            onChange={(e) => handleProductChange(idx, 'particulars', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-brand-input border border-brand-border text-white text-sm focus:outline-none focus:border-brand-orange"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleProductChange(idx, 'qty', parseInt(e.target.value) || 0)}
                            onKeyDown={preventNonNumeric(false)}
                            min="1"
                            className="w-full px-2 py-1.5 rounded bg-brand-input border border-brand-border text-white text-sm text-center focus:outline-none focus:border-brand-orange"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleProductChange(idx, 'rate', e.target.value)}
                            onKeyDown={preventNonNumeric(true)}
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1.5 rounded bg-brand-input border border-brand-border text-white text-sm text-right focus:outline-none focus:border-brand-orange"
                          />
                        </td>
                        <td className="py-2 px-2 text-right text-sm font-semibold font-mono pr-4 text-brand-textMain">
                          {item.amount.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeProductRow(idx)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-brand-textMuted hover:text-red-400 transition duration-150"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SECTION 4: LABOUR LIST */}
          <section className="bg-brand-card border border-brand-border p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-2.5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-orange flex items-center gap-2">
                <Hammer size={16} />
                <span>Labour List</span>
              </h3>
              <button
                type="button"
                onClick={addLabourRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-input border border-brand-border hover:border-brand-orange text-xs text-brand-textMain hover:text-white transition duration-150 font-semibold"
              >
                <Plus size={14} />
                <span>Add Labour Line</span>
              </button>
            </div>

            {formData.labour.length === 0 ? (
              <p className="text-sm text-brand-textMuted py-4 text-center bg-brand-input/20 rounded border border-dashed border-brand-border">No labour items added. Click 'Add Labour Line' to log technical services.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="text-brand-textMuted text-xs font-semibold uppercase border-b border-brand-border pb-2">
                      <th className="py-2 px-3">Particulars / Details</th>
                      <th className="py-2 px-2 w-20">Qty</th>
                      <th className="py-2 px-2 w-28">Rate (Rs)</th>
                      <th className="py-2 px-2 w-32 text-right">Amount (Rs)</th>
                      <th className="py-2 px-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30">
                    {formData.labour.map((item, idx) => (
                      <tr key={idx} className="align-middle">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.particulars}
                            onChange={(e) => handleLabourChange(idx, 'particulars', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-brand-input border border-brand-border text-white text-sm focus:outline-none focus:border-brand-orange"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleLabourChange(idx, 'qty', parseInt(e.target.value) || 0)}
                            onKeyDown={preventNonNumeric(false)}
                            min="1"
                            className="w-full px-2 py-1.5 rounded bg-brand-input border border-brand-border text-white text-sm text-center focus:outline-none focus:border-brand-orange"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleLabourChange(idx, 'rate', e.target.value)}
                            onKeyDown={preventNonNumeric(true)}
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1.5 rounded bg-brand-input border border-brand-border text-white text-sm text-right focus:outline-none focus:border-brand-orange"
                          />
                        </td>
                        <td className="py-2 px-2 text-right text-sm font-semibold font-mono pr-4 text-brand-textMain">
                          {item.amount.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLabourRow(idx)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-brand-textMuted hover:text-red-400 transition duration-150"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SECTION 5: FINANCIALS & FOOTER */}
          <section className="bg-brand-card border border-brand-border p-6 rounded-xl space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-orange flex items-center gap-2 border-b border-brand-border pb-2.5">
              <Save size={16} />
              <span>Service Charge & Totals</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Left Column: Advising Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                    Advisor Name
                  </label>
                  <input
                    type="text"
                    name="advisor_name"
                    value={formData.advisor_name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1.5">
                    Service Advice / Remarks
                  </label>
                  <textarea
                    name="service_advise"
                    value={formData.service_advise}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded bg-brand-input border border-brand-border text-white focus:outline-none focus:border-brand-orange transition duration-200 resize-y"
                  />
                </div>
              </div>

              {/* Right Column: Financial Calculations */}
              <div className="bg-brand-input/40 border border-brand-border p-5 rounded-lg space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-textMuted font-semibold">Subtotal (Products + Labour):</span>
                  <span className="font-semibold font-mono text-white">Rs. {formData.total_amount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-brand-textMuted font-semibold text-sm whitespace-nowrap">Est. Service Charge:</span>
                  <div className="relative max-w-[150px] w-full">
                    <span className="absolute left-2.5 top-2.5 text-xs text-brand-textMuted">Rs.</span>
                    <input
                      type="number"
                      name="estimate_service_charge"
                      value={formData.estimate_service_charge}
                      onChange={handleChange}
                      onKeyDown={preventNonNumeric(true)}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-2 py-2 rounded bg-brand-input border border-brand-border text-right text-sm text-white focus:outline-none focus:border-brand-orange font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-brand-textMuted font-semibold text-sm whitespace-nowrap">Tax (VAT/GST):</span>
                  <div className="relative max-w-[150px] w-full">
                    <span className="absolute left-2.5 top-2.5 text-xs text-brand-textMuted">Rs.</span>
                    <input
                      type="number"
                      name="tax"
                      value={formData.tax}
                      onChange={handleChange}
                      onKeyDown={preventNonNumeric(true)}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-2 py-2 rounded bg-brand-input border border-brand-border text-right text-sm text-white focus:outline-none focus:border-brand-orange font-mono"
                    />
                  </div>
                </div>

                <div className="border-t border-brand-border pt-4 flex justify-between items-center">
                  <span className="text-base font-bold text-brand-orange uppercase">Grand Total:</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">Rs. {formData.grand_total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Action buttons at bottom */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onSelectView('dashboard')}
              className="px-6 py-3 rounded-lg bg-brand-input border border-brand-border hover:border-brand-orange text-brand-textMain hover:text-white font-semibold transition duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-lg bg-brand-orange hover:bg-brand-orangeHover text-white font-bold transition duration-200 shadow-lg shadow-brand-orange/20 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Job Card</span>
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
