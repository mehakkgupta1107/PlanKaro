import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import { apiUrl } from "../../api";
import { eventImageForCategory } from "../../eventImages";

const ANALYTICS_PERIODS = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "7", label: "Last 7 days" }
];

const isTicketSold = (booking) =>
  ["CONFIRMED", "BOOKED", "COMPLETED", "SUCCESS"].includes(
    (booking.status || "").toUpperCase()
  );

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAnalyticsBookings(bookings, period) {
  const soldBookings = bookings.filter(isTicketSold);

  if (period === "all") {
    return soldBookings;
  }

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - Number(period) + 1);

  return soldBookings.filter((booking) => {
    const bookingTime = new Date(booking.bookingTime);
    return !Number.isNaN(bookingTime.getTime()) && bookingTime >= cutoff;
  });
}

function getTrendBuckets(bookings, period) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === "all") {
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      return {
        key: `${month.getFullYear()}-${month.getMonth()}`,
        label: month.toLocaleDateString("en", { month: "short" }),
        start: month,
        end: new Date(month.getFullYear(), month.getMonth() + 1, 1)
      };
    });
  }

  if (period === "30") {
    const firstDay = new Date(today);
    firstDay.setDate(firstDay.getDate() - 29);
    return Array.from({ length: 5 }, (_, index) => {
      const start = new Date(firstDay);
      start.setDate(start.getDate() + index * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return {
        key: getLocalDateKey(start),
        label: start.toLocaleDateString("en", { day: "numeric", month: "short" }),
        start,
        end
      };
    });
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - 6 + index);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    return {
      key: getLocalDateKey(date),
      label: date.toLocaleDateString("en", { weekday: "short" }),
      start: date,
      end
    };
  });
}

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");

  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("all");
  const [eventSearch, setEventSearch] = useState("");

  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    category: "",
    price: "",
    venueId: ""
  });

  const [showVenueForm, setShowVenueForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  const [venueForm, setVenueForm] = useState({
    name: "",
    location: "",
    capacity: "",
    description: ""
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const [
        usersResponse,
        bookingsResponse,
        eventsResponse,
        venuesResponse
      ] = await Promise.all([
        fetch(apiUrl("/api/users")),
        fetch(apiUrl("/api/bookings")),
        fetch(apiUrl("/api/events")),
        fetch(apiUrl("/api/venues"))
      ]);

      if (
        !usersResponse.ok ||
        !bookingsResponse.ok ||
        !eventsResponse.ok ||
        !venuesResponse.ok
      ) {
        throw new Error("Failed to load dashboard data");
      }

      const usersData = await usersResponse.json();
      const bookingsData = await bookingsResponse.json();
      const eventsData = await eventsResponse.json();
      const venuesData = await venuesResponse.json();

      setUsers(usersData);
      setBookings(bookingsData);
      setEvents(eventsData);
      setVenues(venuesData);
    } catch (error) {
      console.error("Dashboard loading error:", error);
      setLoadError("We couldn’t load dashboard data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const analyticsBookings = getAnalyticsBookings(bookings, analyticsPeriod);
  const eventSales = events
    .map((event) => {
      const soldTickets = analyticsBookings.filter(
        (booking) => String(booking.event?.id) === String(event.id)
      );
      return {
        ...event,
        ticketsSold: soldTickets.length,
        revenue: soldTickets.reduce(
          (total, booking) => total + Number(booking.amount || 0),
          0
        )
      };
    })
    .sort((first, second) => second.ticketsSold - first.ticketsSold);
  const allTimeEventSales = events.map((event) => ({
    ...event,
    ticketsSold: bookings.filter(
      (booking) =>
        isTicketSold(booking) &&
        String(booking.event?.id) === String(event.id)
    ).length
  }));
  const highestTicketCount = Math.max(
    1,
    ...eventSales.map((event) => event.ticketsSold)
  );
  const trendBuckets = getTrendBuckets(bookings, analyticsPeriod).map((bucket) => ({
    ...bucket,
    tickets: getAnalyticsBookings(bookings, analyticsPeriod).filter((booking) => {
      const bookingTime = new Date(booking.bookingTime);
      return (
        !Number.isNaN(bookingTime.getTime()) &&
        bookingTime >= bucket.start &&
        bookingTime < bucket.end
      );
    }).length
  }));
  const highestTrendCount = Math.max(
    1,
    ...trendBuckets.map((bucket) => bucket.tickets)
  );
  const normalizedEventSearch = eventSearch.trim().toLowerCase();
  const searchedEventSales = eventSales.filter((event) =>
    [event.name, event.category, event.venue?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedEventSearch)
  );
  const searchedEvents = events.filter((event) =>
    [event.name, event.category, event.venue?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedEventSearch)
  );

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    try {
      const response = await fetch(
        apiUrl(`/api/users/${id}`),
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      alert("User deleted successfully.");
      loadDashboard();
    } catch (error) {
      console.error(error);
      alert("Unable to delete user.");
    }
  };

  const handleEventSubmit = async () => {
    if (
      !eventForm.name ||
      !eventForm.date ||
      !eventForm.time ||
      !eventForm.category ||
      !eventForm.price ||
      !eventForm.venueId
    ) {
      alert("Please fill all required event fields.");
      return;
    }

    const eventData = {
      name: eventForm.name,
      description: eventForm.description,
      date: eventForm.date,
      time: eventForm.time,
      category: eventForm.category,
      price: Number(eventForm.price),
      venue: {
        id: Number(eventForm.venueId)
      }
    };

    try {
      const url = editingEvent
        ? apiUrl(`/api/events/${editingEvent.id}`)
        : apiUrl("/api/events");

      const response = await fetch(url, {
        method: editingEvent ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error("Event operation failed");
      }

      alert(
        editingEvent
          ? "Event updated successfully!"
          : "Event created successfully!"
      );

      setShowEventForm(false);
      setEditingEvent(null);

      setEventForm({
        name: "",
        description: "",
        date: "",
        time: "",
        category: "",
        price: "",
        venueId: ""
      });

      loadDashboard();
    } catch (error) {
      console.error(error);
      alert("Unable to save event.");
    }
  };

  const editEvent = (event) => {
    setEditingEvent(event);

    setEventForm({
      name: event.name || "",
      description: event.description || "",
      date: event.date || "",
      time: event.time || "",
      category: event.category || "",
      price: event.price || "",
      venueId: event.venue?.id || ""
    });

    setShowEventForm(true);
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) {
      return;
    }

    try {
      const response = await fetch(
        apiUrl(`/api/events/${id}`),
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      alert("Event deleted successfully.");
      loadDashboard();
    } catch (error) {
      console.error(error);
      alert(
        "Unable to delete event. It may have existing bookings."
      );
    }
  };

  const handleVenueSubmit = async () => {
    if (
      !venueForm.name ||
      !venueForm.location ||
      !venueForm.capacity
    ) {
      alert("Please fill all required venue fields.");
      return;
    }

    const venueData = {
      name: venueForm.name,
      location: venueForm.location,
      capacity: Number(venueForm.capacity),
      description: venueForm.description
    };

    try {
      const url = editingVenue
        ? apiUrl(`/api/venues/${editingVenue.id}`)
        : apiUrl("/api/venues");

      const response = await fetch(url, {
        method: editingVenue ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(venueData)
      });

      if (!response.ok) {
        throw new Error("Venue operation failed");
      }

      alert(
        editingVenue
          ? "Venue updated successfully!"
          : "Venue created successfully!"
      );

      setShowVenueForm(false);
      setEditingVenue(null);

      setVenueForm({
        name: "",
        location: "",
        capacity: "",
        description: ""
      });

      loadDashboard();
    } catch (error) {
      console.error(error);
      alert("Unable to save venue.");
    }
  };

  const editVenue = (venue) => {
    setEditingVenue(venue);

    setVenueForm({
      name: venue.name || "",
      location: venue.location || "",
      capacity: venue.capacity || "",
      description: venue.description || ""
    });

    setShowVenueForm(true);
  };

  const deleteVenue = async (id) => {
    if (
      !window.confirm(
        "Delete this venue? Existing events or seats linked to this venue may prevent deletion."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        apiUrl(`/api/venues/${id}`),
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete venue");
      }

      alert("Venue deleted successfully.");
      loadDashboard();
    } catch (error) {
      console.error(error);
      alert(
        "This venue cannot be deleted because it is linked with events or seats."
      );
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) {
      return;
    }

    try {
      const response = await fetch(
        apiUrl(`/api/bookings/${id}`),
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }

      alert("Booking cancelled successfully.");
      loadDashboard();
    } catch (error) {
      console.error(error);
      alert("Unable to cancel booking.");
    }
  };

  if (loading) {
    return (
      <main className="admin-dashboard">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="admin-dashboard">
        <section className="admin-load-error" role="alert">
          <span>DATABASE CONNECTION</span>
          <h1>Dashboard data is unavailable.</h1>
          <p>{loadError}</p>
          <button type="button" className="refresh-btn" onClick={loadDashboard}>
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">

      <aside className="admin-sidebar">

        <div className="admin-brand">
          <span>PlanKaro</span>
          <small>ADMIN PANEL</small>
        </div>

        <nav className="admin-menu">

          <button
            className={activeSection === "overview" ? "active" : ""}
            onClick={() => setActiveSection("overview")}
          >
            <span>◈</span>
            Overview
          </button>

          <button
            className={activeSection === "users" ? "active" : ""}
            onClick={() => setActiveSection("users")}
          >
            <span>♙</span>
            Users
          </button>

          <button
            className={activeSection === "events" ? "active" : ""}
            onClick={() => setActiveSection("events")}
          >
            <span>◇</span>
            Events
          </button>

          <button
            className={activeSection === "venues" ? "active" : ""}
            onClick={() => setActiveSection("venues")}
          >
            <span>⌂</span>
            Venues
          </button>

          <button
            className={activeSection === "bookings" ? "active" : ""}
            onClick={() => setActiveSection("bookings")}
          >
            <span>▣</span>
            Bookings
          </button>

        </nav>

      </aside>

      <section className="admin-content">

        <div className="admin-welcome">

          <div>
            <span>PLANKARO ADMINISTRATION · LIVE REPORTING</span>

            <h1>
              {activeSection === "overview" &&
                "Dashboard Overview"}

              {activeSection === "users" &&
                "User Management"}

              {activeSection === "events" &&
                "Event Management"}

              {activeSection === "venues" &&
                "Venue Management"}

              {activeSection === "bookings" &&
                "Booking Management"}
            </h1>
          </div>

          <button
            className="refresh-btn"
            onClick={loadDashboard}
          >
            Refresh
          </button>

        </div>

        {activeSection === "overview" && (
          <>

            <div className="admin-stat-grid">

              <div className="admin-stat-card">
                <span>TOTAL USERS</span>
                <strong>{users.length}</strong>
                <small>Registered customers</small>
              </div>

              <div className="admin-stat-card">
                <span>TICKETS SOLD</span>
                <strong>{analyticsBookings.length}</strong>
                <small>
                  {ANALYTICS_PERIODS.find((period) => period.value === analyticsPeriod)?.label}
                </small>
              </div>

              <div className="admin-stat-card">
                <span>GROSS TICKET SALES</span>
                <strong>{formatCurrency(
                  analyticsBookings.reduce(
                    (total, booking) => total + Number(booking.amount || 0),
                    0
                  )
                )}</strong>
                <small>From confirmed tickets</small>
              </div>

              <div className="admin-stat-card">
                <span>ACTIVE EVENTS</span>
                <strong>{events.length}</strong>
                <small>Available to book</small>
              </div>

              <div className="admin-stat-card">
                <span>REGISTERED USERS</span>
                <strong>{users.length}</strong>
                <small>Customer accounts</small>
              </div>
            </div>

            <section className="analytics-toolbar">
              <div>
                <span>SALES ANALYTICS</span>
                <h2>Understand what’s happening</h2>
                <p>Charts are based on confirmed ticket bookings from your database.</p>
              </div>
              <label>
                <span>Reporting period</span>
                <select
                  value={analyticsPeriod}
                  onChange={(event) => setAnalyticsPeriod(event.target.value)}
                  aria-label="Sales analytics reporting period"
                >
                  {ANALYTICS_PERIODS.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <div className="analytics-grid">
              <section className="admin-panel analytics-panel">
                <div className="admin-panel-header">
                  <div>
                    <span>BOOKING ACTIVITY</span>
                    <h2>Tickets sold over time</h2>
                  </div>
                  <span className="chart-caption">
                    {analyticsPeriod === "all" ? "Last 6 months" : ANALYTICS_PERIODS.find((period) => period.value === analyticsPeriod)?.label}
                  </span>
                </div>
                <div
                  className="trend-chart"
                  role="img"
                  aria-label={`Confirmed ticket sales by ${
                    analyticsPeriod === "7" ? "day" : analyticsPeriod === "30" ? "week" : "month"
                  }`}
                >
                  {trendBuckets.map((bucket) => (
                    <div className="trend-column" key={bucket.key}>
                      <span className="trend-value">{bucket.tickets}</span>
                      <div className="trend-bar-track">
                        <span
                          className={`trend-bar-fill ${bucket.tickets ? "has-sales" : ""}`}
                          style={{
                            height: `${bucket.tickets
                              ? Math.max(8, (bucket.tickets / highestTrendCount) * 100)
                              : 4}%`
                          }}
                        ></span>
                      </div>
                      <span className="trend-label">{bucket.label}</span>
                    </div>
                  ))}
                </div>
                {trendBuckets.every((bucket) => bucket.tickets === 0) && (
                  <p className="chart-empty-note">
                    No confirmed tickets in this period yet.
                  </p>
                )}
              </section>

              <section className="admin-panel analytics-panel">
                <div className="admin-panel-header">
                  <div>
                    <span>EVENT PERFORMANCE</span>
                    <h2>Tickets sold by event</h2>
                  </div>
                  <span className="panel-count">{eventSales.length} Events</span>
                </div>
                <label className="analytics-search">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    placeholder="Search events"
                    aria-label="Search event sales"
                    value={eventSearch}
                    onChange={(event) => setEventSearch(event.target.value)}
                  />
                </label>
                <div className="event-sales-list">
                  {searchedEventSales.map((event) => (
                    <button
                      type="button"
                      className="event-sales-row"
                      key={event.id}
                      onClick={() => {
                        setEventSearch(event.name);
                        setActiveSection("events");
                      }}
                      aria-label={`${event.name}: ${event.ticketsSold} tickets sold. Open event management.`}
                    >
                      <span
                        className="sales-event-image"
                        style={{
                          backgroundImage: `url("${eventImageForCategory(event.category)}")`
                        }}
                        aria-hidden="true"
                      ></span>
                      <span className="sales-event-info">
                        <strong>{event.name}</strong>
                        <span>{event.category || "Event"} · {formatCurrency(event.revenue)}</span>
                        <span className="sales-bar-track">
                          <span
                            className="sales-bar-fill"
                            style={{
                              width: `${event.ticketsSold
                                ? Math.max(3, (event.ticketsSold / highestTicketCount) * 100)
                                : 0}%`
                            }}
                          ></span>
                        </span>
                      </span>
                      <strong className="sales-ticket-count">{event.ticketsSold}</strong>
                    </button>
                  ))}
                  {searchedEventSales.length === 0 && (
                    <p className="chart-empty-note">No events match your search.</p>
                  )}
                  {events.length === 0 && (
                    <p className="chart-empty-note">Add an event to see ticket performance.</p>
                  )}
                </div>
                <p className="chart-footnote">Click an event to open its management details.</p>
              </section>
            </div>

            <section className="admin-panel full-panel">

              <div className="admin-panel-header">

                <div>
                  <span>RECENT ACTIVITY</span>
                  <h2>Recent Bookings</h2>
                </div>

                <div className="panel-count">
                  {bookings.length} Bookings
                </div>

              </div>

              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Customer</th>
                      <th>Event</th>
                      <th>Seat</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    {bookings.slice(0, 8).map((booking) => (
                      <tr key={booking.id}>

                        <td>
                          <strong>{booking.ticketId}</strong>
                        </td>

                        <td>
                          {booking.user?.name || "Unknown"}
                        </td>

                        <td>
                          {booking.event?.name || "Unknown"}
                        </td>

                        <td>
                          {booking.seat
                            ? `${booking.seat.rowName}${booking.seat.seatNumber}`
                            : "N/A"}
                        </td>

                        <td>
                          ₹{booking.amount}
                        </td>

                        <td>
                          <span className="status-badge">
                            ● {booking.status}
                          </span>
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </section>

          </>
        )}

        {activeSection === "users" && (
          <section className="admin-panel full-panel">

            <div className="admin-panel-header">

              <div>
                <span>USER MANAGEMENT</span>
                <h2>Registered Users</h2>
              </div>

              <div className="panel-count">
                {users.length} Users
              </div>

            </div>

            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>ID</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {users.map((user) => (
                    <tr key={user.id}>

                      <td>
                        <strong>{user.name}</strong>
                      </td>

                      <td>{user.email}</td>

                      <td>
                        <span className="role-badge">
                          {user.role}
                        </span>
                      </td>

                      <td>#{user.id}</td>

                      <td>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            deleteUser(user.id)
                          }
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {activeSection === "events" && (
          <section className="admin-panel full-panel">

            <div className="admin-panel-header">

              <div>
                <span>EVENT MANAGEMENT</span>
                <h2>Events</h2>
              </div>

              <label className="event-management-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Find an event"
                  aria-label="Search events"
                  value={eventSearch}
                  onChange={(event) => setEventSearch(event.target.value)}
                />
              </label>

              <button
                className="add-event-btn"
                onClick={() => {
                  setEditingEvent(null);

                  setEventForm({
                    name: "",
                    description: "",
                    date: "",
                    time: "",
                    category: "",
                    price: "",
                    venueId: ""
                  });

                  setShowEventForm(!showEventForm);
                }}
              >
                + Add Event
              </button>

            </div>

            {showEventForm && (
              <div className="event-form">

                <div className="event-form-title">

                  <h3>
                    {editingEvent
                      ? "Edit Event"
                      : "Add New Event"}
                  </h3>

                  <button
                    onClick={() => {
                      setShowEventForm(false);
                      setEditingEvent(null);
                    }}
                  >
                    Close
                  </button>

                </div>

                <div className="event-form-grid">

                  <input
                    type="text"
                    placeholder="Event Name"
                    value={eventForm.name}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        name: e.target.value
                      })
                    }
                  />

                  <input
                    type="text"
                    placeholder="Category"
                    value={eventForm.category}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        category: e.target.value
                      })
                    }
                  />

                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        date: e.target.value
                      })
                    }
                  />

                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        time: e.target.value
                      })
                    }
                  />

                  <input
                    type="number"
                    placeholder="Ticket Price"
                    value={eventForm.price}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        price: e.target.value
                      })
                    }
                  />

                  <select
                    value={eventForm.venueId}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        venueId: e.target.value
                      })
                    }
                  >
                    <option value="">
                      Select Venue
                    </option>

                    {venues.map((venue) => (
                      <option
                        key={venue.id}
                        value={venue.id}
                      >
                        {venue.name}
                      </option>
                    ))}
                  </select>

                  <textarea
                    placeholder="Event Description"
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        description: e.target.value
                      })
                    }
                  />

                </div>

                <button
                  className="save-event-btn"
                  onClick={handleEventSubmit}
                >
                  {editingEvent
                    ? "Update Event"
                    : "Save Event"}
                </button>

              </div>
            )}

            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Venue</th>
                    <th>Price</th>
                    <th>Tickets sold</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {searchedEvents.map((event) => (
                    <tr key={event.id}>

                      <td>
                        <strong>{event.name}</strong>
                      </td>

                      <td>{event.date}</td>

                      <td>{event.category}</td>

                      <td>
                        {event.venue?.name ||
                          "No venue"}
                      </td>

                      <td>
                        ₹{event.price}
                      </td>

                      <td>
                        {allTimeEventSales.find(
                          (sale) => String(sale.id) === String(event.id)
                        )?.ticketsSold || 0}
                      </td>

                      <td>

                        <div className="event-actions">

                          <button
                            className="edit-btn"
                            onClick={() =>
                              editEvent(event)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              deleteEvent(event.id)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                  {searchedEvents.length === 0 && (
                    <tr>
                      <td colSpan="7" className="admin-no-results">
                        No events match your search.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {activeSection === "venues" && (
          <section className="admin-panel full-panel">

            <div className="admin-panel-header">

              <div>
                <span>VENUE MANAGEMENT</span>
                <h2>Venues</h2>
              </div>

              <button
                className="add-event-btn"
                onClick={() => {
                  setEditingVenue(null);

                  setVenueForm({
                    name: "",
                    location: "",
                    capacity: "",
                    description: ""
                  });

                  setShowVenueForm(!showVenueForm);
                }}
              >
                + Add Venue
              </button>

            </div>

            {showVenueForm && (
              <div className="event-form">

                <div className="event-form-title">

                  <h3>
                    {editingVenue
                      ? "Edit Venue"
                      : "Add New Venue"}
                  </h3>

                  <button
                    onClick={() => {
                      setShowVenueForm(false);
                      setEditingVenue(null);
                    }}
                  >
                    Close
                  </button>

                </div>

                <div className="event-form-grid">

                  <input
                    type="text"
                    placeholder="Venue Name"
                    value={venueForm.name}
                    onChange={(e) =>
                      setVenueForm({
                        ...venueForm,
                        name: e.target.value
                      })
                    }
                  />

                  <input
                    type="text"
                    placeholder="Location"
                    value={venueForm.location}
                    onChange={(e) =>
                      setVenueForm({
                        ...venueForm,
                        location: e.target.value
                      })
                    }
                  />

                  <input
                    type="number"
                    placeholder="Capacity"
                    value={venueForm.capacity}
                    onChange={(e) =>
                      setVenueForm({
                        ...venueForm,
                        capacity: e.target.value
                      })
                    }
                  />

                  <textarea
                    placeholder="Venue Description"
                    value={venueForm.description}
                    onChange={(e) =>
                      setVenueForm({
                        ...venueForm,
                        description: e.target.value
                      })
                    }
                  />

                </div>

                <button
                  className="save-event-btn"
                  onClick={handleVenueSubmit}
                >
                  {editingVenue
                    ? "Update Venue"
                    : "Save Venue"}
                </button>

              </div>
            )}

            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Venue</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {venues.map((venue) => (
                    <tr key={venue.id}>

                      <td>
                        <strong>{venue.name}</strong>
                      </td>

                      <td>{venue.location}</td>

                      <td>{venue.capacity}</td>

                      <td>
                        {venue.description ||
                          "No description"}
                      </td>

                      <td>

                        <div className="event-actions">

                          <button
                            className="edit-btn"
                            onClick={() =>
                              editVenue(venue)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              deleteVenue(venue.id)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {activeSection === "bookings" && (
          <section className="admin-panel full-panel">

            <div className="admin-panel-header">

              <div>
                <span>BOOKING MANAGEMENT</span>
                <h2>All Bookings</h2>
              </div>

              <div className="panel-count">
                {bookings.length} Bookings
              </div>

            </div>

            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Customer</th>
                    <th>Event</th>
                    <th>Seat</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {bookings.map((booking) => (
                    <tr key={booking.id}>

                      <td>
                        <strong>
                          {booking.ticketId}
                        </strong>
                      </td>

                      <td>
                        {booking.user?.name ||
                          "Unknown"}
                      </td>

                      <td>
                        {booking.event?.name ||
                          "Unknown"}
                      </td>

                      <td>
                        {booking.seat
                          ? `${booking.seat.rowName}${booking.seat.seatNumber}`
                          : "N/A"}
                      </td>

                      <td>
                        ₹{booking.amount}
                      </td>

                      <td>
                        <span className="status-badge">
                          ● {booking.status}
                        </span>
                      </td>

                      <td>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            cancelBooking(
                              booking.id
                            )
                          }
                        >
                          Cancel
                        </button>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </section>
        )}

      </section>

    </main>
  );
}

export default AdminDashboard;