import React from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, Package, Brain, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
    const [showPassword, setShowPassword] = React.useState(false);
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useRHForm({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data) => {
        try {
            const response = await login(data.email, data.password);
            toast.success('Logged in successfully');

            const role = response.user.role;
            if (role === 'VENDOR') {
                navigate('/vendor-portal');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex w-[60%] bg-gradient-to-br from-secondary to-surface p-12 flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-5xl font-bold text-primary mb-4 tracking-tight">SmartShelfX</h1>
                    <p className="text-xl text-slate-300">AI-Powered Inventory Intelligence</p>
                </div>

                <div className="space-y-6 relative z-10 mt-12">
                    <div className="flex items-center space-x-4 bg-surface/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm max-w-md">
                        <Package className="text-accent h-8 w-8" />
                        <span className="text-lg font-medium text-text">Real-time Stock Tracking</span>
                    </div>
                    <div className="flex items-center space-x-4 bg-surface/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm max-w-md translate-x-8">
                        <Brain className="text-primary h-8 w-8" />
                        <span className="text-lg font-medium text-text">AI Demand Forecasting</span>
                    </div>
                    <div className="flex items-center space-x-4 bg-surface/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm max-w-md translate-x-16">
                        <Bell className="text-warning h-8 w-8" />
                        <span className="text-lg font-medium text-text">Smart Alerts</span>
                    </div>
                </div>

                {/* Decorative background circle */}
                <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background to-transparent" />
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
                <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-2xl border border-white/5 relative z-10">

                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <h1 className="text-3xl font-bold text-primary">SmartShelfX</h1>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                        <p className="text-slate-400">Sign in to your SmartShelfX account</p>
                    </div>

                    {/* Role Badges for Demo */}
                    <div className="flex justify-center space-x-2 mb-8">
                        <Badge variant="ADMIN">Admin</Badge>
                        <Badge variant="MANAGER">Manager</Badge>
                        <Badge variant="VENDOR">Vendor</Badge>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="name@company.com"
                            icon={Mail}
                            error={errors.email?.message}
                            {...register('email')}
                        />

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

                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-indigo-400 transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-semibold mt-2"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-surface text-slate-400">or</span>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-slate-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-medium text-primary hover:text-indigo-400 transition-colors">
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
