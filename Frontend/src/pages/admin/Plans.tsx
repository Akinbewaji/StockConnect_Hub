import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Shield, Rocket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/api';
import { motion } from 'motion/react';

declare const PaystackPop: any;

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for small shops starting out',
    features: [
      'Up to 50 products',
      'Basic inventory tracking',
      'Manual SMS (pay-per-use)',
      'Standard support'
    ],
    icon: Rocket,
    color: 'slate'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 5000,
    description: 'For growing businesses ready to scale',
    features: [
      'Unlimited products',
      'Automated low-stock alerts',
      '500 SMS Credits monthly',
      'Customer loyalty management',
      'Priority chat support'
    ],
    icon: Zap,
    color: 'amber',
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 15000,
    description: 'Advanced tools for larger hardware stores',
    features: [
      'Everything in Pro',
      'Multi-branch inventory',
      'Advanced sales analytics',
      '2,000 SMS Credits monthly',
      'Dedicated account manager'
    ],
    icon: Crown,
    color: 'indigo'
  }
];

export default function Plans() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpgrade = (plan: any) => {
    if (plan.id === 'free') return;
    if (user?.plan?.toLowerCase() === plan.id) {
       alert("You are already on this plan!");
       return;
    }

    setLoading(plan.id);
    
    const handler = PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder', // Use test key placeholder
      email: user?.email || `${user?.username}@stockconnect.com`,
      amount: plan.price * 100, // Amount in kobo
      currency: 'NGN',
      ref: `sub_${Math.floor((Math.random() * 1000000000) + 1)}`,
      callback: async (response: any) => {
        try {
          const verifyRes = await authFetch('/api/subscriptions/verify', {
            method: 'POST',
            body: JSON.stringify({
              reference: response.reference,
              plan: plan.id
            })
          });

          const data = await verifyRes.json();
          if (data.success) {
            updateUser(data.user);
            setMessage({ type: 'success', text: `Successfully upgraded to ${plan.name}!` });
          } else {
            throw new Error(data.error || 'Verification failed');
          }
        } catch (error: any) {
          setMessage({ type: 'error', text: error.message || 'Error verifying payment' });
        } finally {
          setLoading(null);
        }
      },
      onClose: () => {
        setLoading(null);
      }
    });

    handler.openIframe();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">Choose Your Plan</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Scale your hardware business with powerful inventory and marketing tools.
          Select the tier that fits your growth.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-center font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const isCurrent = user?.plan?.toLowerCase() === plan.id;
          const Icon = plan.icon;
          
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -5 }}
              className={`relative bg-white rounded-3xl p-8 border-2 transition-all flex flex-col ${
                plan.popular ? 'border-indigo-600 shadow-xl shadow-indigo-100 scale-105 z-10' : 'border-slate-100 shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="space-y-6 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  plan.color === 'amber' ? 'bg-amber-50 text-amber-600' : 
                  plan.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 
                  'bg-slate-50 text-slate-600'
                }`}>
                  <Icon size={28} />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">₦{plan.price.toLocaleString()}</span>
                    <span className="text-slate-500 font-medium">/month</span>
                  </div>
                  <p className="mt-4 text-slate-500 text-sm leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 pt-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                      <div className="mt-1 p-0.5 rounded-full bg-green-50 text-green-500">
                        <Check size={12} strokeWidth={4} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent || plan.id === 'free' || (loading !== null)}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isCurrent 
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : plan.id === 'free'
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                  }`}
                >
                  {loading === plan.id ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    isCurrent ? 'Current Plan' : 'Select Plan'
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-slate-900 rounded-3xl p-12 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Enterprise Customization?</h2>
          <p className="text-slate-400 mb-8">
            Need more than 2,000 SMS credits or custom integrations for your hardware franchise? 
            We offer tailored solutions for large-scale operations across Nigeria.
          </p>
          <button className="flex items-center gap-2 bg-white text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors">
            Contact Enterprise Sales <Shield size={20} />
          </button>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 blur-3xl w-96 h-96 bg-indigo-500 rounded-full -mr-20 -mb-20"></div>
      </div>
    </div>
  );
}
