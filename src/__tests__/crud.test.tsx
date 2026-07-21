import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Todos } from '../components/project/Todos';
import { Diskusi } from '../components/project/Diskusi';
import { Files } from '../components/project/Files';
import { Project } from '../types';

jest.mock('@/app/project/[slug]/clientActions', () => ({
  addListAction: jest.fn(async () => ({ id: 'db-list-id' })),
  removeListAction: jest.fn(async () => ({ success: true })),
  addTodoAction: jest.fn(async () => ({ id: 'db-todo-id' })),
  updateTodoAction: jest.fn(async () => ({ success: true })),
  removeTodoAction: jest.fn(async () => ({ success: true })),
}));

describe('CRUD Fitur Project (Todos, Diskusi, & Assets)', () => {
  const mockProject: Project = {
    id: 'p1',
    name: 'Test Project',
    stripe: 0,
    client: '',
    createdAt: Date.now(),
    lists: [{ id: 'l1', name: 'Feed', todos: [] }],
    threads: [],
    files: [],
    notes: [],
    logs: [],
    targets: {},
    ads: { nonAds: false, entries: [] }
  };

  it('bisa menambah list tugas (Create) dan menghapus list (Delete)', () => {
    const updateMock = jest.fn();
    render(<Todos project={mockProject} update={updateMock} team={['Sari']} />);
    
    // Create List
    const inputList = screen.getByPlaceholderText('Daftar tugas baru, mis. Konten Feed · Stories · Artikel · Ads');
    fireEvent.change(inputList, { target: { value: 'Ads' } });
    fireEvent.click(screen.getByText('+ Daftar'));
    
    expect(updateMock).toHaveBeenCalled();
    const updated = updateMock.mock.calls[0][0](mockProject);
    expect(updated.lists.length).toBe(2);
    expect(updated.lists[1].name).toBe('Ads');

    // Delete List
    const deleteBtns = screen.getAllByText('hapus');
    fireEvent.click(deleteBtns[0]); // hapus list 'Feed'

    expect(updateMock).toHaveBeenCalledTimes(2);
    const deletedList = updateMock.mock.calls[1][0](mockProject);
    expect(deletedList.lists.length).toBe(0);
  });

  it('bisa menambah tugas dalam list (Create Todo)', () => {
    const updateMock = jest.fn();
    render(<Todos project={mockProject} update={updateMock} team={['Sari']} />);

    const inputTodo = screen.getByPlaceholderText('Tambah tugas…');
    fireEvent.change(inputTodo, { target: { value: 'Bikin desain' } });
    
    const tambahBtn = screen.getByText('Tambah');
    fireEvent.click(tambahBtn);

    expect(updateMock).toHaveBeenCalledTimes(1);
    const updated = updateMock.mock.calls[0][0](mockProject);
    expect(updated.lists[0].todos.length).toBe(1);
    expect(updated.lists[0].todos[0].text).toBe('Bikin desain');
  });

  it('bisa membuat diskusi baru (Create Thread)', () => {
    const updateMock = jest.fn();
    const setViewMock = jest.fn();
    render(<Diskusi project={mockProject} update={updateMock} me="Sari" view={{ tab: 'diskusi' }} setView={setViewMock} team={['Sari']} />);

    fireEvent.click(screen.getByText('+ Diskusi baru'));
    
    const inputTitle = screen.getByPlaceholderText('Judul, mis. Revisi konsep feed minggu ke-2');
    fireEvent.change(inputTitle, { target: { value: 'Diskusi Awal' } });

    const btnTerbit = screen.getByText('Terbitkan');
    fireEvent.click(btnTerbit);

    expect(updateMock).toHaveBeenCalledTimes(1);
    const updated = updateMock.mock.calls[0][0];
    expect(updated.threads.length).toBe(1);
    expect(updated.threads[0].title).toBe('Diskusi Awal');
  });

  it('bisa menyimpan asset/file baru ke dalam database (Create Asset)', () => {
    const updateMock = jest.fn();
    render(<Files project={mockProject} update={updateMock} me="Sari" />);
    
    const inputName = screen.getByPlaceholderText('Nama file, mis. Brand guideline');
    fireEvent.change(inputName, { target: { value: 'Aset Logo' } });

    const inputUrl = screen.getByPlaceholderText('Tautan (Google Drive, Figma, Canva…)');
    fireEvent.change(inputUrl, { target: { value: 'drive.google.com/logo' } });

    const btnSimpan = screen.getByText('Simpan');
    fireEvent.click(btnSimpan);

    expect(updateMock).toHaveBeenCalledTimes(1);
    const updated = updateMock.mock.calls[0][0];
    
    // Pastikan data asset tersimpan (disalurkan ke `update` yang mana akan dipush ke database oleh storage.ts)
    expect(updated.files.length).toBe(1);
    expect(updated.files[0].name).toBe('Aset Logo');
    expect(updated.files[0].url).toBe('https://drive.google.com/logo');
  });
});
