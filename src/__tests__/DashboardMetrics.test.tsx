/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Dashboard from '../pages/Dashboard';

// Mock matchMedia for ant design components
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), 
      removeListener: vi.fn(), 
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultText?: string) => defaultText || key
  }),
}));

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart" />
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="mock-map">{children}</div>,
  TileLayer: () => <div />,
  CircleMarker: () => <div />,
  Popup: () => <div />
}));

describe('Dashboard Component Metrics', () => {
  it('renders all required metrics on the top cards, including total and low battery', () => {
    render(<Dashboard />);
    
    // Check for the presence of all 8 metric titles
    expect(screen.getByText('dash.total')).toBeDefined();
    expect(screen.getByText('dash.online')).toBeDefined();
    expect(screen.getByText('dash.offline')).toBeDefined();
    expect(screen.getByText('dash.km_today')).toBeDefined();
    expect(screen.getByText('dash.km_total')).toBeDefined();
    expect(screen.getByText('dash.alerts')).toBeDefined();
    expect(screen.getByText('dash.fence')).toBeDefined();
    expect(screen.getByText('dash.low_bat')).toBeDefined();
  });
});
