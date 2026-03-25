export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  budget: number;
  startDate: string;
  endDate?: string;
}

export interface Payment {
  id: string;
  projectId: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  paidDate?: string;
}

export interface Invoice {
  id: string;
  paymentId: string;
  number: string;
  issuedDate: string;
  dueDate: string;
  items: InvoiceItem[];
  total: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface TechAsset {
  id: string;
  name: string;
  type: 'server' | 'domain' | 'database' | 'api-key';
  provider: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'warning';
}

export interface Credential {
  id: string;
  assetId: string;
  label: string;
  username: string;
  password?: string;
  key?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
