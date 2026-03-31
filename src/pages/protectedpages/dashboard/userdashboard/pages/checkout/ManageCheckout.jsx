import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import api from '../../../../../../api/axios';
import { fetchShopDetail } from '../../../../../../api/Shop';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/";

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
})

const DEFAULT_RADIUS_KM = 5

function distanceKm(lat1, lon1, lat2, lon2){
    const toRad = v => v * Math.PI / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
}

const ClickHandler = ({onClick})=>{
    useMapEvents({
        click(e){ onClick(e.latlng) }
    })
    return null
}

const ManageCheckout = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!state || !state.products) {
            navigate('/dashboard/customer/shops');
        }
    }, [state, navigate]);

    if (!state || !state.products) return null;

    const products = state.products || []
    const totalPrice = products.reduce((s,p) => s + (Number(p.price || 0) * Number(p.quantity || 1)), 0)


    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [notes, setNotes] = useState('')
    const [error, setError] = useState('')
    const [shopInfo, setShopInfo] = useState(null)
    const [shopLoading, setShopLoading] = useState(true)


    const [currentPos, setCurrentPos] = useState(null)
    const [selectedPos, setSelectedPos] = useState(null)
    const markerRef = useRef(null)
    const prevPosRef = useRef(null)

    useEffect(()=>{
        if (!navigator.geolocation) return setCurrentPos({ lat: 27.7172, lng: 85.3240 })
        navigator.geolocation.getCurrentPosition((pos)=>{
            setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        }, ()=>{
            setCurrentPos({ lat: 27.7172, lng: 85.3240 })
        })
    }, [])

    useEffect(()=>{
        let isMounted = true
        const loadShopInfo = async ()=>{
            if (!state?.shopId){
                setShopLoading(false)
                return
            }
            try{
                const detail = await fetchShopDetail(state.shopId)
                if (!isMounted) return
                setShopInfo(detail)
            }catch(err){
                if (!isMounted) return
                setError('Unable to load shop coverage details. Please try again later.')
            }finally{
                if (isMounted) setShopLoading(false)
            }
        }
        loadShopInfo()
        return ()=>{ isMounted = false }
    }, [state?.shopId])

    const shopLocation = shopInfo && !Number.isNaN(Number(shopInfo.lat)) && !Number.isNaN(Number(shopInfo.lng))
        ? { lat: Number(shopInfo.lat), lng: Number(shopInfo.lng) }
        : null
    const coverageRadiusKm = shopInfo?.delivery_radius_km ? Number(shopInfo.delivery_radius_km) : DEFAULT_RADIUS_KM
    const mapCenter = shopLocation || currentPos
    const selectedDistanceFromShop = (selectedPos && shopLocation)
        ? distanceKm(shopLocation.lat, shopLocation.lng, selectedPos.lat, selectedPos.lng)
        : null

    const ensureWithinCoverage = (latlng)=>{
        if (!shopLocation){
            return { ok: false, distance: null }
        }
        const distance = distanceKm(shopLocation.lat, shopLocation.lng, latlng.lat, latlng.lng)
        if (distance > coverageRadiusKm){
            return { ok: false, distance }
        }
        return { ok: true, distance }
    }

    const handleMapClick = (latlng)=>{
        if (!shopLocation){ setError('Shop location not available yet.'); return }
        const { ok, distance } = ensureWithinCoverage(latlng)
        if (!ok){
            setError(`Selected point is ${distance?.toFixed(2)} km away — must be within ${coverageRadiusKm} km of the shop`)
            return
        }
        prevPosRef.current = latlng
        setSelectedPos(latlng)
        setError('')
    }

    const handleMarkerDragEnd = (latlng)=>{
        if (!shopLocation){ setError('Shop location not available yet.'); return }
        const { ok, distance } = ensureWithinCoverage(latlng)
        if (!ok){
            setError(`Selected point is ${distance?.toFixed(2)} km away — must be within ${coverageRadiusKm} km of the shop`)
            const fallback = prevPosRef.current || selectedPos || shopLocation
            setSelectedPos(fallback)
            try{ if (markerRef.current && markerRef.current.setLatLng && fallback){ markerRef.current.setLatLng([fallback.lat, fallback.lng]) } }catch(e){}
            return
        }
        prevPosRef.current = latlng
        setSelectedPos(latlng)
        setError('')
    }

    // const handlePlaceOnlineOrder = async () => {

    //     if (!name || name.trim().length < 2){ setError('Please enter customer name'); return }
    //     if (!phone || phone.trim().length < 7){ setError('Please enter a valid contact number'); return }
    //     if (!selectedPos){ setError(`Please pick a delivery location on the map within ${coverageRadiusKm} km of the shop`); return }
    //     if (!shopLocation){ setError('Shop location not available yet. Please try again later.'); return }
    //     if (totalPrice < 1000){ setError('Online orders require minimum total Rs 1000'); return }

    //     setError('')
    //     const payload = { customerName: name, phone, notes, deliveryLocation: selectedPos, deliveryDistanceKm: selectedDistanceFromShop, products, totalPrice, shopId: state.shopId }
    //     try{
    //         const response = await api.post(`${BACKEND_URL}/orders/api/orders/create/`, {
    //             data: payload
    //         });

    //         const fields = response.data.fields
    //         const pay_url = response.data.pay_url
    //         const form = document.createElement("form")
    //         form.method = "POST"
    //         form.action = pay_url

    //         Object.keys(fields).forEach(key => {
    //             const input = document.createElement("input")
    //             input.type = "hidden"
    //             input.name = key
    //             input.value = fields[key]
    //             form.appendChild(input)
    //         })

    //         document.body.appendChild(form)
    //         form.submit()
    //     }
    //     catch(err){
    //         console.error("Error creating order:", err)
    //         const serverMessage = err.response?.data?.error || 'Error placing order. Please try again.'
    //         if (err.response?.data?.distance_km){
    //             const dist = Number(err.response.data.distance_km).toFixed(2)
    //             const radius = Number(err.response.data.radius_km).toFixed(2)
    //             setError(`${serverMessage} (Distance: ${dist} km / Radius: ${radius} km)`)
    //         } else {
    //             setError(serverMessage)
    //         }
    //         return

    //     }
    // }


    const handlePlaceOnlineOrder = async () => {

    if (!name || name.trim().length < 2){
        setError('Please enter customer name');
        return;
    }

    if (!/^\d{7,15}$/.test(phone)){
        setError('Please enter a valid contact number');
        return;
    }

    if (!selectedPos){
        setError(`Please pick a delivery location on the map within ${coverageRadiusKm} km of the shop`);
        return;
    }

    if (!shopLocation){
        setError('Shop location not available yet. Please try again later.');
        return;
    }

    if (Number(totalPrice) < 1000){
        setError('Online orders require minimum total Rs 1000');
        return;
    }

    setError('');

    const payload = {
        customerName: name,
        phone,
        notes,
        deliveryLocation: selectedPos,
        deliveryDistanceKm: selectedDistanceFromShop,
        products,
        totalPrice,
        shopId: state.shopId
    };

    console.log("THis is payload",payload);

    try {
        const response = await api.post(
            `${BACKEND_URL}/orders/api/orders/create/`,
            payload
        );

        if (!response.data?.fields || !response.data?.pay_url) {
            setError("Invalid payment response from server.");
            return;
        }

        const { fields, pay_url } = response.data;

        const form = document.createElement("form");
        form.method = "POST";
        form.action = pay_url;

        Object.keys(fields).forEach(key => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = fields[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

    } catch (err) {
        console.error("Error creating order:", err);

        const serverMessage =
            err.response?.data?.error ||
            'Error placing order. Please try again.';

        if (err.response?.data?.distance_km){
            const dist = Number(err.response.data.distance_km).toFixed(2);
            const radius = Number(err.response.data.radius_km).toFixed(2);
            setError(`${serverMessage} (Distance: ${dist} km / Radius: ${radius} km)`);
        } else {
            setError(serverMessage);
        }
    }
};
    return (
        <div>
            {/* Modal backdrop */}
            <div className='backdrop-blur fixed top-0 left-0 w-full h-full flex justify-center items-center bg-opacity-40 z-40 overflow-auto'>
                <div className="bg-white p-6 rounded shadow-md w-[95vw] max-w-4xl">
                    <h2 className="text-lg font-semibold mb-3">Checkout</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Customer name</label>
                                <input className="w-full border rounded px-3 py-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" />
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Contact number</label>
                                <input className="w-full border rounded px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 98XXXXXXXX" />
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                                <textarea className="w-full border rounded px-3 py-2" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
                            </div>

                            <div className="mb-3">
                                <h3 className="font-medium">Products</h3>
                                <div className="mt-2 space-y-2 max-h-40 overflow-auto">
                                    {products.map(p=> (
                                        <div key={p.id} className="flex items-center justify-between border px-3 py-2 rounded">
                                            <div>
                                                <div className="text-sm font-semibold">{p.name}</div>
                                                <div className="text-xs text-gray-500">Qty: {p.quantity || 1}</div>
                                            </div>
                                            <div className="text-sm">Rs {Number(p.price || 0) * Number(p.quantity || 1)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-2">
                                <div className="text-sm text-gray-600">Total: <span className="font-semibold">Rs {totalPrice.toFixed(0)}</span></div>
                                {totalPrice < 1000 ? (
                                    <div className="text-xs text-red-600 mt-1">Online orders require minimum total of Rs 1000. You can place an offline order.</div>
                                ) : (
                                    <div className="text-xs text-green-600 mt-1">Eligible for online payment</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Delivery address (inside shop coverage)</label>
                                <div className="p-3 bg-indigo-50 text-indigo-900 rounded">
                                    <div className="font-semibold">{shopInfo?.business_name || 'Shop'}</div>
                                    <div className="text-sm">Delivery radius: {coverageRadiusKm} km</div>
                                    {shopLocation && <div className="text-xs mt-1">Lat: {shopLocation.lat.toFixed(4)} · Lng: {shopLocation.lng.toFixed(4)}</div>}
                                </div>
                            </div>
                            <div className="border rounded overflow-hidden h-72">
                                {mapCenter ? (
                                    <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        {shopLocation && (
                                            <>
                                                <Circle center={[shopLocation.lat, shopLocation.lng]} radius={coverageRadiusKm * 1000} pathOptions={{ color: 'blue', fillOpacity: 0.08 }} />
                                                <Marker position={[shopLocation.lat, shopLocation.lng]}>
                                                    <Popup>{shopInfo?.business_name || 'Shop location'}</Popup>
                                                </Marker>
                                            </>
                                        )}
                                        {currentPos && (
                                            <CircleMarker center={[currentPos.lat, currentPos.lng]} radius={6} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.8 }}>
                                                <Popup>Your current location</Popup>
                                            </CircleMarker>
                                        )}
                                        <ClickHandler onClick={handleMapClick} />
                                        {selectedPos && (
                                            <Marker
                                                position={[selectedPos.lat, selectedPos.lng]}
                                                draggable={true}
                                                eventHandlers={{
                                                    dragstart: ()=>{ prevPosRef.current = selectedPos },
                                                    dragend: (e)=>{ const latlng = e.target.getLatLng(); handleMarkerDragEnd({ lat: latlng.lat, lng: latlng.lng }) }
                                                }}
                                                ref={markerRef}
                                            >
                                                <Popup>Delivery point</Popup>
                                            </Marker>
                                        )}
                                    </MapContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full">{shopLoading ? 'Loading map…' : 'Waiting for shop location…'}</div>
                                )}
                                <div className="text-xs text-gray-600 p-2 space-y-1">
                                    <div>Tap inside the highlighted circle (coverage radius {coverageRadiusKm} km) to place your delivery marker. Drag to fine-tune.</div>
                                    {selectedDistanceFromShop && <div className="text-indigo-700">Selected point is {selectedDistanceFromShop.toFixed(2)} km from the shop.</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

                    <div className="flex justify-end space-x-2 mt-4">
                        <button type="button" className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={()=>navigate('/dashboard/customer/shops')}>Cancel</button>
                        <button type="button" disabled={totalPrice < 1000} className={`px-4 py-2 rounded text-white ${totalPrice < 1000 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`} onClick={handlePlaceOnlineOrder}>Pay Online</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ManageCheckout;
