import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Edit2, Trash2, Power, ShieldAlert } from 'lucide-react';
import api from '../../services/authService';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const inviteSchema = z.object({
    email: z.string().email('Valid email required'),
    role: z.enum(['ADMIN', 'MANAGER', 'VENDOR']),
});

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('');

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { user: currentUser } = useAuth();

    const { register: registerInvite, handleSubmit: handleInviteSubmit, formState: { errors: inviteErrors, isSubmitting: isInviting }, reset: resetInvite } = useRHForm({
        resolver: zodResolver(inviteSchema),
        defaultValues: { role: 'MANAGER' }
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (roleFilter !== 'ALL') params.append('role', roleFilter);
            if (statusFilter) params.append('status', statusFilter);

            const { data } = await api.get(`/users?${params}`);
            setUsers(data.users || []);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, roleFilter, statusFilter]);

    const onInvite = async (data) => {
        try {
            await api.post('/users/invite', data);
            toast.success('Invitation sent successfully');
            setIsInviteOpen(false);
            resetInvite();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send invitation');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            toast.success('Role updated');
            fetchUsers();
            setIsEditOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    };

    const toggleStatus = async (userId, currentStatus) => {
        try {
            await api.put(`/users/${userId}/status`, { isActive: !currentStatus });
            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const deleteUser = async () => {
        try {
            await api.delete(`/users/${selectedUser._id}`);
            toast.success('User deleted completely');
            setIsDeleteOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage team members and their roles</p>
                </div>
                <Button onClick={() => setIsInviteOpen(true)}>
                    <Plus size={16} className="mr-2" /> Invite User
                </Button>
            </div>

            <Card className="min-h-[500px]">
                {/* Filters Top Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="w-full md:w-96 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            className="bg-background border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary outline-none"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="VENDOR">Vendor</option>
                        </select>
                        <select
                            className="bg-background border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Table Area */}
                {loading ? (
                    <Loader />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-slate-400 uppercase bg-surface/50 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 font-medium">User</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Last Login</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                            No users found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                                                    {getInitials(u.name)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{u.name}</p>
                                                    <p className="text-xs text-slate-400">{u.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={u.role}>{u.role}</Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={u.isActive ? 'success' : 'danger'}>
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedUser(u); setIsEditOpen(true); }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-indigo-400/10"
                                                        title="Edit Role"
                                                        disabled={u._id === currentUser?.id}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleStatus(u._id, u.isActive)}
                                                        className={`p-1.5 rounded-md hover:bg-white/10 ${u.isActive ? 'text-warning hover:text-warning' : 'text-success hover:text-success'}`}
                                                        title={u.isActive ? "Deactivate" : "Activate"}
                                                        disabled={u._id === currentUser?.id}
                                                    >
                                                        <Power size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedUser(u); setIsDeleteOpen(true); }}
                                                        className="p-1.5 text-slate-400 hover:text-danger rounded-md hover:bg-danger/10"
                                                        title="Delete User"
                                                        disabled={u._id === currentUser?.id}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Invite Modal */}
            <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Team Member">
                <form onSubmit={handleInviteSubmit(onInvite)} className="space-y-4">
                    <Input
                        label="Email Address"
                        placeholder="colleague@smartshelfx.com"
                        type="email"
                        error={inviteErrors.email?.message}
                        {...registerInvite('email')}
                    />
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Assign Role</label>
                        <select
                            className="w-full rounded-lg bg-background border border-slate-700 text-text p-2.5 focus:border-primary"
                            {...registerInvite('role')}
                        >
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Admin</option>
                            <option value="VENDOR">Vendor</option>
                        </select>
                    </div>
                    <div className="pt-4 flex gap-3 justify-end">
                        <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isInviting}>Send Invite</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Role Modal */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit User Role">
                {selectedUser && (
                    <div className="space-y-4">
                        <p className="text-slate-300 text-sm">Update role for <span className="font-semibold text-white">{selectedUser.email}</span></p>
                        <select
                            className="w-full rounded-lg bg-background border border-slate-700 text-text p-2.5 focus:border-primary outline-none"
                            defaultValue={selectedUser.role}
                            onChange={(e) => handleRoleChange(selectedUser._id, e.target.value)}
                        >
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="VENDOR">Vendor</option>
                        </select>
                        <div className="pt-4 flex gap-3 justify-end">
                            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete User">
                <div className="text-center">
                    <div className="w-16 h-16 bg-danger/10 rounded-full flex flex-col items-center justify-center mx-auto mb-4">
                        <ShieldAlert size={32} className="text-danger" />
                    </div>
                    <p className="text-slate-300">Are you sure you want to delete <span className="text-white font-semibold">{selectedUser?.email}</span>?</p>
                    <p className="text-sm text-slate-500 mt-2">This action cannot be undone. All their data will be permanently removed.</p>

                    <div className="mt-8 flex gap-3 justify-center">
                        <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={deleteUser}>Delete User</Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default UserManagementPage;
