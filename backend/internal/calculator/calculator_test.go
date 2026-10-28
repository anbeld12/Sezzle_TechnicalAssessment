package calculator

import (
	"errors"
	"math"
	"testing"
)

func floatPtr(v float64) *float64 {
	return &v
}

func TestEngine_Calculate_TableDriven(t *testing.T) {
	engine := NewEngine()

	tests := []struct {
		name          string
		input         CalculationInput
		expectedRes   float64
		expectedExpr  string
		expectedErr   error
		checkResNear  bool
		tolerance     float64
	}{
		// --- Addition ---
		{
			name:         "Addition - positive integers",
			input:        CalculationInput{Operand1: 10, Operand2: floatPtr(5), Operation: OpAdd},
			expectedRes:  15,
			expectedExpr: "10 + 5 = 15",
			expectedErr:  nil,
		},
		{
			name:         "Addition - floating point representation noise (0.1 + 0.2 = 0.3)",
			input:        CalculationInput{Operand1: 0.1, Operand2: floatPtr(0.2), Operation: OpAdd},
			expectedRes:  0.3,
			expectedExpr: "0.1 + 0.2 = 0.3",
			expectedErr:  nil,
		},
		{
			name:         "Addition - negative numbers",
			input:        CalculationInput{Operand1: -15, Operand2: floatPtr(-5), Operation: OpAdd},
			expectedRes:  -20,
			expectedExpr: "-15 + -5 = -20",
			expectedErr:  nil,
		},
		{
			name:         "Addition - adding zero",
			input:        CalculationInput{Operand1: 42, Operand2: floatPtr(0), Operation: OpAdd},
			expectedRes:  42,
			expectedExpr: "42 + 0 = 42",
			expectedErr:  nil,
		},
		{
			name:        "Addition - overflow to +Inf",
			input:       CalculationInput{Operand1: math.MaxFloat64, Operand2: floatPtr(math.MaxFloat64), Operation: OpAdd},
			expectedErr: ErrOverflow,
		},

		// --- Subtraction ---
		{
			name:         "Subtraction - positive integers",
			input:        CalculationInput{Operand1: 25, Operand2: floatPtr(10), Operation: OpSubtract},
			expectedRes:  15,
			expectedExpr: "25 - 10 = 15",
			expectedErr:  nil,
		},
		{
			name:         "Subtraction - resulting in negative",
			input:        CalculationInput{Operand1: 5, Operand2: floatPtr(12), Operation: OpSubtract},
			expectedRes:  -7,
			expectedExpr: "5 - 12 = -7",
			expectedErr:  nil,
		},
		{
			name:         "Subtraction - float precision",
			input:        CalculationInput{Operand1: 1.5, Operand2: floatPtr(0.3), Operation: OpSubtract},
			expectedRes:  1.2,
			expectedExpr: "1.5 - 0.3 = 1.2",
			expectedErr:  nil,
		},
		{
			name:        "Subtraction - overflow to -Inf",
			input:       CalculationInput{Operand1: -math.MaxFloat64, Operand2: floatPtr(math.MaxFloat64), Operation: OpSubtract},
			expectedErr: ErrOverflow,
		},

		// --- Multiplication ---
		{
			name:         "Multiplication - positive numbers",
			input:        CalculationInput{Operand1: 6, Operand2: floatPtr(7), Operation: OpMultiply},
			expectedRes:  42,
			expectedExpr: "6 × 7 = 42",
			expectedErr:  nil,
		},
		{
			name:         "Multiplication - decimals (1.1 * 3 = 3.3)",
			input:        CalculationInput{Operand1: 1.1, Operand2: floatPtr(3), Operation: OpMultiply},
			expectedRes:  3.3,
			expectedExpr: "1.1 × 3 = 3.3",
			expectedErr:  nil,
		},
		{
			name:         "Multiplication - normalize negative zero (-0.0 * 5 = 0)",
			input:        CalculationInput{Operand1: -0.0, Operand2: floatPtr(5), Operation: OpMultiply},
			expectedRes:  0,
			expectedExpr: "0 × 5 = 0",
			expectedErr:  nil,
		},
		{
			name:        "Multiplication - overflow",
			input:       CalculationInput{Operand1: 1e200, Operand2: floatPtr(1e200), Operation: OpMultiply},
			expectedErr: ErrOverflow,
		},

		// --- Division ---
		{
			name:         "Division - exact integer result",
			input:        CalculationInput{Operand1: 100, Operand2: floatPtr(4), Operation: OpDivide},
			expectedRes:  25,
			expectedExpr: "100 ÷ 4 = 25",
			expectedErr:  nil,
		},
		{
			name:         "Division - recurring decimal (1 / 3)",
			input:        CalculationInput{Operand1: 1, Operand2: floatPtr(3), Operation: OpDivide},
			expectedRes:  0.333333333333,
			checkResNear: true,
			tolerance:    1e-11,
			expectedErr:  nil,
		},
		{
			name:        "Division - divide by zero",
			input:       CalculationInput{Operand1: 42, Operand2: floatPtr(0), Operation: OpDivide},
			expectedErr: ErrDivisionByZero,
		},
		{
			name:        "Division - divide by negative zero",
			input:       CalculationInput{Operand1: 42, Operand2: floatPtr(-0.0), Operation: OpDivide},
			expectedErr: ErrDivisionByZero,
		},
		{
			name:        "Division - zero divided by non-zero",
			input:       CalculationInput{Operand1: 0, Operand2: floatPtr(5), Operation: OpDivide},
			expectedRes: 0,
			expectedErr: nil,
		},

		// --- Power (Exponentiation) ---
		{
			name:         "Power - integer exponent (2^10 = 1024)",
			input:        CalculationInput{Operand1: 2, Operand2: floatPtr(10), Operation: OpPower},
			expectedRes:  1024,
			expectedExpr: "2 ^ 10 = 1024",
			expectedErr:  nil,
		},
		{
			name:         "Power - zero exponent (5^0 = 1)",
			input:        CalculationInput{Operand1: 5, Operand2: floatPtr(0), Operation: OpPower},
			expectedRes:  1,
			expectedExpr: "5 ^ 0 = 1",
			expectedErr:  nil,
		},
		{
			name:         "Power - zero to zero (0^0 = 1 per IEEE 754)",
			input:        CalculationInput{Operand1: 0, Operand2: floatPtr(0), Operation: OpPower},
			expectedRes:  1,
			expectedExpr: "0 ^ 0 = 1",
			expectedErr:  nil,
		},
		{
			name:         "Power - negative exponent (2^-2 = 0.25)",
			input:        CalculationInput{Operand1: 2, Operand2: floatPtr(-2), Operation: OpPower},
			expectedRes:  0.25,
			expectedExpr: "2 ^ -2 = 0.25",
			expectedErr:  nil,
		},
		{
			name:         "Power - fractional exponent (9^0.5 = 3)",
			input:        CalculationInput{Operand1: 9, Operand2: floatPtr(0.5), Operation: OpPower},
			expectedRes:  3,
			expectedExpr: "9 ^ 0.5 = 3",
			expectedErr:  nil,
		},
		{
			name:        "Power - zero to negative exponent (0^-2 -> division by zero)",
			input:       CalculationInput{Operand1: 0, Operand2: floatPtr(-2), Operation: OpPower},
			expectedErr: ErrDivisionByZero,
		},
		{
			name:        "Power - negative base with non-integer exponent ((-4)^0.5 -> NaN)",
			input:       CalculationInput{Operand1: -4, Operand2: floatPtr(0.5), Operation: OpPower},
			expectedErr: ErrInvalidDomain,
		},
		{
			name:        "Power - overflow (1e200 ^ 2 -> ErrOverflow)",
			input:       CalculationInput{Operand1: 1e200, Operand2: floatPtr(2), Operation: OpPower},
			expectedErr: ErrOverflow,
		},

		// --- Square Root ---
		{
			name:         "Square Root - perfect square (sqrt(81) = 9)",
			input:        CalculationInput{Operand1: 81, Operation: OpSqrt},
			expectedRes:  9,
			expectedExpr: "√(81) = 9",
			expectedErr:  nil,
		},
		{
			name:         "Square Root - zero (sqrt(0) = 0)",
			input:        CalculationInput{Operand1: 0, Operation: OpSqrt},
			expectedRes:  0,
			expectedExpr: "√(0) = 0",
			expectedErr:  nil,
		},
		{
			name:         "Square Root - irrational (sqrt(2))",
			input:        CalculationInput{Operand1: 2, Operation: OpSqrt},
			expectedRes:  math.Sqrt(2),
			checkResNear: true,
			tolerance:    1e-10,
			expectedErr:  nil,
		},
		{
			name:        "Square Root - negative number (sqrt(-1))",
			input:       CalculationInput{Operand1: -1, Operation: OpSqrt},
			expectedErr: ErrNegativeSquareRoot,
		},

		// --- Percentage ---
		{
			name:         "Percentage - unary mode (50% = 0.5)",
			input:        CalculationInput{Operand1: 50, Operation: OpPercentage},
			expectedRes:  0.5,
			expectedExpr: "50% = 0.5",
			expectedErr:  nil,
		},
		{
			name:         "Percentage - binary mode (15% of 200 = 30)",
			input:        CalculationInput{Operand1: 200, Operand2: floatPtr(15), Operation: OpPercentage},
			expectedRes:  30,
			expectedExpr: "15% of 200 = 30",
			expectedErr:  nil,
		},
		{
			name:        "Percentage - overflow",
			input:       CalculationInput{Operand1: math.MaxFloat64, Operand2: floatPtr(200), Operation: OpPercentage},
			expectedErr: ErrOverflow,
		},

		// --- Missing Second Operand on Binary Operations ---
		{
			name:        "Missing Operand2 - Add",
			input:       CalculationInput{Operand1: 10, Operation: OpAdd},
			expectedErr: ErrMissingSecondOperand,
		},
		{
			name:        "Missing Operand2 - Subtract",
			input:       CalculationInput{Operand1: 10, Operation: OpSubtract},
			expectedErr: ErrMissingSecondOperand,
		},
		{
			name:        "Missing Operand2 - Multiply",
			input:       CalculationInput{Operand1: 10, Operation: OpMultiply},
			expectedErr: ErrMissingSecondOperand,
		},
		{
			name:        "Missing Operand2 - Divide",
			input:       CalculationInput{Operand1: 10, Operation: OpDivide},
			expectedErr: ErrMissingSecondOperand,
		},
		{
			name:        "Missing Operand2 - Power",
			input:       CalculationInput{Operand1: 10, Operation: OpPower},
			expectedErr: ErrMissingSecondOperand,
		},

		// --- Unsupported Operation ---
		{
			name:        "Unsupported operation - 'modulo'",
			input:       CalculationInput{Operand1: 10, Operand2: floatPtr(3), Operation: "modulo"},
			expectedErr: ErrInvalidOperation,
		},
		{
			name:        "Empty operation",
			input:       CalculationInput{Operand1: 10, Operand2: floatPtr(3), Operation: ""},
			expectedErr: ErrInvalidOperation,
		},

		// --- Invalid Domain (NaN / Inf inputs) ---
		{
			name:        "Operand1 is NaN",
			input:       CalculationInput{Operand1: math.NaN(), Operand2: floatPtr(5), Operation: OpAdd},
			expectedErr: ErrInvalidDomain,
		},
		{
			name:        "Operand1 is +Inf",
			input:       CalculationInput{Operand1: math.Inf(1), Operand2: floatPtr(5), Operation: OpAdd},
			expectedErr: ErrInvalidDomain,
		},
		{
			name:        "Operand2 is NaN",
			input:       CalculationInput{Operand1: 5, Operand2: floatPtr(math.NaN()), Operation: OpAdd},
			expectedErr: ErrInvalidDomain,
		},
		{
			name:        "Operand2 is -Inf",
			input:       CalculationInput{Operand1: 5, Operand2: floatPtr(math.Inf(-1)), Operation: OpAdd},
			expectedErr: ErrInvalidDomain,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			output, err := engine.Calculate(tc.input)

			if tc.expectedErr != nil {
				if err == nil {
					t.Fatalf("expected error %v, got nil (output: %+v)", tc.expectedErr, output)
				}
				if !errors.Is(err, tc.expectedErr) {
					t.Fatalf("expected error %v, got %v", tc.expectedErr, err)
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if tc.checkResNear {
				diff := math.Abs(output.Result - tc.expectedRes)
				if diff > tc.tolerance {
					t.Errorf("result %v not within %v of expected %v (diff: %v)", output.Result, tc.tolerance, tc.expectedRes, diff)
				}
			} else {
				if output.Result != tc.expectedRes {
					t.Errorf("expected result %v, got %v", tc.expectedRes, output.Result)
				}
			}

			if tc.expectedExpr != "" && output.Expression != tc.expectedExpr {
				t.Errorf("expected expression %q, got %q", tc.expectedExpr, output.Expression)
			}
		})
	}
}

func TestFormatNumber(t *testing.T) {
	cases := []struct {
		input    float64
		expected string
	}{
		{0, "0"},
		{42, "42"},
		{10.5, "10.5"},
		{-7, "-7"},
	}

	for _, c := range cases {
		res := FormatNumber(c.input)
		if res != c.expected {
			t.Errorf("FormatNumber(%v) = %q; expected %q", c.input, res, c.expected)
		}
	}
}
