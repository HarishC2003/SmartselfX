import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import { Loader } from '../components/ui/Loader';
import { Button } from '../components/ui/Button';

const EmailVerificationPage = () => {
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        let timeout;
        const verifyEmail = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(data.message);

                timeout = setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. Link may be empty or expired.');
            }
        };

        if (token) {
            verifyEmail();
        } else {
            setStatus('error');
            setMessage('No token provided');
        }

        return () => clearTimeout(timeout);
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface p-10 rounded-2xl shadow-2xl border border-white/5 text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader size={64} className="mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Verifying Email...</h2>
                        <p className="text-slate-400">Please wait while we verify your account.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="text-success h-20 w-20 mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Verified!</h2>
                        <p className="text-slate-400 mb-8">{message}</p>
                        <p className="text-sm text-slate-500">Redirecting to login...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <XCircle className="text-danger h-20 w-20 mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                        <p className="text-slate-400 mb-8">{message}</p>
                        <Button onClick={() => navigate('/login')} className="w-full">
                            Go to Login
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailVerificationPage;
