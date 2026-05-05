import React from 'react';

/**
 * TabbedForm - Component to organize form fields into tabbed sections
 * Improved with better spacing and visual design
 */
export default function TabbedForm({ tabs, activeTab, onTabChange }) {
    const scrollContainerRef = React.useRef(null);
    const tabsRef = React.useRef([]);

    React.useEffect(() => {
        if (activeTab >= 0 && tabsRef.current[activeTab] && scrollContainerRef.current) {
            const tabElement = tabsRef.current[activeTab];
            const container = scrollContainerRef.current;

            // Calculate center position
            const scrollLeft = tabElement.offsetLeft - (container.offsetWidth / 2) + (tabElement.offsetWidth / 2);

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, [activeTab]);

    return (
        <div className="w-full">
            {/* Tab Headers - RESPONSIVE */}
            <div
                ref={scrollContainerRef}
                className="w-full max-w-full overflow-x-auto pb-4 mb-4 scrollbar-hide p-2"
            >
                <div className="flex flex-nowrap md:flex-wrap gap-3 min-w-min md:w-full">
                    {tabs.map((tab, index) => {
                        // Color palette synchronized with ResidentFormExtended.jsx section headers
                        const colors = [
                            'text-slate-600 bg-slate-100 border-slate-200',   // 0. Admin (Slate)
                            'text-blue-600 bg-blue-50 border-blue-200',       // 1. Health (Blue)
                            'text-green-600 bg-green-50 border-green-200',    // 2. Nutrition (Green)
                            'text-yellow-700 bg-yellow-50 border-yellow-200', // 3. Elimination (Yellow)
                            'text-red-600 bg-red-50 border-red-200',          // 4. Activity (Red)
                            'text-indigo-600 bg-indigo-50 border-indigo-200', // 5. Sleep (Indigo)
                            'text-purple-600 bg-purple-50 border-purple-200', // 6. Cognitive (Purple)
                            'text-pink-600 bg-pink-50 border-pink-200',       // 7. Self (Pink)
                            'text-cyan-600 bg-cyan-50 border-cyan-200',       // 8. Relations (Cyan)
                            'text-rose-600 bg-rose-50 border-rose-200',       // 9. Sexuality (Rose)
                            'text-orange-600 bg-orange-50 border-orange-200', // 10. Coping (Orange)
                            'text-teal-600 bg-teal-50 border-teal-200',       // 11. Values (Teal)
                        ];
                        const activeColors = [
                            'bg-slate-600 border-slate-600',
                            'bg-blue-600 border-blue-600',
                            'bg-green-600 border-green-600',
                            'bg-yellow-500 border-yellow-500', // Darker yellow for text
                            'bg-red-600 border-red-600',
                            'bg-indigo-600 border-indigo-600',
                            'bg-purple-600 border-purple-600',
                            'bg-pink-600 border-pink-600',
                            'bg-cyan-600 border-cyan-600',
                            'bg-rose-600 border-rose-600',
                            'bg-orange-600 border-orange-600',
                            'bg-teal-600 border-teal-600',
                        ];


                        const colorClass = colors[index % colors.length];
                        const activeClass = activeColors[index % activeColors.length];

                        return (
                            <button
                                key={index}
                                ref={el => tabsRef.current[index] = el}
                                type="button"
                                onClick={() => onTabChange(index)}
                                className={`
                                    shrink-0 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-all rounded-xl border flex items-center gap-2
                                    ${activeTab === index
                                        ? `${activeClass} text-white shadow-lg scale-105 ring-2 ring-offset-2 ring-transparent`
                                        : `${colorClass} hover:brightness-95 opacity-90 hover:opacity-100 hover:scale-105`
                                    }
                                `}
                            >
                                {tab.label}
                                {tab.badge && (
                                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black uppercase bg-white/20 text-white`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
