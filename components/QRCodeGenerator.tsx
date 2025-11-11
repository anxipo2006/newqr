import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Location } from '../types';

interface QRCodeGeneratorProps {
    locations: Location[];
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ locations }) => {
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [qrValue, setQrValue] = useState<string>('');

    useEffect(() => {
        if (!selectedLocationId) {
            setQrValue('');
            return;
        }

        const generateQrValue = () => {
            const payload = {
                locationId: selectedLocationId,
            };
            setQrValue(JSON.stringify(payload));
        };
        
        generateQrValue();

    }, [selectedLocationId]);

    if(locations.length === 0) {
        return (
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col items-center justify-center h-full text-center">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Chưa có địa điểm</h2>
                 <p className="text-gray-600 dark:text-gray-400">Vui lòng thêm một địa điểm trong tab "Quản lý Địa điểm" để tạo mã QR.</p>
             </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Mã QR Chấm Công</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Chọn một địa điểm để tạo mã QR. Mã này là tĩnh và có thể in ra.</p>
            
            <div className="w-full max-w-xs mb-6">
                <label htmlFor="location-qr-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chọn địa điểm</label>
                <select 
                    id="location-qr-select" 
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="" disabled>-- Vui lòng chọn --</option>
                    {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                </select>
            </div>
            
            {selectedLocationId ? (
                <>
                    <div className="p-4 bg-white rounded-lg shadow-inner relative">
                        <QRCodeSVG value={qrValue} size={256} includeMargin={true} />
                        {!qrValue && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <p>Đang tạo mã...</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="p-4 flex items-center justify-center h-[288px]">
                     <p className="text-gray-500 dark:text-gray-400">Vui lòng chọn một địa điểm để hiển thị mã QR.</p>
                </div>
            )}
        </div>
    );
};

export default QRCodeGenerator;