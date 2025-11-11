
import React, { useState, useEffect } from 'react';
import type { CurrentUser } from './types';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import EmployeePortal from './components/EmployeePortal';
import { LoadingIcon } from './components/icons';
import { getInitialData } from './services/attendanceService';


function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This effect now only runs once on mount to check session/initial state.
  useEffect(() => {
    // In a real app, you might check for a saved session token here.
    // For now, we just transition from the loading state.
    setIsLoading(false);
  }, []);


  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleLogin = (user: CurrentUser) => {
    setCurrentUser(user);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <LoadingIcon className="h-12 w-12 text-primary-600" />
      </div>
    );
  }

  let content;
  if (!currentUser) {
    content = <LoginScreen onLogin={handleLogin} />;
  } else if ('deviceCode' in currentUser) {
    content = <EmployeePortal employee={currentUser} onLogout={handleLogout} />;
  } else {
    content = <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {content}
    </div>
  );
}

export default App;