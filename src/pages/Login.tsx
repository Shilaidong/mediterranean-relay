import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { HapticTap } from '../components/HapticTap';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/home', { replace: true });
    }
  };

  return (
    <div className="h-full bg-paper flex flex-col">
      {/* Header */}
      <div className="flex items-center px-6 pt-6">
        <HapticTap
          onClick={() => navigate('/')}
          className="w-11 h-11 rounded-full bg-paper shadow-neumo-inset flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-ink" />
        </HapticTap>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <h1 className="text-[32px] font-serif font-bold text-ink text-center">
            Welcome Back
          </h1>
          <p className="text-[10px] tracking-[0.4em] font-bold opacity-40 mt-2 text-center uppercase">
            Mediterranean Relay
          </p>

          <form onSubmit={handleLogin} className="mt-12 space-y-5">
            <div>
              <label className="text-[10px] tracking-[0.3em] font-bold opacity-50 uppercase">
                Email
              </label>
              <div className="mt-2 relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collector@relay.com"
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-full bg-paper shadow-neumo-inset text-[14px] placeholder:text-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/30"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] tracking-[0.3em] font-bold opacity-50 uppercase">
                Password
              </label>
              <div className="mt-2 relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-12 pl-11 pr-4 rounded-full bg-paper shadow-neumo-inset text-[14px] placeholder:text-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/30"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[12px] text-stamp text-center"
              >
                {error}
              </motion.p>
            )}

            <HapticTap
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-ink text-paper rounded-full shadow-neumo font-bold tracking-[0.3em] text-[12px] uppercase mt-6 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </HapticTap>
          </form>

          <p className="text-center text-[12px] mt-8 opacity-60">
            New to Relay?{' '}
            <Link to="/register" className="text-ink font-bold">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
