'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ServiceAdvisory, AdvisoryType } from '@/lib/industry/types'
import { NAME_TO_CODE, STATE_NAMES } from '@/lib/industry/regions'

const US_CENTER: [number, number] = [39, -98]
const US_ZOOM = 4

// Severity ranking: higher = more severe
const TYPE_SEVERITY: Record<AdvisoryType, number> = {
  EMBARGO: 4,
  SERVICE_ALERT: 3,
  WEATHER_ADVISORY: 2,
  MAINTENANCE_NOTICE: 1,
}

const TYPE_COLORS: Record<AdvisoryType, string> = {
  EMBARGO: '#ef4444',
  SERVICE_ALERT: '#f97316',
  WEATHER_ADVISORY: '#eab308',
  MAINTENANCE_NOTICE: '#3b82f6',
}

const TYPE_LABELS: Record<AdvisoryType, string> = {
  EMBARGO: 'Embargo',
  SERVICE_ALERT: 'Service Alert',
  WEATHER_ADVISORY: 'Weather Advisory',
  MAINTENANCE_NOTICE: 'Maintenance',
}

const NO_ADVISORY_COLOR = '#374151'

interface StateAdvisoryData {
  count: number
  highestSeverityType: AdvisoryType | null
  byType: Partial<Record<AdvisoryType, number>>
}

function buildStateMap(advisories: ServiceAdvisory[]): Map<string, StateAdvisoryData> {
  const map = new Map<string, StateAdvisoryData>()

  for (const a of advisories) {
    if (!a.affectedArea) continue
    // affectedArea can be a 2-letter code or a comma-separated list
    const codes = a.affectedArea.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length === 2)
    for (const code of codes) {
      if (!STATE_NAMES[code]) continue
      const existing = map.get(code) || { count: 0, highestSeverityType: null, byType: {} }
      existing.count++
      existing.byType[a.advisoryType] = (existing.byType[a.advisoryType] || 0) + 1
      if (
        !existing.highestSeverityType ||
        TYPE_SEVERITY[a.advisoryType] > TYPE_SEVERITY[existing.highestSeverityType]
      ) {
        existing.highestSeverityType = a.advisoryType
      }
      map.set(code, existing)
    }
  }

  return map
}

function getStateColor(data: StateAdvisoryData | undefined): string {
  if (!data || !data.highestSeverityType) return NO_ADVISORY_COLOR
  return TYPE_COLORS[data.highestSeverityType]
}

// Sub-component to handle map bounds reset on mount
function MapBounds() {
  const map = useMap()
  useEffect(() => {
    map.setView(US_CENTER, US_ZOOM)
  }, [map])
  return null
}

interface AdvisoryMapProps {
  advisories: ServiceAdvisory[]
  selectedState: string | null
  onStateSelect: (stateCode: string | null) => void
}

export function AdvisoryMap({ advisories, selectedState, onStateSelect }: AdvisoryMapProps) {
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null)
  const geoJsonRef = useRef<L.GeoJSON | null>(null)

  const stateMap = useMemo(() => buildStateMap(advisories), [advisories])

  const nationwideCount = useMemo(
    () => advisories.filter(a => !a.affectedArea).length,
    [advisories]
  )

  // Load GeoJSON on mount
  useEffect(() => {
    fetch('/data/us-states.geojson')
      .then(res => res.json())
      .then((data: GeoJSON.FeatureCollection) => setGeoData(data))
      .catch(err => console.error('Failed to load US states GeoJSON:', err))
  }, [])

  const stateStyle = useCallback(
    (feature: GeoJSON.Feature | undefined): L.PathOptions => {
      if (!feature?.properties) return {}
      const name = feature.properties.name as string
      const code = NAME_TO_CODE[name]
      const data = code ? stateMap.get(code) : undefined
      const isSelected = code === selectedState

      return {
        fillColor: getStateColor(data),
        weight: isSelected ? 2.5 : 1,
        color: isSelected ? '#f0f0f0' : '#555555',
        dashArray: isSelected ? '' : '1',
        fillOpacity: data ? 0.65 : 0.15,
      }
    },
    [stateMap, selectedState]
  )

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      const name = feature.properties?.name as string
      const code = NAME_TO_CODE[name]
      const data = code ? stateMap.get(code) : undefined

      // Tooltip content
      let tip = `<div style="font-family:system-ui,sans-serif;">
        <strong style="font-size:13px;">${name}</strong>`
      if (data && data.count > 0) {
        tip += `<div style="font-size:12px;margin-top:4px;color:#d1d5db;">${data.count} active advisor${data.count === 1 ? 'y' : 'ies'}</div>`
        for (const [type, count] of Object.entries(data.byType)) {
          const color = TYPE_COLORS[type as AdvisoryType]
          tip += `<div style="font-size:11px;margin-top:2px;"><span style="display:inline-block;width:8px;height:8px;background:${color};border-radius:50%;margin-right:5px;"></span>${TYPE_LABELS[type as AdvisoryType]}: ${count}</div>`
        }
      } else {
        tip += `<div style="font-size:12px;margin-top:4px;color:#9ca3af;">No active advisories</div>`
      }
      tip += '</div>'

      ;(layer as L.Path).bindTooltip(tip, {
        sticky: true,
        className: 'advisory-map-tooltip',
        direction: 'top',
        offset: [0, -10],
      })

      // Hover effects
      ;(layer as L.Path).on({
        mouseover: (e: L.LeafletMouseEvent) => {
          const target = e.target as L.Path
          target.setStyle({
            weight: 2.5,
            color: '#f0f0f0',
            dashArray: '',
            fillOpacity: data ? 0.8 : 0.3,
          })
          target.bringToFront()
        },
        mouseout: () => {
          if (geoJsonRef.current) {
            geoJsonRef.current.resetStyle()
          }
        },
        click: () => {
          if (!code) return
          onStateSelect(selectedState === code ? null : code)
        },
      })
    },
    [stateMap, selectedState, onStateSelect]
  )

  // Re-render GeoJSON when stateMap or selectedState changes
  // react-leaflet GeoJSON doesn't re-render on prop change, so we use a key
  const geoKey = useMemo(
    () => `${advisories.length}-${selectedState || 'none'}`,
    [advisories.length, selectedState]
  )

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '400px', border: '1px solid var(--border-default)' }}>
      <MapContainer
        center={US_CENTER}
        zoom={US_ZOOM}
        className="w-full h-full"
        style={{ background: '#1a1a2e' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <MapBounds />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {geoData && (
          <GeoJSON
            key={geoKey}
            data={geoData}
            style={stateStyle}
            onEachFeature={onEachFeature}
            ref={(ref) => { geoJsonRef.current = ref }}
          />
        )}
      </MapContainer>

      {/* Nationwide badge */}
      {nationwideCount > 0 && (
        <div
          className="absolute top-3 left-3 z-[1000] px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {nationwideCount} advisor{nationwideCount === 1 ? 'y' : 'ies'} nationwide
        </div>
      )}

      {/* Selected state indicator */}
      {selectedState && (
        <button
          onClick={() => onStateSelect(null)}
          className="absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition hover:opacity-80"
          style={{
            background: 'var(--accent-muted)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent-text)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {STATE_NAMES[selectedState] || selectedState} &times;
        </button>
      )}

      {/* Legend */}
      <div
        className="absolute bottom-4 right-4 z-[1000] rounded-lg p-3"
        style={{
          background: 'rgba(17, 17, 17, 0.92)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
          Advisory Type
        </div>
        {(Object.entries(TYPE_COLORS) as [AdvisoryType, string][]).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 mb-1 last:mb-0">
            <span
              className="inline-block rounded-sm"
              style={{ width: 12, height: 12, background: color, opacity: 0.8 }}
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {TYPE_LABELS[type]}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1 pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span
            className="inline-block rounded-sm"
            style={{ width: 12, height: 12, background: NO_ADVISORY_COLOR, opacity: 0.3 }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No advisories
          </span>
        </div>
      </div>

      {/* Tooltip styles */}
      <style jsx global>{`
        .advisory-map-tooltip {
          background: rgba(17, 17, 17, 0.95) !important;
          border: 1px solid #333 !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          color: #f0f0f0 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
          font-size: 12px !important;
        }
        .advisory-map-tooltip::before {
          border-top-color: rgba(17, 17, 17, 0.95) !important;
        }
        .leaflet-interactive {
          cursor: pointer !important;
        }
      `}</style>
    </div>
  )
}
