
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <SEO title="About Us" description="Learn more about StockConnect." />
      <Navbar />
      
      <div className="pt-32 pb-12 bg-white border-b border-slate-100 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight">About StockConnect</h1>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">
            Connecting builders, contractors, and suppliers across Africa with high-quality materials and seamless procurement.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-5xl p-8 shadow-xl shadow-slate-200/40 border border-slate-50 space-y-8"
        >
          <section>
            <h2 className="text-2xl font-black font-outfit text-slate-900 mb-4">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">
              At StockConnect, our mission is to revolutionize the construction material supply chain. We provide a robust platform where reliability meets convenience, ensuring that every project, big or small, has access to the best materials at the right time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black font-outfit text-slate-900 mb-4">Why Choose Us?</h2>
            <ul className="list-disc list-inside text-slate-600 leading-relaxed space-y-2">
              <li>Verified Suppliers and Premium Quality Products</li>
              <li>Secure and Transparent Transactions</li>
              <li>Flexible Delivery and Pickup Options</li>
              <li>Dedicated Customer Support Team</li>
            </ul>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
