package com.example.payment_service.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class PayPalService {

    private static final Logger log = LoggerFactory.getLogger(PayPalService.class);

    private final RestTemplate rest = new RestTemplate();

    @Value("${paypal.clientId:}")
    private String clientId;

    @Value("${paypal.clientSecret:}")
    private String clientSecret;

    @Value("${paypal.baseUrl:https://api.sandbox.paypal.com}")
    private String baseUrl;

    @Value("${paypal.returnUrl:http://localhost:8081/payments/return}")
    private String returnUrl;

    @Value("${paypal.cancelUrl:http://localhost:8081/payments/cancel}")
    private String cancelUrl;

    @Value("${paypal.currency:USD}")
    private String currency;

    private String getAccessToken() {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()
                || clientId.contains("YOUR") || clientSecret.contains("YOUR")) {
            throw new IllegalStateException("PayPal credentials are not configured (paypal.clientId/paypal.clientSecret). Set them in application.properties or pass as runtime arguments to use real PayPal sandbox.");
        }

        try {
            String auth = clientId + ":" + clientSecret;
            String encoded = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Basic " + encoded);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<String> req = new HttpEntity<>("grant_type=client_credentials", headers);
            ResponseEntity<Map> resp = rest.postForEntity(baseUrl + "/v1/oauth2/token", req, Map.class);
            Map body = resp.getBody();
            if (body != null && body.get("access_token") != null) {
                return body.get("access_token").toString();
            }
            throw new RuntimeException("Could not obtain PayPal access token: empty response body");
        } catch (RestClientException ex) {
            log.error("Error while requesting PayPal access token: {}", ex.getMessage());
            throw new RuntimeException("Error while requesting PayPal access token: " + ex.getMessage(), ex);
        }
    }

    public String createOrder(Double amount) {
        // Allow quick local testing without real PayPal credentials: return a fake approval URL
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()
                || clientId.contains("YOUR") || clientSecret.contains("YOUR")) {
            log.warn("PayPal credentials missing or placeholder detected - returning fake approval URL for testing");
            return "https://www.sandbox.paypal.com/checkoutnow?token=FAKE-TEST-TOKEN";
        }

        try {
            String token = getAccessToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> purchaseUnit = new HashMap<>();
            Map<String, String> amountMap = new HashMap<>();
            amountMap.put("currency_code", currency);
            amountMap.put("value", String.format("%.2f", amount));
            purchaseUnit.put("amount", amountMap);

            Map<String, Object> applicationContext = new HashMap<>();
            applicationContext.put("return_url", returnUrl);
            applicationContext.put("cancel_url", cancelUrl);

            Map<String, Object> order = new HashMap<>();
            order.put("intent", "CAPTURE");
            order.put("purchase_units", List.of(purchaseUnit));
            order.put("application_context", applicationContext);

            HttpEntity<Map<String, Object>> req = new HttpEntity<>(order, headers);
            ResponseEntity<Map> resp = rest.postForEntity(baseUrl + "/v2/checkout/orders", req, Map.class);
            Map body = resp.getBody();
            if (body != null && body.get("links") instanceof List) {
                List<Map> links = (List<Map>) body.get("links");
                for (Map link : links) {
                    if ("approve".equals(link.get("rel"))) {
                        return link.get("href").toString();
                    }
                }
            }
            throw new RuntimeException("PayPal approval link not found in response");
        } catch (RestClientException ex) {
            log.error("Error while creating PayPal order: {}", ex.getMessage());
            throw new RuntimeException("Error while creating PayPal order: " + ex.getMessage(), ex);
        }
    }
}
