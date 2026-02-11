import React from 'react';

interface IdleScreenProps {
    status: string;
}

export default function IdleScreen({ status }: IdleScreenProps) {
    return (
        <div className="flex flex-col items-center text-center space-y-6 py-4">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-blue-50 p-6 rounded-full border-4 border-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Waiting for Bus...</h2>
                <p className="text-gray-500 font-medium">Looking for nearest vehicle</p>
            </div>

            <div className="w-full bg-gray-100 rounded-xl p-3 text-sm text-gray-600">
                Status: <span className="font-semibold text-blue-600">{status}</span>
            </div>
            {/* Backend Connection Indicator */}
            <div className="text-xs text-gray-400 mt-2">
                Backend: {process.env.NEXT_PUBLIC_INSFORGE_API_KEY ? 'Connected' : 'Local Mode'}
            </div>
        </div>
    );
}
