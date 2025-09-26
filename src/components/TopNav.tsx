import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';

export default function TopNav() {
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
      <div className="flex items-center">
        <Link 
          to="/dashboard" 
          className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200"
        >
          Ripple 24/7 — Admin
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-6">
          <Link 
            to="/dashboard" 
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
          >
            Dashboard
          </Link>
          <Link 
            to="/reports" 
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
          >
            Reports
          </Link>
          <Link 
            to="/settings" 
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
          >
            Settings
          </Link>
        </div>
        
        <button
          onClick={handleSignOut}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </header>
  );
}


