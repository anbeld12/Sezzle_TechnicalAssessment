import React from 'react';
import {
  Divide,
  X,
  Minus,
  Plus,
  Equal,
  Delete as BackspaceIcon,
  Percent,
} from 'lucide-react';
import { Button } from './Button';
import type { BinaryOperation, UnaryOperation } from '../types/calculator';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onDelete: () => void;
  onClear: () => void;
  onToggleSign: () => void;
  onBinaryOperation: (op: BinaryOperation) => void;
  onUnaryOperation: (op: UnaryOperation) => void;
  onEvaluate: () => void;
  pendingOperation: BinaryOperation | null;
  isLoading: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  onDigit,
  onDecimal,
  onDelete,
  onClear,
  onToggleSign,
  onBinaryOperation,
  onUnaryOperation,
  onEvaluate,
  pendingOperation,
  isLoading,
}) => {
  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3 mt-4">
      {/* Row 1: Advanced Operations Bar (Soft Lavender) */}
      <Button
        variant="advanced-op"
        onClick={() => onUnaryOperation('sqrt')}
        disabled={isLoading}
        ariaLabel="Square root"
        testId="btn-sqrt"
      >
        <span>√</span>
      </Button>
      <Button
        variant="advanced-op"
        onClick={() => onBinaryOperation('power')}
        disabled={isLoading}
        isActive={pendingOperation === 'power'}
        ariaLabel="Exponentiate"
        testId="btn-power"
      >
        <span>x<sup>y</sup></span>
      </Button>
      <Button
        variant="advanced-op"
        onClick={() => onUnaryOperation('percentage')}
        disabled={isLoading}
        ariaLabel="Percentage"
        testId="btn-percentage"
      >
        <Percent className="w-5 h-5" strokeWidth={2.2} />
      </Button>
      <Button
        variant="advanced-op"
        onClick={onToggleSign}
        disabled={isLoading}
        ariaLabel="Toggle positive or negative"
        testId="btn-toggle-sign"
      >
        <span>±</span>
      </Button>

      {/* Row 2: Clear/Delete & Divide */}
      <Button
        variant="danger"
        onClick={onClear}
        className="col-span-2"
        ariaLabel="All clear"
        testId="btn-ac"
      >
        AC
      </Button>
      <Button
        variant="danger"
        onClick={onDelete}
        ariaLabel="Delete last digit"
        testId="btn-del"
      >
        <BackspaceIcon className="w-5 h-5" strokeWidth={2.2} />
      </Button>
      <Button
        variant="basic-op"
        onClick={() => onBinaryOperation('divide')}
        disabled={isLoading}
        isActive={pendingOperation === 'divide'}
        ariaLabel="Divide"
        testId="btn-divide"
      >
        <Divide className="w-5 h-5" strokeWidth={2.2} />
      </Button>

      {/* Row 3: 7, 8, 9, Multiply */}
      <Button variant="number" onClick={() => onDigit('7')} ariaLabel="Digit 7" testId="btn-7">
        7
      </Button>
      <Button variant="number" onClick={() => onDigit('8')} ariaLabel="Digit 8" testId="btn-8">
        8
      </Button>
      <Button variant="number" onClick={() => onDigit('9')} ariaLabel="Digit 9" testId="btn-9">
        9
      </Button>
      <Button
        variant="basic-op"
        onClick={() => onBinaryOperation('multiply')}
        disabled={isLoading}
        isActive={pendingOperation === 'multiply'}
        ariaLabel="Multiply"
        testId="btn-multiply"
      >
        <X className="w-5 h-5" strokeWidth={2.2} />
      </Button>

      {/* Row 4: 4, 5, 6, Subtract */}
      <Button variant="number" onClick={() => onDigit('4')} ariaLabel="Digit 4" testId="btn-4">
        4
      </Button>
      <Button variant="number" onClick={() => onDigit('5')} ariaLabel="Digit 5" testId="btn-5">
        5
      </Button>
      <Button variant="number" onClick={() => onDigit('6')} ariaLabel="Digit 6" testId="btn-6">
        6
      </Button>
      <Button
        variant="basic-op"
        onClick={() => onBinaryOperation('subtract')}
        disabled={isLoading}
        isActive={pendingOperation === 'subtract'}
        ariaLabel="Subtract"
        testId="btn-subtract"
      >
        <Minus className="w-5 h-5" strokeWidth={2.2} />
      </Button>

      {/* Row 5: 1, 2, 3, Add */}
      <Button variant="number" onClick={() => onDigit('1')} ariaLabel="Digit 1" testId="btn-1">
        1
      </Button>
      <Button variant="number" onClick={() => onDigit('2')} ariaLabel="Digit 2" testId="btn-2">
        2
      </Button>
      <Button variant="number" onClick={() => onDigit('3')} ariaLabel="Digit 3" testId="btn-3">
        3
      </Button>
      <Button
        variant="basic-op"
        onClick={() => onBinaryOperation('add')}
        disabled={isLoading}
        isActive={pendingOperation === 'add'}
        ariaLabel="Add"
        testId="btn-add"
      >
        <Plus className="w-5 h-5" strokeWidth={2.2} />
      </Button>

      {/* Row 6: 0 (span 2), Decimal, Equals */}
      <Button
        variant="number"
        onClick={() => onDigit('0')}
        className="col-span-2"
        ariaLabel="Digit 0"
        testId="btn-0"
      >
        0
      </Button>
      <Button
        variant="number"
        onClick={onDecimal}
        ariaLabel="Decimal point"
        testId="btn-decimal"
      >
        .
      </Button>
      <Button
        variant="equals"
        onClick={onEvaluate}
        disabled={isLoading}
        ariaLabel="Calculate result"
        testId="btn-equals"
      >
        <Equal className="w-5 h-5" strokeWidth={2.2} />
      </Button>
    </div>
  );
};
