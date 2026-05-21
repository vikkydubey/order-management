import { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils';
import './OrderForm.css';

function OrderForm() {
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [itemQuantities, setItemQuantities] = useState({});
  const [addedItems, setAddedItems] = useState({});
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [cartNotice, setCartNotice] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCustomers();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/items/all');
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/admin/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('customers');
      setCustomers(stored ? JSON.parse(stored) : []);
    }
  };

  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const collapseAllCategories = () => {
    const next = {};
    categories.forEach((category) => {
      next[category.id] = true;
    });
    setCollapsedCategories(next);
  };

  const expandAllCategories = () => {
    setCollapsedCategories({});
  };

  const getFilteredCategories = () => {
    if (!searchQuery.trim()) {
      return categories;
    }
    
    const query = searchQuery.toLowerCase();
    return categories
      .map(category => ({
        ...category,
        items: category.items?.filter(item => 
          item.name.toLowerCase().includes(query)
        ) || []
      }))
      .filter(category => category.items.length > 0);
  };

  const getSelectedQuantity = (itemId) => {
    return itemQuantities[itemId] || 1;
  };

  const updateSelectedQuantity = (itemId, delta) => {
    setItemQuantities(prev => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, current + delta);
      return {
        ...prev,
        [itemId]: next
      };
    });
  };

  const addToCart = (item, quantity = 1) => {
    const selectedQuantity = Math.max(1, parseInt(quantity, 10) || 1);

    setCart(prevCart => {
      const existingItem = prevCart.find(ci => ci.id === item.id);
      if (existingItem) {
        return prevCart.map(ci =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + selectedQuantity } : ci
        );
      }
      return [...prevCart, { ...item, quantity: selectedQuantity }];
    });

    setItemQuantities(prev => ({
      ...prev,
      [item.id]: 1
    }));

    setCartNotice(`${item.name} added to cart`);
    setAddedItems(prev => ({
      ...prev,
      [item.id]: true
    }));

    setTimeout(() => {
      setCartNotice('');
    }, 1800);

    setTimeout(() => {
      setAddedItems(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }, 1200);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateCartQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: parseInt(quantity) } : item
      ));
    }
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerInfo({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || ''
    });
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
    setCustomerInfo({ name: '', email: '', phone: '' });
    setCustomerSearch('');
  };

  const getFilteredCustomers = () => {
    if (!customerSearch.trim()) {
      return customers;
    }
    const query = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
    );
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!customerInfo.name.trim()) {
      alert('Please enter your name');
      return;
    }

    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/api/orders/create', {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        notes
      });

      if (response.data.id) {
        setSubmitSuccess(true);
        setCustomerInfo({ name: '', email: '', phone: '' });
        setNotes('');
        setCart([]);
        setShowCart(false);
        
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error submitting order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="form-container"><p>Loading...</p></div>;
  }

  return (
    <div className="form-container">
      {submitSuccess && (
        <div className="success-message">
          ✓ Order submitted successfully! We'll be in touch soon.
        </div>
      )}

      {/* Floating fixed cart button */}
      <button
        className="cart-fab"
        onClick={() => setShowCart(true)}
        aria-label="Open cart"
      >
        🛒
        {getCartCount() > 0 && (
          <span className="cart-fab-count">{getCartCount()}</span>
        )}
      </button>

      <div className="products-page">
        <div className="page-header">
          <h2>Shop</h2>
          <button 
            className="cart-icon-btn"
            onClick={() => setShowCart(true)}
          >
            🛒 Cart ({getCartCount()})
          </button>
        </div>

        {cartNotice && <div className="cart-notice">{cartNotice}</div>}

        <div className="items-section">
          <div className="items-header-row">
            <h3>Browse Products</h3>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="items-header-actions">
              <button type="button" className="link-button" onClick={expandAllCategories}>
                Expand all
              </button>
              <button type="button" className="link-button" onClick={collapseAllCategories}>
                Collapse all
              </button>
            </div>
          </div>

          {categories.length === 0 ? (
            <p className="no-items">No items available yet. Ask the admin to add items.</p>
          ) : getFilteredCategories().length === 0 && searchQuery ? (
            <p className="no-items">No items matching "{searchQuery}"</p>
          ) : (
            getFilteredCategories().map(category => {
              const isCollapsed = !!collapsedCategories[category.id];
              return (
                <div key={category.id} className="category-group">
                  <button
                    type="button"
                    className={`category-header ${isCollapsed ? 'collapsed' : ''}`}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <span className="category-title">
                      <span className="chevron">{isCollapsed ? '▶' : '▼'}</span>
                      {category.name}
                      <span className="item-count">{category.items?.length || 0} items</span>
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="items-grid">
                      {category.items && category.items.map(item => (
                        <div key={item.id} className="item-card">
                          <div className="item-image-wrap">
                            {item.image_path && (
                              <img 
                                src={getImageUrl(item.image_path)} 
                                alt={item.name}
                                className="item-image"
                              />
                            )}
                          </div>
                          <div className="item-details">
                            <h5>{item.name}</h5>
                            {item.description && <p className="description">{item.description}</p>}
                            <div className="item-purchase-controls">
                              <div className="qty-stepper">
                                <button
                                  type="button"
                                  className="qty-step-btn"
                                  onClick={() => updateSelectedQuantity(item.id, -1)}
                                  aria-label={`Decrease quantity for ${item.name}`}
                                >
                                  -
                                </button>
                                <span className="qty-value">{getSelectedQuantity(item.id)}</span>
                                <button
                                  type="button"
                                  className="qty-step-btn"
                                  onClick={() => updateSelectedQuantity(item.id, 1)}
                                  aria-label={`Increase quantity for ${item.name}`}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                className={`add-to-cart-btn ${addedItems[item.id] ? 'added' : ''}`}
                                onClick={() => addToCart(item, getSelectedQuantity(item.id))}
                              >
                                {addedItems[item.id] ? '✓ Added' : '🛒 Add to Cart'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="cart-overlay">
          <div className="cart-modal">
            <div className="cart-header">
              <h2>Shopping Cart</h2>
              <button 
                type="button"
                className="close-btn"
                onClick={() => setShowCart(false)}
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              <form onSubmit={handleSubmitOrder}>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <h5>{item.name}</h5>
                      </div>
                      <div className="cart-item-controls">
                        <button
                          type="button"
                          className="qty-step-btn"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          aria-label={`Decrease quantity for ${item.name}`}
                        >
                          -
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          type="button"
                          className="qty-step-btn"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="customer-info-section">
                  <h3>Your Information</h3>

                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleCustomerChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleCustomerChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleCustomerChange}
                    />
                  </div>
                </div>

                <div className="notes-section">
                  <h3>Additional Notes</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes..."
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="submit-btn"
                  >
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowCart(false)}
                    className="cancel-btn"
                  >
                    Continue Shopping
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderForm;
