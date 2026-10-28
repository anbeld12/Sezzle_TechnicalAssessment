package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"calculator-backend/internal/calculator"

	httpSwagger "github.com/swaggo/http-swagger/v2"
)

// Handler handles incoming HTTP requests for arithmetic operations and health checks.
type Handler struct {
	calc calculator.Service
}

// NewHandler creates a new Handler instance with the provided calculation service.
func NewHandler(calc calculator.Service) *Handler {
	return &Handler{calc: calc}
}

// writeJSON writes a payload as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// writeError writes a standardized error JSON response.
func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, ErrorResponse{
		Error: ErrorDetail{
			Code:    code,
			Message: message,
		},
	})
}

// Calculate performs an arithmetic operation based on the JSON payload.
//
// @Summary      Perform an arithmetic calculation
// @Description  Calculates basic and advanced arithmetic operations with IEEE 754 precision normalization.
// @Tags         calculator
// @Accept       json
// @Produce      json
// @Param        request body CalculateRequest true "Calculation payload"
// @Success      200 {object} CalculateResponse
// @Failure      400 {object} ErrorResponse
// @Failure      422 {object} ErrorResponse
// @Failure      500 {object} ErrorResponse
// @Router       /api/v1/calculate [post]
func (h *Handler) Calculate(w http.ResponseWriter, r *http.Request) {
	// Restrict payload to 1 MB to prevent body flooding
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req CalculateRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "request body must be valid JSON matching the schema")
		return
	}

	// Reject trailing JSON tokens
	if dec.More() {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "request body must contain a single JSON object")
		return
	}

	if req.Operand1 == nil {
		writeError(w, http.StatusBadRequest, "MISSING_OPERAND", "operand1 is required")
		return
	}

	normalizedOp := strings.TrimSpace(strings.ToLower(req.Operation))
	if normalizedOp == "" {
		writeError(w, http.StatusBadRequest, "INVALID_OPERATION", "unsupported arithmetic operation")
		return
	}

	input := calculator.CalculationInput{
		Operand1:  *req.Operand1,
		Operand2:  req.Operand2,
		Operation: calculator.Operation(normalizedOp),
	}

	output, err := h.calc.Calculate(input)
	if err != nil {
		switch {
		case errors.Is(err, calculator.ErrMissingSecondOperand):
			writeError(w, http.StatusBadRequest, "MISSING_OPERAND", "second operand is required for binary operation")
		case errors.Is(err, calculator.ErrInvalidOperation):
			writeError(w, http.StatusBadRequest, "INVALID_OPERATION", "unsupported arithmetic operation")
		case errors.Is(err, calculator.ErrDivisionByZero):
			writeError(w, http.StatusUnprocessableEntity, "DIVISION_BY_ZERO", "division by zero is undefined")
		case errors.Is(err, calculator.ErrNegativeSquareRoot):
			writeError(w, http.StatusUnprocessableEntity, "NEGATIVE_SQUARE_ROOT", "square root of a negative number is undefined in real numbers")
		case errors.Is(err, calculator.ErrOverflow):
			writeError(w, http.StatusUnprocessableEntity, "NUMERIC_OVERFLOW", "calculation result exceeds maximum representable float64 value")
		case errors.Is(err, calculator.ErrInvalidDomain):
			writeError(w, http.StatusUnprocessableEntity, "DOMAIN_ERROR", "operands produce an undefined real number (NaN or Inf)")
		default:
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "an unexpected internal server error occurred")
		}
		return
	}

	writeJSON(w, http.StatusOK, CalculateResponse{
		Result:     output.Result,
		Operation:  string(output.Operation),
		Operand1:   output.Operand1,
		Operand2:   output.Operand2,
		Expression: output.Expression,
	})
}

// Health checks the readiness/liveness of the service.
//
// @Summary      Service health check
// @Description  Returns ok if the service is alive and healthy.
// @Tags         system
// @Produce      json
// @Success      200 {object} HealthResponse
// @Router       /api/v1/health [get]
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, HealthResponse{Status: "ok"})
}

// NewRouter constructs and configures the HTTP router with middleware and route mappings.
func NewRouter(calc calculator.Service) http.Handler {
	h := NewHandler(calc)
	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/v1/calculate", h.Calculate)
	mux.HandleFunc("GET /api/v1/health", h.Health)
	mux.Handle("GET /swagger/", httpSwagger.WrapHandler)

	return Recoverer(RequestLogger(CORS(mux)))
}
