package com.venuevista.venuevista.repository;

import com.venuevista.venuevista.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VenueRepository extends JpaRepository<Venue, Long> {
}