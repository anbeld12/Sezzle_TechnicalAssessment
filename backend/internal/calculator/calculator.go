package calculator

import (
	"fmt"
	"math"
	"strconv"
)

// Operation defines supported mathematical operations.
type Operation string

const (
	OpAdd        Operation = "add"
	OpSubtract   Operation = "subtract"
	OpMultiply   Operation = "multiply"
	OpDivide     Operation = "divide"
	OpPower      Operation = "power"
	OpSqrt       Operation = "sqrt"
	OpPercentage Operation = "percentage"
)

// CalculationInput encapsulates validated domain parameters.
type CalculationInput struct {
	Operand1  float64
	Operand2  *float64
	Operation Operation
}

// CalculationOutput encapsulates the normalized result and formatted expression.
type CalculationOutput struct {
	Result     float64
	Operation  Operation
	Operand1   float64
	Operand2   *float64
	Expression string
}

// Service defines the interface for arithmetic evaluation.
type Service interface {
	Calculate(input CalculationInput) (CalculationOutput, error)
}

// Engine implements Service with pure stateless mathematical evaluation.
type Engine struct{}

// NewEngine creates a new arithmetic Engine instance.
func NewEngine() *Engine {
	return &Engine{}
}

// Calculate performs the requested arithmetic operation with IEEE 754 boundary checks.
func (e *Engine) Calculate(input CalculationInput) (CalculationOutput, error) {
	// Guard against NaN or Inf on input operands
	if math.IsNaN(input.Operand1) || math.IsInf(input.Operand1, 0) {
		return CalculationOutput{}, ErrInvalidDomain
	}
	if input.Operand2 != nil {
		if math.IsNaN(*input.Operand2) || math.IsInf(*input.Operand2, 0) {
			return CalculationOutput{}, ErrInvalidDomain
		}
	}

	var rawResult float64

	switch input.Operation {
	case OpAdd:
		if input.Operand2 == nil {
			return CalculationOutput{}, ErrMissingSecondOperand
		}
		rawResult = input.Operand1 + *input.Operand2

	case OpSubtract:
		if input.Operand2 == nil {
			return CalculationOutput{}, ErrMissingSecondOperand
		}
		rawResult = input.Operand1 - *input.Operand2

	case OpMultiply:
		if input.Operand2 == nil {
			return CalculationOutput{}, ErrMissingSecondOperand
		}
		rawResult = input.Operand1 * *input.Operand2

	case OpDivide:
		if input.Operand2 == nil {
			return CalculationOutput{}, ErrMissingSecondOperand
		}
		if *input.Operand2 == 0 {
			return CalculationOutput{}, ErrDivisionByZero
		}
		rawResult = input.Operand1 / *input.Operand2

	case OpPower:
		if input.Operand2 == nil {
			return CalculationOutput{}, ErrMissingSecondOperand
		}
		if input.Operand1 == 0 && *input.Operand2 < 0 {
			return CalculationOutput{}, ErrDivisionByZero
		}
		rawResult = math.Pow(input.Operand1, *input.Operand2)

	case OpSqrt:
		if input.Operand1 < 0 {
			return CalculationOutput{}, ErrNegativeSquareRoot
		}
		rawResult = math.Sqrt(input.Operand1)

	case OpPercentage:
		if input.Operand2 == nil {
			// Unary percentage: 50% = 0.5
			rawResult = input.Operand1 / 100.0
		} else {
			// Binary contextual percentage: 15% of 200 = 30
			rawResult = (input.Operand1 * *input.Operand2) / 100.0
		}

	default:
		return CalculationOutput{}, ErrInvalidOperation
	}

	// Validate output boundaries
	if math.IsNaN(rawResult) {
		return CalculationOutput{}, ErrInvalidDomain
	}
	if math.IsInf(rawResult, 0) {
		return CalculationOutput{}, ErrOverflow
	}

	// Normalize IEEE 754 negative zero (-0.0 -> 0.0)
	if rawResult == 0 {
		rawResult = 0
	}

	result := normalizeFloat(rawResult)
	expression := formatExpression(input, result)

	return CalculationOutput{
		Result:     result,
		Operation:  input.Operation,
		Operand1:   input.Operand1,
		Operand2:   input.Operand2,
		Expression: expression,
	}, nil
}

// normalizeFloat rounds float64 values to 12 significant digits using 'G' formatting
// to eliminate IEEE 754 binary fraction representation noise (e.g., 0.1 + 0.2 -> 0.3).
func normalizeFloat(val float64) float64 {
	if val == 0 || math.IsNaN(val) || math.IsInf(val, 0) {
		return 0
	}
	formatted := strconv.FormatFloat(val, 'G', 12, 64)
	parsed, err := strconv.ParseFloat(formatted, 64)
	if err != nil {
		return val
	}
	if parsed == 0 {
		return 0
	}
	return parsed
}

// FormatNumber formats a floating-point number into a clean human-readable representation.
func FormatNumber(val float64) string {
	if val == 0 {
		return "0"
	}
	return strconv.FormatFloat(val, 'g', 12, 64)
}

// formatExpression constructs a canonical human-readable representation of the computation.
func formatExpression(input CalculationInput, result float64) string {
	resStr := FormatNumber(result)
	op1Str := FormatNumber(input.Operand1)

	switch input.Operation {
	case OpAdd:
		return fmt.Sprintf("%s + %s = %s", op1Str, FormatNumber(*input.Operand2), resStr)
	case OpSubtract:
		return fmt.Sprintf("%s - %s = %s", op1Str, FormatNumber(*input.Operand2), resStr)
	case OpMultiply:
		return fmt.Sprintf("%s × %s = %s", op1Str, FormatNumber(*input.Operand2), resStr)
	case OpDivide:
		return fmt.Sprintf("%s ÷ %s = %s", op1Str, FormatNumber(*input.Operand2), resStr)
	case OpPower:
		return fmt.Sprintf("%s ^ %s = %s", op1Str, FormatNumber(*input.Operand2), resStr)
	case OpSqrt:
		return fmt.Sprintf("√(%s) = %s", op1Str, resStr)
	case OpPercentage:
		if input.Operand2 == nil {
			return fmt.Sprintf("%s%% = %s", op1Str, resStr)
		}
		return fmt.Sprintf("%s%% of %s = %s", FormatNumber(*input.Operand2), op1Str, resStr)
	default:
		return fmt.Sprintf("%s = %s", op1Str, resStr)
	}
}
