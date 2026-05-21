import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import OrderForm from './pages/OrderForm';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import OrderDetail from './pages/OrderDetail';
import './App.css';

function isAdminRoute() {
  return window.location.hash === '#/admin' || window.location.hash.startsWith('#/admin/');
}

function isAuthed() {
  return sessionStorage.getItem('admin_authed') === '1';
}

function App() {
  const [currentPage, setCurrentPage] = useState(() =>
    isAdminRoute() ? (isAuthed() ? 'admin' : 'admin-login') : 'form'
  );
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Sync hash changes (e.g. user types /admin in address bar)
  useEffect(() => {
    const onHashChange = () => {
      if (isAdminRoute()) {
        setCurrentPage(isAuthed() ? 'admin' : 'admin-login');
      } else {
        setCurrentPage('form');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (page, orderId = null) => {
    if (page === 'form') window.location.hash = '';
    if (page === 'admin') window.location.hash = '#/admin';
    setCurrentPage(page);
    if (orderId) setSelectedOrderId(orderId);
  };

  const handleLoginSuccess = () => {
    window.location.hash = '#/admin';
    setCurrentPage('admin');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('admin_authed');
    window.location.hash = '';
    setCurrentPage('form');
  };

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Full-screen login — no nav/footer chrome
  if (currentPage === 'admin-login') {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      <Navigation
        currentPage={currentPage}
        onNavigate={navigateTo}
        isAdmin={currentPage === 'admin' || currentPage === 'order-detail'}
        onLogout={handleAdminLogout}
      />

      <main className="main-content">
        {currentPage === 'form' && <OrderForm />}
        {currentPage === 'admin' && <AdminPanel onViewOrder={navigateTo} />}
        {currentPage === 'order-detail' && selectedOrderId && (
          <OrderDetail
            orderId={selectedOrderId}
            onBack={() => navigateTo('admin')}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 Developed by VN Developers. Contact: +44-7436693729</p>
      </footer>

      {showBackToTop && (
        <button 
          className="back-to-top-btn"
          onClick={scrollToTop}
          title="Back to top"
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default App;
