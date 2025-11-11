export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface Employee {
  id: string;
  username: string; // Unique login identifier
  password: string; // Hashing should be used in a real app
  name: string; // Display name
  deviceCode: string; // 5-character unique device/account identifier
  shiftId?: string | null; // Optional link to a Shift, allow null for "no shift"
  locationId?: string | null; // Optional link to a Location, allow null for "no location"
}

// FIX: Add CurrentUser type definition here to be shared across the app.
export type CurrentUser = Employee | { id: 'admin'; name: 'Admin', username: 'admin' };

export enum AttendanceStatus {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  username: string; // Replaced employeeCode
  timestamp: number;
  status: AttendanceStatus;
  shiftName?: string; // To display in logs
  isLate?: boolean;
  isEarly?: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}