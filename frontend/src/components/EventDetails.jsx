import { eventImageForCategory } from "../eventImages";

function EventDetails({ event, onBack, onBookNow }) {
  const location =
    event.venue?.location || "PlanKaro";

  const venueName =
    event.venue?.name || "PlanKaro Venue";

  const price = event.price;

  return (
    <main className="details-page">
      <button className="back-btn" type="button" onClick={onBack}>
        ← Back to Events
      </button>

      <section className="details-hero">
        <div
          className="details-hero-image"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.15)), url("${eventImageForCategory(event.category)}")`
          }}
        ></div>

        <div className="details-hero-overlay"></div>

        <div className="details-hero-content">
          <div className="details-category">
            {event.category || "EVENT"}
          </div>

          <p className="details-kicker">
            PlanKaro PRESENTS
          </p>

          <h1>{event.name}</h1>

          <div className="details-location">
            <span>⌖</span>
            <span>
              {venueName}, {location}
            </span>
          </div>
        </div>
      </section>

      <section className="details-layout">
        <div className="details-main">
          <div className="details-section-label">
            ABOUT THE EVENT
          </div>

          <h2>
            Experience something
            <br />
            unforgettable.
          </h2>

          <p className="details-description">
            {event.description ||
              "Experience an unforgettable event with amazing performances, great people and a memorable atmosphere."}
          </p>

          <div className="details-info-grid">
            <div className="details-info">
              <span>DATE</span>
              <strong>{event.date}</strong>
            </div>

            <div className="details-info">
              <span>TIME</span>
              <strong>
                {event.time || "10:00 AM"}
              </strong>
            </div>

            <div className="details-info">
              <span>VENUE</span>
              <strong>{venueName}</strong>
            </div>

            <div className="details-info">
              <span>LOCATION</span>
              <strong>{location}</strong>
            </div>
          </div>
        </div>

        <aside className="ticket-card">
          <div className="ticket-top">
            <span>YOUR EXPERIENCE</span>

            <div className="ticket-symbol">
              ✦
            </div>
          </div>

          <h3>Reserve your place.</h3>

          <p>
            Select your preferred seats and get ready
            for an unforgettable experience.
          </p>

          <div className="ticket-divider"></div>

          <div className="ticket-price">
            <span>Tickets starting from</span>

            <strong>₹{price}</strong>
          </div>

          <button
            className="ticket-button"
            type="button"
            onClick={onBookNow}
          >
            Select Your Seat
            <span>→</span>
          </button>

          <div className="ticket-note">
            <span>✓</span>
            Secure booking experience
          </div>
        </aside>
      </section>
    </main>
  );
}

export default EventDetails;