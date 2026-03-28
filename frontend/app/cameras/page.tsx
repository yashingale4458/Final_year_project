'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { cameraApi } from '@/lib/client'
import { Camera } from '@/lib/api'
import {
  Plus,
  Trash2,
  Play,
  Square,
  Camera as CameraIcon,
  Wifi,
  WifiOff,
  Monitor,
  Loader2,
  MapPin,
} from 'lucide-react'

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    stream_url: '0',
    location: '',
    useWebcam: true,
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchCameras = useCallback(async () => {
    try {
      const data = await cameraApi.list()
      setCameras(data)
    } catch (err) {
      console.error('Failed to fetch cameras:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCameras()
  }, [fetchCameras])

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await cameraApi.create({
        name: formData.name,
        stream_url: formData.useWebcam ? '0' : formData.stream_url,
        location: formData.location,
      })
      setShowAddForm(false)
      setFormData({ name: '', stream_url: '0', location: '', useWebcam: true })
      await fetchCameras()
    } catch (err) {
      console.error('Failed to add camera:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this camera?')) return
    try {
      await cameraApi.delete(id)
      await fetchCameras()
    } catch (err) {
      console.error('Failed to delete camera:', err)
    }
  }

  const handleToggleStream = async (camera: Camera) => {
    try {
      if (camera.status === 'active') {
        await cameraApi.stopStream(camera.id)
      } else {
        await cameraApi.startStream(camera.id)
      }
      await fetchCameras()
    } catch (err) {
      console.error('Failed to toggle stream:', err)
    }
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    connecting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    disconnected: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />

      <main className="flex-1 ml-64 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Cameras</h1>
            <p className="text-gray-400 mt-1">Manage surveillance camera sources</p>
          </div>
          <button
            id="add-camera-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Camera
          </button>
        </div>

        {/* Add Camera Form */}
        {showAddForm && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Register New Camera</h3>
            <form onSubmit={handleAddCamera} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Camera Name
                  </label>
                  <input
                    id="camera-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Room 101 Camera"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Location
                  </label>
                  <input
                    id="camera-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g. Building A, Floor 2"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Source Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Video Source
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, useWebcam: true, stream_url: '0' })
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      formData.useWebcam
                        ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    Webcam
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, useWebcam: false, stream_url: '' })
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      !formData.useWebcam
                        ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Wifi className="w-4 h-4" />
                    IP Camera / RTSP
                  </button>
                </div>
              </div>

              {!formData.useWebcam && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Stream URL
                  </label>
                  <input
                    id="camera-url"
                    type="text"
                    required
                    value={formData.stream_url}
                    onChange={(e) =>
                      setFormData({ ...formData, stream_url: e.target.value })
                    }
                    placeholder="rtsp://192.168.1.100:554/stream or http://..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all font-mono text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="camera-submit"
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all font-medium disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Register Camera
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Camera List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl skeleton" />
            ))}
          </div>
        ) : cameras.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
            <CameraIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No cameras registered yet</p>
            <p className="text-gray-600 text-sm mt-1">
              Click &quot;Add Camera&quot; to register your first camera
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4 hover:bg-white/[0.07] transition-all group"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <CameraIcon className="w-6 h-6 text-gray-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-semibold truncate">{camera.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full border ${
                        statusColors[camera.status] || statusColors.disconnected
                      }`}
                    >
                      {camera.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-gray-500 text-sm font-mono truncate">
                      {camera.stream_url === '0' ? 'Webcam' : camera.stream_url}
                    </span>
                    {camera.location && (
                      <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <MapPin className="w-3 h-3" />
                        {camera.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleStream(camera)}
                    className={`p-2 rounded-lg transition-all ${
                      camera.status === 'active'
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    }`}
                    title={camera.status === 'active' ? 'Stop Stream' : 'Start Stream'}
                  >
                    {camera.status === 'active' ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(camera.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    title="Delete Camera"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
