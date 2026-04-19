import React, { useState } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User as UserIcon, Mail, Phone, Lock, Eye, EyeOff, MailCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    role: z.enum(['ADMIN', 'MANAGER', 'VENDOR']),
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

const calculateStrength = (pwd) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length > 8) score += 25;
    if (pwd.match(/[A-Z]/)) score += 25;
    if (pwd.match(/[0-9]/)) score += 25;
    if (pwd.match(/[^A-Za-z0-9]/)) score += 25;
    return score;
};

const RegisterPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useRHForm({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: 'MANAGER' }
    });

    const passwordValue = watch('password');

    React.useEffect(() => {
        setPasswordStrength(calculateStrength(passwordValue));
    }, [passwordValue]);

    const getStrengthColor = () => {
        if (passwordStrength < 50) return 'bg-danger';
        if (passwordStrength < 75) return 'bg-warning';
        if (passwordStrength < 100) return 'bg-primary';
        return 'bg-success';
    };

    const getStrengthLabel = () => {
        if (passwordStrength === 0) return '';
        if (passwordStrength < 50) return 'Weak';
        if (passwordStrength < 75) return 'Fair';
        if (passwordStrength < 100) return 'Strong';
        return 'Very Strong';
    };

    const onSubmit = async (data) => {
        try {
            await authService.register({
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
                phone: data.phone || undefined
            });
            setIsSuccess(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-2xl border border-white/5 text-center">
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MailCheck className="h-8 w-8 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
                    <p className="text-slate-400 mb-8">
                        Please check your email inbox to verify your account before logging in.
                    </p>
                    <Link to="/login">
                        <Button className="w-full h-12">Back to Login</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
            <div className="w-full max-w-lg bg-surface p-8 sm:p-10 rounded-2xl shadow-2xl border border-white/5">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">SmartShelfX</h1>
                    <h2 className="text-xl font-semibold text-white">Create your account</h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <Input
                        label="Full Name"
                        placeholder="John Doe"
                        icon={UserIcon}
                        error={errors.name?.message}
                        {...register('name')}
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="john@example.com"
                        icon={Mail}
                        error={errors.email?.message}
                        {...register('email')}
                    />

                    <Input
                        label="Phone Number (Optional)"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        icon={Phone}
                        error={errors.phone?.message}
                        {...register('phone')}
                    />

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Role</label>
                        <select
                            className="w-full rounded-lg bg-background border border-slate-700 text-text p-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                            {...register('role')}
                        >
                            <option value="ADMIN">🛡️ Admin — Full system access</option>
                            <option value="MANAGER">🏭 Warehouse Manager — Inventory control</option>
                            <option value="VENDOR">🚚 Vendor — Order management</option>
                        </select>
                        {errors.role && <p className="text-sm text-danger">{errors.role.message}</p>}
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <Input
                                label="Password"
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

                        {passwordValue && (
                            <div className="space-y-1">
                                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                                        style={{ width: `${passwordStrength}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-slate-400">
                                    <span>8+ chars, 1 uppercase, 1 number, 1 special</span>
                                    <span className={getStrengthColor().replace('bg-', 'text-')}>{getStrengthLabel()}</span>
                                </div>
                            </div>
                        )}
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
                        className="w-full h-12 text-lg font-semibold mt-4"
                        isLoading={isSubmitting}
                    >
                        Create Account
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary hover:text-indigo-400 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
