package com.venuevista.venuevista.controller;

import com.venuevista.venuevista.entity.Booking;
import com.venuevista.venuevista.repository.BookingRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    private final BookingRepository bookingRepository;

    public BookingController(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Booking> getBookingsByUser(@PathVariable Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    @GetMapping("/{id}")
    public Booking getBookingById(@PathVariable Long id) {
        return bookingRepository.findById(id).orElse(null);
    }

    @GetMapping("/event/{eventId}")
    public List<Booking> getBookingsByEvent(@PathVariable Long eventId) {
        return bookingRepository.findByEventIdAndStatus(
                eventId,
                "CONFIRMED"
        );
    }

    @PostMapping
    public Booking createBooking(@RequestBody Booking booking) {

        if (booking.getEvent() == null ||
            booking.getEvent().getId() == null ||
            booking.getSeat() == null ||
            booking.getSeat().getId() == null) {
            throw new RuntimeException("Event and seat are required");
        }

        boolean alreadyBooked =
                bookingRepository.existsByEventIdAndSeatIdAndStatus(
                        booking.getEvent().getId(),
                        booking.getSeat().getId(),
                        "CONFIRMED"
                );

        if (alreadyBooked) {
            throw new RuntimeException("This seat is already booked");
        }

        booking.setTicketId(
                "VV-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase()
        );

        booking.setStatus("CONFIRMED");
        booking.setBookingTime(LocalDateTime.now());

        return bookingRepository.save(booking);
    }

    @DeleteMapping("/{id}")
    public String deleteBooking(@PathVariable Long id) {

        if (!bookingRepository.existsById(id)) {
            return "Booking not found";
        }

        bookingRepository.deleteById(id);

        return "Booking deleted successfully";
    }
}
