import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (locationId: string) => void;
  onScanError: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      },
      false
    );
    scannerRef.current = scanner;

    const success = (decodedText: string) => {
      scanner.clear();
      try {
        const data = JSON.parse(decodedText);
        if (data.locationId) {
          onScanSuccess(data.locationId);
        } else {
          onScanError('Mã QR không hợp lệ (thiếu dữ liệu).');
        }
      } catch (e) {
        onScanError('Mã QR không hợp lệ (sai định dạng).');
      }
    };

    const error = (err: any) => {
      // console.warn(err); // can be noisy
    };

    scanner.render(success, error);

    return () => {
       if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error("Failed to clear html5-qrcode-scanner.", err);
        });
      }
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id="reader" className="w-full"></div>;
};

export default QRScanner;