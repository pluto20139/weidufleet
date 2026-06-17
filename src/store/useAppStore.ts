import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang, PageKey, TenantItem } from '@/types';

interface AppState {
  page: PageKey | 'login';
  lang: Lang;
  user: { name: string; email: string; mustChangePassword?: boolean } | null;
  token: string | null;
  tenant: string | null;
  tenants: TenantItem[];
  detail: string | null;
  _vf: { vin?: string; plate?: string; device?: string; batteryVer?: string; minAge?: number | null; maxAge?: number | null };
  _rt: string;
  _dt: string;
  _dr: string;
  _bt: string;
  _mt: string;
  _vt: string;
  _dv: string;
  bz: string;
  setPage: (page: PageKey | 'login') => void;
  setLang: (lang: Lang) => void;
  setUser: (user: AppState['user']) => void;
  setToken: (token: string | null) => void;
  setTenant: (tenant: string | null) => void;
  setTenants: (tenants: TenantItem[]) => void;
  setDetail: (detail: string | null) => void;
  setVf: (vf: Partial<AppState['_vf']>) => void;
  setRt: (rt: string) => void;
  setDt: (dt: string) => void;
  setDr: (dr: string) => void;
  setBt: (bt: string) => void;
  setMt: (mt: string) => void;
  setVt: (vt: string) => void;
  setDv: (dv: string) => void;
  setBz: (bz: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      page: 'login',
      lang: 'en',
      user: null,
      token: null,
      tenant: 'ten1',
      tenants: [],
      detail: null,
      _vf: {},
      _rt: 'fence',
      _dt: 'alert',
      _dr: 'week',
      _bt: 'monitor',
      _mt: 'location',
      _vt: 'risk',
      _dv: '',
      bz: 'permission',
      setPage: (page) => set({ page }),
      setLang: (lang) => set({ lang }),
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setTenant: (tenant) => set({ tenant }),
      setTenants: (tenants) => set({ tenants }),
      setDetail: (detail) => set({ detail }),
      setVf: (vf) => set((s) => ({ _vf: { ...s._vf, ...vf } })),
      setRt: (rt) => set({ _rt: rt }),
      setDt: (dt) => set({ _dt: dt }),
      setDr: (dr) => set({ _dr: dr }),
      setBt: (bt) => set({ _bt: bt }),
      setMt: (mt) => set({ _mt: mt }),
      setVt: (vt) => set({ _vt: vt }),
      setDv: (dv) => set({ _dv: dv }),
      setBz: (bz) => set({ bz }),
    }),
    {
      name: 'weidu-fleet-storage',
      partialize: (state) => ({
        page: state.page,   // 必须持久化 page 否则刷新后认证态丢失
        user: state.user,
        token: state.token,
        lang: state.lang,
        tenant: state.tenant,
      }),
    }
  )
);
