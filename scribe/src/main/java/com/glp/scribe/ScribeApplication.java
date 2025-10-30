package com.glp.scribe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Scribe - Main Application
 * Backend API for The Glenn L. Pearson Papers
 * 
 * Named "Scribe" to honor Glenn L. Pearson's work as a writer, professor, 
 * and keeper of records - preserving his journals, letters, and teachings.
 */
@SpringBootApplication
public class ScribeApplication {

    public static void main(String[] args) {
        SpringApplication.run(ScribeApplication.class, args);
    }
}
