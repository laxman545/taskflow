import React, { useState, useEffect } from 'react';
import { StaffMember, Shop, StaffRole, Language } from '../../types';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  UserCheck,
  UserCog,
  RefreshCw,
} from 'lucide-react';

export interface StaffManagementProps {
  shop: Shop;
  currentUser?: StaffMember | null;
  lang?: Language;
  onShopUpdated?: (updated: Shop) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  shop,
  currentUser = null,
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('print123');
  const [newRole, setNewRole] = useState<StaffRole>('staff');
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStaffList(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: newName, email: newEmail, username: newUsername, password: newPassword, role: newRole
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert('Error creating user');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ active: currentStatus === 1 ? false : true })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-fade-in">
      <div className="p-6 md:p-8 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Staff Management
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              Manage accounts, roles, and access for {shop.shop_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchUsers} className="p-2 border rounded-xl hover:bg-slate-50">
              <RefreshCw className="w-5 h-5 text-slate-500" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff Member
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="space-y-4">
            {staffList.map((staff) => (
              <div key={staff.id} className="p-4 border rounded-2xl flex items-center justify-between hover:border-blue-300">
                <div>
                  <h3 className="font-bold text-slate-900">{staff.name} <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-500">{staff.role}</span></h3>
                  <p className="text-sm text-slate-500">@{staff.username} • {staff.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleStatus(staff.id, staff.active ?? 1)} className="p-2 hover:bg-slate-100 rounded-lg" title="Toggle Status">
                    {staff.active === 1 ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                  {currentUser?.id !== staff.id && (
                    <button onClick={() => handleDelete(staff.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Staff</h3>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div><label className="text-sm font-bold">Name</label><input required className="w-full p-2 border rounded-xl" value={newName} onChange={e => setNewName(e.target.value)} /></div>
              <div><label className="text-sm font-bold">Username</label><input required className="w-full p-2 border rounded-xl" value={newUsername} onChange={e => setNewUsername(e.target.value)} /></div>
              <div><label className="text-sm font-bold">Email</label><input required type="email" className="w-full p-2 border rounded-xl" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
              <div><label className="text-sm font-bold">Password</label><input required className="w-full p-2 border rounded-xl" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
              <div>
                <label className="text-sm font-bold">Role</label>
                <select className="w-full p-2 border rounded-xl" value={newRole} onChange={e => setNewRole(e.target.value as StaffRole)}>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
