
export interface ScanItem {
  id: string;
  barcode: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR' | 'DUPLICATE';
  condition?: string;
  productName?: string;
  systemMessage?: string;
  logColor?: string;
  isDiscount?: boolean;
  isMrpMismatch?: boolean;
  apiData?: {
    oldMrp: number;
    discount: number;
    currentMrp: number;
    type?: string;
  };
}

export interface SessionStats {
  scannedQty: number;
  totalQty: number;
  referenceNumber: string;
  storeName: string;
}

export enum View {
  HOME = 'HOME',
  UPLOADED_DATA = 'UPLOADED_DATA',
  MESSAGES = 'MESSAGES',
  SCAN_REPORT = 'SCAN_REPORT',
  SLAB = 'SLAB',
  SETTINGS = 'SETTINGS',
  SUMMARY = 'SUMMARY',
  NEW_MRP = 'NEW_MRP'
}
