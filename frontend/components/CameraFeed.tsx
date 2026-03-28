'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, StreamResult } from '@/lib/api'
import { createWebSocket } from '@/lib/client'
import { AlertTriangle, Video, VideoOff } from 'lucide-react'

interface CameraFeedProps {
  camera: Camera
  onAlert?: (cameraId: string, detections: StreamResult['detections']) => void
}

export function CameraFeed({ camera, onAlert }: CameraFeedProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isAlert, setIsAlert] = useState(false)
  const [lastDetection, setLastDetection] = useState<StreamResult | null>(null)
  const [frame, setFrame] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (camera.status !== 'active') return

    const ws = createWebSocket(camera.id)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data: StreamResult = JSON.parse(event.data)

        if (data.detections && data.detections.length > 0) {
          setIsAlert(true)
          setLastDetection(data)
          onAlert?.(camera.id, data.detections)

          // Reset alert after 3 seconds
          setTimeout(() => setIsAlert(false), 3000)
        }
      } catch (error) {
        console.error('WebSocket parse error:', error)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      // Reconnect after 5 seconds
      reconnectTimeout.current = setTimeout(connect, 5000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      ws.close()
    }
  }, [camera.id, camera.status, onAlert])

  useEffect(() => {
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
    }
  }, [connect])

  // MJPEG stream for IP cameras
  const streamUrl = camera.stream_url.startsWith('http') || camera.stream_url.startsWith('rtsp')
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cameras/${camera.id}/frame`
    : null

  return (
    <div className={`camera-tile ${isAlert ? 'alert' : ''}`}>
      {/* Camera Name Overlay */}
      <div className="absolute top-2 left-2 z-10">
        <div className="flex items-center gap-2 bg-black/60 text-white px-3 py-1 rounded-md text-sm">
          <span className="font-medium">{camera.name}</span>
          {camera.location && (
            <span className="text-white/60">• {camera.location}</span>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-2 right-2 z-10">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
          isConnected ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
        }`}>
          {isConnected ? (
            <>
              <Video className="w-3 h-3" />
              <span>Live</span>
            </>
          ) : (
            <>
              <VideoOff className="w-3 h-3" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Alert Overlay */}
      {isAlert && lastDetection && (
        <div className="absolute inset-0 z-20 bg-red-500/20 flex items-center justify-center">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <div>
              <div className="font-bold">Alert Detected!</div>
              <div className="text-sm">
                {lastDetection.detections.map(d => d.behaviors.join(', ')).join('; ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Feed */}
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        {streamUrl ? (
          <img
            src={streamUrl}
            alt={camera.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white/40 flex flex-col items-center">
            <Video className="w-12 h-12 mb-2" />
            <span className="text-sm">Waiting for stream...</span>
          </div>
        )}
      </div>
    </div>
  )
}