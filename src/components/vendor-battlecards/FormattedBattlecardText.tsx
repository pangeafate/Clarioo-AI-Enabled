/**
 * FormattedBattlecardText Component
 *
 * Safely renders battlecard cell text with:
 * - **bold** syntax (renders as <strong>)
 * - Newlines preserved
 * - Blue bullet points (•)
 *
 * No external dependencies, no dangerouslySetInnerHTML
 */

import React from 'react';

interface FormattedBattlecardTextProps {
  text: string;
  className?: string;
}

export const FormattedBattlecardText: React.FC<FormattedBattlecardTextProps> = ({
  text,
  className = '',
}) => {
  // Handle undefined/null text
  if (!text) {
    return <div className={className}></div>;
  }

  return (
    <div className={className}>
      {text.split('\n').map((line, lineIdx) => (
        <span key={lineIdx}>
          {lineIdx > 0 && <br />}
          {parseLine(line)}
        </span>
      ))}
    </div>
  );
};

/**
 * Parse a single line to handle:
 * - **bold** text
 * - Blue bullets (•)
 */
function parseLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  let partKey = 0;

  while ((match = boldRegex.exec(line)) !== null) {
    // Add text before the bold match
    if (match.index > lastIndex) {
      const beforeText = line.substring(lastIndex, match.index);
      parts.push(
        <span key={`text-${partKey++}`}>
          {formatBullets(beforeText)}
        </span>
      );
    }

    // Add bold text
    parts.push(
      <strong key={`bold-${partKey++}`} className="font-semibold">
        {match[1]}
      </strong>
    );

    lastIndex = boldRegex.lastIndex;
  }

  // Add remaining text after last bold match
  if (lastIndex < line.length) {
    const remainingText = line.substring(lastIndex);
    parts.push(
      <span key={`text-${partKey++}`}>
        {formatBullets(remainingText)}
      </span>
    );
  }

  return parts.length > 0 ? parts : formatBullets(line);
}

/**
 * Format bullet points (•) with blue color
 * FIXED: Use span wrapper instead of React.Fragment to avoid prop warnings
 */
function formatBullets(text: string): React.ReactNode {
  const bulletParts = text.split('•');

  if (bulletParts.length === 1) {
    // No bullets in this text
    return text;
  }

  return bulletParts.map((part, idx) => (
    <span key={idx}>
      {idx > 0 && <span className="text-blue-600">•</span>}
      {part}
    </span>
  ));
}
