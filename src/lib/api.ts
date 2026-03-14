import type { Note, User } from '@/db/types'

export type { Note, User }

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchNotes(): Promise<Note[]> {
  const data = await request<{ notes: Note[] }>('/api/notes')
  return data.notes
}

export async function fetchNote(id: string): Promise<Note> {
  return request<Note>(`/api/notes/${id}`)
}

export async function createNote(body?: { title?: string; content?: unknown }): Promise<Note> {
  return request<Note>('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

export async function updateNote(id: string, body: { title?: string | null; content?: unknown; synthesis?: string | null }): Promise<Note> {
  return request<Note>(`/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function deleteNote(id: string): Promise<void> {
  await request<{ deleted: boolean }>(`/api/notes/${id}`, { method: 'DELETE' })
}

export async function fetchTrash(): Promise<Note[]> {
  const data = await request<{ notes: Note[] }>('/api/notes/trash')
  return data.notes
}

export async function restoreNote(id: string): Promise<Note> {
  return request<Note>(`/api/notes/${id}/restore`, { method: 'POST' })
}

export async function permanentlyDeleteNote(id: string): Promise<void> {
  await request<{ deleted: boolean }>(`/api/notes/${id}/permanent`, { method: 'DELETE' })
}

export async function fetchCurrentUser(): Promise<User> {
  return request<User>('/api/users/me')
}

export async function updateCurrentUser(body: { display_name?: string; color_theme?: string }): Promise<User> {
  return request<User>('/api/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
