
"use client"

import React, { useCallback, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%'
}

const center = {
    lat: 9.0300, // Default to Addis Ababa or similar
    lng: 38.7400
}

interface MapProps {
    markers?: Array<{
        id: string
        lat: number
        lng: number
        title: string
        icon?: string
        data?: any
    }>
    onMarkerClick?: (marker: any) => void
    center?: { lat: number, lng: number }
    zoom?: number
}

export function EcoGoogleMap({ markers = [], onMarkerClick, center: mapCenter, zoom = 13 }: MapProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    })

    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [selectedMarker, setSelectedMarker] = useState<any>(null)

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map)
    }, [])

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null)
    }, [])

    if (!isLoaded) return <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-bold">Loading Maps...</div>

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter || center}
            zoom={zoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                styles: [
                    {
                        "featureType": "all",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
                    },
                    {
                        "featureType": "administrative.country",
                        "elementType": "geometry",
                        "stylers": [{ "visibility": "on" }]
                    },
                    {
                        "featureType": "landscape",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#f5f8f9" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#d2e7f7" }]
                    }
                ],
                disableDefaultUI: false,
                zoomControl: true,
            }}
        >
            {markers.map((marker) => (
                <Marker
                    key={marker.id}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    onClick={() => {
                        setSelectedMarker(marker)
                        if (onMarkerClick) onMarkerClick(marker)
                    }}
                    title={marker.title}
                    icon={marker.icon}
                />
            ))}

            {selectedMarker && (
                <InfoWindow
                    position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                >
                    <div className="p-2 min-w-[150px]">
                        <h4 className="font-black text-slate-900 text-sm mb-1">{selectedMarker.title}</h4>
                        {selectedMarker.data?.type && (
                            <p className="text-[10px] uppercase font-bold text-primary mb-1">{selectedMarker.data.type}</p>
                        )}
                        {selectedMarker.data?.description && (
                            <p className="text-xs text-slate-500 line-clamp-2">{selectedMarker.data.description}</p>
                        )}
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    )
}
