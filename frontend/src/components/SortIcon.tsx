import React from 'react';
import { SortDirection } from '../hooks/useSort';

interface SortIconProps {
  direction: SortDirection;
  className?: string;
}

const SortIcon: React.FC<SortIconProps> = ({ direction, className = "w-4 h-4" }) => {
  if (direction === 'asc') {
    return (
      <svg className={`${className} text-indigo-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  }

  if (direction === 'desc') {
    return (
      <svg className={`${className} text-indigo-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  }

  // No sort / default state
  return (
    <svg className={`${className} text-slate-400 group-hover:text-slate-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
    </svg>
  );
};

export default SortIcon;