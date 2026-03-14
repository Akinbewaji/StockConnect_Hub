import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Load Paystack script securely, avoiding re-inserts in strict mode
    if (!document.getElementById('paystack-inline-script')) {
      const script = document.createElement('script');
      script.id = 'paystack-inline-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleUpgrade = (plan: any) => {
    if (plan.id === 'free') {
        // If they want to downgrade to free or just select it
        // We might want to allow this if they are currently on pro? 
        // For now, let's just keep it simple.
        return;
    }
    
    if (user?.plan?.toLowerCase() === plan.id) {
       alert("You are already on this plan!");
       return;
    }

    setLoading(plan.id);
    
    const paystackPopVar = (window as any).PaystackPop || PaystackPop;

    if (!paystackPopVar) {
      setMessage({ type: 'error', text: 'Payment gateway is still loading. Please try again.' });
      setLoading(null);
      return;
    }

    try {
      const handler = paystackPopVar.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
      email: user?.email || `${user?.username}@stockconnect.com`,
      amount: plan.price * 100, // Amount in kobo
      currency: 'NGN',
      ref: `sub_${Math.floor((Math.random() * 1000000000) + 1)}`,
      callback: function(response: any) {
        (async () => {
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
              setTimeout(() => navigate('/admin'), 2000);
            } else {
              throw new Error(data.error || 'Verification failed');
            }
          } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error verifying payment' });
          } finally {
            setLoading(null);
          }
        })();
      },
      onClose: function() {
        setLoading(null);
      }
    });

    handler.openIframe();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to initialize payment gateway' });
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Choose Your Plan</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Scale your hardware business with tools designed for Nigerian SMEs. No hidden fees.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-center font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = user?.plan?.toLowerCase() === plan.id;

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -5 }}
              className={`relative bg-white rounded-3xl p-8 border-2 transition-all flex flex-col ${
                plan.popular 
                  ? 'border-indigo-600 shadow-2xl shadow-indigo-100 ring-4 ring-indigo-50' 
                  : 'border-slate-100 shadow-xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-${plan.color}-100 text-${plan.color}-600`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-slate-500 mt-2 text-sm">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">₦{plan.price.toLocaleString()}</span>
                  <span className="text-slate-500">/month</span>
                </div>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-slate-600 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrent || (loading === plan.id) || (plan.id === 'free' && !isCurrent)}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isCurrent 
                    ? 'bg-slate-100 text-slate-400 cursor-default'
                    : plan.id === 'free'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                }`}
              >
                {loading === plan.id ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isCurrent ? (
                  'Current Plan'
                ) : (
                  'Select Plan'
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Trust Badges */}
      <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Secure Payment</h4>
            <p className="text-xs text-slate-500">Fast and encrypted via Paystack</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
            <Rocket size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Instant Activation</h4>
            <p className="text-xs text-slate-500">Features unlocked immediately</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Cancel Anytime</h4>
            <p className="text-xs text-slate-500">No long-term contracts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
