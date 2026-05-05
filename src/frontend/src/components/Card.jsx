import React from 'react';

/**
 * Reusable Card component using Tailwind CSS utilities.
 * @param {ReactNode} children - Card content
 * @param {string} className - Additional Tailwind classes
 */
export default function Card({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-xl p-10 shadow-xl border border-blue-200 hover:shadow-xl transition-all duration-200 ${className}`}>
            {children}
        </div>
    );
}
