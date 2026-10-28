package calculator

import "errors"

var (
	// ErrDivisionByZero indicates an attempt to divide by zero or raise zero to a negative power.
	ErrDivisionByZero = errors.New("division by zero is undefined")

	// ErrNegativeSquareRoot indicates an attempt to calculate the square root of a negative number.
	ErrNegativeSquareRoot = errors.New("square root of a negative number is undefined in real numbers")

	// ErrInvalidOperation indicates that an unknown or unsupported operation was requested.
	ErrInvalidOperation = errors.New("unsupported arithmetic operation")

	// ErrMissingSecondOperand indicates that a binary operation was requested without a second operand.
	ErrMissingSecondOperand = errors.New("second operand is required for binary operation")

	// ErrOverflow indicates that the result exceeds the IEEE 754 float64 representation limit.
	ErrOverflow = errors.New("calculation result exceeds maximum representable float64 value")

	// ErrInvalidDomain indicates that the inputs or operations produce NaN or Inf.
	ErrInvalidDomain = errors.New("operands produce an undefined real number (NaN or Inf)")
)
