
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const vendors = [
  { id: '1', name: 'Dangote Cement', category: 'Building Materials', location: 'Lagos, Nigeria', rating: 4.9, reviews: 1240, verified: true },
  { id: '2', name: 'Berger Paints', category: 'Paints & Finishes', location: 'Ikeja, Lagos', rating: 4.8, reviews: 856, verified: true },
  { id: '3', name: 'Cutix Cables', category: 'Electrical', location: 'Nnewi, Anambra', rating: 4.7, reviews: 432, verified: true },
  { id: '4', name: 'Nigerite', category: 'Roofing & Ceilings', location: 'Ikeja, Lagos', rating: 4.6, reviews: 310, verified: true },
  { id: '5', name: 'Lafarge Africa', category: 'Building Materials', location: 'Lagos, Nigeria', rating: 4.8, reviews: 920, verified: true },
  { id: '6', name: 'CDK Integrated Ind.', category: 'Tiles & Ceramics', location: 'Sagamu, Ogun', rating: 4.5, reviews: 156, verified: false },
];

export default function Vendors() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <SEO title="Our Vendors" description="Discover trusted suppliers and manufacturers" />
      <Navbar />

      <div className="pt-32 pb-12 bg-white border-b border-slate-100 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight">Verified Vendors</h1>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">
            Partner with the most reliable and highly-rated suppliers for your construction and industrial needs.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor, index) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-200">
                    {vendor.name.charAt(0)}
                  </div>
                  {vendor.verified && (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <ShieldCheck size={14} /> Verified
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-black font-outfit text-slate-900">{vendor.name}</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">{vendor.category}</p>
                
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                    {vendor.rating} <span className="text-slate-400 font-medium">({vendor.reviews})</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={16} />
                    {vendor.location}
                  </div>
                </div>

                <Link 
                  to={`/seller/${vendor.id}`} 
                  className="mt-6 block w-full py-3 bg-slate-50 hover:bg-indigo-50 text-slate-900 hover:text-indigo-600 rounded-xl font-bold text-center transition-colors border border-slate-100 hover:border-indigo-100"
                >
                  View Store Profile
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
