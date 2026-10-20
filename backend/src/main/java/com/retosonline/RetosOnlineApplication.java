package com.retosonline;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class
RetosOnlineApplication {

	public static void main(String[] args) {
		SpringApplication.run(RetosOnlineApplication.class, args);
	}
}