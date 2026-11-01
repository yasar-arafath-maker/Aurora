import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { loginCard, loginField, staggerContainer, floatingParticle } from '../lib/animations';

interface LoginPageProps {
  onSuccess: () => void;
}

// Floating grid particles for ambient background
const GridParticles: React.FC = () => {
  const particles = Array.from({ length: 18 });
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3) * 2,
            height: 2 + (i % 3) * 2,
            left: `${5 + (i * 5.5) % 90}%`,
            top: `${10 + (i * 7.3) % 80}%`,
            background: i % 3 === 0 ? 'rgba(34, 230, 196, 0.4)' : i % 3 === 1 ? 'rgba(95, 168, 255, 0.3)' : 'rgba(255, 178, 56, 0.3)',
          }}
          animate={{
            y: [0, -40 - (i % 4) * 15, 0],
            x: [0, 20 * (i % 2 === 0 ? 1 : -1), 0],
            opacity: [0.15, 0.6, 0.15],
            scale: [1, 1.5, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 5 + (i % 4) * 1.5,
            ease: 'easeInOut',
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleSelectRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setError(null);
  };

  return (
    <div className="min-h-screen aurora-bg flex flex-col items-center justify-center p-4 selection:bg-teal selection:text-bg relative overflow-hidden">
      <GridParticles />

      {/* Ambient light ring behind card */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(34, 230, 196, 0.08) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      />

      <motion.div
        className="w-full max-w-md scada-panel p-6 sm:p-8 border-teal/40 glow-teal relative z-10"
        variants={loginCard}
        initial="initial"
        animate="animate"
      >
        {/* Animated accent top bar */}
        <div className="accent-top-animated" />

        {/* Brand Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-teal to-blue text-bg font-bold shadow-glow-teal mb-3 font-mono text-xl"
            animate={{
              boxShadow: [
                '0 0 15px -3px rgba(34, 230, 196, 0.3)',
                '0 0 25px -3px rgba(34, 230, 196, 0.5)',
                '0 0 15px -3px rgba(34, 230, 196, 0.3)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            AU
          </motion.div>
          <h2 className="text-xl font-bold tracking-wider text-text-main">
            AURORA SCADA ACCESS
          </h2>
          <p className="text-xs text-text-dim mt-1 font-mono">
            Grid Battery Storage & Renewable Optimization Control Center
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4 font-mono text-xs"
          variants={staggerContainer(0.15)}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={loginField}>
            <label className="block text-text-dim text-[11px] uppercase mb-1">
              Operator Identifier
            </label>
            <div className="relative group">
              <Mail className="w-4 h-4 text-text-faint absolute left-3 top-2.5 transition-colors group-focus-within:text-teal" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-panel-2 border border-line rounded py-2 pl-9 pr-3 text-text-main placeholder-text-faint focus:outline-none focus:border-teal/60 transition-all duration-300 focus:shadow-glow-teal"
                placeholder="operator@aurora.grid"
              />
            </div>
          </motion.div>

          <motion.div variants={loginField}>
            <label className="block text-text-dim text-[11px] uppercase mb-1">
              Access Token / Password
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-text-faint absolute left-3 top-2.5 transition-colors group-focus-within:text-teal" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-panel-2 border border-line rounded py-2 pl-9 pr-3 text-text-main placeholder-text-faint focus:outline-none focus:border-teal/60 transition-all duration-300 focus:shadow-glow-teal"
                placeholder="••••••••••••"
              />
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="p-2.5 rounded bg-red/15 border border-red/40 text-red text-[11px]"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded bg-teal text-bg font-bold text-xs hover:bg-teal/90 transition-all flex items-center justify-center gap-2 shadow-glow-teal tracking-wider uppercase disabled:opacity-50 btn-ripple"
            variants={loginField}
            whileHover={{ scale: 1.02, boxShadow: '0 0 25px -3px rgba(34, 230, 196, 0.5)' }}
            whileTap={{ scale: 0.97 }}
          >
            <span>{isLoading ? 'Authorizing...' : 'Authorize Terminal'}</span>
            <motion.div
              animate={isLoading ? { rotate: 360 } : {}}
              transition={isLoading ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </motion.form>

        {/* Quick Role Fill (Development/Evaluation Only) */}
        {!import.meta.env.PROD && (
          <motion.div
            className="mt-6 pt-4 border-t border-line text-xs font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <p className="text-[11px] text-text-dim uppercase tracking-wider mb-2 text-center">
              Operator Role Fill:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { email: 'admin@aurora.grid', label: 'ADMIN', sublabel: 'Full Control', color: 'teal', hoverBorder: 'hover:border-teal/50' },
                { email: 'operator@aurora.grid', label: 'OPERATOR', sublabel: 'Dispatch Ops', color: 'amber', hoverBorder: 'hover:border-amber/50' },
                { email: 'viewer@aurora.grid', label: 'VIEWER', sublabel: 'Read Only', color: 'blue', hoverBorder: 'hover:border-blue/50' },
              ].map((role, i) => (
                <motion.button
                  key={role.label}
                  type="button"
                  onClick={() => handleSelectRole(role.email)}
                  className={`p-2 rounded bg-panel-2 border border-line ${role.hoverBorder} text-${role.color} text-[10px] text-center transition-colors`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="font-bold block">{role.label}</span>
                  <span className="text-[9px] text-text-dim">{role.sublabel}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
