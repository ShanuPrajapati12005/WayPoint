import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from './UserMenu';
import { useApp } from '@/context/AppContext';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock ResizeObserver for Radix UI
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('UserMenu Component', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    useApp.mockReturnValue({
      userProfile: {
        name: 'Prashant Kumar',
        email: 'prashant@example.com',
        targetRole: 'Data Scientist'
      },
      logout: mockLogout
    });
  });

  it('renders avatar initials correctly', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );
    // Check if the trigger button renders the initials
    const avatar = screen.getByLabelText('Account menu — profile and log out');
    expect(avatar).toHaveTextContent('PK');
  });

  it('opens dropdown and displays user details', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );
    
    const trigger = screen.getByLabelText('Account menu — profile and log out');
    fireEvent.click(trigger);
    
    // Check dropdown content
    expect(screen.getByText('Prashant Kumar')).toBeInTheDocument();
    expect(screen.getByText('prashant@example.com')).toBeInTheDocument();
    expect(screen.getByText('Data Scientist')).toBeInTheDocument();
  });
});
