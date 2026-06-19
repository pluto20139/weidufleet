/**
 * Store barrel export.
 * Currently backed by useAppStore (single store).
 * Future: split into domain stores (useAuthStore, useTenantStore, useUIStore)
 * and re-export them here without changing consumer import paths.
 */
export { useAppStore } from './useAppStore';
