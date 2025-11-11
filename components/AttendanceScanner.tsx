import React, { useState, useEffect } from 'react';
import type { Employee, AttendanceRecord } from '../types';
import { AttendanceStatus } from '../types';
import { addAttendanceRecord, getLastRecordForEmployee } from '../services/attendanceService';
import QRScanner from './QRScanner';
import { CheckCircleIcon, XCircleIcon, QrCodeIcon, LoadingIcon, MapPinIcon } from './icons';
import { formatTimestamp } from '../utils/date';

interface AttendanceScannerProps {
  employee: Employee;
  onScanComplete: () => Promise<void>;
}

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ employee, onScanComplete }) => {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');
  const [receipt, setReceipt] = useState<AttendanceRecord | null>(null);
  const [nextAction, setNextAction] = useState<AttendanceStatus>(AttendanceStatus.CHECK_IN);
  
  useEffect(() => {
    const determineNextAction = async () => {
      const lastRecord = await getLastRecordForEmployee(employee.id);
      setNextAction(lastRecord?.status === AttendanceStatus.CHECK_IN ? AttendanceStatus.CHECK_OUT : AttendanceStatus.CHECK_IN);
    };
    determineNextAction();
  }, [employee.id]);


  const nextActionText = nextAction === AttendanceStatus.CHECK_IN ? 'Check-in' : 'Check-out';

  const showResult = (state: 'error' | 'success', record?: AttendanceRecord, message?: string) => {
    setScanState(state);
    if(state === 'success' && record){
        setReceipt(record);
    }
    if (state === 'error' && message) {
        setErrorMessage(message);
    }
    setTimeout(() => {
      setScanState('idle');
      setErrorMessage('');
      setReceipt(null);
    }, 5000); // Show result for 5 seconds
  };
  
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    });
  }

  const handleScanSuccess = async (locationId: string) => {
    setScanState('processing');
    try {
      setProcessingMessage('Đang lấy vị trí của bạn...');
      const position = await getCurrentPosition();
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      
      setProcessingMessage(`Đang xác thực ${nextActionText}...`);
      const newRecord = await addAttendanceRecord(employee.id, nextAction, locationId, coords);

      await onScanComplete();
      showResult('success', newRecord);

    } catch (error: any) {
      // Handle Geolocation errors more specifically
      if (error.code && typeof error.code === 'number') {
        switch(error.code) {
          case 1: // PERMISSION_DENIED
            showResult('error', undefined, "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt.");
            break;
          case 2: // POSITION_UNAVAILABLE
            showResult('error', undefined, "Không thể xác định vị trí hiện tại. Vui lòng kiểm tra kết nối mạng và GPS.");
            break;
          case 3: // TIMEOUT
            showResult('error', undefined, "Yêu cầu vị trí đã hết hạn. Vui lòng thử lại.");
            break;
          default:
            showResult('error', undefined, `Lỗi vị trí không xác định (Mã: ${error.code}).`);
            break;
        }
      } else {
        // Handle other errors (e.g., from addAttendanceRecord)
        showResult('error', undefined, error.message || 'Đã xảy ra lỗi không xác định.');
      }
    } finally {
        setProcessingMessage('');
    }
  };

  const handleScanError = (error: string) => {
    showResult('error', undefined, error);
  };
  
  const handleCancel = () => {
    setScanState('idle');
  }

  // Idle State: Show the main button
  if (scanState === 'idle') {
    return (
      <button
        onClick={() => setScanState('scanning')}
        className="w-full px-6 py-4 text-lg font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-transform transform hover:scale-105 flex items-center justify-center gap-3"
      >
        <QrCodeIcon className="h-7 w-7" />
        <span>Quét mã QR để {nextActionText}</span>
      </button>
    );
  }

  // Scanning State: Show the QR Scanner and a cancel button
  if (scanState === 'scanning') {
    return (
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-4">Đưa mã QR vào trong khung</h3>
            <div className="rounded-lg overflow-hidden">
                <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
            </div>
            <button onClick={handleCancel} className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                Hủy
            </button>
        </div>
    );
  }
  
  if (scanState === 'success' && receipt) {
    return (
        <div className="w-full p-4 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-300 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 min-h-[290px]">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mb-3" />
            <h3 className="text-xl font-bold text-green-800 dark:text-green-200">Chấm công thành công!</h3>
            
            <div className="text-left mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300 w-full">
                <div className="flex justify-between">
                    <span className="font-semibold">Trạng thái:</span>
                    <span>{receipt.status === AttendanceStatus.CHECK_IN ? 'Check-in' : 'Check-out'}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="font-semibold">Thời gian:</span>
                    <span>{formatTimestamp(receipt.timestamp)}</span>
                </div>
                {receipt.latitude && receipt.longitude && (
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">Vị trí:</span>
                        <a href={`https://www.google.com/maps?q=${receipt.latitude},${receipt.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                            <span>Xem trên Bản đồ</span>
                            <span className="text-xs">({receipt.accuracy?.toFixed(0)}m)</span>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
  }

  if (scanState === 'error') {
     return (
        <div className={`w-full p-6 rounded-lg flex flex-col items-center justify-center gap-4 text-center transition-all duration-300 h-auto min-h-[290px] bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200`}>
            <XCircleIcon className={`h-16 w-16`} />
            <p className="text-xl font-semibold">
                {errorMessage}
            </p>
        </div>
    );
  }

  // Processing State
  return (
    <div className={`w-full p-6 rounded-lg flex flex-col items-center justify-center gap-4 text-center transition-all duration-300 h-auto min-h-[290px]`}>
        <div className={`p-6 rounded-lg flex flex-col items-center justify-center gap-4 text-center transition-all duration-300 w-full h-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200`}>
            <LoadingIcon className={`h-16 w-16 animate-spin`} />
            <p className="text-xl font-semibold">
                {processingMessage}
            </p>
        </div>
    </div>
  );
};

export default AttendanceScanner;