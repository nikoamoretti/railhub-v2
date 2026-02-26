'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import type { Facility } from '@/lib/types'
import { getTypeLabel, getBadgeStyle } from '@/lib/facility-types'

const DEFAULT_CENTER: [number, number] = [39.8, -98.5]
const DEFAULT_ZOOM = 4

const TYPE_COLORS: Record<string, string> = {
  TRANSLOAD: '#3b82f6',
  STORAGE: '#22c55e',
  TEAM_TRACK: '#a855f7',
  REPAIR_SHOP: '#f97316',
  INTERMODAL: '#6366f1',
  BULK_TRANSFER: '#eab308',
  TANK_WASH: '#06b6d4',
  MANUFACTURING: '#ec4899',
  SHORTLINE: '#14b8a6',
}

const DEFAULT_COLOR = '#6b7280'

function createIcon(type: string): L.DivIcon {
  const color = TYPE_COLORS[type] || DEFAULT_COLOR
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
}

function buildPopup(f: Facility): string {
  const badge = getBadgeStyle(f.type)
  const city = f.location?.city || ''
  const state = f.location?.state || ''
  const loc = [city, state].filter(Boolean).join(', ')

  let html = `<div style="min-width:200px;font-family:system-ui,sans-serif;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${f.name}</div>`

  if (loc) {
    html += `<div style="font-size:12px;margin-bottom:4px;color:#6b7280;">${loc}</div>`
  }

  html += `<span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:9999px;background:${badge.bg};color:${badge.text};border:1px solid ${badge.border};margin-bottom:8px;">${getTypeLabel(f.type)}</span>`

  if (f.google_rating) {
    html += `<div style="font-size:12px;margin-bottom:4px;">★ ${f.google_rating} (${f.google_review_count || 0} reviews)</div>`
  }

  if (f.phone) {
    html += `<div style="font-size:12px;color:#6b7280;">${f.phone}</div>`
  }

  html += `<div style="margin-top:8px;"><a href="/facility/${f.id}" style="font-size:12px;color:#e65100;font-weight:500;">View details →</a></div></div>`

  return html
}

// Component that manages the marker cluster layer
function ClusterLayer({ facilities }: { facilities: Facility[] }) {
  const map = useMap()
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const prevKeyRef = useRef('')

  useEffect(() => {
    // Build a key to detect actual data changes
    const key = `${facilities.length}-${facilities[0]?.id || ''}-${facilities[facilities.length - 1]?.id || ''}`
    if (key === prevKeyRef.current && clusterRef.current) return
    prevKeyRef.current = key

    // Remove old cluster
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current)
    }

    // Create cluster group
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      iconCreateFunction: (clusterObj) => {
        const count = clusterObj.getChildCount()
        let size = 'small'
        let dim = 30
        if (count > 100) { size = 'large'; dim = 44 }
        else if (count > 10) { size = 'medium'; dim = 36 }
        return L.divIcon({
          html: `<div style="
            width:${dim}px;height:${dim}px;
            background:rgba(230,81,0,0.85);
            border:2px solid white;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:700;font-size:${size === 'large' ? 13 : 11}px;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
            font-family:system-ui,sans-serif;
          ">${count}</div>`,
          className: '',
          iconSize: [dim, dim],
          iconAnchor: [dim / 2, dim / 2],
        })
      },
    })

    // Add markers
    const markers: L.Marker[] = []
    for (const f of facilities) {
      if (!f.location?.latitude || !f.location?.longitude) continue
      const marker = L.marker(
        [f.location.latitude, f.location.longitude],
        { icon: createIcon(f.type) }
      )
      marker.bindPopup(buildPopup(f), { maxWidth: 280 })
      markers.push(marker)
    }

    cluster.addLayers(markers)
    map.addLayer(cluster)
    clusterRef.current = cluster

    // Fit bounds
    if (markers.length > 0) {
      const points: [number, number][] = facilities
        .filter(f => f.location?.latitude && f.location?.longitude)
        .map(f => [f.location!.latitude!, f.location!.longitude!])
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 })
    }

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current)
        clusterRef.current = null
      }
    }
  }, [facilities, map])

  return null
}

interface FacilityMapProps {
  facilities: Facility[]
  typeFilter: string
  stateFilter: string
  searchQuery: string
}

export function FacilityMap({ facilities, typeFilter, stateFilter, searchQuery }: FacilityMapProps) {
  const filtered = useMemo(() => {
    let result = facilities.filter(f => f.location?.latitude && f.location?.longitude)

    if (typeFilter) {
      result = result.filter(f => f.type === typeFilter.toUpperCase())
    }
    if (stateFilter) {
      result = result.filter(f => f.location?.state === stateFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(f =>
        f.name?.toLowerCase().includes(q) ||
        f.location?.city?.toLowerCase().includes(q)
      )
    }

    return result
  }, [facilities, typeFilter, stateFilter, searchQuery])

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 56px - 200px)', minHeight: '500px' }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full rounded-xl"
        style={{ background: 'var(--bg-card)' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusterLayer facilities={filtered} />
      </MapContainer>

      <div
        className="absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        {filtered.length.toLocaleString()} facilities on map
      </div>
    </div>
  )
}
