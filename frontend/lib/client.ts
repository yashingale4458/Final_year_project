// API Client for Drushti AI — Anti-Cheat Environment Backend

import { Camera, Incident, DetectionSettings } from './api'

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new ApiError(response.status, error.detail || 'Request failed')
  }

  return response.json()
}

// Camera API
export const cameraApi = {
  list: () => fetchApi<Camera[]>('/api/cameras'),

  get: (id: string) => fetchApi<Camera>(`/api/cameras/${id}`),

  create: (data: { name: string; stream_url: string; location?: string }) =>
    fetchApi<Camera>('/api/cameras', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/api/cameras/${id}`, { method: 'DELETE' }),

  startStream: (id: string) =>
    fetchApi<{ message: string }>(`/api/cameras/${id}/start`, { method: 'POST' }),

  stopStream: (id: string) =>
    fetchApi<{ message: string }>(`/api/cameras/${id}/stop`, { method: 'POST' }),
}

// Incidents API
export const incidentApi = {
  list: (params?: { camera_id?: string; behavior?: string; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.camera_id) query.set('camera_id', params.camera_id)
    if (params?.behavior) query.set('behavior', params.behavior)
    if (params?.limit) query.set('limit', params.limit.toString())
    return fetchApi<Incident[]>(`/api/incidents?${query.toString()}`)
  },

  get: (id: string) => fetchApi<Incident>(`/api/incidents/${id}`),

  exportCsv: () => fetchApi<{ csv: string }>('/api/incidents/export/csv'),
}

// Settings API
export const settingsApi = {
  get: () => fetchApi<DetectionSettings>('/api/settings'),

  update: (settings: Partial<DetectionSettings>) =>
    fetchApi<DetectionSettings>('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
}

// WebSocket connection factory
export function createWebSocket(cameraId: string): WebSocket {
  const wsUrl = API_URL.replace('http', 'ws')
  return new WebSocket(`${wsUrl}/ws/feed/${cameraId}`)
}

export function createStatusWebSocket(): WebSocket {
  const wsUrl = API_URL.replace('http', 'ws')
  return new WebSocket(`${wsUrl}/ws/status`)
}