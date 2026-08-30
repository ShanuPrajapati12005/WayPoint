import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Profile from './Profile';
import { useApp } from '@/context/AppContext';

// Mock the context
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

describe('Profile Component', () => {
  const mockSetUserProfile = vi.fn();
  
  beforeEach(() => {
    useApp.mockReturnValue({
      userProfile: {
        name: 'John Doe',
        email: 'john@example.com',
        targetRole: 'Software Engineer',
        weeklyTimeHours: 10,
        stats: { xp: 1200, streak: 5 },
        detailedContext: {
          dreamCompany: 'Google',
          strengths: 'React',
          weaknesses: 'Backend',
          preferredLanguages: ['JavaScript', 'Python']
        }
      },
      setUserProfile: mockSetUserProfile,
      tracks: {
        'track-1': {
          nodeMap: {
            'node-1': { status: 'completed' },
            'node-2': { status: 'not_started' }
          }
        }
      }
    });
  });

  it('renders personal information correctly', () => {
    render(<Profile />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders learner context correctly', () => {
    render(<Profile />);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('10 hours / week')).toBeInTheDocument();
  });

  it('toggles personal info edit mode', () => {
    render(<Profile />);
    const editBtns = screen.getAllByText('Edit');
    // First edit button is for personal info
    fireEvent.click(editBtns[0]);
    
    // Expect input fields to appear
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    
    // Cancel editing
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument();
  });

  it('toggles learner context edit mode', () => {
    render(<Profile />);
    const editBtn = screen.getByText('Edit Details');
    fireEvent.click(editBtn);
    
    expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Google')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByDisplayValue('Google')).not.toBeInTheDocument();
  });
});
