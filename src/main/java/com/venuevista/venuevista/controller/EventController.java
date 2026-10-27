package com.venuevista.venuevista.controller;

import com.venuevista.venuevista.entity.Event;
import com.venuevista.venuevista.repository.EventRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "https://plan-karo-app.vercel.app"
})
public class EventController {

    private final EventRepository eventRepository;

    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @GetMapping("/{id}")
    public Event getEventById(@PathVariable Long id) {
        return eventRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Event createEvent(@RequestBody Event event) {
        return eventRepository.save(event);
    }

    @PutMapping("/{id}")
    public Event updateEvent(
            @PathVariable Long id,
            @RequestBody Event event
    ) {
        Event existingEvent = eventRepository.findById(id).orElse(null);

        if (existingEvent == null) {
            return null;
        }

        existingEvent.setName(event.getName());
        existingEvent.setDescription(event.getDescription());
        existingEvent.setDate(event.getDate());
        existingEvent.setTime(event.getTime());
        existingEvent.setCategory(event.getCategory());
        existingEvent.setPrice(event.getPrice());
        existingEvent.setVenue(event.getVenue());

        return eventRepository.save(existingEvent);
    }

    @DeleteMapping("/{id}")
    public String deleteEvent(@PathVariable Long id) {
        if (!eventRepository.existsById(id)) {
            return "Event not found";
        }

        eventRepository.deleteById(id);
        return "Event deleted successfully";
    }
}