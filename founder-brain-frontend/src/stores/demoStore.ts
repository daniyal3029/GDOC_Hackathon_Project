import { create } from 'zustand';

interface DemoStore {
  userId: string;
  userName: string;
}

export const useDemoStore = create<DemoStore>(() => ({
  userId: import.meta.env.VITE_DEMO_USER_ID || 'demo-user-001',
  userName: 'Daniyal',
}));
