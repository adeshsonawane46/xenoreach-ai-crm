import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import '../styles/DataCenter.css';

const DataCenter = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'view-customer' | 'edit-customer' | 'view-order' | 'edit-order' | null
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Delete confirm custom modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // 'customer' | 'order' | null
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetLabel, setDeleteTargetLabel] = useState(null);

  // Toast state
  const [toast, setToast] = useState(null);

  // CSV upload states
  const fileInputRef = React.useRef(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Form edit states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    segment: 'New',
    city: '',
    ltv: 0
  });

  const [orderForm, setOrderForm] = useState({
    orderId: '',
    date: '',
    status: 'Processing',
    amount: 0,
    customerName: '',
    customerEmail: ''
  });

  const [saving, setSaving] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const custRes = await api.getCustomers();
      const ordRes = await api.getOrders();
      setCustomers(custRes.data || []);
      setOrders(ordRes.data || []);
    } catch (error) {
      console.error('Error fetching database records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeed = async () => {
    try {
      setLoading(true);
      const res = await api.generateDemoData();
      showToast(`Demo seeded: inserted ${res.customersCount} customers and ${res.ordersCount} orders.`);
      fetchData();
    } catch (error) {
      alert('Error seeding demo data: ' + error.message);
      setLoading(false);
    }
  };

  const handleUploadCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showToast('Please select a valid CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      parseCSV(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      showToast('CSV file is empty or missing data rows.');
      return;
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/["']/g, '').trim());
    
    const nameIndex = headers.indexOf('name');
    const emailIndex = headers.indexOf('email');
    const segmentIndex = headers.indexOf('segment');
    const cityIndex = headers.indexOf('city');
    const ltvIndex = headers.indexOf('ltv');

    if (nameIndex === -1 || emailIndex === -1) {
      showToast('CSV must contain at least "name" and "email" columns.');
      return;
    }

    const parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < Math.max(nameIndex, emailIndex) + 1) continue;

      const email = cols[emailIndex]?.replace(/["']/g, '').trim();
      const name = cols[nameIndex]?.replace(/["']/g, '').trim();
      if (!email || !name) continue;

      const segment = segmentIndex !== -1 ? cols[segmentIndex]?.replace(/["']/g, '').trim() : 'New';
      const city = cityIndex !== -1 ? cols[cityIndex]?.replace(/["']/g, '').trim() : 'N/A';
      const ltvVal = ltvIndex !== -1 ? parseInt(cols[ltvIndex]?.replace(/["']/g, '').trim(), 10) : 0;
      
      parsedRows.push({
        name,
        email,
        segment: segment || 'New',
        city: city || 'N/A',
        ltv: isNaN(ltvVal) ? 0 : ltvVal
      });
    }

    if (parsedRows.length === 0) {
      showToast('No valid customer records found in CSV.');
      return;
    }

    setCsvPreviewRows(parsedRows);
    setActiveModal('csv-preview');
  };

  const executeCSVImport = async () => {
    setUploading(true);
    setUploadProgress(10);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 20;
      });
    }, 100);

    try {
      const res = await api.uploadCustomersCSV(csvPreviewRows);
      setUploadProgress(100);
      clearInterval(progressInterval);
      showToast(`✓ ${res.count} customers imported, ${res.skipped} duplicates skipped`);
      setActiveModal(null);
      setCsvPreviewRows([]);
      fetchData();
    } catch (error) {
      clearInterval(progressInterval);
      showToast(`Failed to upload CSV: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Customer Actions
  const handleViewCustomer = (customer) => {
    setSelectedItem(customer);
    setActiveModal('view-customer');
  };

  const handleEditCustomer = (customer) => {
    setSelectedItem(customer);
    setCustomerForm({
      name: customer.name || '',
      email: customer.email || '',
      segment: customer.segment || 'New',
      city: customer.city || '',
      ltv: customer.ltv || 0
    });
    setActiveModal('edit-customer');
  };

  const triggerDeleteCustomer = (id, name) => {
    setDeleteTargetId(id);
    setDeleteTargetLabel(name);
    setShowDeleteConfirm('customer');
  };

  const executeDeleteCustomer = async () => {
    try {
      setLoading(true);
      setShowDeleteConfirm(null);
      await api.deleteCustomer(deleteTargetId);
      showToast('Customer record deleted successfully.');
      fetchData();
    } catch (error) {
      alert('Failed to delete customer: ' + error.message);
      setLoading(false);
    }
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateCustomer(selectedItem._id, customerForm);
      showToast('Customer updated successfully!');
      setActiveModal(null);
      fetchData();
    } catch (error) {
      alert('Failed to update customer: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Order Actions
  const handleViewOrder = (order) => {
    setSelectedItem(order);
    setActiveModal('view-order');
  };

  const handleEditOrder = (order) => {
    setSelectedItem(order);
    // Format date string for date picker input (YYYY-MM-DD)
    const orderDate = order.date ? new Date(order.date).toISOString().split('T')[0] : '';
    setOrderForm({
      orderId: order.orderId || '',
      date: orderDate,
      status: order.status || 'Processing',
      amount: order.amount || 0,
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || ''
    });
    setActiveModal('edit-order');
  };

  const triggerDeleteOrder = (id, orderId) => {
    setDeleteTargetId(id);
    setDeleteTargetLabel(orderId);
    setShowDeleteConfirm('order');
  };

  const executeDeleteOrder = async () => {
    try {
      setLoading(true);
      setShowDeleteConfirm(null);
      await api.deleteOrder(deleteTargetId);
      showToast('Order record deleted successfully.');
      fetchData();
    } catch (error) {
      alert('Failed to delete order: ' + error.message);
      setLoading(false);
    }
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateOrder(selectedItem._id, orderForm);
      showToast('Order updated successfully!');
      setActiveModal(null);
      fetchData();
    } catch (error) {
      alert('Failed to update order: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Filters
  const filteredCustomers = (customers || []).filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.segment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = (orders || []).filter(o => 
    o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="dc-toast">
          <span className="material-symbols-outlined dc-toast-icon">check_circle</span>
          <span className="font-body-md dc-toast-text">{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-title">
          <h2>Data Center</h2>
          <p>Manage and explore your customer and order data.</p>
        </div>
        <div className="page-header-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            style={{ display: 'none' }}
          />
          <button onClick={handleUploadCSVClick} className="btn btn-secondary">
            <span className="material-symbols-outlined dc-action-btn-icon">upload_file</span>
            Upload CSV
          </button>
          <button onClick={handleSeed} className="btn btn-ai">
            <span className="material-symbols-outlined dc-action-btn-icon">auto_awesome</span>
            Generate Demo Data
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="dc-filter-bar">
        <div className="search-container dc-search-container">
          <span className="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            placeholder="Search records by name, email, city or segment..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dc-search-input"
          />
        </div>
      </div>

      {loading && customers.length === 0 && orders.length === 0 ? (
        <div className="dc-loading-container">
          <span className="material-symbols-outlined dc-loading-icon">sync</span>
          <p className="dc-loading-text">Querying MongoDB database...</p>
        </div>
      ) : (
        <div className="grid-2">
          {/* Customer Data Column */}
          <div className="card dc-data-card">
            <div className="dc-card-header">
              <div className="dc-card-header-title">
                <span className="material-symbols-outlined text-primary">group</span>
                <h3 className="font-headline-md dc-card-title">Customer Data</h3>
              </div>
              <span className="badge badge-neutral">{filteredCustomers.length} Records</span>
            </div>
            
            <div className="dc-card-body">
              <table className="custom-table dc-table">
                <thead className="dc-table-head">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Segment</th>
                    <th>City</th>
                    <th className="dc-th-ltv">LTV</th>
                    <th className="dc-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="dc-td-empty">
                        No customer records found. Click "Generate Demo Data" to seed.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(customer => (
                      <tr key={customer._id}>
                        <td className="dc-td-name">{customer.name}</td>
                        <td className="dc-td-email">{customer.email}</td>
                        <td>
                          <span className={`badge ${
                            customer.segment === 'High Value' ? 'badge-primary' : 
                            customer.segment === 'At Risk' ? 'badge-danger' : 'badge-secondary'
                          }`}>
                            {customer.segment}
                          </span>
                        </td>
                        <td>{customer.city}</td>
                        <td className="dc-td-ltv">₹{customer.ltv.toLocaleString()}</td>
                        <td>
                          <div className="action-buttons dc-td-actions-container">
                            <button onClick={() => handleViewCustomer(customer)} className="action-btn action-btn-view" aria-label="View Customer">
                              <span className="material-symbols-outlined dc-action-btn-icon">visibility</span>
                            </button>
                            <button onClick={() => handleEditCustomer(customer)} className="action-btn action-btn-edit" aria-label="Edit Customer">
                              <span className="material-symbols-outlined dc-action-btn-icon">edit</span>
                            </button>
                            <button onClick={() => triggerDeleteCustomer(customer._id, customer.name)} className="action-btn action-btn-delete" aria-label="Delete Customer">
                              <span className="material-symbols-outlined dc-action-btn-icon">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Data Column */}
          <div className="card dc-data-card">
            <div className="dc-card-header">
              <div className="dc-card-header-title">
                <span className="material-symbols-outlined text-secondary">shopping_cart</span>
                <h3 className="font-headline-md dc-card-title">Order Data</h3>
              </div>
              <span className="badge badge-neutral">{filteredOrders.length} Records</span>
            </div>
            
            <div className="dc-card-body">
              <table className="custom-table dc-table">
                <thead className="dc-table-head">
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="dc-th-ltv">Amount</th>
                    <th className="dc-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="dc-td-empty">
                        No order records found. Click "Generate Demo Data" to seed.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order._id}>
                        <td className="dc-td-order-id">{order.orderId}</td>
                        <td className="dc-td-order-date">{new Date(order.date).toLocaleDateString()}</td>
                        <td>
                          <div className="dc-td-name">{order.customerName}</div>
                          <div className="dc-td-order-customer-email">{order.customerEmail}</div>
                        </td>
                        <td>
                          <span className={`badge ${
                            order.status === 'Fulfilled' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="dc-td-order-amount">₹{order.amount.toLocaleString()}</td>
                        <td>
                          <div className="action-buttons dc-td-actions-container">
                            <button onClick={() => handleViewOrder(order)} className="action-btn action-btn-view" aria-label="View Order">
                              <span className="material-symbols-outlined dc-action-btn-icon">visibility</span>
                            </button>
                            <button onClick={() => handleEditOrder(order)} className="action-btn action-btn-edit" aria-label="Edit Order">
                              <span className="material-symbols-outlined dc-action-btn-icon">edit</span>
                            </button>
                            <button onClick={() => triggerDeleteOrder(order._id, order.orderId)} className="action-btn action-btn-delete" aria-label="Delete Order">
                              <span className="material-symbols-outlined dc-action-btn-icon">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM CONFIRM DELETE MODAL --- */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content dc-modal-delete-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header dc-modal-delete-header">
              <h3 className="font-headline-md dc-modal-delete-title">
                <span className="material-symbols-outlined">warning</span>
                Confirm Delete
              </h3>
              <button className="action-btn" onClick={() => setShowDeleteConfirm(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body dc-modal-delete-body">
              <p className="font-body-md dc-modal-delete-desc">
                Are you sure you want to delete {showDeleteConfirm === 'customer' ? 'customer' : 'order'}{' '}
                <strong>"{deleteTargetLabel}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer dc-modal-delete-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button 
                className="btn dc-modal-delete-btn" 
                onClick={showDeleteConfirm === 'customer' ? executeDeleteCustomer : executeDeleteOrder}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOMER OVERLAY MODALS --- */}
      
      {/* View Customer Modal */}
      {activeModal === 'view-customer' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-headline-md dc-modal-view-title">Customer Details</h3>
              <button className="action-btn" onClick={() => setActiveModal(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="dc-modal-view-body-list">
                <div>
                  <label className="form-label dc-modal-view-label">Database Document ID</label>
                  <p className="font-body-md dc-modal-view-id-text">{selectedItem._id}</p>
                </div>
                <div>
                  <label className="form-label dc-modal-view-label">Full Name</label>
                  <p className="font-body-lg dc-modal-view-name-text">{selectedItem.name}</p>
                </div>
                <div>
                  <label className="form-label dc-modal-view-label">Email Address</label>
                  <p className="font-body-md dc-modal-view-email-text">{selectedItem.email}</p>
                </div>
                <div className="dc-modal-view-grid-2">
                  <div>
                    <label className="form-label dc-modal-view-label">Segment</label>
                    <div>
                      <span className={`badge ${
                        selectedItem.segment === 'High Value' ? 'badge-primary' : 
                        selectedItem.segment === 'At Risk' ? 'badge-danger' : 'badge-secondary'
                      }`}>
                        {selectedItem.segment}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="form-label dc-modal-view-label">City / Location</label>
                    <p className="font-body-md dc-modal-view-city-text">{selectedItem.city || 'N/A'}</p>
                  </div>
                </div>
                <div className="dc-modal-view-grid-2">
                  <div>
                    <label className="form-label dc-modal-view-label">Lifetime Value (LTV)</label>
                    <p className="font-body-lg dc-modal-view-ltv-text">₹{selectedItem.ltv.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="form-label dc-modal-view-label">Last Purchase Date</label>
                    <p className="font-body-md dc-modal-view-date-text">
                      {selectedItem.lastPurchaseDate ? new Date(selectedItem.lastPurchaseDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {activeModal === 'edit-customer' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-header">
                <h3 className="font-headline-md dc-modal-edit-title">Edit Customer</h3>
                <button type="button" className="action-btn" onClick={() => setActiveModal(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="dc-modal-edit-body-list">
                  <div className="form-group dc-modal-edit-form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group dc-modal-edit-form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group dc-modal-edit-form-group">
                    <label className="form-label">Segment</label>
                    <select
                      className="form-input"
                      value={customerForm.segment}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, segment: e.target.value }))}
                    >
                      <option value="New">New</option>
                      <option value="High Value">High Value</option>
                      <option value="At Risk">At Risk</option>
                    </select>
                  </div>
                  <div className="dc-modal-view-grid-2">
                    <div className="form-group dc-modal-edit-form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-input"
                        value={customerForm.city}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group dc-modal-edit-form-group">
                      <label className="form-label">LTV (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={customerForm.ltv}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, ltv: parseInt(e.target.value) || 0 }))}
                        required
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ORDER OVERLAY MODALS --- */}
      
      {/* View Order Modal */}
      {activeModal === 'view-order' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-headline-md dc-modal-view-title">Order Details</h3>
              <button className="action-btn" onClick={() => setActiveModal(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="dc-modal-view-body-list">
                <div className="dc-modal-view-grid-2">
                  <div>
                    <label className="form-label dc-modal-view-label">Order ID</label>
                    <p className="font-body-lg dc-modal-view-ltv-text">{selectedItem.orderId}</p>
                  </div>
                  <div>
                    <label className="form-label dc-modal-view-label">Order Date</label>
                    <p className="font-body-md dc-modal-view-date-text">{new Date(selectedItem.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--outline-variant)', margin: '4px 0' }} />
                <div>
                  <label className="form-label dc-modal-view-label">Customer Name</label>
                  <p className="font-body-lg dc-modal-view-name-text">{selectedItem.customerName}</p>
                </div>
                <div>
                  <label className="form-label dc-modal-view-label">Customer Email</label>
                  <p className="font-body-md dc-modal-view-id-text">{selectedItem.customerEmail}</p>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--outline-variant)', margin: '4px 0' }} />
                <div className="dc-modal-view-grid-2">
                  <div>
                    <label className="form-label dc-modal-view-label">Fulfillment Status</label>
                    <div>
                      <span className={`badge ${
                        selectedItem.status === 'Fulfilled' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {selectedItem.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="form-label dc-modal-view-label">Amount Paid</label>
                    <p className="font-body-lg dc-modal-view-name-text">₹{selectedItem.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {activeModal === 'edit-order' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveOrder}>
              <div className="modal-header">
                <h3 className="font-headline-md dc-modal-edit-title">Edit Order</h3>
                <button type="button" className="action-btn" onClick={() => setActiveModal(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="dc-modal-edit-body-list">
                  <div className="dc-modal-view-grid-2">
                    <div className="form-group dc-modal-edit-form-group">
                      <label className="form-label">Order ID</label>
                      <input
                        type="text"
                        className="form-input"
                        value={orderForm.orderId}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, orderId: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group dc-modal-edit-form-group">
                      <label className="form-label">Order Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={orderForm.date}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group dc-modal-edit-form-group">
                    <label className="form-label">Customer Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group dc-modal-edit-form-group">
                    <label className="form-label">Customer Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={orderForm.customerEmail}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="dc-modal-view-grid-2">
                    <div className="form-group dc-modal-edit-form-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-input"
                        value={orderForm.status}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Fulfilled">Fulfilled</option>
                      </select>
                    </div>
                    <div className="form-group dc-modal-edit-form-group">
                      <label className="form-label">Amount (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={orderForm.amount}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Preview & Confirm Modal */}
      {activeModal === 'csv-preview' && csvPreviewRows.length > 0 && (
        <div className="modal-overlay" onClick={() => !uploading && setActiveModal(null)}>
          <div className="modal-content dc-modal-csv-preview" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="font-headline-md">CSV Data Preview</h3>
              <button className="action-btn" onClick={() => !uploading && setActiveModal(null)} disabled={uploading}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
                Found <strong>{csvPreviewRows.length}</strong> customer records in the CSV file. Please confirm the preview below before importing them into MongoDB.
              </p>
              
              <table className="custom-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--outline-variant)' }}>
                    <th style={{ padding: '8px' }}>Name</th>
                    <th style={{ padding: '8px' }}>Email</th>
                    <th style={{ padding: '8px' }}>Segment</th>
                    <th style={{ padding: '8px' }}>City</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>LTV</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreviewRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                      <td style={{ padding: '8px' }}>{row.name}</td>
                      <td style={{ padding: '8px' }}>{row.email}</td>
                      <td style={{ padding: '8px' }}>
                        <span className="badge badge-neutral">{row.segment}</span>
                      </td>
                      <td style={{ padding: '8px' }}>{row.city}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>₹{row.ltv.toLocaleString()}</td>
                    </tr>
                  ))}
                  {csvPreviewRows.length > 5 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: 'var(--outline)', fontStyle: 'italic' }}>
                        ... and {csvPreviewRows.length - 5} more customer records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {uploading && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span>Importing to MongoDB...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.2s ease-out' }}></div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)} disabled={uploading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={executeCSVImport} disabled={uploading}>
                {uploading ? (
                  <>
                    <span className="material-symbols-outlined spinner" style={{ animation: 'spin 1s linear infinite', marginRight: '6px', fontSize: '16px' }}>sync</span>
                    Importing...
                  </>
                ) : (
                  'Confirm & Import'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCenter;
