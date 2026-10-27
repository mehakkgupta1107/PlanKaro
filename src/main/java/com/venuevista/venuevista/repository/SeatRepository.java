package com.venuevista.venuevista.repository;

import com.venuevista.venuevista.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    boolean existsByRowNameAndSeatNumberAndVenueId(
            String rowName,
            int seatNumber,
            Long venueId
    );

    List<Seat> findByVenueId(Long venueId);
}