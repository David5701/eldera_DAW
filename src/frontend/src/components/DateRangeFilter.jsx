import { RotateCcw, X } from 'lucide-react';

const DateRangeFilter = ({ startDate, endDate, onStartChange, onEndChange, className = "h-12" }) => {
    const hasValues = startDate || endDate;

    const isFluid = className.includes('w-full');

    return (
        <div className={`border-2 border-slate-300 bg-white rounded-xl flex items-center shadow-md hover:border-indigo-400 transition-all ${isFluid ? '' : 'w-fit mx-auto'} ${className}`}>
            {/* Left Spacer: Fixed width to balance the right button (32px) */}
            <div className={`flex-none w-8 flex items-center justify-center transition-all ${hasValues ? 'opacity-100' : 'opacity-0'}`}>
                {/* Invisible spacer */}
            </div>

            {/* Center Content: Flex-grow to fill space */}
            <div className="flex-1 flex items-center justify-center px-2">
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5 text-center sm:text-left">Desde</span>
                    <input
                        type="date"
                        value={startDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => onStartChange(e.target.value)}
                        className="bg-transparent border-none p-0 text-[11px] font-black text-slate-700 focus:ring-0 w-[85px] text-center sm:text-left"
                    />
                </div>
                <div className="w-px h-6 bg-slate-100 mx-2"></div>
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5 text-center sm:text-left">Hasta</span>
                    <input
                        type="date"
                        value={endDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => onEndChange(e.target.value)}
                        className="bg-transparent border-none p-0 text-[11px] font-black text-slate-700 focus:ring-0 w-[85px] text-center sm:text-left"
                    />
                </div>
            </div>

            {/* Right Button: Fixed width (32px) */}
            <div className={`flex-none w-8 flex items-center justify-center border-l border-slate-100 h-6 my-auto transition-opacity ${hasValues ? 'opacity-100' : 'opacity-0'}`}>
                {hasValues && (
                    <button
                        onClick={() => { onStartChange(''); onEndChange(''); }}
                        className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-all active:scale-90"
                        title="Limpiar fechas"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default DateRangeFilter;
