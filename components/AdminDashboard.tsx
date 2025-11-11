import React, { useState, useEffect } from 'react';
import { 
  getEmployees, 
  addEmployee, 
  deleteEmployee, 
  updateEmployee,
  getAttendanceRecords,
  getShifts,
  addShift,
  deleteShift,
  updateShift,
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
  getInitialData,
} from '../services/attendanceService';
import type { Employee, AttendanceRecord, Shift, Location } from '../types';
import { AttendanceStatus } from '../types';
import QRCodeGenerator from './QRCodeGenerator';
import { QrCodeIcon, UserGroupIcon, ListBulletIcon, LogoutIcon, ClockIcon, CalendarDaysIcon, DocumentArrowDownIcon, PencilIcon, XCircleIcon, MapPinIcon, BuildingOffice2Icon, LoadingIcon } from './icons';
import { formatTimestamp, formatDateForDisplay, getWeekRange, formatTimeToHHMM, calculateHours } from '../utils/date';

type Tab = 'timesheet' | 'logs' | 'employees' | 'shifts' | 'locations' | 'qrcode';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('timesheet');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeUsername, setNewEmployeeUsername] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [employeeAddError, setEmployeeAddError] = useState('');

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { employees, records, shifts, locations } = await getInitialData();
      setEmployees(employees);
      setRecords(records);
      setShifts(shifts);
      setLocations(locations);
    } catch (error) {
      console.error("Failed to load data:", error);
      // Handle error display to the user
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeAddError('');
    try {
      await addEmployee(newEmployeeName, newEmployeeUsername, newEmployeePassword, selectedShiftId, selectedLocationId);
      setNewEmployeeName('');
      setNewEmployeeUsername('');
      setNewEmployeePassword('');
      setSelectedShiftId('');
      setSelectedLocationId('');
      await loadData();
    } catch (error: any) {
      setEmployeeAddError(error.message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này? Tất cả dữ liệu chấm công của họ cũng sẽ bị xóa.')) {
      await deleteEmployee(id);
      await loadData();
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>): Promise<{ success: boolean, message?: string }> => {
    try {
      await updateEmployee(id, updates);
      setEditingEmployee(null);
      await loadData();
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };
  
  const handleAddShift = async (name: string, startTime: string, endTime: string) => {
    await addShift(name, startTime, endTime);
    await loadData();
  };

  const handleDeleteShift = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ca làm việc này? Nhân viên được phân công vào ca này sẽ không còn ca làm việc.')) {
      await deleteShift(id);
      await loadData();
    }
  };

  const handleUpdateShift = async (id: string, updates: Partial<Shift>) => {
    await updateShift(id, updates);
    setEditingShift(null);
    await loadData();
  };
  
  const handleAddLocation = async (location: Omit<Location, 'id'>) => {
    await addLocation(location);
    await loadData();
  };

  const handleDeleteLocation = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa điểm này? Nhân viên được phân công vào địa điểm này sẽ không còn địa điểm làm việc.')) {
      await deleteLocation(id);
      await loadData();
    }
  };
  
  const handleUpdateLocation = async (id: string, updates: Partial<Location>) => {
    await updateLocation(id, updates);
    setEditingLocation(null);
    await loadData();
  }

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingIcon className="h-10 w-10 text-primary-500" />
            </div>
        );
    }
    switch (activeTab) {
      case 'logs':
        return <AttendanceLog records={records} />;
      case 'employees':
        return <EmployeeManagement 
                 employees={employees} 
                 shifts={shifts}
                 locations={locations}
                 newEmployeeName={newEmployeeName} 
                 setNewEmployeeName={setNewEmployeeName}
                 newEmployeeUsername={newEmployeeUsername}
                 setNewEmployeeUsername={setNewEmployeeUsername}
                 newEmployeePassword={newEmployeePassword}
                 setNewEmployeePassword={setNewEmployeePassword}
                 selectedShiftId={selectedShiftId}
                 setSelectedShiftId={setSelectedShiftId}
                 selectedLocationId={selectedLocationId}
                 setSelectedLocationId={setSelectedLocationId}
                 employeeAddError={employeeAddError}
                 onAddEmployee={handleAddEmployee}
                 onDeleteEmployee={handleDeleteEmployee} 
                 onEditEmployee={setEditingEmployee}
               />;
      case 'shifts':
        return <ShiftManagement 
                  shifts={shifts}
                  onAddShift={handleAddShift}
                  onDeleteShift={handleDeleteShift}
                  onEditShift={setEditingShift}
               />;
      case 'locations':
        return <LocationManagement
                  locations={locations}
                  onAddLocation={handleAddLocation}
                  onDeleteLocation={handleDeleteLocation}
                  onEditLocation={setEditingLocation}
                />;
      case 'timesheet':
        return <AttendanceTimesheet employees={employees} records={records} />;
      case 'qrcode':
        return <QRCodeGenerator locations={locations} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <nav className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
          <div className="p-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">Bảng điều khiển Admin</h1>
          </div>
          <ul className="flex-grow p-2">
            <TabButton icon={<CalendarDaysIcon className="h-6 w-6"/>} label="Bảng chấm công" isActive={activeTab === 'timesheet'} onClick={() => { setActiveTab('timesheet'); }} />
            <TabButton icon={<ListBulletIcon className="h-6 w-6"/>} label="Nhật ký Chấm công" isActive={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); }} />
            <TabButton icon={<UserGroupIcon className="h-6 w-6"/>} label="Quản lý Nhân viên" isActive={activeTab === 'employees'} onClick={() => { setActiveTab('employees'); }} />
            <TabButton icon={<ClockIcon className="h-6 w-6"/>} label="Quản lý Ca làm việc" isActive={activeTab === 'shifts'} onClick={() => { setActiveTab('shifts'); }} /> 
            <TabButton icon={<BuildingOffice2Icon className="h-6 w-6"/>} label="Quản lý Địa điểm" isActive={activeTab === 'locations'} onClick={() => { setActiveTab('locations'); }} />
            <TabButton icon={<QrCodeIcon className="h-6 w-6"/>} label="Mã QR Chấm công" isActive={activeTab === 'qrcode'} onClick={() => setActiveTab('qrcode')} />
          </ul>
          <div className="p-2 border-t dark:border-gray-700">
             <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <LogoutIcon className="h-5 w-5"/>
              <span>Đăng xuất</span>
            </button>
          </div>
        </nav>
        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          {renderContent()}
        </main>
      </div>
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          shifts={shifts}
          locations={locations}
          onClose={() => setEditingEmployee(null)}
          onSave={handleUpdateEmployee}
        />
      )}
      {editingShift && (
        <EditShiftModal
          shift={editingShift}
          onClose={() => setEditingShift(null)}
          onSave={handleUpdateShift}
        />
      )}
      {editingLocation && (
        <EditLocationModal
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
          onSave={handleUpdateLocation}
        />
      )}
    </>
  );
};

const TabButton: React.FC<{icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void}> = ({ icon, label, isActive, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive
          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  </li>
);

const AttendanceLog: React.FC<{records: AttendanceRecord[]}> = ({ records }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Nhật ký Chấm công</h2>
    <div className="overflow-x-auto max-h-[75vh]">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
          <tr>
            <th scope="col" className="px-6 py-3">Tên đăng nhập</th>
            <th scope="col" className="px-6 py-3">Tên nhân viên</th>
            <th scope="col" className="px-6 py-3">Thời gian</th>
            <th scope="col" className="px-6 py-3">Ca làm việc</th>
            <th scope="col" className="px-6 py-3">Trạng thái</th>
            <th scope="col" className="px-6 py-3">Vị trí</th>
            <th scope="col" className="px-6 py-3">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <td className="px-6 py-4 font-mono text-sm text-gray-500 dark:text-gray-400">{record.username}</td>
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{record.employeeName}</td>
              <td className="px-6 py-4">{formatTimestamp(record.timestamp)}</td>
              <td className="px-6 py-4">{record.shiftName || 'Không có'}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status === AttendanceStatus.CHECK_IN ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                  {record.status === AttendanceStatus.CHECK_IN ? 'Check-in' : 'Check-out'}
                </span>
              </td>
               <td className="px-6 py-4">
                {record.latitude && record.longitude ? (
                  <a href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                    <MapPinIcon className="h-4 w-4" />
                    <span>Xem vị trí</span>
                    <span className="text-xs text-gray-400">({record.accuracy?.toFixed(0)}m)</span>
                  </a>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm font-medium">
                {record.isLate && <span className="text-red-500">Đi trễ</span>}
                {record.isEarly && <span className="text-yellow-600 dark:text-yellow-400">Về sớm</span>}
                {!record.isLate && !record.isEarly && <span className="text-gray-400">-</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {records.length === 0 && <p className="text-center py-8 text-gray-500">Chưa có dữ liệu chấm công.</p>}
    </div>
  </div>
);

const EmployeeManagement: React.FC<{
  employees: Employee[],
  shifts: Shift[],
  locations: Location[],
  newEmployeeName: string,
  setNewEmployeeName: (name: string) => void,
  newEmployeeUsername: string,
  setNewEmployeeUsername: (code: string) => void,
  newEmployeePassword:  string,
  setNewEmployeePassword: (password: string) => void,
  selectedShiftId: string,
  setSelectedShiftId: (id: string) => void,
  selectedLocationId: string,
  setSelectedLocationId: (id: string) => void,
  employeeAddError: string,
  onAddEmployee: (e: React.FormEvent) => Promise<void>,
  onDeleteEmployee: (id: string) => Promise<void>,
  onEditEmployee: (employee: Employee) => void,
}> = ({ employees, shifts, locations, newEmployeeName, setNewEmployeeName, newEmployeeUsername, setNewEmployeeUsername, newEmployeePassword, setNewEmployeePassword, selectedShiftId, setSelectedShiftId, selectedLocationId, setSelectedLocationId, employeeAddError, onAddEmployee, onDeleteEmployee, onEditEmployee }) => {
  const shiftMap = new Map(shifts.map(s => [s.id, s.name]));
  const locationMap = new Map(locations.map(l => [l.id, l.name]));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quản lý Nhân viên</h2>
      <form onSubmit={onAddEmployee} className="mb-6 p-4 border rounded-lg dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
              <label htmlFor="emp-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên hiển thị</label>
              <input
                id="emp-name" type="text" value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="VD: Nguyễn Văn A" required
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
          </div>
          <div>
              <label htmlFor="emp-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đăng nhập</label>
              <input
                id="emp-username" type="text" value={newEmployeeUsername}
                onChange={(e) => setNewEmployeeUsername(e.target.value)}
                placeholder="VD: nguyenvana" required
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
          </div>
          <div>
              <label htmlFor="emp-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mật khẩu</label>
              <input
                id="emp-password" type="password"
                value={newEmployeePassword}
                onChange={(e) => setNewEmployeePassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
          </div>
           <div>
                <label htmlFor="shift-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ca làm việc</label>
                <select 
                    id="shift-select" value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">Không phân ca</option>
                    {shifts.map(shift => (
                        <option key={shift.id} value={shift.id}>
                            {shift.name} ({shift.startTime} - {shift.endTime})
                        </option>
                    ))}
                </select>
           </div>
            <div>
                <label htmlFor="location-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Địa điểm</label>
                <select 
                    id="location-select" value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">Không có</option>
                    {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                </select>
           </div>
        </div>
        <button type="submit" className="mt-4 w-full px-6 py-2 font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700">Thêm nhân viên</button>
        {employeeAddError && <p className="text-red-500 text-sm mt-2">{employeeAddError}</p>}
      </form>
      <ul className="space-y-3 max-h-[50vh] overflow-y-auto">
        {employees.map(employee => (
          <li key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <div className="flex-grow">
               <p className="font-medium text-gray-800 dark:text-gray-200">{employee.name}</p>
               <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-4 flex-wrap">
                  <span>Tài khoản: <strong className="font-mono">{employee.username}</strong></span>
                  <span>Mã: <strong className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded">{employee.deviceCode}</strong></span>
                  <span>Ca: {employee.shiftId && shiftMap.has(employee.shiftId) ? shiftMap.get(employee.shiftId) : 'Chưa phân'}</span>
                  <span>Địa điểm: {employee.locationId && locationMap.has(employee.locationId) ? locationMap.get(employee.locationId) : 'Chưa phân'}</span>
               </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <button onClick={() => onEditEmployee(employee)} className="p-2 text-sm font-semibold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500">
                    <PencilIcon className="h-4 w-4" />
                </button>
                <button onClick={() => onDeleteEmployee(employee.id)} className="p-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
            </div>
          </li>
        ))}
      </ul>
     {employees.length === 0 && <p className="text-center py-8 text-gray-500">Chưa có nhân viên nào.</p>}
    </div>
  );
};

const ShiftManagement: React.FC<{
  shifts: Shift[],
  onAddShift: (name: string, startTime: string, endTime: string) => Promise<void>,
  onDeleteShift: (id: string) => Promise<void>,
  onEditShift: (shift: Shift) => void,
}> = ({ shifts, onAddShift, onDeleteShift, onEditShift }) => {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onAddShift(name, startTime, endTime);
      setName('');
      setStartTime('');
      setEndTime('');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quản lý Ca làm việc</h2>
      <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg dark:border-gray-700">
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên ca (VD: Ca Sáng)" required
              className="px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 sm:col-span-3"
            />
            <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">Giờ bắt đầu</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)} required
                  className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
             <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">Giờ kết thúc</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)} required
                  className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
            <button type="submit" className="self-end px-6 py-2 font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700">Thêm ca</button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
       <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
        {shifts.map(shift => (
          <li key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {shift.name} ({shift.startTime} - {shift.endTime})
            </span>
            <div className="flex items-center gap-2">
                <button onClick={() => onEditShift(shift)} className="p-2 text-sm font-semibold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500">
                    <PencilIcon className="h-4 w-4" />
                </button>
                <button onClick={() => onDeleteShift(shift.id)} className="p-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
            </div>
          </li>
        ))}
      </ul>
      {shifts.length === 0 && <p className="text-center py-8 text-gray-500">Chưa có ca làm việc nào.</p>}
    </div>
  );
};

const LocationManagement: React.FC<{
  locations: Location[],
  onAddLocation: (location: Omit<Location, 'id'>) => Promise<void>,
  onDeleteLocation: (id: string) => Promise<void>,
  onEditLocation: (location: Location) => void,
}> = ({ locations, onAddLocation, onDeleteLocation, onEditLocation }) => {
    const [name, setName] = useState('');
    const [latitude, setLatitude] = useState<number | ''>('');
    const [longitude, setLongitude] = useState<number | ''>('');
    const [radius, setRadius] = useState<number | ''>(50);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    
    const handleGetCurrentLocation = () => {
      setIsFetchingLocation(true);
      setMessage(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setIsFetchingLocation(false);
        },
        (error) => {
          setMessage({ type: 'error', text: `Lỗi khi lấy vị trí: ${error.message}` });
          setIsFetchingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (name.trim() === '' || latitude === '' || longitude === '' || radius === '' || radius <= 0) {
            setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin và bán kính phải là số dương.' });
            return;
        }
        await onAddLocation({ name, latitude, longitude, radius });
        setName('');
        setLatitude('');
        setLongitude('');
        setRadius(50);
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quản lý Địa điểm</h2>
            <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên địa điểm</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Văn phòng chính" required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vĩ độ (Latitude)</label>
                        <input type="number" step="any" value={latitude} onChange={e => setLatitude(parseFloat(e.target.value) || '')} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kinh độ (Longitude)</label>
                        <input type="number" step="any" value={longitude} onChange={e => setLongitude(parseFloat(e.target.value) || '')} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div className="sm:col-span-2">
                        <button type="button" onClick={handleGetCurrentLocation} disabled={isFetchingLocation} className="text-sm text-primary-600 hover:underline disabled:text-gray-400 disabled:cursor-wait">
                            {isFetchingLocation ? 'Đang lấy vị trí...' : 'Lấy vị trí hiện tại'}
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bán kính (mét)</label>
                        <input type="number" value={radius} onChange={e => setRadius(parseInt(e.target.value, 10) || '')} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>
                <button type="submit" className="mt-4 w-full px-6 py-2 font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700">Thêm Địa điểm</button>
                {message && <p className={`text-sm mt-2 text-center ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{message.text}</p>}
            </form>
            <ul className="space-y-3 max-h-[50vh] overflow-y-auto">
                {locations.map(loc => (
                    <li key={loc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{loc.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Bán kính: {loc.radius}m</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => onEditLocation(loc)} className="p-2 text-sm font-semibold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500">
                                <PencilIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => onDeleteLocation(loc.id)} className="p-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
             {locations.length === 0 && <p className="text-center py-8 text-gray-500">Chưa có địa điểm nào được cấu hình.</p>}
        </div>
    );
};


interface DailyAttendance {
  checkIn: number | null;
  checkOut: number | null;
  hours: number;
  isLate: boolean;
  isEarly: boolean;
}

interface WeeklyAttendanceData {
  employeeName: string;
  dailyData: DailyAttendance[];
  totalHours: number;
}

const AttendanceTimesheet: React.FC<{ employees: Employee[], records: AttendanceRecord[] }> = ({ employees, records }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [processedData, setProcessedData] = useState<Map<string, WeeklyAttendanceData>>(new Map());

  useEffect(() => {
    const { weekStart } = getWeekRange(currentDate);
    const data = new Map<string, WeeklyAttendanceData>();

    employees.forEach(employee => {
      const weeklyRecords: DailyAttendance[] = [];
      let totalWeekHours = 0;

      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        const dayStart = new Date(day).setHours(0, 0, 0, 0);
        const dayEnd = new Date(day).setHours(23, 59, 59, 999);

        const dayRecords = records.filter(r =>
          r.employeeId === employee.id &&
          r.timestamp >= dayStart &&
          r.timestamp <= dayEnd
        );

        const checkIns = dayRecords
            .filter(r => r.status === AttendanceStatus.CHECK_IN)
            .sort((a, b) => a.timestamp - b.timestamp);
        const checkOuts = dayRecords
            .filter(r => r.status === AttendanceStatus.CHECK_OUT)
            .sort((a, b) => b.timestamp - a.timestamp);

        const firstCheckInRecord = checkIns.length > 0 ? checkIns[0] : null;
        const lastCheckOutRecord = checkOuts.length > 0 ? checkOuts[0] : null;

        const firstCheckIn = firstCheckInRecord ? firstCheckInRecord.timestamp : null;
        const lastCheckOut = lastCheckOutRecord ? lastCheckOutRecord.timestamp : null;
        
        const dayHours = calculateHours(firstCheckIn, lastCheckOut);
        totalWeekHours += dayHours;
        
        weeklyRecords.push({ 
            checkIn: firstCheckIn, 
            checkOut: lastCheckOut, 
            hours: dayHours,
            isLate: firstCheckInRecord?.isLate || false,
            isEarly: lastCheckOutRecord?.isEarly || false,
        });
      }

      data.set(employee.id, {
        employeeName: employee.name,
        dailyData: weeklyRecords,
        totalHours: parseFloat(totalWeekHours.toFixed(2)),
      });
    });

    setProcessedData(data);
  }, [currentDate, employees, records]);

  const handlePrevWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };
  
  const handleExport = () => {
    const { weekStart } = getWeekRange(currentDate);
    const headers = ['Nhân viên', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật', 'Tổng giờ làm'];
    const rows = [headers.join(',')];

    processedData.forEach((data) => {
      const rowData = [data.employeeName];
      data.dailyData.forEach(day => {
        if (day.checkIn && day.checkOut) {
          rowData.push(`"${formatTimeToHHMM(day.checkIn)} - ${formatTimeToHHMM(day.checkOut)}"`);
        } else if (day.checkIn) {
          rowData.push(`"${formatTimeToHHMM(day.checkIn)} - "`);
        } else {
          rowData.push('-');
        }
      });
      rowData.push(data.totalHours.toString());
      rows.push(rowData.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + '\uFEFF' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bao_cao_cham_cong_tuan_${formatDateForDisplay(weekStart).replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { weekStart } = getWeekRange(currentDate);
  const weekDays = [...Array(7)].map((_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bảng Chấm Công Tuần</h2>
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
             <button onClick={handlePrevWeek} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">{'<'}</button>
             <span>{formatDateForDisplay(weekStart)} - {formatDateForDisplay(getWeekRange(currentDate).weekEnd)}</span>
             <button onClick={handleNextWeek} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">{'>'}</button>
          </div>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
            <DocumentArrowDownIcon className="h-5 w-5"/>
            <span>Xuất báo cáo</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-4 py-3 border border-gray-200 dark:border-gray-600 w-1/5 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">Nhân viên</th>
              {weekDays.map((day, i) => {
                const isToday = day.getTime() === today.getTime();
                return (
                  <th key={i} scope="col" className={`px-4 py-3 border border-gray-200 dark:border-gray-600 text-center ${isToday ? 'bg-primary-100 dark:bg-primary-900/50' : ''}`}>
                    {dayLabels[i]}<br/>{formatDateForDisplay(day)}
                  </th>
                )
              })}
              <th scope="col" className="px-4 py-3 border border-gray-200 dark:border-gray-600 text-center">Tổng giờ</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => {
              const data = processedData.get(employee.id);
              if (!data) return null;

              return (
                <tr key={employee.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border border-gray-200 dark:border-gray-600 sticky left-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600">{employee.name}</td>
                  {data.dailyData.map((day, i) => {
                     const dayDate = weekDays[i];
                     const isToday = dayDate.getTime() === today.getTime();
                     return (
                        <td key={i} className={`px-4 py-2 border border-gray-200 dark:border-gray-600 text-center ${isToday ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}>
                          {day.checkIn ? (
                            <div className="flex flex-col items-center justify-center">
                                <div className="flex items-center gap-1" title={day.isLate ? 'Đi trễ' : undefined}>
                                    <span className={`font-semibold ${day.isLate ? 'text-red-500' : ''}`}>{formatTimeToHHMM(day.checkIn)}</span>
                                    {day.isLate && <ClockIcon className="h-3.5 w-3.5 text-red-500" />}
                                </div>
                                {day.checkOut ? (
                                    <>
                                        <div className="flex items-center gap-1" title={day.isEarly ? 'Về sớm' : undefined}>
                                            <span className={`font-semibold ${day.isEarly ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>- {formatTimeToHHMM(day.checkOut)}</span>
                                            {day.isEarly && <ClockIcon className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />}
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1">{day.hours} giờ</span>
                                    </>
                                ) : (
                                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">- ...</span>
                                )}
                            </div>
                            ) : (
                                <span>-</span>
                            )}
                        </td>
                     )
                  })}
                  <td className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-center font-bold text-primary-600 dark:text-primary-400">{data.totalHours}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {employees.length === 0 && <p className="text-center py-8 text-gray-500">Chưa có nhân viên nào để hiển thị.</p>}
      </div>
    </div>
  );
};

// Modal for editing an employee
const EditEmployeeModal: React.FC<{
  employee: Employee;
  shifts: Shift[];
  locations: Location[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<Employee>) => Promise<{ success: boolean, message?: string }>;
}> = ({ employee, shifts, locations, onClose, onSave }) => {
  const [name, setName] = useState(employee.name);
  const [username, setUsername] = useState(employee.username);
  const [password, setPassword] = useState('');
  const [shiftId, setShiftId] = useState(employee.shiftId || '');
  const [locationId, setLocationId] = useState(employee.locationId || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const updates: Partial<Employee> = {
      name: name.trim(),
      username: username.trim(),
      shiftId: shiftId || undefined,
      locationId: locationId || undefined,
    };

    if (password) {
      updates.password = password;
    }

    const result = await onSave(employee.id, updates);
    if (!result.success) {
      setError(result.message || 'Đã xảy ra lỗi không xác định.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Chỉnh sửa Nhân viên</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <XCircleIcon className="w-8 h-8"/>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên hiển thị</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đăng nhập</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mật khẩu mới (để trống nếu không đổi)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ca làm việc</label>
              <select value={shiftId} onChange={e => setShiftId(e.target.value)} className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Không phân ca</option>
                {shifts.map(shift => (
                  <option key={shift.id} value={shift.id}>{shift.name} ({shift.startTime} - {shift.endTime})</option>
                ))}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Địa điểm</label>
              <select value={locationId} onChange={e => setLocationId(e.target.value)} className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Không có</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Hủy</button>
            <button type="submit" className="px-8 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-semibold">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal for editing a shift
const EditShiftModal: React.FC<{
  shift: Shift;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Shift>) => Promise<void>;
}> = ({ shift, onClose, onSave }) => {
  const [name, setName] = useState(shift.name);
  const [startTime, setStartTime] = useState(shift.startTime);
  const [endTime, setEndTime] = useState(shift.endTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(shift.id, { name, startTime, endTime });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Chỉnh sửa Ca làm việc</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <XCircleIcon className="w-8 h-8"/>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên ca</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giờ bắt đầu</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giờ kết thúc</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Hủy</button>
            <button type="submit" className="px-8 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-semibold">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal for editing a location
const EditLocationModal: React.FC<{
  location: Location;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Location>) => Promise<void>;
}> = ({ location, onClose, onSave }) => {
  const [name, setName] = useState(location.name);
  const [latitude, setLatitude] = useState(location.latitude);
  const [longitude, setLongitude] = useState(location.longitude);
  const [radius, setRadius] = useState(location.radius);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '' || radius <= 0) {
        // Simple validation
        return;
    }
    onSave(location.id, { name, latitude, longitude, radius });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Chỉnh sửa Địa điểm</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <XCircleIcon className="w-8 h-8"/>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên địa điểm</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vĩ độ</label>
                <input type="number" step="any" value={latitude} onChange={e => setLatitude(parseFloat(e.target.value))} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kinh độ</label>
                <input type="number" step="any" value={longitude} onChange={e => setLongitude(parseFloat(e.target.value))} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bán kính (mét)</label>
                <input type="number" value={radius} onChange={e => setRadius(parseInt(e.target.value, 10))} required className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Hủy</button>
            <button type="submit" className="px-8 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-semibold">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default AdminDashboard;