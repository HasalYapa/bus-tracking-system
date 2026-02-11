import React from 'react';

interface ActiveScreenProps {
    speed: number;
    nextHalt: string;
}

export default function ActiveScreen({ speed, nextHalt }: ActiveScreenProps) {
    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 leading-tight">Bus 138</h2>
                    <p className="text-gray-500 font-medium">Fort - Homagama Route</p>
                </div>
                <div className="bg-green-100 p-3 rounded-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M21 12H3V7a1 1 0 011-1h16a1 1 0 011 1v5z" />
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Speed</p>
                    <p className="text-2xl font-bold text-gray-800">
                        {speed > 0 ? `${speed}` : 'Stopped'} <span className="text-sm text-gray-400 font-normal">{speed > 0 ? 'km/h' : ''}</span>
                    </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Next Halt</p>
                    <p className="text-lg font-bold text-gray-800 truncate">
                        {nextHalt}
                    </p>
                </div>
            </div>

            <div className="w-full bg-green-50 rounded-xl p-3 text-sm text-center text-green-700 font-medium">
                You are in a verified bus.
            </div>
        </div>
    );
}
