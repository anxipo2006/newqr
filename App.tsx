
import React, { useState, useEffect } from 'react';
// FIx: Import CurrentUser from types.ts
import type { Employee, CurrentUser } from './types';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import EmployeePortal from './components/EmployeePortal';
import { LoadingIcon } from './components/icons';

// FIX: Moved to types.ts to be shared across files.
// export type CurrentUser = Employee | { id: 'admin'; name: 'Admin', username: 'admin' };

function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
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
    // FIX: Use a property unique to Employee ('deviceCode') as a type guard.
    // This correctly narrows the type of `currentUser` to `Employee` for the EmployeePortal.
    // The original `currentUser.id === 'admin'` check was not sufficient for TypeScript to narrow the type,
    // because `Employee.id` is a string and could technically be 'admin'.
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