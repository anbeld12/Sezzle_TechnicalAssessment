export const OPERATIONS = {
  ADD: 'add',
  SUBTRACT: 'subtract',
  MULTIPLY: 'multiply',
  DIVIDE: 'divide',
  POWER: 'power',
  SQRT: 'sqrt',
  PERCENTAGE: 'percentage',
} as const;

export type Operation = (typeof OPERATIONS)[keyof typeof OPERATIONS];
export type BinaryOperation = 'add' | 'subtract' | 'multiply' | 'divide' | 'power';
export type UnaryOperation = 'sqrt' | 'percentage';

export interface CalculateRequest {
  operand1: number;
  operand2?: number;
  operation: Operation;
}

export interface CalculateResponse {
  result: number;
  operation: Operation;
  operand1: number;
  operand2?: number;
  expression: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiErrorPayload {
  error: ApiErrorDetail;
}

export interface HistoryEntry {
  id: string;
  expression: string;
  result: number;
  timestamp: string;
}

export interface FriendlyError {
  title: string;
  message: string;
}

export interface CalculatorState {
  displayValue: string;
  expressionTrail: string;
  firstOperand: number | null;
  pendingOperation: BinaryOperation | null;
  waitingForSecondOperand: boolean;
  isLoading: boolean;
  error: FriendlyError | null;
  history: HistoryEntry[];
}

export type ButtonVariant = 'number' | 'basic-op' | 'advanced-op' | 'equals' | 'danger';
