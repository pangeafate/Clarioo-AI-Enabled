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
  return (
    <div className={className}>
      {text.split('\n').map((line, lineIdx) => (
        <React.Fragment key={lineIdx}>
          {lineIdx > 0 && <br />}
          {parseLine(line)}
        </React.Fragment>
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
        <React.Fragment key={`text-${partKey++}`}>
          {formatBullets(beforeText)}
        </React.Fragment>
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
      <React.Fragment key={`text-${partKey++}`}>
        {formatBullets(remainingText)}
      </React.Fragment>
    );
  }

  return parts.length > 0 ? parts : formatBullets(line);
}

/**
 * Format bullet points (•) with blue color
 */
function formatBullets(text: string): React.ReactNode {
  const bulletParts = text.split('•');

  if (bulletParts.length === 1) {
    // No bullets in this text
    return text;
  }

  return bulletParts.map((part, idx) => (
    <React.Fragment key={idx}>
      {idx > 0 && <span className="text-blue-600">•</span>}
      {part}
    </React.Fragment>
  ));
}
