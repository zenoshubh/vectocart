import React from 'react';
import { LogOut, User } from 'lucide-react';
import { logOut } from '../lib/auth';

const UserProfile = ({ user, onLogout }) => {
  const handleLogout = async () => {
    try {
      await logOut();
      onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-indigo-50 border-b border-indigo-100">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 truncate max-w-32">
            {user.email}
          </p>
          <p className="text-xs text-gray-500">Signed in</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};

export default UserProfile;
