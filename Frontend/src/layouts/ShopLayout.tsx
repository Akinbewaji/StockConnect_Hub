import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, Search, Menu } from 'lucide-react';

export default function ShopLayout() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900">
                HardwareStore
              </Link>
            </div>
            
            <div className="flex-1 max-w-lg mx-8 hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Search products..."
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <ShoppingCart className="h-6 w-6" />
              </button>
              <button className="md:hidden p-2 text-gray-400 hover:text-gray-500">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400 text-sm">
            &copy; 2024 HardwareStore. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
