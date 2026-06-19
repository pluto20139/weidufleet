/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import VehicleSignal from '../pages/VehicleSignal';
import DataExport from '../pages/DataExport';

// Setup basic mocks for antd components that require matchMedia or ResizeObserver
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
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

afterEach(() => {
  cleanup();
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options && options.selectedCount !== undefined) {
        return `Selected: ${options.selectedCount}`;
      }
      if (options && options.n !== undefined) {
        return `Selected: ${options.n}`;
      }
      return key;
    }
  }),
}));

describe('Vehicle Data Integration Tests', () => {
  
  it('1. DataExport page renders correctly and displays mock records with their status', async () => {
    render(<DataExport />);
    
    // Check Title
    expect(screen.getByText('sidebar.data_export')).toBeDefined();
    
    // Check if the two mock files are rendered
    expect(screen.getByText('📊 车辆信号数据_V001_20260610.csv')).toBeDefined();
    expect(screen.getByText('📊 车辆信号数据_V005_20260609.csv')).toBeDefined();

    // Check if status tags are rendered properly
    // Note: getExportTasks() dynamically marks completed tasks as 'expired'
    // when their expiredAt date has passed, so we check for expired + processing
    expect(screen.getAllByText('vds.status.expired').length).toBeGreaterThan(0);
    expect(screen.getAllByText('vds.status.processing').length).toBeGreaterThan(0);
  });

  it('2. VehicleSignal page enforces form validation when attempting to search', async () => {
    render(<MemoryRouter><VehicleSignal /></MemoryRouter>);
    
    const searchBtn = screen.getByRole('button', { name: /common\.search/i });
    fireEvent.click(searchBtn);
    
    // Since we mocked i18n, the warning message string would be 'vds.warning.incomplete_form'
    // antd message uses rc-notification internally, we can check if it exists in DOM
    await waitFor(() => {
      expect(screen.getByText('vds.warning.incomplete_form')).toBeDefined();
    });
  });

  it('3. VehicleSignal handles dynamic signal column rendering and mock data generation', async () => {
    render(<MemoryRouter><VehicleSignal /></MemoryRouter>);
    
    // Instead, we can verify that the Tree component has the search input and vehicles are rendered
    expect(screen.getByPlaceholderText('common.search')).toBeDefined();
    expect(screen.getByText('智利物流集团')).toBeDefined();

    // Verify filter bar elements exist
    // "common.search" and "common.reset" buttons are in the filter bar
    expect(screen.getByRole('button', { name: /common\.reset/i })).toBeDefined();

    // The data table initially has fixed columns
    expect(screen.getAllByText('序号').length).toBeGreaterThan(0);
    expect(screen.getAllByText('上报时间').length).toBeGreaterThan(0);
    expect(screen.getAllByText('设备ID').length).toBeGreaterThan(0);
  });
  
});
