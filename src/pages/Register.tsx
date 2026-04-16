import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { HapticTap } from '../components/HapticTap';

export function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Sign up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        credits: 100, // Welcome bonus
      });

      if (profileError) {
        setError('Failed to create profile. Please try again.');
        setLoading(false);
        return;
      }

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
            Join Relay
          </h1>
          <p className="text-[10px] tracking-[0.4em] font-bold opacity-40 mt-2 text-center uppercase">
            Mediterranean Relay
          </p>

          <form onSubmit={handleRegister} className="mt-10 space-y-5">
            <div>
              <label className="text-[10px] tracking-[0.3em] font-bold opacity-50 uppercase">
                Username
              </label>
              <div className="mt-2 relative">
                <User
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="VinylHunter"
                  required
                  minLength={3}
                  className="w-full h-12 pl-11 pr-4 rounded-full bg-paper shadow-neumo-inset text-[14px] placeholder:text-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/30"
                />
              </div>
            </div>

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
                  placeholder="Min 6 characters"
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
              {loading ? 'Creating...' : 'Create Account'}
            </HapticTap>
          </form>

          <p className="text-center text-[12px] mt-8 opacity-60">
            Already a member?{' '}
            <Link to="/login" className="text-ink font-bold">
              Sign In
            </Link>
          </p>

          <p className="text-center text-[10px] mt-4 opacity-40">
            By joining, you agree to our Terms of Service
          </p>
        </motion.div>
      </div>
    </div>
  );
}
