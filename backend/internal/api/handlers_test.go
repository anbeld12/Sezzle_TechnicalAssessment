package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"calculator-backend/internal/calculator"
)

type panicCalculator struct{}

func (p *panicCalculator) Calculate(_ calculator.CalculationInput) (calculator.CalculationOutput, error) {
	panic("unexpected catastrophic failure in calculation engine")
}

type errorCalculator struct {
	err error
}

func (e *errorCalculator) Calculate(_ calculator.CalculationInput) (calculator.CalculationOutput, error) {
	return calculator.CalculationOutput{}, e.err
}

func TestHandler_Calculate_Success(t *testing.T) {
	engine := calculator.NewEngine()
	router := NewRouter(engine)

	tests := []struct {
		name           string
		body           string
		expectedStatus int
		expectedResult float64
		expectedOp     string
	}{
		{
			name:           "Addition 10.5 + 2.5 = 13",
			body:           `{"operand1": 10.5, "operand2": 2.5, "operation": "add"}`,
			expectedStatus: http.StatusOK,
			expectedResult: 13,
			expectedOp:     "add",
		},
		{
			name:           "Addition with zero (0 + 0 = 0)",
			body:           `{"operand1": 0, "operand2": 0, "operation": "add"}`,
			expectedStatus: http.StatusOK,
			expectedResult: 0,
			expectedOp:     "add",
		},
		{
			name:           "Subtraction 100 - 45 = 55",
			body:           `{"operand1": 100, "operand2": 45, "operation": "subtract"}`,
			expectedStatus: http.StatusOK,
			expectedResult: 55,
			expectedOp:     "subtract",
		},
		{
			name:           "Multiplication 7 * 6 = 42",
			body:           `{"operand1": 7, "operand2": 6, "operation": "multiply"}`,
			expectedStatus: http.StatusOK,
			expectedResult: 42,
			expectedOp:     "multiply",
		},
		{
			name:           "Division 10 / 4 = 2.5",
			body:           `{"operand1": 10, "operand2": 4, "operation": "divide"}`,
			expectedStatus: http.StatusOK,
			expectedResult: 2.5,
			expectedOp:     "divide",
		},
		{
			name:           "Power 2 ^ 8 = 256",
			body:           `{"operand1": 2, "operand2": 8, "operation": "power"}`,
			expectedStatus: http.StatusOK,
			expectedResult: 256,
			expectedOp:     "power",
		},
		{
			name:           "Square Root sqrt(64) = 8 (unary)",
			body:           `{"operand1": 64, "operation": "sqrt"}`,
			expectedStatus: http.StatusOK,
			expectedResult: 8,
			expectedOp:     "sqrt",
		},
		{
			name:           "Percentage unary 25% = 0.25",
			body:           `{"operand1": 25, "operation": "percentage"}`,
			expectedStatus: http.StatusOK,
			expectedResult: 0.25,
			expectedOp:     "percentage",
		},
		{
			name:           "Percentage binary 15% of 200 = 30",
			body:           `{"operand1": 200, "operand2": 15, "operation": "percentage"}`,
			expectedStatus: http.StatusOK,
			expectedResult: 30,
			expectedOp:     "percentage",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(tc.body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tc.expectedStatus {
				t.Fatalf("expected status %d, got %d (body: %s)", tc.expectedStatus, rec.Code, rec.Body.String())
			}

			var resp CalculateResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.Result != tc.expectedResult {
				t.Errorf("expected result %v, got %v", tc.expectedResult, resp.Result)
			}
			if resp.Operation != tc.expectedOp {
				t.Errorf("expected operation %q, got %q", tc.expectedOp, resp.Operation)
			}
			if resp.Expression == "" {
				t.Errorf("expected non-empty expression")
			}
		})
	}
}

func TestHandler_Calculate_BadRequest(t *testing.T) {
	engine := calculator.NewEngine()
	router := NewRouter(engine)

	tests := []struct {
		name         string
		body         string
		expectedCode string
	}{
		{
			name:         "Malformed JSON syntax",
			body:         `{"operand1": 10, "operation": `,
			expectedCode: "INVALID_JSON",
		},
		{
			name:         "Disallowed unknown field",
			body:         `{"operand1": 10, "operand2": 5, "operation": "add", "extraField": true}`,
			expectedCode: "INVALID_JSON",
		},
		{
			name:         "Trailing JSON tokens",
			body:         `{"operand1": 10, "operation": "sqrt"} {"operand1": 20}`,
			expectedCode: "INVALID_JSON",
		},
		{
			name:         "Missing operand1",
			body:         `{"operand2": 5, "operation": "add"}`,
			expectedCode: "MISSING_OPERAND",
		},
		{
			name:         "Missing operand2 on binary add",
			body:         `{"operand1": 10, "operation": "add"}`,
			expectedCode: "MISSING_OPERAND",
		},
		{
			name:         "Missing operation",
			body:         `{"operand1": 10, "operand2": 5}`,
			expectedCode: "INVALID_OPERATION",
		},
		{
			name:         "Unsupported operation name",
			body:         `{"operand1": 10, "operand2": 5, "operation": "bitwise_xor"}`,
			expectedCode: "INVALID_OPERATION",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(tc.body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status 400 Bad Request, got %d (body: %s)", rec.Code, rec.Body.String())
			}

			var resp ErrorResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode error response: %v", err)
			}

			if resp.Error.Code != tc.expectedCode {
				t.Errorf("expected error code %q, got %q (message: %q)", tc.expectedCode, resp.Error.Code, resp.Error.Message)
			}
		})
	}
}

func TestHandler_Calculate_UnprocessableEntity(t *testing.T) {
	engine := calculator.NewEngine()
	router := NewRouter(engine)

	tests := []struct {
		name         string
		body         string
		expectedCode string
	}{
		{
			name:         "Division by zero",
			body:         `{"operand1": 10, "operand2": 0, "operation": "divide"}`,
			expectedCode: "DIVISION_BY_ZERO",
		},
		{
			name:         "Power zero to negative exponent",
			body:         `{"operand1": 0, "operand2": -2, "operation": "power"}`,
			expectedCode: "DIVISION_BY_ZERO",
		},
		{
			name:         "Negative square root",
			body:         `{"operand1": -9, "operation": "sqrt"}`,
			expectedCode: "NEGATIVE_SQUARE_ROOT",
		},
		{
			name:         "Floating point overflow",
			body:         `{"operand1": 1e200, "operand2": 2, "operation": "power"}`,
			expectedCode: "NUMERIC_OVERFLOW",
		},
		{
			name:         "Domain error (negative base fractional exponent)",
			body:         `{"operand1": -4, "operand2": 0.5, "operation": "power"}`,
			expectedCode: "DOMAIN_ERROR",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(tc.body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusUnprocessableEntity {
				t.Fatalf("expected status 422 Unprocessable Entity, got %d (body: %s)", rec.Code, rec.Body.String())
			}

			var resp ErrorResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode error response: %v", err)
			}

			if resp.Error.Code != tc.expectedCode {
				t.Errorf("expected error code %q, got %q (message: %q)", tc.expectedCode, resp.Error.Code, resp.Error.Message)
			}
		})
	}
}

func TestHandler_Health(t *testing.T) {
	engine := calculator.NewEngine()
	router := NewRouter(engine)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", rec.Code)
	}

	var resp HealthResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode health response: %v", err)
	}

	if resp.Status != "ok" {
		t.Errorf("expected status 'ok', got %q", resp.Status)
	}
}

func TestHandler_CORS_OptionsPreflight(t *testing.T) {
	engine := calculator.NewEngine()
	router := NewRouter(engine)

	req := httptest.NewRequest(http.MethodOptions, "/api/v1/calculate", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status 204 No Content for OPTIONS preflight, got %d", rec.Code)
	}

	if origin := rec.Header().Get("Access-Control-Allow-Origin"); origin != "*" {
		t.Errorf("expected CORS origin '*', got %q", origin)
	}
	if methods := rec.Header().Get("Access-Control-Allow-Methods"); methods == "" {
		t.Errorf("expected non-empty CORS methods header")
	}
}

func TestHandler_PanicRecovery(t *testing.T) {
	router := NewRouter(&panicCalculator{})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(`{"operand1": 10, "operation": "sqrt"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500 Internal Server Error, got %d", rec.Code)
	}

	var resp ErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}

	if resp.Error.Code != "INTERNAL_ERROR" {
		t.Errorf("expected code INTERNAL_ERROR, got %q", resp.Error.Code)
	}
}

func TestHandler_UnexpectedEngineError(t *testing.T) {
	router := NewRouter(&errorCalculator{err: errors.New("database disk full")})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(`{"operand1": 10, "operation": "sqrt"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rec.Code)
	}

	var resp ErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}

	if resp.Error.Code != "INTERNAL_ERROR" {
		t.Errorf("expected code INTERNAL_ERROR, got %q", resp.Error.Code)
	}
}
