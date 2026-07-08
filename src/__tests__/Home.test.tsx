import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
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
          createdAt: Date.now(),
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
    
    const createProjectMock = jest.fn();
    const openMock = jest.fn();

    render(<Home data={mockData} createProject={createProjectMock} me="Alice" open={openMock} />);

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
    
    expect(createProjectMock).toHaveBeenCalledTimes(1);
    expect(createProjectMock).toHaveBeenCalledWith({
      name: 'Project Beta',
      client: '',
      stripe: 1 // mockData has 1 project, so length % 5 = 1
    });
  });
});
