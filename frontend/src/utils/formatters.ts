const SUPERSCRIPTS: Record<string, string> = {
  '-': '⁻',
  '+': '',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

/**
 * Formats numbers for tactile calculator display:
 * - Separates thousands using locale commas (e.g. 7284123 -> 7,284,123)
 * - Preserves trailing active decimal states (e.g. 12.00 -> 12.00, 12. -> 12.)
 * - Formats scientific notation with clean KaTeX-style superscripts (e.g. 1.4134e+73 -> 1.4134 × 10⁷³)
 */
export function formatDisplayNumber(val: string): string {
  if (!val) return '0';

  // Scientific notation handling
  if (val.toLowerCase().includes('e')) {
    const [base, exp] = val.toLowerCase().split('e');
    const expClean = exp ? exp.replace(/^\+/, '') : '';
    const supExp = expClean
      .split('')
      .map((c) => SUPERSCRIPTS[c] ?? c)
      .join('');

    const [baseInt, baseDec] = (base ?? '').split('.');
    const formattedBaseInt = (baseInt ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formattedBase = baseDec !== undefined ? `${formattedBaseInt}.${baseDec}` : formattedBaseInt;
    return `${formattedBase} × 10${supExp}`;
  }

  // Handle standard decimal & integer formatting preserving active typing state
  const [intPart, decPart] = val.split('.');
  const formattedInt = (intPart ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}
