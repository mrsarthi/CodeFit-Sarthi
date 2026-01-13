'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');
    const hasVerified = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        if (hasVerified.current) return;
        hasVerified.current = true;

        const verifyToken = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage('Email verified successfully!');
                    // Optional: redirect after a few seconds
                    // setTimeout(() => router.push('/login'), 3000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed. Token may be invalid or expired.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('An error occurred. Please try again later.');
            }
        };

        verifyToken();
    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
            <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                <h1 className="text-2xl font-bold mb-6">Email Verification</h1>

                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-300">Verifying your email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div>
                        <div className="text-green-500 text-5xl mb-4">✓</div>
                        <p className="text-lg text-gray-200 mb-6">{message}</p>
                        <Link
                            href="/login"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition duration-200"
                        >
                            Go to Login
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <div className="text-red-500 text-5xl mb-4">✕</div>
                        <p className="text-lg text-gray-200 mb-6">{message}</p>
                        <Link
                            href="/login"
                            className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded transition duration-200"
                        >
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
