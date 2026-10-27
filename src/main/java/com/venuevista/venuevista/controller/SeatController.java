package com.venuevista.venuevista.controller;

import com.venuevista.venuevista.entity.Seat;
import com.venuevista.venuevista.entity.Venue;
import com.venuevista.venuevista.repository.SeatRepository;
import com.venuevista.venuevista.repository.VenueRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "http://localhost:5173")
public class SeatController {

    private final SeatRepository seatRepository;
    private final VenueRepository venueRepository;

    public SeatController(
            SeatRepository seatRepository,
            VenueRepository venueRepository
    ) {
        this.seatRepository = seatRepository;
        this.venueRepository = venueRepository;
    }

    @GetMapping
    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }

    @GetMapping("/venue/{venueId}")
    public List<Seat> getSeatsByVenue(@PathVariable Long venueId) {
        return seatRepository.findByVenueId(venueId);
    }

    @GetMapping("/{id}")
    public Seat getSeatById(@PathVariable Long id) {
        return seatRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Seat createSeat(@RequestBody Seat seat) {
        return seatRepository.save(seat);
    }

    @PostMapping("/generate/{venueId}")
    public String generateSeats(@PathVariable Long venueId) {

        Venue venue = venueRepository.findById(venueId).orElse(null);

        if (venue == null) {
            return "Venue not found";
        }

        String[] rows = {"A", "B", "C", "D", "E", "F"};

        int created = 0;

        for (String row : rows) {
            for (int number = 1; number <= 8; number++) {

                boolean exists =
                        seatRepository.existsByRowNameAndSeatNumberAndVenueId(
                                row,
                                number,
                                venueId
                        );

                if (!exists) {
                    Seat seat = new Seat();
                    seat.setRowName(row);
                    seat.setSeatNumber(number);
                    seat.setSeatType("REGULAR");
                    seat.setVenue(venue);

                    seatRepository.save(seat);
                    created++;
                }
            }
        }

        return created + " seats generated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteSeat(@PathVariable Long id) {

        if (!seatRepository.existsById(id)) {
            return "Seat not found";
        }

        seatRepository.deleteById(id);

        return "Seat deleted successfully";
    }
}