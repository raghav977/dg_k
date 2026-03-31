import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const Sidebar = () => {

    const sideLinkNavbar = [
        {
            name:"Dashboard",
            link:"/dashboard/customer"
        },
        {
            name:"Shops",
            link:"/dashboard/customer/shops"
        },
        {
            name:"Loans",
            link:"/dashboard/customer/loans"
        },
        {
            name:"Messages",
            link:"/dashboard/customer/chat"
        },
        {
            name:"Analytics",
            link:"/dashboard/customer/analytics"
        },
        {
            name:"Profile",
            link:"/dashboard/customer/profile"
        }
    ]

    const location = useLocation()
  return (
    <div>
        <div className="flex min-h-screen">
            {/* left side */}
            <div className="w-64 h-screen bg-white text-black flex flex-col  sticky top-0">
                <div className="p-6 text-2xl font-bold border-b border-gray-700">
                    Customer Dashboard
                </div>
                <nav className="flex-1 p-4">
                    <ul className="space-y-4">
                        {sideLinkNavbar.map((item)=>(
                            <li key={item.name}>
                                <Link
                                    to={item.link}
                                    className={`block px-4 py-2 rounded transition ${location.pathname === item.link || location.pathname.startsWith(item.link + '/') ? 'bg-blue-400 text-white' : 'hover:bg-blue-200'}`}
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            {/* right side */}
            <div className="flex-1 px-4 py-6 bg-gray-100">
                    <Outlet />
            </div>
        </div>


        
    </div>
  )
}

export default Sidebar