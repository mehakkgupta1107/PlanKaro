import { eventImageForCategory } from "../eventImages";

function EventCard({ event, onClick }) {
  const location =
    event.venue?.location || "PlanKaro";

  const price = event.price || 499;

  const image = eventImageForCategory(event.category);

  return (
    <article className="event-card">
      <div
        className="event-image"
        style={{
          backgroundImage: `url("${image}")`,
        }}
      >
        <div className="event-image-overlay"></div>

        <div className="event-top">
          <span className="event-category">
            {event.category || "EVENT"}
          </span>

          <span className="event-arrow">
            ↗
          </span>
        </div>

        <div className="event-image-bottom">
          <span>UPCOMING EVENT</span>
        </div>
      </div>

      <div className="event-content">
        <div className="event-date-row">
          <span className="event-date-label">
            DATE
          </span>

          <span className="event-date">
            {event.date}
          </span>
        </div>

        <h3>{event.name}</h3>

        <p className="event-description">
          {event.description ||
            "An unforgettable experience awaits you."}
        </p>

        <div className="event-location">
          <span className="location-icon">⌖</span>
          <span>{location}</span>
        </div>

        <div className="event-bottom">
          <div className="event-price-wrapper">
            <span>Tickets from</span>

            <strong>₹{price}</strong>
          </div>

          <button type="button" onClick={onClick}>
            View Event
            <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default EventCard;