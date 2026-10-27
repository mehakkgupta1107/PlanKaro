
import { useEffect, useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import EventCard from "./components/EventCard";
import EventDetails from "./components/EventDetails";
import SeatSelection from "./components/SeatSelection";

function App() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState("home");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/events")
      .then((response) => response.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });

    fetch("http://localhost:8080/api/bookings")
      .then((response) => response.json())
      .then((data) => {
        setBookings(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setPage("details");
  };

  const handleSelectSeats = () => {
    setPage("seats");
  };

  const handleBooking = async (seats) => {
    if (!selectedEvent?.id || !selectedEvent?.venue?.id) {
      alert("Event information is incomplete.");
      return;
    }

    try {
      const venueResponse = await fetch(
        `http://localhost:8080/api/seats/venue/${selectedEvent.venue.id}`
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
          "http://localhost:8080/api/bookings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              amount: selectedEvent.price || 499,
              user: {
                id: 1
              },
              event: {
                id: selectedEvent.id
              },
              seat: {
                id: selectedSeat.id
              }
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

  return (
    <>
      <Navbar
        page={page}
        setPage={setPage}
      />

      {page === "home" && (
        <main className="home-page">
          <section className="hero">
            <p>EXPERIENCE • CONNECT • CELEBRATE</p>

            <h1>
              Discover Events.
              <br />
              Create Memories.
            </h1>

            <p>
              Find exciting events, choose your seats and book
              your experience with PlanKaro.
            </p>
          </section>

          <section className="events-section">
            <h2>Upcoming Events</h2>

            {loading ? (
              <p>Loading events...</p>
            ) : events.length === 0 ? (
              <p>No events available.</p>
            ) : (
              <div className="events-grid">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                ))}
              </div>
            )}
          </section>
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

      {page === "bookings" && (
        <main className="bookings-page">
          <h1>My Bookings</h1>

          {bookings.length === 0 ? (
            <p>No bookings yet.</p>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div
                  className="booking-card"
                  key={booking.id}
                >
                  <h3>
                    {booking.event?.name || "PlanKaro Event"}
                  </h3>

                  <p>
                    Ticket ID: {booking.ticketId}
                  </p>

                  <p>
                    Seat:{" "}
                    {booking.seat
                      ? `${booking.seat.rowName}${booking.seat.seatNumber}`
                      : "N/A"}
                  </p>

                  <p>
                    Amount: ₹{booking.amount}
                  </p>

                  <p>
                    Status: {booking.status}
                  </p>
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
