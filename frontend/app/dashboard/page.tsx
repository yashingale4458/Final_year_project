'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { CameraFeed } from '@/components/CameraFeed'
import { AlertPanel } from '@/components/AlertBadge'
import { cameraApi } from '@/lib/client'
import { Camera, StreamResult } from '@/lib/api'
import {
  Camera as CameraIcon,
  AlertTriangle,
  Activity,
  Shield,
  RefreshCw,
} from 'lucide-react'

interface AlertSummary {
  type: 'looking_sideways' | 'proximity_cheating' | 'talking' | 'left_seat' | 'gaze_deviation'
  count: number
  lastSeen?: string
}

export default function DashboardPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [alerts, setAlerts] = useState<AlertSummary[]>([])
  const [incidentCount, setIncidentCount] = useState(0)
  const [loading, setLoading] = useState(true)

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
    const interval = setInterval(fetchCameras, 10000)
    return () => clearInterval(interval)
  }, [fetchCameras])

  const handleAlert = useCallback(
    (cameraId: string, detections: StreamResult['detections']) => {
      setIncidentCount((prev) => prev + detections.length)

      // Aggregate alerts
      const newAlerts: Record<string, AlertSummary> = {}
      for (const detection of detections) {
        for (const behavior of detection.behaviors) {
          const key = behavior as AlertSummary['type']
          if (!newAlerts[key]) {
            newAlerts[key] = { type: key, count: 0 }
          }
          newAlerts[key].count++
          newAlerts[key].lastSeen = new Date().toLocaleTimeString()
        }
      }

      setAlerts((prev) => {
        const merged = [...prev]
        for (const [key, alert] of Object.entries(newAlerts)) {
          const existing = merged.find((a) => a.type === key)
          if (existing) {
            existing.count += alert.count
            existing.lastSeen = alert.lastSeen
          } else {
            merged.push(alert)
          }
        }
        return merged
      })
    },
    []
  )

  const activeCameras = cameras.filter((c) => c.status === 'active').length

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />

      <main className="flex-1 ml-64 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Real-time exam surveillance monitoring</p>
          </div>
          <button
            onClick={fetchCameras}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<CameraIcon className="w-5 h-5" />}
            label="Total Cameras"
            value={cameras.length}
            color="blue"
          />
          <StatCard
            icon={<Activity className="w-5 h-5" />}
            label="Active Streams"
            value={activeCameras}
            color="green"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Incidents Today"
            value={incidentCount}
            color="red"
          />
          <StatCard
            icon={<Shield className="w-5 h-5" />}
            label="Alert Types"
            value={alerts.length}
            color="purple"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Camera Grid */}
          <div className="xl:col-span-3">
            <h2 className="text-lg font-semibold text-white mb-4">Camera Feeds</h2>
            {loading ? (
              <div className="camera-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="camera-tile skeleton" />
                ))}
              </div>
            ) : cameras.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
                <CameraIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No cameras registered</p>
                <p className="text-gray-600 text-sm mt-1">
                  Go to the Cameras page to add your first camera
                </p>
              </div>
            ) : (
              <div className="camera-grid">
                {cameras.map((cam) => (
                  <CameraFeed
                    key={cam.id}
                    camera={cam}
                    onAlert={handleAlert}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Alert Sidebar */}
          <div className="xl:col-span-1">
            <AlertPanel alerts={alerts} />
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'blue' | 'green' | 'red' | 'purple'
}) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    green: 'from-green-500/20 to-green-600/5 border-green-500/20 text-green-400',
    red: 'from-red-500/20 to-red-600/5 border-red-500/20 text-red-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
  }

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5 transition-all hover:scale-[1.02]`}
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  )
}
