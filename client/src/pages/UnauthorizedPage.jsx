import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const UnauthorizedPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-surface/50 p-8 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                    <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <ShieldAlert className="h-12 w-12 text-danger" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-lg text-slate-400 mb-8">
                        You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
                    </p>
                    <div className="flex space-x-4 justify-center">
                        <Button onClick={() => navigate(-1)} variant="secondary" className="px-8">
                            Go Back
                        </Button>
                        <Link to="/dashboard">
                            <Button className="px-8 bg-indigo-600 hover:bg-indigo-500">
                                Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
