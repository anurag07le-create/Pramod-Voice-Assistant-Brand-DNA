import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/pucho_logo_sidebar_new.png';
import userAvatar from '../../assets/ToyFaces_Tansparent_BG_30.png';
import { getMascotUrl } from '../../utils/mascots';

import { Dna, Megaphone, Palette, FolderOpen, Activity, Plug, BookOpen, Wrench, Store, LogOut, Users, LineChart, FileText, Mic, Target, ClipboardList, Share2, Bot } from 'lucide-react';
import { useBrands } from '../../context/BrandContext';

const Sidebar = ({ isMobileOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const { brands } = useBrands();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Menu items configuration
    const allMenuItems = [
        { name: 'Tally Agent', icon: Bot, path: '/tally-agent', divider: true },
        { name: 'Generate Brand DNA', icon: Dna, path: '/generate-dna' },
        { name: 'Get Campaign Ideas', icon: Megaphone, path: '/campaign-ideas' },
        { name: 'Generate Creatives', icon: Palette, path: '/generate-creatives' },
        {
            name: 'My DNAs',
            icon: FolderOpen,
            path: '/my-dnas',
            subItems: brands.map(brand => ({
                name: brand.name,
                path: `/dna/${brand.slug}`,
                logo: brand.logo
            }))
        },
        { name: 'History', icon: Activity, path: '/history' },
    ];

    // Filter menu based on role/username
    const menuItems = allMenuItems.filter(item => {
        if (item.adminOnly) {
            return user?.username === 'admin007';
        }
        return true;
    });

    return (
        <aside
            className={`
                w-[240px] h-screen bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 left-0 z-30
                transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            {/* Logo */}
            <div className="pl-8 pt-3 pb-2"> {/* Minor padding adjustment */}
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Pucho" className="h-[34px] w-auto" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <React.Fragment key={item.name}>
                        <NavLink
                            to={item.path}
                            end
                            className={({ isActive }) => `
                                flex items-center gap-[10px] px-[12px] h-[40px] rounded-[22px] text-[14px] font-medium transition-all duration-200 border
                                ${isActive
                                    ? 'bg-[rgba(160,210,150,0.1)] border-transparent text-black'
                                    : 'bg-transparent border-transparent text-black hover:border-[rgba(160,210,150,0.3)]'
                                }
                            `}
                        >
                            {/* Render Icon Component */}
                            <item.icon className="w-5 h-5" strokeWidth={1.5} />
                            <span className="truncate">{item.name}</span>
                        </NavLink>

                        {/* Sub Items - Only show if parent or sub-item is active */}
                        {item.subItems && (
                            location.pathname === item.path ||
                            item.subItems.some(sub => location.pathname === sub.path)
                        ) && (
                                <div className="pl-9 mt-1 space-y-1">
                                    {item.subItems.map((subItem) => (
                                        <NavLink
                                            key={subItem.name}
                                            to={subItem.path}
                                            className={({ isActive }) => `
                                            flex items-center gap-2 h-[32px] px-3 rounded-xl text-[13px] font-medium transition-all duration-200
                                            ${isActive
                                                    ? 'bg-gray-100 text-black font-semibold'
                                                    : 'text-gray-500 hover:text-black hover:bg-gray-50'
                                                }
                                        `}
                                        >
                                            {subItem.logo && (
                                                <img
                                                    src={subItem.logo}
                                                    alt=""
                                                    className="w-4 h-4 rounded-full object-contain bg-white border border-gray-100 flex-shrink-0"
                                                />
                                            )}
                                            <span className="truncate">{subItem.name}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            )}

                        {/* Divider Logic */}
                        {item.divider && (
                            <div className="my-2 border-b border-gray-100 mx-2" />
                        )}
                    </React.Fragment>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
