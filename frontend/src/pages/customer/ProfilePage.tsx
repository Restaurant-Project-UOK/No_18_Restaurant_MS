import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdArrowBack, MdEdit, MdSave, MdCancel, MdLogout, MdPerson, MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

export default function CustomerProfilePage() {
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
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      {/* MOBILE HEADER - Fixed */}
      <div className="bg-brand-darker border-b border-brand-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('/customer')}
          className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
          title="Back"
        >
          <MdArrowBack className="text-xl" />
        </button>
        <h1 className="text-lg font-bold text-white flex-1">My Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-brand-primary hover:bg-brand-primary/20 rounded-lg transition-colors"
            title="Edit"
          >
            <MdEdit className="text-xl" />
          </button>
        )}
      </div>

      {/* MAIN CONTENT - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pb-40">
        {/* Profile Header Card */}
        <div className="bg-brand-darker border border-brand-border rounded-lg p-6 mb-6 text-center">
          <div className="w-20 h-20 bg-brand-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <MdPerson className="text-4xl text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{formData.name}</h2>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Profile Information */}
        <div className="space-y-4">
          {/* Name Field */}
          <div className="bg-brand-darker border border-brand-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MdPerson className="text-brand-primary text-lg" />
              <label className="text-sm font-semibold text-gray-300">Full Name</label>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors text-sm"
                placeholder="Your name"
                disabled={loading}
              />
            ) : (
              <p className="text-white">{formData.name}</p>
            )}
          </div>

          {/* Email Field (Read-only) */}
          <div className="bg-brand-darker border border-brand-border rounded-lg p-4 opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <MdEmail className="text-brand-primary text-lg" />
              <label className="text-sm font-semibold text-gray-300">Email Address</label>
            </div>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
          </div>

          {/* Phone Field */}
          <div className="bg-brand-darker border border-brand-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MdPhone className="text-brand-primary text-lg" />
              <label className="text-sm font-semibold text-gray-300">Phone Number</label>
            </div>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors text-sm"
                placeholder="+1 (555) 000-0000"
                disabled={loading}
              />
            ) : (
              <p className="text-white">{formData.phone || 'Not provided'}</p>
            )}
          </div>

          {/* Address Field */}
          <div className="bg-brand-darker border border-brand-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MdLocationOn className="text-brand-primary text-lg" />
              <label className="text-sm font-semibold text-gray-300">Address</label>
            </div>
            {isEditing ? (
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors text-sm"
                placeholder="Your address (optional)"
                rows={3}
                disabled={loading}
              />
            ) : (
              <p className="text-white">{formData.address || 'Not provided'}</p>
            )}
          </div>
        </div>

        {/* Edit Mode Actions */}
        {isEditing && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-brand-darker hover:bg-black border border-brand-border text-gray-300 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MdCancel /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-brand-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <MdSave /> {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* LOGOUT BUTTON - Fixed at bottom */}
      <div className="bg-brand-darker border-t border-brand-border px-4 py-4 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-red-900/20 hover:bg-red-900/40 border border-red-700 text-red-300 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <MdLogout className="text-lg" /> Logout
        </button>
      </div>
    </div>
  );
}

