import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { useApp } from '@/context/AppContext';

vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock Recharts since it uses ResizeObserver which isn't in jsdom by default
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  RadarChart: () => <div data-testid="radar-chart" />,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  Radar: () => null,
  Legend: () => null,
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    useApp.mockReturnValue({
      activeTrackId: 'track-1',
      isLoading: false,
      userProfile: {
        stats: { streak: 10 },
        weeklyTimeHours: 5,
        detailedContext: {
          education: 'B.Tech',
          strengths: 'Logic'
        }
      },
      tracks: {
        'track-1': {
          id: 'track-1',
          label: 'Data Science',
          nodeMap: {
            'node-1': { status: 'completed' },
            'node-2': { status: 'not_started' }
          },
          skillData: [
            { skill: 'Python', current: 80, target: 100 },
            { skill: 'Math', current: 20, target: 90 }
          ]
        }
      }
    });
  });

  it('renders progress header', () => {
    render(<Dashboard />);
    expect(screen.getByText('Your Progress')).toBeInTheDocument();
    expect(screen.getByText('Data Science Track')).toBeInTheDocument();
  });

  it('renders skill gaps and stats', () => {
    render(<Dashboard />);
    // Check stat tiles
    expect(screen.getByText('Day streak')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    
    // Check if skill gaps are rendered
    expect(screen.getByText('Specific Skill Gaps')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument(); // large gap
  });

  it('renders learner profile snippet', () => {
    render(<Dashboard />);
    expect(screen.getByText('Learner Profile')).toBeInTheDocument();
    expect(screen.getByText('B.Tech')).toBeInTheDocument();
  });
});
