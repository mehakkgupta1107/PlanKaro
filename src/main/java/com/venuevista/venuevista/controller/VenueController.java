package com.venuevista.venuevista.controller;

import com.venuevista.venuevista.entity.Venue;
import com.venuevista.venuevista.repository.VenueRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/venues")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "https://plan-karo-app.vercel.app"
})
public class VenueController {

    private final VenueRepository venueRepository;

    public VenueController(VenueRepository venueRepository) {
        this.venueRepository = venueRepository;
    }

    @GetMapping
    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }

    @GetMapping("/{id}")
    public Venue getVenueById(@PathVariable Long id) {
        return venueRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Venue createVenue(@RequestBody Venue venue) {
        return venueRepository.save(venue);
    }

    @PutMapping("/{id}")
    public Venue updateVenue(@PathVariable Long id, @RequestBody Venue venue) {
        Venue existingVenue = venueRepository.findById(id).orElse(null);

        if (existingVenue == null) {
            return null;
        }

        existingVenue.setName(venue.getName());
        existingVenue.setLocation(venue.getLocation());
        existingVenue.setCapacity(venue.getCapacity());
        existingVenue.setDescription(venue.getDescription());

        return venueRepository.save(existingVenue);
    }

    @DeleteMapping("/{id}")
    public String deleteVenue(@PathVariable Long id) {
        venueRepository.deleteById(id);
        return "Venue deleted successfully";
    }
}