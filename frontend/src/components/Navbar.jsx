function Navbar({ page, setPage, user, onLogin, onLogout }) {
  return (
    <nav className="navbar" aria-label="Main navigation">
      <button
        className="nav-logo"
        type="button"
        onClick={() => setPage("home")}
        aria-label="PlanKaro home"
      >
        PlanKaro
      </button>

      <div className="nav-links">
        <button
          className={page === "home" ? "active" : ""}
          onClick={() => setPage("home")}
        >
          Home
        </button>

        <button
          className={page === "bookings" ? "active" : ""}
          onClick={() => {
            if (user) {
              setPage("bookings");
            } else {
              onLogin();
            }
          }}
        >
          My Bookings
        </button>

        {user?.role === "ADMIN" && (
          <button
            className={page === "admin" ? "active" : ""}
            onClick={() => setPage("admin")}
          >
            Admin Dashboard
          </button>
        )}

        {user ? (
          <>
            <span className="nav-user">
              Hi, {user.name?.split(" ")[0]}
            </span>

            <button type="button" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <button className="nav-login-btn" type="button" onClick={onLogin}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;