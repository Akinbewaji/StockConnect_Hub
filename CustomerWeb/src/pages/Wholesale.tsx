
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { PackageOpen, TrendingDown, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Wholesale() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <SEO title="Wholesale Purchases" description="Bulk purchasing program for large projects" />
      <Navbar />

      <div className="pt-32 pb-12 bg-white border-b border-slate-100 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm mb-6 border border-indigo-100">
            <PackageOpen size={16} /> Volume Purchasing Program
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-outfit text-slate-900 tracking-tight">Wholesale & Bulk Orders</h1>
          <p className="text-slate-500 mt-6 text-xl max-w-2xl mx-auto leading-relaxed">
            Maximize your margins. Access direct factory pricing, priority fulfillment, and dedicated account management for high-volume material procurement.
          </p>
          <div className="mt-8">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-lg transition-transform active:scale-95 shadow-xl shadow-indigo-200">
              Apply for Wholesale Account <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { icon: <TrendingDown size={28} />, title: "Tiered Discounts", desc: "The more you buy, the more you save with automatic bulk volume discounting." },
            { icon: <Clock size={28} />, title: "Priority Fulfillment", desc: "Skip the line. Wholesale orders jump to the front of the logistics queue." },
            { icon: <ShieldCheck size={28} />, title: "Credit Terms", desc: "Flexible Net-30 and Net-60 payment options for qualified institutional buyers." },
            { icon: <PackageOpen size={28} />, title: "Custom Sourcing", desc: "Can't find it listed? Our procurement team will source custom materials for you." }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-4xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-32 -translate-x-32" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black font-outfit text-white mb-4">Ready to optimize your supply chain?</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">Join hundreds of contractors and builders already saving thousands on their project material costs.</p>
            <Link to="/products" className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-2xl font-black text-lg transition-transform active:scale-95 shadow-xl">
              Browse Wholesale Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
