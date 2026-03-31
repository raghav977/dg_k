import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import {
    fetchShopkeeperDeliverySettings,
    updateShopkeeperDeliverySettings
} from '../../../../../api/Shop'

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
})

const MIN_RADIUS = 1
const MAX_RADIUS = 25

// Recenter map when coordinates change
const RecenterMap = ({ lat, lng }) => {
    const map = useMap()
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng])
        }
    }, [lat, lng, map])
    return null
}

const DeliverySettings = () => {
    const [settings, setSettings] = useState(null)
    const [radius, setRadius] = useState(5)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [locating, setLocating] = useState(false)
    const [currentLocation, setCurrentLocation] = useState(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const loadSettings = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await fetchShopkeeperDeliverySettings()
            setSettings(data)
            setRadius(Number(data.delivery_radius_km) || 5)
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to load delivery settings.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSettings()
    }, [])

    const handleRadiusInput = (value) => {
        const num = Number(value)
        if (Number.isNaN(num)) return
        setRadius(Math.min(Math.max(num, MIN_RADIUS), MAX_RADIUS))
    }

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.')
            return
        }

        setLocating(true)
        setError('')
        setMessage('')

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setCurrentLocation({ lat: latitude, lng: longitude })
                setLocating(false)
                setMessage('Using your current GPS location. Click Save to store it.')
            },
            () => {
                setError('Unable to retrieve your location.')
                setLocating(false)
            }
        )
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage('')
        setError('')

        const coords = currentLocation
            ? currentLocation
            : settings && !Number.isNaN(Number(settings.lat)) && !Number.isNaN(Number(settings.lng))
                ? { lat: Number(settings.lat), lng: Number(settings.lng) }
                : null

        try {
            const payload = {
                delivery_radius_km: Number(radius),
                lat: coords?.lat,
                lng: coords?.lng,
            }
            console.log("THis is payload",payload);

            const data = await updateShopkeeperDeliverySettings(payload)
            console.log("This is data",data);
            setSettings(data)
            setRadius(Number(data.delivery_radius_km) || radius)
            setCurrentLocation(null)
            setMessage('Delivery radius and location updated successfully.')
        } catch (err) {
            const detail =
                err.response?.data?.delivery_radius_km?.[0] ||
                err.response?.data?.error ||
                'Unable to save delivery settings.'
            setError(detail)
        } finally {
            setSaving(false)
        }
    }

    const coords =
        currentLocation
            ? currentLocation
            : settings &&
              !Number.isNaN(Number(settings.lat)) &&
              !Number.isNaN(Number(settings.lng))
            ? { lat: Number(settings.lat), lng: Number(settings.lng) }
            : null

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow border">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Delivery Coverage</h1>
                        <p className="text-gray-500">
                            Control how far customers can place online orders.
                        </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={loadSettings}
                            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Refresh
                        </button>

                        <button
                            onClick={handleUseMyLocation}
                            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                            disabled={locating}
                        >
                            {locating ? 'Locating…' : 'Use My Location'}
                        </button>

                        <button
                            onClick={handleSave}
                            className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                            disabled={saving || loading}
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Delivery radius (km)
                            </label>

                            <input
                                type="range"
                                min={MIN_RADIUS}
                                max={MAX_RADIUS}
                                value={radius}
                                onChange={(e) => handleRadiusInput(e.target.value)}
                                className="w-full mt-2"
                            />

                            <input
                                type="number"
                                min={MIN_RADIUS}
                                max={MAX_RADIUS}
                                value={radius}
                                onChange={(e) => handleRadiusInput(e.target.value)}
                                className="mt-2 w-24 border rounded px-3 py-2"
                            />

                            <p className="text-xs text-gray-500 mt-1">
                                Customers must be within this distance to place online orders.
                            </p>
                        </div>

                        {settings && (
                            <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700">
                                <div className="font-semibold text-gray-900">Saved shop location</div>
                                <div>
                                    Lat: {Number(settings.lat).toFixed(4)} · Lng:{' '}
                                    {Number(settings.lng).toFixed(4)}
                                </div>
                            </div>
                        )}

                        {currentLocation && (
                            <div className="bg-blue-50 border rounded-lg p-4 text-sm text-blue-700">
                                Using current GPS location:
                                <div>
                                    Lat: {currentLocation.lat.toFixed(4)} · Lng:{' '}
                                    {currentLocation.lng.toFixed(4)}
                                </div>
                            </div>
                        )}

                        {message && <div className="text-green-600 text-sm">{message}</div>}
                        {error && <div className="text-red-600 text-sm">{error}</div>}
                    </div>

                    <div className="h-80 border rounded-lg overflow-hidden">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                Loading map…
                            </div>
                        ) : coords ? (
                            <MapContainer
                                center={[coords.lat, coords.lng]}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <RecenterMap lat={coords.lat} lng={coords.lng} />

                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                <Circle
                                    center={[coords.lat, coords.lng]}
                                    radius={radius * 1000}
                                    pathOptions={{ color: 'blue', fillOpacity: 0.08 }}
                                />

                                <Marker position={[coords.lat, coords.lng]}>
                                    <Popup>Your shop</Popup>
                                </Marker>
                            </MapContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-red-500">
                                Shop location missing. Please set your location.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeliverySettings