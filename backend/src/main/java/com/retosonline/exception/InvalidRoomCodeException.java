package com.retosonline.exception;


public class InvalidRoomCodeException extends RuntimeException {
    public InvalidRoomCodeException(String message) {
        super(message);
    }
}