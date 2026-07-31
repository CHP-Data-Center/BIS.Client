// src/components/common/SanitizedHTML.jsx
import React from 'react';
import { sanitizeHtml } from '../../utils/sanitize';

/**
 * Component render HTML an toàn chống XSS với DOMPurify.
 */
export default function SanitizedHTML({ html, className = '', style = {} }) {
  const cleanHtml = sanitizeHtml(html);
  return (
    <div
      className={`sanitized-content ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
