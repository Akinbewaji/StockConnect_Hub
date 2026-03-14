import { useState } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    alert('Thank you for contacting us!');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <SEO title="Contact Us" description="Get in touch with the StockConnect team." />
      <Navbar />
      
      <div className="pt-32 pb-12 bg-white border-b border-slate-100 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight">Contact Us</h1>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/40 border border-slate-50 flex items-start gap-4">
              <div className="rounded-xl bg-indigo-50 text-indigo-600 p-3">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black font-outfit text-slate-900">Our Office</h3>
                <p className="text-slate-500 mt-2">123 Innovation Drive<br/>Tech District<br/>Lagos, Nigeria</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/40 border border-slate-50 flex items-start gap-4">
              <div className="rounded-xl bg-indigo-50 text-indigo-600 p-3">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black font-outfit text-slate-900">Phone</h3>
                <p className="text-slate-500 mt-2">+234 (0) 123 456 7890</p>
                <p className="text-slate-500">Mon-Fri from 8am to 5pm</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/40 border border-slate-50 flex items-start gap-4">
              <div className="rounded-xl bg-indigo-50 text-indigo-600 p-3">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black font-outfit text-slate-900">Email</h3>
                <p className="text-slate-500 mt-2">support@stockconnect.com</p>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-5xl p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-50"
          >
            <h2 className="text-2xl font-black font-outfit text-slate-900 mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:outline-none transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:outline-none transition-colors"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                <textarea 
                  id="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:outline-none transition-colors resize-none"
                  placeholder="How can we help you?"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
              >
                Send Message <Send size={20} />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
