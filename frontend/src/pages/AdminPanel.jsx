import { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils';
import './AdminPanel.css';

function AdminPanel({ onViewOrder }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newCategory, setNewCategory] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category_id: '',
    description: ''
  });
  const [itemImage, setItemImage] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'items') {
      fetchItems();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders/all');
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/admin/categories');
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/admin/items');
      setItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/admin/customers');
      setCustomers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('customers');
      setCustomers(stored ? JSON.parse(stored) : []);
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      alert('Please enter category name');
      return;
    }

    try {
      await axios.post('/api/admin/categories', { name: newCategory });
      setNewCategory('');
      fetchCategories();
      alert('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? Items in this category will also be deleted.')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/categories/${categoryId}`);
      fetchCategories();
      alert('Category deleted');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category_id) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newItem.name);
      formData.append('price', newItem.price);
      formData.append('category_id', newItem.category_id);
      formData.append('description', newItem.description);
      if (itemImage) {
        formData.append('image', itemImage);
      }

      await axios.post('/api/admin/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNewItem({ name: '', price: '', category_id: '', description: '' });
      setItemImage(null);
      fetchItems();
      alert('Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/items/${itemId}`);
      fetchItems();
      alert('Item deleted');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) {
      alert('Please enter customer name');
      return;
    }

    try {
      const response = await axios.post('/api/admin/customers', newCustomer);
      setNewCustomer({ name: '', email: '', phone: '' });
      fetchCustomers();
      alert('Customer added successfully');
    } catch (error) {
      console.error('Error adding customer:', error);
      // Fallback: store locally
      const localCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const newCust = { ...newCustomer, id: Date.now() };
      localCustomers.push(newCust);
      localStorage.setItem('customers', JSON.stringify(localCustomers));
      setNewCustomer({ name: '', email: '', phone: '' });
      fetchCustomers();
      alert('Customer added successfully');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Delete this customer?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/customers/${customerId}`);
      fetchCustomers();
      alert('Customer deleted');
    } catch (error) {
      console.error('Error deleting customer:', error);
      // Fallback: remove from localStorage
      const localCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const filtered = localCustomers.filter(c => c.id !== customerId);
      localStorage.setItem('customers', JSON.stringify(filtered));
      fetchCustomers();
      alert('Customer deleted');
    }
  };

  const handleViewOrder = (orderId) => {
    onViewOrder('order-detail', orderId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-container">
      <h2>Admin Panel</h2>
      
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button 
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button 
          className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Items
        </button>
        <button 
          className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {/* Orders Tab */}
      {activeTab === 'orders' && !loading && (
        <div className="tab-content">
          <div className="orders-header">
            <h3>All Orders</h3>
            <div className="order-status-filters">
              {['all', 'pending', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  className={`status-filter-btn ${orderStatusFilter === status ? 'active' : ''} ${status !== 'all' ? status : ''}`}
                  onClick={() => setOrderStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status === 'all'
                    ? ` (${orders.length})`
                    : ` (${orders.filter(o => o.status === status).length})`
                  }
                </button>
              ))}
            </div>
          </div>
          {orders.length === 0 ? (
            <p className="no-data">No orders yet</p>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter)
                    .map(order => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.customer_name}</td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>£{order.total_price.toFixed(2)}</td>
                        <td className={`status ${order.status}`}>{order.status}</td>
                        <td>
                          <button
                            className="secondary"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                  {orders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter).length === 0 && (
                    <tr><td colSpan="6" style={{textAlign:'center', color:'#999', padding:'20px'}}>No {orderStatusFilter} orders</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && !loading && (
        <div className="tab-content">
          <h3>Manage Categories</h3>
          
          <form onSubmit={handleAddCategory} className="add-form">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
            />
            <button type="submit">Add Category</button>
          </form>

          <div className="categories-list">
            {categories.length === 0 ? (
              <p className="no-data">No categories yet</p>
            ) : (
              categories.map(category => (
                <div key={category.id} className="category-item">
                  <div>
                    <h4>{category.name}</h4>
                  </div>
                  <button 
                    className="danger"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && !loading && (
        <div className="tab-content">
          <h3>Manage Items</h3>
          
          <form onSubmit={handleAddItem} className="add-item-form">
            <div className="form-row">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="Item name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  placeholder="Price"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={newItem.category_id}
                  onChange={(e) => setNewItem({...newItem, category_id: e.target.value})}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  placeholder="Item description"
                  rows="2"
                ></textarea>
              </div>
              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setItemImage(e.target.files[0])}
                />
              </div>
            </div>
            <button type="submit">Add Item</button>
          </form>

          <div className="items-list">
            {items.length === 0 ? (
              <p className="no-data">No items yet</p>
            ) : (
              items.map(item => (
                <div key={item.id} className="item-item">
                  {item.image_path && (
                    <img src={getImageUrl(item.image_path)} alt={item.name} className="item-thumb" />
                  )}
                  <div>
                    <h4>{item.name}</h4>
                    <p><strong>Category:</strong> {item.category_name}</p>
                    <p><strong>Price:</strong> £{item.price}</p>
                    {item.description && <p>{item.description}</p>}
                  </div>
                  <button 
                    className="danger"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && !loading && (
        <div className="tab-content">
          <h3>Manage Customers</h3>
          
          <form onSubmit={handleAddCustomer} className="add-item-form">
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="Customer name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  placeholder="Email address"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <button type="submit">Add Customer</button>
          </form>

          <div className="customers-list">
            {customers.length === 0 ? (
              <p className="no-data">No customers yet</p>
            ) : (
              customers.map(customer => (
                <div key={customer.id} className="customer-item">
                  <div>
                    <h4>{customer.name}</h4>
                    {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
                    {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
                  </div>
                  <button 
                    className="danger"
                    onClick={() => handleDeleteCustomer(customer.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
