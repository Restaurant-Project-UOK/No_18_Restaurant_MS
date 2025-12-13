package com.restaurant.menu_service.media;

import com.restaurant.menu_service.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping(
        value = "/upload",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(@RequestParam("file") MultipartFile file)
            throws IOException {
        String id = mediaService.store(file);
        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder()
                .success(true)
                .message("Uploaded")
                .data(Map.of("imageId", id))
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable String id) throws IOException {
        InputStreamResource resource = mediaService.getFile(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG); // frontend can detect actual type if needed
        return ResponseEntity.ok().headers(headers).body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        mediaService.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }
}
