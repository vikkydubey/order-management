import { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils';
import './OrderDetail.css';

function OrderDetail({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`);
      setOrder(response.data);
      setNewStatus(response.data.status);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (newStatus === order.status) {
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await axios.put(`/api/orders/${orderId}/status`, {
        status: newStatus
      });
      setOrder(response.data);
      alert('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      await axios.delete(`/api/orders/${orderId}`);
      alert('Order deleted');
      onBack();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error deleting order');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return <div className="order-detail"><p>Loading...</p></div>;
  }

  if (!order) {
    return <div className="order-detail"><p>Order not found</p></div>;
  }

  const total = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || order.total_price;

  return (
    <div className="order-detail">
      <button className="back-button" onClick={onBack}>← Back to Orders</button>

      <div className="order-header">
        <div>
          <h2>Order #{order.id}</h2>
          <p className="order-date">{formatDate(order.created_at)}</p>
        </div>
        <div className="status-section">
          <label>Status:</label>
          <select 
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="status-select"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button 
            onClick={handleUpdateStatus}
            disabled={updatingStatus || newStatus === order.status}
            className="update-button"
          >
            {updatingStatus ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>

      <div className="order-content">
        <div className="customer-section">
          <h3>Customer Information</h3>
          <div className="info-grid">
            <div>
              <label>Name</label>
              <p>{order.customer_name}</p>
            </div>
            <div>
              <label>Email</label>
              <p>{order.customer_email || 'N/A'}</p>
            </div>
            <div>
              <label>Phone</label>
              <p>{order.customer_phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="items-section">
          <h3>Order Items</h3>
          <div className="items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="item-with-image">
                        {item.image_path && (
                          <img src={getImageUrl(item.image_path)} alt={item.name} className="order-item-image" />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>{item.category_name || 'N/A'}</td>
                    <td>£{item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>£{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {order.notes && (
          <div className="notes-section">
            <h3>Notes</h3>
            <p>{order.notes}</p>
          </div>
        )}

        <div className="total-section">
          <div className="total-amount">
            <h3>Total Amount</h3>
            <p className="amount">£{total.toFixed(2)}</p>
          </div>
        </div>

        <div className="actions">
          <button className="danger" onClick={handleDeleteOrder}>Delete Order</button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
