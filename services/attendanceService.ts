import { db } from './firebaseConfig';

import { AttendanceStatus } from '../types';
import type { Employee, AttendanceRecord, Shift, CurrentUser, Location } from '../types';
import { getTimeToday } from '../utils/date';


// --- Collection References ---
// FIX: Use v8 compat syntax for collection references
const locationsCol = db.collection('locations');
const shiftsCol = db.collection('shifts');
const employeesCol = db.collection('employees');
const recordsCol = db.collection('records');


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
export const getLocations = async (): Promise<Location[]> => {
  // FIX: Use v8 compat syntax for getting documents
  const snapshot = await locationsCol.get();
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Location));
};

export const addLocation = async (location: Omit<Location, 'id'>): Promise<Location> => {
  // FIX: Use v8 compat syntax for adding a document
  const docRef = await locationsCol.add(location);
  return { ...location, id: docRef.id };
};

export const updateLocation = async (locationId: string, updates: Partial<Omit<Location, 'id'>>): Promise<Location> => {
    // FIX: Use v8 compat syntax for document reference, update, and get
    const docRef = db.collection('locations').doc(locationId);
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return { ...updatedDoc.data(), id: locationId } as Location;
};

export const deleteLocation = async (locationId: string): Promise<void> => {
  // FIX: Use v8 compat syntax for deleting a document
  await db.collection('locations').doc(locationId).delete();
  // In a real app, you might want to handle unassigning employees using a Cloud Function for atomicity.
  // For simplicity, we'll require manual reassignment.
};


// --- Authentication ---
export const login = async (
  role: 'admin' | 'employee',
  credentials: { username?: string; password?: string; deviceCode?: string }
): Promise<CurrentUser | null> => {
  if (role === 'admin') {
    if (credentials.username?.toLowerCase() === 'admin' && credentials.password === 'admin123') {
      return { id: 'admin', name: 'Admin', username: 'admin' };
    }
    return null;
  }

  if (role === 'employee') {
    if (!credentials.deviceCode) return null;
    // FIX: Use v8 compat syntax for query
    const q = employeesCol.where("deviceCode", "==", credentials.deviceCode.toUpperCase()).limit(1);
    const snapshot = await q.get();
    if (snapshot.empty) {
        return null;
    }
    const employeeDoc = snapshot.docs[0];
    return { ...employeeDoc.data(), id: employeeDoc.id } as Employee;
  }

  return null;
};

// --- Shift Management ---
export const getShifts = async (): Promise<Shift[]> => {
  // FIX: Use v8 compat syntax for getting documents
  const snapshot = await shiftsCol.get();
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Shift));
};

export const addShift = async (name: string, startTime: string, endTime: string): Promise<Shift> => {
  if (!name.trim() || !startTime.trim() || !endTime.trim()) {
    throw new Error('Vui lòng điền đầy đủ thông tin ca làm việc.');
  }
  const newShift: Omit<Shift, 'id'> = {
    name: name.trim(),
    startTime,
    endTime,
  };
  // FIX: Use v8 compat syntax for adding a document
  const docRef = await shiftsCol.add(newShift);
  return { ...newShift, id: docRef.id };
};

export const updateShift = async (shiftId: string, updates: Partial<Omit<Shift, 'id'>>): Promise<Shift> => {
    // FIX: Use v8 compat syntax for document reference, update, and get
    const docRef = db.collection('shifts').doc(shiftId);
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return { ...updatedDoc.data(), id: shiftId } as Shift;
};

export const deleteShift = async (id: string): Promise<void> => {
  // FIX: Use v8 compat syntax for deleting a document
  await db.collection('shifts').doc(id).delete();
};


// --- Employee Management ---
export const getEmployees = async (): Promise<Employee[]> => {
  // FIX: Use v8 compat syntax for getting documents
  const snapshot = await employeesCol.get();
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Employee));
};

const generateDeviceCode = (): string => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export const addEmployee = async (name: string, username: string, password: string, shiftId?: string, locationId?: string): Promise<Employee> => {
  if (!name.trim() || !username.trim() || !password.trim()) {
    throw new Error('Vui lòng điền đầy đủ thông tin.');
  }
  
  const trimmedUsername = username.trim();
  // FIX: Use v8 compat syntax for query
  const q = employeesCol.where("username", "==", trimmedUsername);
  const existing = await q.get();
  if (!existing.empty) {
      throw new Error('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
  }

  const newEmployee: Omit<Employee, 'id'> = {
    name: name.trim(),
    username: trimmedUsername,
    password: password, // In a real app, this should be hashed server-side
    deviceCode: generateDeviceCode(),
    shiftId: shiftId || null,
    locationId: locationId || null,
  };
  // FIX: Use v8 compat syntax for adding a document
  const docRef = await employeesCol.add(newEmployee);
  return { ...newEmployee, id: docRef.id };
};

export const updateEmployee = async (employeeId: string, updates: Partial<Omit<Employee, 'id' | 'deviceCode'>>): Promise<Employee> => {
  // FIX: Use v8 compat syntax for document reference
  const docRef = db.collection('employees').doc(employeeId);

  if (updates.username) {
    const trimmedUsername = updates.username.trim();
    if (!trimmedUsername) {
        throw new Error('Tên đăng nhập không được để trống.');
    }
    // FIX: Use v8 compat syntax for query
    const q = employeesCol.where("username", "==", trimmedUsername);
    const existing = await q.get();
    if (!existing.empty && existing.docs[0].id !== employeeId) {
        throw new Error('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
    }
    updates.username = trimmedUsername;
  }
  
  if ('deviceCode' in updates) {
      delete (updates as any).deviceCode;
  }

  // FIX: Use v8 compat syntax for update and get
  await docRef.update(updates);
  
  const updatedDoc = await docRef.get();
  if (!updatedDoc.exists) {
      throw new Error("Không tìm thấy nhân viên sau khi cập nhật.");
  }
  return { ...updatedDoc.data(), id: updatedDoc.id } as Employee;
};

export const deleteEmployee = async (employeeId: string): Promise<void> => {
  // FIX: Use v8 compat syntax for batch and document reference
  const batch = db.batch();
  const employeeRef = db.collection('employees').doc(employeeId);
  batch.delete(employeeRef);

  // FIX: Use v8 compat syntax for query
  const recordsQuery = recordsCol.where("employeeId", "==", employeeId);
  const recordsSnapshot = await recordsQuery.get();
  recordsSnapshot.forEach(recordDoc => {
    batch.delete(recordDoc.ref);
  });
  
  await batch.commit();
};

// --- Attendance Management ---
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
    // FIX: Use v8 compat syntax for query
    const q = recordsCol.orderBy('timestamp', 'desc');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as AttendanceRecord));
};

export const getRecordsForEmployee = async (employeeId: string): Promise<AttendanceRecord[]> => {
    // FIX: Use v8 compat syntax for query
    const q = recordsCol.where('employeeId', '==', employeeId);
    const snapshot = await q.get();
    const records = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as AttendanceRecord));
    // Sort client-side to avoid needing a composite index
    return records.sort((a, b) => b.timestamp - a.timestamp);
};

export const getLastRecordForEmployee = async (employeeId: string): Promise<AttendanceRecord | null> => {
    // FIX: Use v8 compat syntax for query
    const q = recordsCol.where('employeeId', '==', employeeId);
    const snapshot = await q.get();
    if (snapshot.empty) {
        return null;
    }
    // Sort client-side to get the latest record, avoiding a composite index
    const records = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as AttendanceRecord));
    records.sort((a, b) => b.timestamp - a.timestamp);
    return records.length > 0 ? records[0] : null;
};

export const addAttendanceRecord = async (
  employeeId: string,
  status: AttendanceStatus,
  scannedLocationId: string,
  coords: { latitude: number; longitude: number; accuracy: number }
): Promise<AttendanceRecord> => {
  // FIX: Use v8 compat syntax for getting a document
  const employeeSnap = await db.collection('employees').doc(employeeId).get();
  if (!employeeSnap.exists) throw new Error('Nhân viên không tồn tại.');
  const employee = { ...employeeSnap.data(), id: employeeSnap.id } as Employee;

  const lastRecord = await getLastRecordForEmployee(employeeId);

  if (status === AttendanceStatus.CHECK_IN && lastRecord?.status === AttendanceStatus.CHECK_IN) {
    throw new Error('Bạn đã check-in rồi. Vui lòng check-out trước.');
  }
  if (status === AttendanceStatus.CHECK_OUT && lastRecord?.status !== AttendanceStatus.CHECK_IN) {
    throw new Error('Bạn chưa check-in. Vui lòng check-in trước.');
  }

  if (employee.locationId && employee.locationId !== scannedLocationId) {
      throw new Error('Mã QR không hợp lệ cho địa điểm làm việc của bạn.');
  }

  // FIX: Use v8 compat syntax for getting a document
  const locationSnap = await db.collection('locations').doc(scannedLocationId).get();
  if (!locationSnap.exists) throw new Error('Địa điểm làm việc không hợp lệ hoặc đã bị xóa.');
  const location = { ...locationSnap.data(), id: locationSnap.id } as Location;
  
  const distance = haversineDistance(coords, { latitude: location.latitude, longitude: location.longitude });
  
  // Account for GPS inaccuracy. We only fail if the user's *closest possible* location
  // (based on accuracy) is still outside the radius.
  if (distance - coords.accuracy > location.radius) {
      throw new Error(`Bạn đang ở quá xa địa điểm làm việc. (Khoảng cách: ${distance.toFixed(0)}m, bán kính cho phép: ${location.radius}m, độ chính xác vị trí: ${coords.accuracy.toFixed(0)}m)`);
  }

  let shiftName: string | undefined;
  let isLate: boolean = false;
  let isEarly: boolean = false;

  if (employee.shiftId) {
    // FIX: Use v8 compat syntax for getting a document
    const shiftSnap = await db.collection('shifts').doc(employee.shiftId).get();
    if (shiftSnap.exists) {
        const shift = { ...shiftSnap.data(), id: shiftSnap.id } as Shift;
        shiftName = shift.name;
        const now = new Date();
        const shiftStartTime = getTimeToday(shift.startTime);
        const shiftEndTime = getTimeToday(shift.endTime);
        const gracePeriodMinutes = 5; 
        
        if (status === AttendanceStatus.CHECK_IN) {
            const graceTime = new Date(shiftStartTime.getTime() + gracePeriodMinutes * 60000);
            isLate = now > graceTime;
        } else if (status === AttendanceStatus.CHECK_OUT) {
            isEarly = now < shiftEndTime;
        }
    }
  }

  const recordToSave = {
    employeeId,
    employeeName: employee.name,
    username: employee.username,
    timestamp: Date.now(),
    status,
    isLate,
    isEarly,
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    ...(shiftName && { shiftName }),
  };

  // FIX: Use v8 compat syntax for adding a document
  const docRef = await recordsCol.add(recordToSave);
  return { ...recordToSave, id: docRef.id } as AttendanceRecord;
};

// --- Data Fetching ---
export const getInitialData = async () => {
    const [employees, records, shifts, locations] = await Promise.all([
        getEmployees(),
        getAttendanceRecords(),
        getShifts(),
        getLocations()
    ]);
    return { employees, records, shifts, locations };
};
