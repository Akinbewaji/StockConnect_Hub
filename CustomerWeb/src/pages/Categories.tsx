
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { HardHat, Wrench, Plug, PaintBucket, Truck, Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  { id: 'electrical', name: 'Electrical', icon: <Plug size={32} />, count: 124, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'plumbing', name: 'Plumbing', icon: <Wrench size={32} />, count: 86, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'safety', name: 'Safety Equipment', icon: <HardHat size={32} />, count: 45, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'paint', name: 'Paints & Finishes', icon: <PaintBucket size={32} />, count: 92, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'heavy', name: 'Heavy Machinery', icon: <Truck size={32} />, count: 18, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'tools', name: 'Hand Tools', icon: <Hammer size={32} />, count: 215, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

export default function Categories() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <SEO title="Categories" description="Browse all industrial material categories" />
      <Navbar />

      <div className="pt-32 pb-12 bg-white border-b border-slate-100 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight">Browse Categories</h1>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">
            Find exactly what you need from our comprehensive catalog of industrial materials and equipment.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link 
                to={`/products?category=${category.id}`}
                className="block bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1 group"
              >
                <div className={`w-16 h-16 ${category.bg} ${category.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-black font-outfit text-slate-900 mb-2">{category.name}</h3>
                <p className="text-slate-500 font-medium">{category.count} Products Available</p>
                <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm">
                  View Category &rarr;
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
