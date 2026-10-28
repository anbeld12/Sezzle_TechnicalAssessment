package api

// CalculateRequest represents the JSON payload for POST /api/v1/calculate.
type CalculateRequest struct {
	Operand1  *float64 `json:"operand1" example:"10.5"`
	Operand2  *float64 `json:"operand2,omitempty" example:"2.5"`
	Operation string   `json:"operation" example:"add" enums:"add,subtract,multiply,divide,power,sqrt,percentage"`
}

// CalculateResponse represents a successful calculation result.
type CalculateResponse struct {
	Result     float64  `json:"result" example:"13"`
	Operation  string   `json:"operation" example:"add"`
	Operand1   float64  `json:"operand1" example:"10.5"`
	Operand2   *float64 `json:"operand2,omitempty" example:"2.5"`
	Expression string   `json:"expression" example:"10.5 + 2.5 = 13"`
}

// ErrorDetail contains a machine-readable error code and human-friendly message.
type ErrorDetail struct {
	Code    string `json:"code" example:"DIVISION_BY_ZERO"`
	Message string `json:"message" example:"division by zero is undefined"`
}

// ErrorResponse wraps ErrorDetail in a consistent top-level JSON envelope.
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

// HealthResponse represents the health check response.
type HealthResponse struct {
	Status string `json:"status" example:"ok"`
}
