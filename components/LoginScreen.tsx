import React, { useState } from 'react';
import type { CurrentUser } from '../types';
import { login } from '../services/attendanceService';
import { LoadingIcon, UserGroupIcon } from './icons';

interface LoginScreenProps {
  onLogin: (user: CurrentUser) => void;
}

type LoginRole = 'employee' | 'admin';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<LoginRole>('employee');
  
  // Admin state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Employee state
  const [deviceCode, setDeviceCode] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let user: CurrentUser | null = null;
      if (activeTab === 'employee') {
        user = await login('employee', { deviceCode });
        if (!user) setError('Mã chấm công không hợp lệ.');
      } else {
        user = await login('admin', { username, password });
        if (!user) setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
      
      if (user) {
        onLogin(user);
      }
    } catch (err) {
        console.error("Login failed:", err);
        setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
        setIsLoading(false);
    }
  };

  const renderEmployeeForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label htmlFor="deviceCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Mã chấm công
        </label>
        <input
          id="deviceCode"
          name="deviceCode"
          type="text"
          autoComplete="off"
          required
          value={deviceCode}
          onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
          placeholder="Nhập mã 5 ký tự của bạn"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white uppercase tracking-widest text-center font-mono"
        />
      </div>
      <LoginButton />
    </form>
  );

  const renderAdminForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tên đăng nhập
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
       <LoginButton />
       <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-dashed dark:border-gray-600">
          <p>TK Admin mặc định: <strong>admin</strong> / <strong>admin123</strong></p>
      </div>
    </form>
  );

  const LoginButton = () => (
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
        >
          {isLoading ? <LoadingIcon className="h-5 w-5" /> : 'Đăng nhập'}
        </button>
      </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
        <div className="text-center">
           <UserGroupIcon className="mx-auto h-12 w-auto text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Hệ Thống Chấm Công</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Vui lòng chọn vai trò của bạn</p>
        </div>
        
        <div>
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <TabButton title="Nhân viên" isActive={activeTab === 'employee'} onClick={() => { setActiveTab('employee'); setError(''); }} />
                <TabButton title="Quản trị viên" isActive={activeTab === 'admin'} onClick={() => { setActiveTab('admin'); setError(''); }} />
            </div>
            <div className="py-6">
                {activeTab === 'employee' ? renderEmployeeForm() : renderAdminForm()}
                {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}
            </div>
        </div>

      </div>
    </div>
  );
};

const TabButton: React.FC<{title: string, isActive: boolean, onClick: () => void}> = ({ title, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full py-2.5 text-sm font-medium leading-5 text-center transition-colors duration-200 ease-in-out focus:outline-none
        ${isActive 
            ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' 
            : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
    >
        {title}
    </button>
)

export default LoginScreen;