import React, { useState } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const forgotSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

const ForgotPasswordPage = () => {
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useRHForm({
        resolver: zodResolver(forgotSchema)
    });

    const onSubmit = async (data) => {
        try {
            await authService.forgotPassword(data.email);
            setSubmittedEmail(data.email);
            setIsSuccess(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset email');
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-2xl border border-white/5 text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
                    <p className="text-slate-400 mb-8">
                        We've sent a password reset link to <br />
                        <span className="font-semibold text-white">{submittedEmail}</span>
                    </p>
                    <Link to="/login">
                        <Button className="w-full h-12" variant="secondary">Back to Login</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-2xl border border-white/5">
                <div className="mb-8">
                    <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to login
                    </Link>
                    <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                    <p className="text-slate-400">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="name@company.com"
                        icon={Mail}
                        error={errors.email?.message}
                        {...register('email')}
                    />
                    <Button
                        type="submit"
                        className="w-full h-12 text-lg"
                        isLoading={isSubmitting}
                    >
                        Send Reset Link
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
