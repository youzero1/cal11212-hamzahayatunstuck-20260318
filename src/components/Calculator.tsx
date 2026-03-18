'use client';

import { useState, useCallback, useEffect } from 'react';

type ButtonType = 'number' | 'operator' | 'equals' | 'clear' | 'special';

interface CalcButton {
  label: string;
  value: string;
  type: ButtonType;
  span?: number;
}

const buttons: CalcButton[][] = [
  [
    { label: 'AC', value: 'AC', type: 'clear' },
    { label: '+/-', value: 'SIGN', type: 'special' },
    { label: '%', value: '%', type: 'special' },
    { label: '÷', value: '/', type: 'operator' },
  ],
  [
    { label: '7', value: '7', type: 'number' },
    { label: '8', value: '8', type: 'number' },
    { label: '9', value: '9', type: 'number' },
    { label: '×', value: '*', type: 'operator' },
  ],
  [
    { label: '4', value: '4', type: 'number' },
    { label: '5', value: '5', type: 'number' },
    { label: '6', value: '6', type: 'number' },
    { label: '-', value: '-', type: 'operator' },
  ],
  [
    { label: '1', value: '1', type: 'number' },
    { label: '2', value: '2', type: 'number' },
    { label: '3', value: '3', type: 'number' },
    { label: '+', value: '+', type: 'operator' },
  ],
  [
    { label: '0', value: '0', type: 'number', span: 2 },
    { label: '.', value: '.', type: 'number' },
    { label: '=', value: '=', type: 'equals' },
  ],
];

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('');
  const [justCalculated, setJustCalculated] = useState(false);

  const calculate = useCallback(
    (a: number, b: number, op: string): number => {
      switch (op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          if (b === 0) return NaN;
          return a / b;
        default:
          return b;
      }
    },
    []
  );

  const formatNumber = (num: number): string => {
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Error';
    const str = num.toString();
    if (str.length > 10) {
      const fixed = parseFloat(num.toPrecision(9)).toString();
      return fixed;
    }
    return str;
  };

  const handleNumber = useCallback(
    (value: string) => {
      if (justCalculated && value !== '.') {
        setDisplay(value);
        setExpression('');
        setJustCalculated(false);
        setWaitingForOperand(false);
        return;
      }

      if (waitingForOperand) {
        setDisplay(value);
        setWaitingForOperand(false);
      } else {
        if (value === '.' && display.includes('.')) return;
        if (display === '0' && value !== '.') {
          setDisplay(value);
        } else {
          if (display.length >= 10) return;
          setDisplay(display + value);
        }
      }
    },
    [display, waitingForOperand, justCalculated]
  );

  const handleOperator = useCallback(
    (value: string) => {
      setJustCalculated(false);
      const current = parseFloat(display);

      if (previousValue !== null && !waitingForOperand) {
        const result = calculate(parseFloat(previousValue), current, operator!);
        const formatted = formatNumber(result);
        setDisplay(formatted);
        setPreviousValue(formatted);
        const opSymbol =
          value === '/'
            ? '÷'
            : value === '*'
            ? '×'
            : value;
        setExpression(formatted + ' ' + opSymbol);
      } else {
        setPreviousValue(display);
        const opSymbol =
          value === '/'
            ? '÷'
            : value === '*'
            ? '×'
            : value;
        setExpression(display + ' ' + opSymbol);
      }

      setOperator(value);
      setWaitingForOperand(true);
    },
    [display, previousValue, operator, waitingForOperand, calculate]
  );

  const handleEquals = useCallback(() => {
    if (previousValue === null || operator === null) return;

    const current = parseFloat(display);
    const prev = parseFloat(previousValue);
    const result = calculate(prev, current, operator);
    const formatted = formatNumber(result);

    const opSymbol =
      operator === '/'
        ? '÷'
        : operator === '*'
        ? '×'
        : operator;
    setExpression(previousValue + ' ' + opSymbol + ' ' + display + ' =');
    setDisplay(formatted);
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustCalculated(true);
  }, [display, previousValue, operator, calculate]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression('');
    setJustCalculated(false);
  }, []);

  const handleSign = useCallback(() => {
    const value = parseFloat(display);
    if (value !== 0) {
      setDisplay(formatNumber(-value));
    }
  }, [display]);

  const handlePercent = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(formatNumber(value / 100));
  }, [display]);

  const handleButton = useCallback(
    (btn: CalcButton) => {
      switch (btn.type) {
        case 'number':
          handleNumber(btn.value);
          break;
        case 'operator':
          handleOperator(btn.value);
          break;
        case 'equals':
          handleEquals();
          break;
        case 'clear':
          handleClear();
          break;
        case 'special':
          if (btn.value === 'SIGN') handleSign();
          if (btn.value === '%') handlePercent();
          break;
      }
    },
    [handleNumber, handleOperator, handleEquals, handleClear, handleSign, handlePercent]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      else if (e.key === '.') handleNumber('.');
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('*');
      else if (e.key === '/') { e.preventDefault(); handleOperator('/'); }
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Escape') handleClear();
      else if (e.key === '%') handlePercent();
      else if (e.key === 'Backspace') {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1));
        } else {
          setDisplay('0');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleOperator, handleEquals, handleClear, handlePercent, display]);

  const getButtonStyle = (type: ButtonType): string => {
    const base =
      'flex items-center justify-center rounded-full text-xl font-medium cursor-pointer select-none transition-all duration-150 active:scale-95 shadow-md';
    switch (type) {
      case 'clear':
      case 'special':
        return `${base} bg-gray-400 hover:bg-gray-300 text-black`;
      case 'operator':
        return `${base} bg-orange-500 hover:bg-orange-400 text-white`;
      case 'equals':
        return `${base} bg-orange-500 hover:bg-orange-400 text-white`;
      case 'number':
      default:
        return `${base} bg-gray-700 hover:bg-gray-600 text-white`;
    }
  };

  const displayLength = display.length;
  const fontSize =
    displayLength > 9
      ? 'text-3xl'
      : displayLength > 6
      ? 'text-4xl'
      : 'text-5xl';

  return (
    <div
      className="w-80 rounded-3xl overflow-hidden shadow-2xl"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Display */}
      <div className="px-6 pt-8 pb-4 flex flex-col items-end">
        <div className="text-gray-400 text-sm h-5 mb-1 truncate w-full text-right">
          {expression || '\u00A0'}
        </div>
        <div
          className={`text-white font-light truncate w-full text-right ${fontSize}`}
          style={{ letterSpacing: '-0.5px' }}
        >
          {display}
        </div>
      </div>

      {/* Buttons */}
      <div className="px-4 pb-6 grid gap-3">
        {buttons.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 gap-3">
            {row.map((btn) => (
              <button
                key={btn.value}
                onClick={() => handleButton(btn)}
                className={`${
                  getButtonStyle(btn.type)
                } h-16 ${
                  btn.span === 2 ? 'col-span-2' : 'col-span-1'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
