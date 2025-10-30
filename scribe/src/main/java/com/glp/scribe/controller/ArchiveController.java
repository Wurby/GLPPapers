package com.glp.scribe.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Archive Controller
 * REST API endpoints for The Glenn L. Pearson Papers archive
 */
@RestController
@RequestMapping("/api")
public class ArchiveController {

    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Scribe API is running - The Glenn L. Pearson Papers");
        return response;
    }

    @GetMapping("/archive/boxes")
    public Map<String, Object> getBoxes() {
        Map<String, Object> response = new HashMap<>();
        response.put("boxes", new String[]{
            "Box 1 - KLP (Karl L. Pearson)", 
            "Box 2 - KLP (Karl L. Pearson)", 
            "Box 3 - GLP (Glenn L. Pearson)"
        });
        response.put("message", "Archive metadata coming soon");
        return response;
    }
}
