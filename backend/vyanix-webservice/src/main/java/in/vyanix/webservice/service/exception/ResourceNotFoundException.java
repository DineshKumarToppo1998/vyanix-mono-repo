package in.vyanix.webservice.service.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(Class<?> className, Object identifier) {
        super(String.format("%s with id %s not found", className.getSimpleName(), identifier));
    }
}
