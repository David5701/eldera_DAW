import React from 'react';

/**
 * Reusable Button component
 * @param {string} variant - 'primary' | 'secondary' | 'outline' | 'ghost'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Disabled state
 * @param {ReactNode} children - Button content
 */
export default function Button({
    variant = 'primary',
    size = 'md',
    onClick,
    disabled = false,
    children,
    type = 'button',
    className = '',
    ...props
}) {
    const baseStyles = 'font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

    const variantStyles = {
        primary: 'bg-[#1E82E5] text-white hover:bg-[#1565C0] active:bg-[#0D47A1]',
        secondary: 'bg-[#00D4C4] text-white hover:bg-[#00B4A4] active:bg-[#009484]',
        outline: 'border-2 border-[#1E82E5] text-[#1E82E5] bg-white hover:bg-blue-50 active:bg-blue-100',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200'
    };

    const sizeStyles = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };

    return (
        <button
            type={type}
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}
