// FIX: Import `AttendanceStatus` as a value, as it is an enum used at runtime.
import { AttendanceStatus } from '../types';
// FIX: The remaining imports are types and can be imported using `import type`.
import type { Employee, AttendanceRecord, Shift, CurrentUser, Location } from '../types';
import { getTimeToday } from '../utils/date';

const EMPLOYEES_KEY = 'attendance_employees';
const RECORDS_KEY = 'attendance_records';
const SHIFTS_KEY = 'attendance_shifts';
const LOCATIONS_KEY = 'attendance_locations';


// --- Geolocation Helpers ---

const haversineDistance = (
  coords1: { latitude: number; longitude: number },
  coords2: { latitude: number; longitude: number }
): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;

  const R = 6371e3; // meters
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};


// --- Location Management ---
export const getLocations = (): Location[] => {
  const locationsJson = localStorage.getItem(LOCATIONS_KEY);
  return locationsJson ? JSON.parse(locationsJson) : [];
};

export const addLocation = (location: Omit<Location, 'id'>): Location => {
  const locations = getLocations();
  const newLocation: Location = {
    ...location,
    id: `loc_${new Date().getTime()}`,
  };
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify([...locations, newLocation]));
  return newLocation;
};

export const updateLocation = (locationId: string, updates: Partial<Omit<Location, 'id'>>): Location => {
    const locations = getLocations();
    const locationIndex = locations.findIndex(l => l.id === locationId);
    if (locationIndex === -1) {
        throw new Error('Không tìm thấy địa điểm.');
    }
    const updatedLocation = { ...locations[locationIndex], ...updates };
    locations[locationIndex] = updatedLocation;
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
    return updatedLocation;
};

export const deleteLocation = (locationId: string): void => {
  const locations = getLocations();
  const updatedLocations = locations.filter(l => l.id !== locationId);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(updatedLocations));

  // Unassign employees from the deleted location
  const employees = getEmployees();
  const updatedEmployees = employees.map(emp => {
    if (emp.locationId === locationId) {
      return { ...emp, locationId: undefined };
    }
    return emp;
  });
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updatedEmployees));
};


// --- Authentication ---
export const login = (
  role: 'admin' | 'employee',
  credentials: { username?: string; password?: string; deviceCode?: string }
): CurrentUser | null => {
  if (role === 'admin') {
    if (credentials.username?.toLowerCase() === 'admin' && credentials.password === 'admin123') {
      return { id: 'admin', name: 'Admin', username: 'admin' };
    }
    return null; // Admin login failed
  }

  if (role === 'employee') {
    if (!credentials.deviceCode) return null;
    const employees = getEmployees();
    const employee = employees.find(
      (emp) => emp.deviceCode.toUpperCase() === credentials.deviceCode!.toUpperCase()
    );
    return employee || null; // Employee login failed if no match
  }

  return null; // Should not happen
};


// --- Shift Management ---

export const getShifts = (): Shift[] => {
  const shiftsJson = localStorage.getItem(SHIFTS_KEY);
  return shiftsJson ? JSON.parse(shiftsJson) : [];
};

export const addShift = (name: string, startTime: string, endTime: string): Shift => {
  if (!name.trim() || !startTime.trim() || !endTime.trim()) {
    throw new Error('Vui lòng điền đầy đủ thông tin ca làm việc.');
  }
  const shifts = getShifts();
  const newShift: Shift = {
    id: `shift_${new Date().getTime()}`,
    name: name.trim(),
    startTime,
    endTime,
  };
  const updatedShifts = [...shifts, newShift];
  localStorage.setItem(SHIFTS_KEY, JSON.stringify(updatedShifts));
  return newShift;
};

export const updateShift = (shiftId: string, updates: Partial<Omit<Shift, 'id'>>): Shift => {
    const shifts = getShifts();
    const shiftIndex = shifts.findIndex(s => s.id === shiftId);
    if (shiftIndex === -1) {
        throw new Error('Không tìm thấy ca làm việc.');
    }

    const originalShift = shifts[shiftIndex];
    const updatedShift = { ...originalShift, ...updates };

    shifts[shiftIndex] = updatedShift;
    localStorage.setItem(SHIFTS_KEY, JSON.stringify(shifts));

    if (updates.name && updates.name !== originalShift.name) {
        let records = getAttendanceRecords();
        records = records.map(rec => {
            if (rec.shiftName === originalShift.name) {
                return { ...rec, shiftName: updatedShift.name };
            }
            return rec;
        });
        localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    }

    return updatedShift;
}


export const deleteShift = (id: string): void => {
  const shifts = getShifts();
  const updatedShifts = shifts.filter(s => s.id !== id);
  localStorage.setItem(SHIFTS_KEY, JSON.stringify(updatedShifts));
  
  const employees = getEmployees();
  const updatedEmployees = employees.map(emp => {
    if (emp.shiftId === id) {
      return { ...emp, shiftId: undefined };
    }
    return emp;
  });
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updatedEmployees));
};

// --- Employee Management ---

export const getEmployees = (): Employee[] => {
  const employeesJson = localStorage.getItem(EMPLOYEES_KEY);
  return employeesJson ? JSON.parse(employeesJson) : [];
};

const generateDeviceCode = (): string => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export const addEmployee = (name: string, username: string, password: string, shiftId?: string, locationId?: string): Employee => {
  if (!name.trim()) throw new Error('Tên hiển thị không được để trống');
  if (!username.trim()) throw new Error('Tên đăng nhập không được để trống');
  if (!password.trim()) throw new Error('Mật khẩu không được để trống');

  const employees = getEmployees();
  
  const usernameExists = employees.some(emp => emp.username.toLowerCase() === username.trim().toLowerCase());
  if (usernameExists) {
    throw new Error('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
  }

  const newEmployee: Employee = {
    id: `emp_${new Date().getTime()}`,
    name: name.trim(),
    username: username.trim(),
    password: password, // In a real app, this should be hashed
    deviceCode: generateDeviceCode(),
    shiftId: shiftId || undefined,
    locationId: locationId || undefined,
  };
  const updatedEmployees = [...employees, newEmployee];
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updatedEmployees));
  return newEmployee;
};

export const updateEmployee = (employeeId: string, updates: Partial<Omit<Employee, 'id' | 'deviceCode'>>): Employee => {
  const employees = getEmployees();
  const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
  if (employeeIndex === -1) {
    throw new Error('Không tìm thấy nhân viên.');
  }

  if (updates.username) {
    const usernameExists = employees.some(emp => emp.id !== employeeId && emp.username.toLowerCase() === updates.username!.trim().toLowerCase());
    if (usernameExists) {
      throw new Error('Tên đăng nhập đã tồn tại.');
    }
  }

  const originalEmployee = employees[employeeIndex];
  const updatedEmployee = { 
    ...originalEmployee, 
    ...updates,
    // Ensure password is not cleared if an empty string is passed
    password: updates.password ? updates.password : originalEmployee.password
  };

  employees[employeeIndex] = updatedEmployee;
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));

  if (updates.name && updates.name !== originalEmployee.name) {
    let records = getAttendanceRecords();
    records = records.map(rec => {
      if (rec.employeeId === employeeId) {
        return { ...rec, employeeName: updatedEmployee.name };
      }
      return rec;
    });
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }

  return updatedEmployee;
};

export const deleteEmployee = (id: string): void => {
  let employees = getEmployees();
  let records = getAttendanceRecords();
  
  const updatedEmployees = employees.filter(emp => emp.id !== id);
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updatedEmployees));
  
  const updatedRecords = records.filter(rec => rec.employeeId !== id);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(updatedRecords));
};
const firebaseConfig = {

  apiKey: "AIzaSyCDtSJOvvOcakG3ZzxAZcC8wwCHBJoSIxE",

  authDomain: "qrcheck-4db34.firebaseapp.com",

  projectId: "qrcheck-4db34",

  storageBucket: "qrcheck-4db34.firebasestorage.app",

  messagingSenderId: "187674911175",

  appId: "1:187674911175:web:714ea8a1ce52f38070f9e2",

  measurementId: "G-4PL87N83M7"

};

// --- Attendance Management ---

export const getAttendanceRecords = (): AttendanceRecord[] => {
  const recordsJson = localStorage.getItem(RECORDS_KEY);
  const records = recordsJson ? JSON.parse(recordsJson) : [];
  return records.sort((a: AttendanceRecord, b: AttendanceRecord) => b.timestamp - a.timestamp);
};

export const addAttendanceRecord = (
  employeeId: string, 
  status: AttendanceStatus,
  locationId: string,
  coords?: { latitude: number; longitude: number; accuracy: number; }
): AttendanceRecord => {
  const locations = getLocations();
  const location = locations.find(l => l.id === locationId);

  if (!location) {
    throw new Error('Địa điểm chấm công không hợp lệ hoặc đã bị xóa.');
  }

  if (!coords) {
    throw new Error('Không thể lấy được vị trí của bạn.');
  }
  const distance = haversineDistance(coords, location);
  if (distance > location.radius) {
    throw new Error(`Bạn phải ở trong bán kính ${location.radius}m của "${location.name}" để chấm công. Vị trí hiện tại của bạn cách ${Math.round(distance)}m.`);
  }

  const employees = getEmployees();
  const employee = employees.find(e => e.id === employeeId);
  if (!employee) throw new Error('Không tìm thấy nhân viên');

  const shifts = getShifts();
  const shift = shifts.find(s => s.id === employee.shiftId);

  const records = getAttendanceRecords();
  const newRecord: AttendanceRecord = {
    id: `rec_${new Date().getTime()}`,
    employeeId,
    employeeName: employee.name,
    username: employee.username,
    timestamp: Date.now(),
    status,
    shiftName: shift ? shift.name : undefined,
  };
  
  if (coords) {
    newRecord.latitude = coords.latitude;
    newRecord.longitude = coords.longitude;
    newRecord.accuracy = coords.accuracy;
  }

  if (shift) {
    const now = new Date();
    if (status === AttendanceStatus.CHECK_IN) {
      const shiftStartTime = getTimeToday(shift.startTime);
      // Add a 1 minute grace period for check-ins
      shiftStartTime.setMinutes(shiftStartTime.getMinutes() + 1);
      if (now > shiftStartTime) {
        newRecord.isLate = true;
      }
    } else if (status === AttendanceStatus.CHECK_OUT) {
      const shiftEndTime = getTimeToday(shift.endTime);
      if (now < shiftEndTime) {
        newRecord.isEarly = true;
      }
    }
  }

  const updatedRecords = [newRecord, ...records];
  localStorage.setItem(RECORDS_KEY, JSON.stringify(updatedRecords));
  return newRecord;
};

export const getRecordsForEmployee = (employeeId: string): AttendanceRecord[] => {
  const allRecords = getAttendanceRecords();
  return allRecords.filter(record => record.employeeId === employeeId);
};

export const getLastRecordForEmployee = (employeeId: string): AttendanceRecord | undefined => {
  const employeeRecords = getRecordsForEmployee(employeeId);
  return employeeRecords[0]; // Already sorted descending by timestamp
};