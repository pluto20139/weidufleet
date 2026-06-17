/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import LocationPrivacy from '../components/LocationPrivacy';
import { truncateLocation } from '@/utils/masking';

afterEach(() => {
  cleanup();
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultText?: string) => defaultText || key
  }),
}));

describe('LocationPrivacy Component', () => {
  it('initially hides the real location and shows the click-to-view text', () => {
    const realLocation = "智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号";
    render(<LocationPrivacy text={realLocation} />);

    // The real location should not be in the DOM
    expect(screen.queryByText(realLocation)).toBeNull();

    // The placeholder text "查看位置" should be in the DOM
    expect(screen.getAllByText('查看位置').length).toBeGreaterThan(0);
  });

  it('reveals the street-level location after clicking (V1.2: truncated to street)', () => {
    const realLocation = "智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号";
    const streetLevel = truncateLocation(realLocation);
    render(<LocationPrivacy text={realLocation} />);

    const viewBtn = screen.getAllByText('查看位置')[0];
    if (viewBtn) fireEvent.click(viewBtn);

    // V1.2: the displayed text is truncated to street level (no building number)
    expect(screen.getByText(streetLevel)).toBeDefined();

    // The full address including building number should NOT appear
    expect(screen.queryByText(realLocation)).toBeNull();

    // The placeholder text should disappear
    expect(screen.queryByText('查看位置')).toBeNull();
  });
});
