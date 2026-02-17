import React, { useMemo } from 'react';
import stageportCrestSvg from '../assets/crestSvg.js';

const VALID_STATES = ['inactive', 'active', 'notarized'];

export default function StageCrest({
  state = 'inactive',
  size = 140,
  className = '',
  ariaLabel = 'StagePort Crest',
}) {
  const normalizedState = VALID_STATES.includes(state) ? state : 'inactive';
  const svgMarkup = useMemo(
    () =>
      stageportCrestSvg.replace('state--inactive', `state--${normalizedState}`),
    [normalizedState],
  );

  return (
    <div
      className={`stagecrest-wrapper ${className}`.trim()}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        lineHeight: 0,
      }}
      role="img"
      aria-label={`${ariaLabel} — ${normalizedState}`}
      aria-pressed={
        normalizedState === 'active' || normalizedState === 'notarized'
      }
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
