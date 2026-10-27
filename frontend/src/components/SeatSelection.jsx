import { useEffect, useState } from "react";
import { apiUrl } from "../api";

function SeatSelection({ event, onBack, onConfirm }) {
  const [seats, setSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = event.venue?.location || "PlanKaro";
  const price = event.price;

  useEffect(() => {
    const venueId = event.venue?.id;

    if (!venueId) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(apiUrl(`/api/seats/venue/${venueId}`))
        .then((response) => response.json()),

      fetch(apiUrl(`/api/bookings/event/${event.id}`))
        .then((response) => response.json())
    ])
      .then(([seatData, bookingData]) => {
        setSeats(seatData);

        const bookedSeatIds = bookingData
          .filter((booking) => booking.seat)
          .map((booking) => booking.seat.id);

        setBookedSeats(bookedSeatIds);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [event]);

  const toggleSeat = (seat) => {
    if (bookedSeats.includes(seat.id)) {
      return;
    }

    const seatName = `${seat.rowName}${seat.seatNumber}`;

    if (selectedSeats.includes(seatName)) {
      setSelectedSeats(
        selectedSeats.filter((item) => item !== seatName)
      );
    } else {
      setSelectedSeats([
        ...selectedSeats,
        seatName
      ]);
    }
  };

  const total = selectedSeats.length * price;

  return (
    <main className="seat-page">
      <div className="seat-header">
        <button type="button" onClick={onBack}>← Back</button>

        <div>
          <h1>Select Your Seats</h1>
          <p>{event.name}</p>
          <span>{location}</span>
        </div>
      </div>

      <div className="screen">
        SCREEN
      </div>

      {loading ? (
        <p>Loading seats...</p>
      ) : (
        <>
          <div className="seat-layout">
            {["A", "B", "C", "D", "E", "F"].map((row) => (
              <div className="seat-row" key={row}>
                <span className="row-label">{row}</span>

                {seats
                  .filter((seat) => seat.rowName === row)
                  .sort((a, b) => a.seatNumber - b.seatNumber)
                  .map((seat) => {
                    const seatName =
                      `${seat.rowName}${seat.seatNumber}`;

                    const isSelected =
                      selectedSeats.includes(seatName);

                    const isBooked =
                      bookedSeats.includes(seat.id);

                    return (
                      <button
                        type="button"
                        key={seat.id}
                        disabled={isBooked}
                        className={`seat ${isSelected ? "selected" : "available"} ${
                          isBooked ? "booked" : ""
                        }`}
                        aria-label={`Seat ${seatName}${isBooked ? ", booked" : ""}`}
                        aria-pressed={isSelected}
                        onClick={() => toggleSeat(seat)}
                      >
                        {seat.seatNumber}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>

          <div className="seat-legend">
            <span><i className="legend-box available-box" aria-hidden="true"></i>Available</span>
            <span><i className="legend-box selected-box" aria-hidden="true"></i>Selected</span>
            <span><i className="legend-box booked-box" aria-hidden="true"></i>Booked</span>
          </div>
        </>
      )}

      <div className="seat-summary">
        <div>
          <strong>
            {selectedSeats.length} seat
            {selectedSeats.length !== 1 ? "s" : ""}
          </strong>

          <p>
            {selectedSeats.length > 0
              ? selectedSeats.join(", ")
              : "No seats selected"}
          </p>
        </div>

        <div>
          <strong>₹{total}</strong>

          <button
            type="button"
            className="confirm-btn"
            disabled={selectedSeats.length === 0}
            onClick={() =>
              onConfirm(selectedSeats, total)
            }
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </main>
  );
}

export default SeatSelection;