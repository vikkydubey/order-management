import './Navigation.css';

function Navigation({ currentPage, onNavigate, isAdmin, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>Order Management</h1>
        </div>

        <ul className="nav-menu">
          {!isAdmin && (
            <li>
              <button
                className={`nav-link ${currentPage === 'form' ? 'active' : ''}`}
                onClick={() => onNavigate('form')}
              >
                Place Order
              </button>
            </li>
          )}
          {isAdmin && (
            <li>
              <button
                className="nav-link"
                onClick={onLogout}
                title="Sign out of Admin"
              >
                Sign Out
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
