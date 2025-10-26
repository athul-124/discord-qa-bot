export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface Server {
  id: string;
  name: string;
  tier: 'free' | 'pro';
  linkedAt: Date;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
