import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Calendar,
    Users,
    Trophy,
    Gift,
    BarChart3,
    Settings
} from 'lucide-react';

function Layout() {
    const navigation = [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { name: 'Vender', to: '/sell', icon: ShoppingCart },
        { name: 'Eventos', to: '/events', icon: Calendar },
        { name: 'Clientes', to: '/customers', icon: Users },
        { name: 'Reclamar Premio', to: '/claim', icon: Gift },
        { name: 'Ganadores', to: '/winners', icon: Trophy },
        { name: 'Reportes', to: '/reports', icon: BarChart3 },
        { name: 'Configuración', to: '/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-green-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="text-3xl">🎰</div>
                            <div>
                                <h1 className="text-2xl font-bold">La Suerte</h1>
                                <p className="text-sm text-green-100">Sistema de Sorteos</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">

                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-1 overflow-x-auto">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${isActive
                                            ? 'text-green-600 border-b-2 border-green-600'
                                            : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                                        }`
                                    }
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <p className="text-center text-sm text-gray-500">
                        © 2025 La Suerte - Sistema de Gestión de Sorteos
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Layout;