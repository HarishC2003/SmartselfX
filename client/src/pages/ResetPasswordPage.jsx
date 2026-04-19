import React, { useState } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const resetSchema = z.object({
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const ResetPasswordPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useRHForm({
        resolver: zodResolver(resetSchema)
    });

    const onSubmit = async (data) => {
        try {
            await authService.resetPassword(token, data.password);
            toast.success('Password reset successfully! Please log in.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password. The link might be expired.');
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-2xl border border-white/5">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Create new password</h1>
                    <p className="text-slate-400">
                        Your new password must be different from previous used passwords.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="relative">
                        <Input
                            label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            icon={Lock}
                            error={errors.password?.message}
                            {...register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-200 focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <Input
                        label="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        icon={Lock}
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />

                    <Button
                        type="submit"
                        className="w-full h-12 text-lg"
                        isLoading={isSubmitting}
                    >
                        Reset Password
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
