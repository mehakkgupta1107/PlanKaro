import { useEffect, useState } from "react";
import "./App.css";
import { apiUrl } from "./api";
import Navbar from "./components/Navbar";
import EventCard from "./components/EventCard";
import EventDetails from "./components/EventDetails";
import SeatSelection from "./components/SeatSelection";
import Login from "./components/Login";
import AdminDashboard from "./components/Admin/AdminDashboard";

function App() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState("home");
  const [loading, setLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  const [eventRetry, setEventRetry] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All events");

  const [user, setUser] = useState(() => {
    try {
      // Read the current key, with a one-time fallback for older saved sessions.
      const savedUser = localStorage.getItem("PlanKaroUser") || localStorage.getItem("venuevistaUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.warn("Could not restore saved user session:", error);
      localStorage.removeItem("PlanKaroUser");
      localStorage.removeItem("venuevistaUser");
      return null;
    }
  });

  useEffect(() => {
    fetch(apiUrl("/api/events"))
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Events received:", data);
        setEvents(data);
        setEventsError(false);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Event fetch error:", error);
        setEventsError(true);
        setLoading(false);
      });
  }, [eventRetry]);

  const categories = [
    "All events",
    ...new Set(events.map((event) => event.category).filter(Boolean))
  ];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      selectedCategory === "All events" || event.category === selectedCategory;
    const searchableText = [
      event.name,
      event.category,
      event.description,
      event.venue?.name,
      event.venue?.location
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesCategory && searchableText.includes(normalizedQuery);
  });

  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }

    fetch(apiUrl(`/api/bookings/user/${user.id}`))
      .then((response) => response.json())
      .then((data) => {
        setBookings(data);
      })
      .catch((error) => {
        console.error("Booking fetch error:", error);
      });
  }, [user]);

  const handleLogin = (loggedInUser) => {
    localStorage.setItem("PlanKaroUser", JSON.stringify(loggedInUser));
    localStorage.removeItem("venuevistaUser");
    setUser(loggedInUser);
    setPage("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("PlanKaroUser");
    localStorage.removeItem("venuevistaUser");
    setUser(null);
    setBookings([]);
    setPage("home");
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setPage("details");
  };

  const handleSelectSeats = () => {
    if (!user) {
      setPage("login");
      return;
    }

    setPage("seats");
  };

  const handleBooking = async (seats) => {
    if (!user) {
      setPage("login");
      return;
    }

    if (!selectedEvent?.id || !selectedEvent?.venue?.id) {
      alert("Event information is incomplete.");
      return;
    }

    try {
      const venueResponse = await fetch(
        apiUrl(`/api/seats/venue/${selectedEvent.venue.id}`)
      );

      const venueSeats = await venueResponse.json();
      const createdBookings = [];

      for (const seatName of seats) {
        const rowName = seatName.charAt(0);
        const seatNumber = Number(seatName.substring(1));

        const selectedSeat = venueSeats.find(
          (seat) =>
            seat.rowName === rowName &&
            seat.seatNumber === seatNumber
        );

        if (!selectedSeat) {
          alert(`Seat ${seatName} not found.`);
          return;
        }

        const bookingResponse = await fetch(
          apiUrl("/api/bookings"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              amount: selectedEvent.price,
              user: { id: user.id },
              event: { id: selectedEvent.id },
              seat: { id: selectedSeat.id }
            })
          }
        );

        if (!bookingResponse.ok) {
          throw new Error("Booking failed");
        }

        const booking = await bookingResponse.json();
        createdBookings.push(booking);
      }

      setBookings((previousBookings) => [
        ...previousBookings,
        ...createdBookings
      ]);

      alert("Booking confirmed successfully!");
      setPage("bookings");
      setSelectedEvent(null);
    } catch (error) {
      console.error(error);
      alert("Booking failed. Please try again.");
    }
  };

  if (page === "login") {
    return <Login onLogin={handleLogin} onCancel={() => setPage("home")} />;
  }

  return (
    <>
      <Navbar
        page={page}
        setPage={setPage}
        user={user}
        onLogin={() => setPage("login")}
        onLogout={handleLogout}
      />

      {page === "home" && (
        <main className="home-page" id="top">
          <section className="hero">
            <div className="hero-content">
              <p className="hero-tag">EXPERIENCE · CONNECT · CELEBRATE</p>
              <h1>
                Make room for
                <br />
                <span>something special.</span>
              </h1>
              <p className="hero-description">
                Find your next favorite moment. Explore handpicked events,
                choose the seats you love, and make a day of it.
              </p>
              <div className="hero-actions">
                <a className="primary-btn" href="#events">
                  Explore events <span aria-hidden="true">→</span>
                </a>
                <span className="hero-note">Good plans start here.</span>
              </div>
              <div className="hero-stats" aria-label="PlanKaro highlights">
                <div>
                  <strong>{events.length}+</strong>
                  <span>experiences to explore</span>
                </div>
                <div>
                  <strong>Easy</strong>
                  <span>seat selection</span>
                </div>
                <div>
                  <strong>Yours</strong>
                  <span>to remember</span>
                </div>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-image">
                <div className="hero-image-content">
                  <span>YOUR NEXT GREAT NIGHT</span>
                  <strong>Be there<br />when it happens.</strong>
                </div>
              </div>
              <div className="hero-floating-card">
                <span className="floating-icon">✦</span>
                <div>
                  <strong>Make it memorable</strong>
                  <p>Find an event worth going to</p>
                </div>
              </div>
              <div className="hero-date-card">
                <span>YOUR PLANS</span>
                <strong>Start<br />here</strong>
                <small>Discover something new</small>
              </div>
            </div>
          </section>

          <section className="events-section" id="events">
            <div className="section-heading">
              <p className="section-tag">FIND YOUR NEXT FAVORITE</p>
              <div className="events-heading-row">
                <div>
                  <h2>Events worth<br />looking forward to.</h2>
                  <p>Browse what’s happening and find a moment that feels like yours.</p>
                </div>
                <span className="events-count">
                  {events.length} {events.length === 1 ? "event" : "events"} to explore
                </span>
              </div>
            </div>

            <div className="event-discovery">
              <label className="event-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search events, places, or experiences"
                  aria-label="Search events, places, or experiences"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
              <div className="category-filters" aria-label="Filter events by category">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={selectedCategory === category ? "selected" : ""}
                    aria-pressed={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="loading-events" role="status">
                <span className="loading-spinner" aria-hidden="true"></span>
                <p>Finding your next great experience…</p>
              </div>
            ) : eventsError ? (
              <div className="empty-events" role="alert">
                <span className="empty-icon" aria-hidden="true">!</span>
                <h3>We couldn’t load events.</h3>
                <p>Please check your connection and try again.</p>
                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setEventsError(false);
                    setEventRetry((retry) => retry + 1);
                  }}
                >
                  Try again
                </button>
              </div>
            ) : events.length === 0 ? (
              <div className="empty-events">
                <span className="empty-icon" aria-hidden="true">✦</span>
                <h3>Great plans are on the way.</h3>
                <p>There aren’t any events to show just yet. Check back soon.</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-events">
                <span className="empty-icon" aria-hidden="true">⌕</span>
                <h3>No matching events</h3>
                <p>Try a different search or category to find what you’re looking for.</p>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All events");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="events-grid">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                ))}
              </div>
            )}
          </section>
          <section className="experience-section">
            <div className="experience-heading">
              <div>
                <p className="section-tag">A BETTER WAY TO GO OUT</p>
                <h2>From “we should go”<br />to “that was amazing.”</h2>
              </div>
              <p className="experience-intro">
                Less time figuring it out. More time looking forward to it.
              </p>
            </div>
            <div className="features-section">
              <article className="feature">
                <div className="feature-number">01</div>
                <div className="feature-icon" aria-hidden="true">⌕</div>
                <h3>Find your thing</h3>
                <p>Explore events by category and find experiences that feel like you.</p>
              </article>
              <article className="feature">
                <div className="feature-number">02</div>
                <div className="feature-icon" aria-hidden="true">◫</div>
                <h3>Pick your place</h3>
                <p>See the seating plan and choose the seats that make the night yours.</p>
              </article>
              <article className="feature">
                <div className="feature-number">03</div>
                <div className="feature-icon" aria-hidden="true">✦</div>
                <h3>Look forward to it</h3>
                <p>Keep your bookings together and get back to the good part: the event.</p>
              </article>
            </div>
          </section>
          <footer className="site-footer">
            <a className="footer-brand" href="#top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              PlanKaro
            </a>
            <p>Make plans. Make memories.</p>
            <a href="#events">Explore events <span aria-hidden="true">↑</span></a>
          </footer>
        </main>
      )}

      {page === "details" && selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onBack={() => setPage("home")}
          onBookNow={handleSelectSeats}
        />
      )}

      {page === "seats" && selectedEvent && (
        <SeatSelection
          event={selectedEvent}
          onBack={() => setPage("details")}
          onConfirm={handleBooking}
        />
      )}

      {page === "admin" && user?.role === "ADMIN" && (
        <AdminDashboard />
      )}

      {page === "bookings" && (
        <main className="bookings-page">
          <div className="bookings-header">
            <div>
              <p className="section-tag">YOUR PLANS, ALL IN ONE PLACE</p>
              <h1>My Bookings</h1>
              <p>Everything you’re looking forward to, right here.</p>
            </div>
            <button className="secondary-btn" onClick={() => setPage("home")}>
              Discover more events <span aria-hidden="true">→</span>
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-bookings">
              <span className="empty-icon" aria-hidden="true">✦</span>
              <h3>Your next great memory starts here.</h3>
              <p>You haven’t booked an event yet. Find something you love and make a plan.</p>
              <button className="primary-btn" onClick={() => setPage("home")}>
                Explore events <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div className="booking-card" key={booking.id}>
                  <div className="booking-card-top">
                    <span className="booking-category">{booking.event?.category || "YOUR EVENT"}</span>
                    <span className="booking-status">{booking.status || "CONFIRMED"}</span>
                  </div>
                  <h3>{booking.event?.name || "PlanKaro Event"}</h3>
                  <p className="booking-location">
                    {booking.event?.venue?.name || booking.event?.venue?.location || "Your event details"}
                  </p>
                  <div className="booking-details">
                    <div>
                      <span>Ticket ID</span>
                      <strong>{booking.ticketId || "—"}</strong>
                    </div>
                    <div>
                      <span>Seat</span>
                      <strong>
                        {booking.seat
                          ? `${booking.seat.rowName}${booking.seat.seatNumber}`
                          : "—"}
                      </strong>
                    </div>
                  </div>
                  <div className="booking-bottom">
                    <span>Ticket price</span>
                    <strong>₹{booking.amount ?? "—"}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}
    </>
  );
}

export default App;