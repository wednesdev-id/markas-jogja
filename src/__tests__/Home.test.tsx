import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Home } from '../components/Home';
import { MarkasData } from '../types';

describe('Home Component', () => {
  it('renders projects and handles new project creation', () => {
    const mockData: MarkasData = {
      team: ['Alice', 'Bob'],
      projects: [
        {
          id: 'p1',
          name: 'Project Alpha',
          stripe: 0,
          client: 'Client A',
          lists: [],
          threads: [],
          files: [],
          notes: [],
          logs: [],
          targets: {},
          ads: { nonAds: false, entries: [] }
        }
      ],
      notes: []
    };
    
    const persistMock = jest.fn();
    const openMock = jest.fn();

    render(<Home data={mockData} persist={persistMock} me="Alice" open={openMock} />);

    // Verify existing project is rendered
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    
    // Check if new project form can be opened
    const newProjectBtn = screen.getByText('+ Proyek baru');
    fireEvent.click(newProjectBtn);
    
    // Add new project
    const nameInput = screen.getByPlaceholderText('Nama proyek / brand, mis. Kenangan Jogja');
    fireEvent.change(nameInput, { target: { value: 'Project Beta' } });
    
    const saveBtn = screen.getByText('Buat');
    fireEvent.click(saveBtn);
    
    expect(persistMock).toHaveBeenCalledTimes(1);
    const updatedData = persistMock.mock.calls[0][0];
    expect(updatedData.projects.length).toBe(2);
    expect(updatedData.projects[0].name).toBe('Project Beta');
  });
});
