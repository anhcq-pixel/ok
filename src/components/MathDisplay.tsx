import React, { useMemo } from 'react';
import katex from 'katex';

interface MathDisplayProps {
  text: string;
  className?: string;
  inline?: boolean;
}

// Convert common plain text math into clean LaTeX markup for Vietnamese textbook notation
function textToLatex(input: string): string {
  let s = input;

  // Replace degree symbols
  s = s.replace(/°/g, '^\\circ');
  s = s.replace(/(\w+)\^\\circ/g, '{$1}^\\circ');

  // Replace exponents
  s = s.replace(/²/g, '^2');
  s = s.replace(/³/g, '^3');

  // Replace pi
  s = s.replace(/π/g, '\\pi ');

  // Replace square roots like 3√10 -> 3\sqrt{10}, √7 -> \sqrt{7}
  s = s.replace(/(\d*)√(\d+)/g, (_match, prefix, num) => {
    return `${prefix ? prefix + ' ' : ''}\\sqrt{${num}}`;
  });

  // Replace subscripts: r1 -> r_1, r2 -> r_2, r₁ -> r_1, r₂ -> r_2
  s = s.replace(/r[1₁]/g, 'r_1');
  s = s.replace(/r[2₂]/g, 'r_2');

  // Replace units: cm² -> \text{ cm}^2, cm -> \text{ cm}
  s = s.replace(/cm\^2/g, '\\text{ cm}^2');
  s = s.replace(/cm²/g, '\\text{ cm}^2');
  s = s.replace(/\bcm\b/g, '\\text{ cm}');

  // Replace fraction expressions like (πRn) / 180 or πRn / 180 or 10π / 3 or πa²x / 360
  // e.g. "l = πRn / 180" -> "l = \frac{\pi R n}{180}"
  // e.g. "10π / 3" -> "\frac{10\pi}{3}"
  // e.g. "S = πR²n / 360" -> "S = \frac{\pi R^2 n}{360}"
  s = s.replace(/([A-Za-z]\s*=\s*)?\(?([0-9a-zA-Z\s\\pi\^\{\}]+?)\)?\s*\/\s*(\d+)/g, (_m, eq, num, den) => {
    const eqPrefix = eq ? eq : '';
    return `${eqPrefix}\\frac{${num.trim()}}{${den.trim()}}`;
  });

  return s;
}

export const MathDisplay: React.FC<MathDisplayProps> = ({
  text,
  className = '',
  inline = true,
}) => {
  const html = useMemo(() => {
    if (!text) return '';

    // Check if the whole string is a math formula or choice
    // e.g., "A. C = 2πr", "10π / 3", "S = πr²"
    // We parse sentences with mixed text and math formulas:
    // e.g.: "Công thức tính chu vi đường tròn bán kính r (hoặc đường kính d) là:"
    const mathFormulaRegex = /(C\s*=\s*[^,;]+|S\s*=\s*[^,;]+|l\s*=\s*[^,;]+|[Rrabkxy]\s*=\s*[^,;]+|\d+\\?pi\s*\/\s*\d+|\d+\s*cm|\d+\\?pi\s*cm\^?2?|[0-9]+[a-z]?\^\\circ|\b[rdaxky]\b|\\pi|\\frac\{.+?\}\{.+?\}|\d+\\sqrt\{\d+\}|\\sqrt\{\d+\})/g;

    try {
      // If the string is purely a choice like "C = 2πr" or "10π / 3" or "R = 5 cm"
      const isChoiceOrFormula = /^([A-D]\.\s*)?([A-Za-z]\s*=\s*.+|[0-9].+|\(?[0-9a-zA-Z\s\\pi\^]+\/?\d*.*)$/.test(text.trim());
      
      // If text doesn't contain Vietnamese prose, render the whole thing as LaTeX formula
      const hasVietnameseLetters = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(text);

      if (!hasVietnameseLetters) {
        const latex = textToLatex(text);
        return katex.renderToString(latex, {
          displayMode: !inline,
          throwOnError: false,
        });
      }

      // If text contains Vietnamese prose (question statement), render prose with embedded KaTeX formulas
      // Tokenize by math terms like "r", "d", "n° = 60°", "R = 10", etc.
      const transformedText = text
        .replace(/\b([radkxy])\b/g, '$1') // variables
        .replace(/([radkxy])\s*=\s*(\d+)/g, '$$$1 = $2$$')
        .replace(/([nmxaα])°\s*=\s*(\d+)°/g, '$$$1^\\circ = $2^\\circ$$')
        .replace(/([nmxaα])°/g, '$$$1^\\circ$$')
        .replace(/(\d+)°/g, '$$$1^\\circ$$')
        .replace(/(\d+π\s*cm²)/g, '$$$1$$');

      // Replace $...$ segments with KaTeX
      return transformedText.replace(/\$(.+?)\$/g, (_m, formula) => {
        const latex = textToLatex(formula);
        return katex.renderToString(latex, {
          displayMode: false,
          throwOnError: false,
        });
      });
    } catch {
      return text;
    }
  }, [text, inline]);

  return (
    <span
      className={`inline-math-container font-sans ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
