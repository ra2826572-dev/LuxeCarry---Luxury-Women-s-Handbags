import React, { useState } from 'react';
import { Shield, Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AdminLoginPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { adminLogin } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password.trim()) {
      setError('Please enter the administrator passcode.');
      return;
    }
    setLoading(true);

    try {
      const result = await adminLogin(password);
      if (!result.success) {
        setError(result.error || 'Administrator access denied. Incorrect passcode.');
        setLoading(false);
        return;
      }

      window.location.hash = 'admin';
      onNavigate('admin');
    } catch (err: any) {
      setError(err.message || 'Connection failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141413] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#ECE7DF]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#262422] to-[#1A1A19] border border-[#3E3A35] flex items-center justify-center shadow-xl">
            <Shield className="w-7 h-7 text-[#D4AF37]" />
          </div>
        </div>

        <h2 className="mt-5 text-center text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
          LuxeCarry Atelier Control
        </h2>
        <p className="mt-1 text-center text-xs text-neutral-400">
          Authorized Administrator Portal · Password Protected
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#1C1A18] py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-[#2E2B27] space-y-6">
          {error && (
            <div className="p-3.5 bg-[#2E1818] border border-[#6B2424] text-[#F0A8A8] text-xs rounded-lg flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-300"
                >
                  Admin Passcode
                </label>
                <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-[#D4AF37]" /> Protected
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#121110] border border-[#3A3631] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#D4AF37] transition-colors p-1"
                  title={showPassword ? 'Hide passcode' : 'Show passcode'}
                  aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-500">
                Enter your secure administrator password to unlock Atelier Control.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 rounded-full shadow-md text-xs font-semibold uppercase tracking-wider text-neutral-950 bg-[#D4AF37] hover:bg-[#C29F2F] focus:outline-none transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Verifying Admin Passcode...' : 'Unlock Atelier Admin Control'}
              </button>
            </div>
          </form>

          <div className="pt-2 text-center border-t border-[#2E2B27]">
            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Storefront</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
