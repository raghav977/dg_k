import React, { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import api from '../../../../../api/axios'
import ShopkeeperTopbar from './Topbar'

const menuItems = [
    { name: 'Dashboard', link: '/dashboard/shopkeeper' },
    { name: 'Products', link: '/dashboard/shopkeeper/products' },
    { name: 'Orders', link: '/dashboard/shopkeeper/orders' },
    { name: 'Sales', link: '/dashboard/shopkeeper/sales' },
    { name: 'Sales History', link: '/dashboard/shopkeeper/sales-history' },
    { name: 'Audit Center', link: '/dashboard/shopkeeper/audit' },
    { name: 'Messages', link: '/dashboard/shopkeeper/chat' },
    { name: 'Requests', link: '/dashboard/shopkeeper/requests' },
    { name: 'Reports', link: '/dashboard/shopkeeper/reports' },
    { name: 'Delivery Settings', link: '/dashboard/shopkeeper/delivery-settings' },
]

const Sidebar = () => {

    const fetchShopkeeperHome = async()=>{
        try{
            const response = await api.get('/accounts/shopkeeper/home/');
            const data = await response.data;
            console.log("Shopkeeper Home data:", data);
        }
        catch(err){
            console.error("Error fetching shopkeeper home data:", err);
            window.location.href = '/login';
        }
    }
    useEffect(()=>{
        fetchShopkeeperHome();
    },[]);

    const location = useLocation()
    return (
        <div className="flex min-h-screen">
            {/* left side */}
            <div className="w-64 h-screen bg-white-800 text-black flex flex-col  sticky top-0">
                <div className="p-6 text-2xl font-bold border-b border-gray-700">
                    Shopkeeper Dashboard
                </div>
                <nav className="flex-1 p-4">
                    <ul className="space-y-4">
                        {menuItems.map((item) => {
                            const active = location.pathname === item.link || location.pathname.startsWith(item.link + '/')
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.link}
                                        className={`block px-4 py-2 rounded transition ${active ? 'bg-blue-400 font-bold' : 'hover:bg-blue-300'}`}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            </div>
            {/* right side */}
            <div className="flex-1 flex flex-col bg-gray-50">
                <ShopkeeperTopbar />
                <div className="flex-1 p-4">
                    <Outlet/>
                </div>
            </div>
        </div>
    )
}

export default Sidebar