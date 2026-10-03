"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import {
  CogIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  KeyIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface UserOptions {
  cache: boolean;
}

interface ProfileData {
  username: string;
  profile_picture: string | null;
}

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="liquid-glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold liquid-glass-text">{title}</h3>
            <button
              onClick={onClose}
              className="liquid-glass-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 liquid-glass-text" />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default function SettingsPage() {
  const { currentUser, getUserInfo } = useAuth();
  const [userOptions, setUserOptions] = useState<UserOptions>({ cache: true });
  const [profileData, setProfileData] = useState<ProfileData>({ username: '', profile_picture: null });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Loading and message states
  const [saving, setSaving] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPicture, setSavingPicture] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/settings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUserOptions(data.user_options);
          setProfileData({
            username: data.username || '',
            profile_picture: data.profile_picture || null
          });
          setNewUsername(data.username || '');
        } else {
          setError('Failed to load settings');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchSettings();
    }
  }, [currentUser]);

  const handleToggleCache = async () => {
    const newOptions = { ...userOptions, cache: !userOptions.cache };
    setUserOptions(newOptions);
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_options: newOptions }),
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('Saved!');
        setTimeout(() => setSuccess(''), 1500);
      } else {
        setError('Failed to save');
        setUserOptions(userOptions);
      }
    } catch (error) {
      setError('Failed to save');
      setUserOptions(userOptions);
    } finally {
      setSaving(false);
    }
  };

  const handleUsernameUpdate = async () => {
    try {
      setSavingUsername(true);
      setModalError('');
      setModalSuccess('');

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newUsername }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setProfileData({ ...profileData, username: newUsername });
        setModalSuccess('Username updated successfully!');
        await getUserInfo(); // Refresh user context to update sidebar
        setTimeout(() => {
          setShowUsernameModal(false);
          setModalSuccess('');
        }, 1500);
      } else {
        setModalError(data.message || 'Failed to update username');
      }
    } catch (error) {
      setModalError('Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      setSavingPassword(true);
      setModalError('');
      setModalSuccess('');

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setModalError('Passwords do not match');
        setSavingPassword(false);
        return;
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: passwordData.newPassword,
          old_password: passwordData.oldPassword
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setModalSuccess('Password updated successfully!');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setModalSuccess('');
        }, 1500);
      } else {
        setModalError(data.message || 'Failed to update password');
      }
    } catch (error) {
      setModalError('Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!uploadedFile) return;

    try {
      setSavingPicture(true);
      setModalError('');
      setModalSuccess('');

      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setModalSuccess('Profile picture updated!');
        // Wait a bit before refreshing to ensure R2 upload is complete
        await new Promise(resolve => setTimeout(resolve, 500));
        await getUserInfo(); // Refresh user context to update sidebar
        
        // Reset modal state
        setTimeout(() => {
          setShowProfilePictureModal(false);
          setModalSuccess('');
          setModalError('');
          setUploadedFile(null);
          setPreviewUrl(null);
        }, 1000);
      } else {
        setModalError(data.message || 'Failed to upload picture');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setModalError('Failed to upload picture');
    } finally {
      setSavingPicture(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setSavingPicture(true);
      setModalError('');
      setModalSuccess('');

      const response = await fetch('/api/upload/profile-picture', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setModalSuccess('Profile picture removed!');
        await getUserInfo(); // Refresh user context to update sidebar
        
        // Reset modal state
        setTimeout(() => {
          setShowProfilePictureModal(false);
          setModalSuccess('');
          setModalError('');
        }, 1000);
      } else {
        const data = await response.json();
        setModalError(data.message || 'Failed to remove picture');
      }
    } catch (error) {
      console.error('Remove error:', error);
      setModalError('Failed to remove picture');
    } finally {
      setSavingPicture(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '', color: '' };
    let errors = 0;
    if (password.length < 8) errors++;
    if (!/[A-Z]/.test(password)) errors++;
    if (!/[a-z]/.test(password)) errors++;
    if (!/[0-9]/.test(password)) errors++;
    
    if (errors === 0) return { strength: 100, text: 'Strong', color: 'text-green-400' };
    if (errors <= 2) return { strength: 60, text: 'Medium', color: 'text-yellow-400' };
    return { strength: 30, text: 'Weak', color: 'text-red-400' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="liquid-glass-card p-6">
            <div className="animate-pulse space-y-3">
              <div className="liquid-glass-1 h-6 rounded w-1/4"></div>
              <div className="liquid-glass-1 h-4 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass-card p-6"
        >
          <div className="flex items-center gap-3">
            <div className="liquid-glass-2 p-2 rounded-lg">
              <CogIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold liquid-glass-text">Settings</h1>
              <p className="liquid-glass-text-subtle text-sm">Manage your account preferences</p>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="liquid-glass-card p-4 border-red-500/30 bg-red-500/5 flex items-center gap-3"
          >
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="liquid-glass-card p-4 border-green-500/30 bg-green-500/5 flex items-center gap-3"
          >
            <div className="h-5 w-5 rounded-full bg-green-400 flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full"></div>
            </div>
            <span className="text-green-400 text-sm">{success}</span>
          </motion.div>
        )}

        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="liquid-glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="liquid-glass-2 p-2 rounded-lg">
              <UserCircleIcon className="h-6 w-6 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold liquid-glass-text">Profile</h2>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowUsernameModal(true)}
              className="w-full flex items-center justify-between p-4 liquid-glass-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <UserCircleIcon className="h-5 w-5 text-purple-400 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium liquid-glass-text">Username</div>
                  <div className="text-sm liquid-glass-text-subtle truncate">{profileData.username || 'Not set'}</div>
                </div>
              </div>
              <div className="text-sm text-blue-400 flex-shrink-0 ml-2">Edit</div>
            </button>

            <button
              onClick={() => setShowProfilePictureModal(true)}
              className="w-full flex items-center justify-between p-4 liquid-glass-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {profileData.profile_picture ? (
                  <img src={profileData.profile_picture} alt="Profile" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <PhotoIcon className="h-5 w-5 text-purple-400 flex-shrink-0" />
                )}
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium liquid-glass-text">Profile Picture</div>
                  <div className="text-sm liquid-glass-text-subtle truncate">
                    {profileData.profile_picture ? 'Change picture' : 'No picture set'}
                  </div>
                </div>
              </div>
              <div className="text-sm text-blue-400 flex-shrink-0 ml-2">Edit</div>
            </button>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="liquid-glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="liquid-glass-2 p-2 rounded-lg">
              <KeyIcon className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold liquid-glass-text">Security</h2>
          </div>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-4 liquid-glass-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <KeyIcon className="h-5 w-5 text-blue-400" />
              <div className="text-left">
                <div className="font-medium liquid-glass-text">Password</div>
                <div className="text-sm liquid-glass-text-subtle">Change your password</div>
              </div>
            </div>
            <div className="text-sm text-blue-400">Edit</div>
          </button>
        </motion.div>

        {/* Performance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="liquid-glass-card p-6"
        >
          <h2 className="text-lg font-semibold liquid-glass-text mb-6">Performance</h2>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium liquid-glass-text">Prompt Caching</h3>
                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm liquid-glass-text-subtle">Reduce token usage through prompt caching</p>
            </div>
            <div className="flex items-center gap-2">
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
              )}
              <button
                onClick={handleToggleCache}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 ${userOptions.cache ? 'bg-blue-600' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${userOptions.cache ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Username Modal */}
        <Modal isOpen={showUsernameModal} onClose={() => setShowUsernameModal(false)} title="Change Username">
          {modalError && (
            <div className="mb-4 p-3 border border-red-500/30 bg-red-500/5 rounded-lg flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="mb-4 p-3 border border-green-500/30 bg-green-500/5 rounded-lg flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
              </div>
              <span className="text-green-400 text-sm">{modalSuccess}</span>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium liquid-glass-text mb-2">New Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-4 py-2 liquid-glass-1 rounded-lg liquid-glass-text border border-white/5 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="Enter new username"
              />
            </div>
            <button
              onClick={handleUsernameUpdate}
              disabled={savingUsername || !newUsername || newUsername === profileData.username}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingUsername ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </Modal>

        {/* Password Modal */}
        <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
          {modalError && (
            <div className="mb-4 p-3 border border-red-500/30 bg-red-500/5 rounded-lg flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="mb-4 p-3 border border-green-500/30 bg-green-500/5 rounded-lg flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
              </div>
              <span className="text-green-400 text-sm">{modalSuccess}</span>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium liquid-glass-text mb-2">Current Password</label>
              <input
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="w-full px-4 py-2 liquid-glass-1 rounded-lg liquid-glass-text border border-white/5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium liquid-glass-text mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 liquid-glass-1 rounded-lg liquid-glass-text border border-white/5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter new password"
              />
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs liquid-glass-text-subtle">Password Strength</span>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>{passwordStrength.text}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.strength === 100 ? 'bg-green-500' :
                        passwordStrength.strength >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium liquid-glass-text mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 liquid-glass-1 rounded-lg liquid-glass-text border border-white/5 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Confirm new password"
              />
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>
            <button
              onClick={handlePasswordUpdate}
              disabled={savingPassword || !passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </Modal>

        {/* Profile Picture Modal */}
        <Modal
          isOpen={showProfilePictureModal}
          onClose={() => {
            setShowProfilePictureModal(false);
            setUploadedFile(null);
            setPreviewUrl(null);
            setModalError('');
            setModalSuccess('');
          }}
          title="Change Profile Picture"
        >
          {modalError && (
            <div className="mb-4 p-3 border border-red-500/30 bg-red-500/5 rounded-lg flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="mb-4 p-3 border border-green-500/30 bg-green-500/5 rounded-lg flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
              </div>
              <span className="text-green-400 text-sm">{modalSuccess}</span>
            </div>
          )}
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {(previewUrl || (currentUser?.profile_picture && !uploadedFile)) && (
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-white/10 shadow-lg">
                  <img
                    src={previewUrl || currentUser?.profile_picture!}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Preview image failed to load');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                id="profile-picture-input"
              />
              <label
                htmlFor="profile-picture-input"
                className="px-4 py-2 liquid-glass-1 rounded-lg cursor-pointer hover:bg-white/5 transition-colors font-medium liquid-glass-text"
              >
                Choose File
              </label>
              {uploadedFile && (
                <p className="text-sm liquid-glass-text-subtle">{uploadedFile.name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleProfilePictureUpload}
                disabled={savingPicture || !uploadedFile}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingPicture ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload</span>
                )}
              </button>
              {currentUser?.profile_picture && !uploadedFile && (
                <button
                  onClick={handleRemoveProfilePicture}
                  disabled={savingPicture}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}