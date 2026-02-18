import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdArrowBack, MdEdit, MdSave, MdCancel, MdLogout, MdPerson, MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

export default function StaffProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  // Determine dashboard path based on role
  const getDashboardPath = () => {
    switch (user?.role) {
      case 2:
        return '/admin';
      case 3:
        return '/kitchen';
      case 4:
        return '/waiter';
      default:
        return '/login';
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 2:
        return 'Administrator';
      case 3:
        return 'Kitchen Staff';
      case 4:
        return 'Waiter';
      default:
        return 'Staff';
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await updateProfile(formData.name, formData.phone, formData.address);
      setIsEditing(false);
    } catch {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setError('');
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login?staff=true');
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* HEADER */}
      <div className="bg-brand-darker border-b border-brand-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(getDashboardPath())}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <MdArrowBack className="text-xl" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
              <p className="text-sm text-gray-400">{getRoleLabel()}</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-brand-primary hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <MdEdit /> Edit
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-brand-darker border border-brand-border rounded-lg p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center flex-shrink-0">
              <MdPerson className="text-5xl text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">{formData.name}</h2>
              <p className="text-gray-400 mb-1">{user?.email}</p>
              <p className="text-sm text-brand-primary font-semibold">{getRoleLabel()}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Name Field */}
          <div className="bg-brand-darker border border-brand-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <MdPerson className="text-brand-primary text-xl" />
              <label className="text-sm font-semibold text-gray-300">Full Name</label>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors"
                placeholder="Your name"
                disabled={loading}
              />
            ) : (
              <p className="text-white text-lg">{formData.name}</p>
            )}
          </div>

          {/* Email Field (Read-only) */}
          <div className="bg-brand-darker border border-brand-border rounded-lg p-5 opacity-60">
            <div className="flex items-center gap-2 mb-3">
              <MdEmail className="text-brand-primary text-xl" />
              <label className="text-sm font-semibold text-gray-300">Email Address</label>
            </div>
            <p className="text-gray-400 text-lg mb-1">{user?.email}</p>
            <p className="text-xs text-gray-500">Cannot be changed</p>
          </div>

          {/* Phone Field */}
          <div className="bg-brand-darker border border-brand-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <MdPhone className="text-brand-primary text-xl" />
              <label className="text-sm font-semibold text-gray-300">Phone Number</label>
            </div>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors"
                placeholder="+1 (555) 000-0000"
                disabled={loading}
              />
            ) : (
              <p className="text-white text-lg">{formData.phone || 'Not provided'}</p>
            )}
          </div>

          {/* Address Field (Full Width) */}
          <div className="bg-brand-darker border border-brand-border rounded-lg p-5 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <MdLocationOn className="text-brand-primary text-xl" />
              <label className="text-sm font-semibold text-gray-300">Address</label>
            </div>
            {isEditing ? (
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors"
                placeholder="Your address (optional)"
                rows={3}
                disabled={loading}
              />
            ) : (
              <p className="text-white text-lg">{formData.address || 'Not provided'}</p>
            )}
          </div>
        </div>

        {/* Edit Mode Actions */}
        {isEditing && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 py-3 px-6 bg-brand-darker hover:bg-black border border-brand-border text-gray-300 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MdCancel /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3 px-6 bg-brand-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <MdSave /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* LOGOUT BUTTON */}
        <div className="bg-brand-darker border border-brand-border rounded-lg p-6">
          <button
            onClick={handleLogout}
            className="w-full py-3 px-6 bg-red-900/20 hover:bg-red-900/40 border border-red-700 text-red-300 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <MdLogout className="text-lg" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

