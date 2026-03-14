import React from 'react';
import { useResilientImageLoader } from '../hooks/useResilientImageLoader';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    urls: string[];
    spinner?: React.ReactNode;
    retryDelays?: number[];
    className?: string;
}

export default function ResilientImage({
    urls,
    spinner,
    retryDelays,
    className = '',
    ...imgProps
}: ResilientImageProps) {
    const {
        src,
        loading,
        error,
        onLoad,
        onError,
        manualRetry,
    } = useResilientImageLoader({ urls, retryDelays });

    return (
        <div className={`relative w-full h-full ${className}`} style={{ minHeight: 40 }}>
            {loading && (
                <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={manualRetry}
                    title={error ? 'Retry loading image' : 'Loading...'}
                >
                    {spinner || (
                        <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                        </svg>
                    )}
                </div>
            )}
            <img
                {...imgProps}
                src={src}
                style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.2s' }}
                onLoad={onLoad}
                onError={onError}
                draggable={false}
                alt={imgProps.alt || 'NFT'}
                className={`w-full h-full object-cover ${className}`}
            />
        </div>
    );
}
