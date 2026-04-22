import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { ThemeContext } from "./ThemeContext";
import * as LucideIcons from "lucide-react";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { login, error: contextError } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    const result = await login(form.username, form.password);
    setLoading(false);
    if (!result?.success) {
      setErrorMessage(result?.error || contextError || 'No se pudo iniciar sesión');
    }
    if (result?.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-100'}`}>
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#c8f135] rounded-full blur-[100px] opacity-10 pointer-events-none" />

        {/* Card */}
        <div className={`relative border backdrop-blur-sm rounded-2xl p-8 shadow-2xl ${
          isDark ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white'
        }`}>
          {/* Logo mark */}
          <div className="mb-8">
            <LucideIcons.Layers className="w-10 h-10 mb-6 text-[#c8f135]" />
            <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              CMS APP
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-600'}`}>
              Inicia sesión para continuar
            </p>
          </div>

          {(errorMessage || contextError) && (
            <div className={`mb-4 p-3 border rounded-xl text-sm ${
              (errorMessage || contextError)?.includes('bloqueada') || (errorMessage || contextError)?.includes('bloqueado')
                ? isDark ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-orange-100 border-orange-300 text-orange-700'
                : isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-100 border-red-300 text-red-700'
            }`}>
              <div className="flex items-start gap-2">
                {(errorMessage || contextError)?.includes('bloqueada') || (errorMessage || contextError)?.includes('bloqueado') ? (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{errorMessage || contextError}</span>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className={`text-xs font-medium tracking-wide uppercase ${isDark ? 'text-white/50' : 'text-gray-700'}`}>
                Usuario
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handle}
                placeholder="tu_usuario"
                required
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#c8f135]/60 transition-all duration-200 ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:bg-white/[0.07]'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-[#c8f135]/20'
                }`}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className={`text-xs font-medium tracking-wide uppercase ${isDark ? 'text-white/50' : 'text-gray-700'}`}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handle}
                  placeholder="••••••••"
                  required
                  className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-[#c8f135]/60 transition-all duration-200 ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:bg-white/[0.07]'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-[#c8f135]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {show ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#c8f135] hover:bg-[#d4f74e] active:scale-[0.98] text-[#0a0a0a] font-semibold text-sm py-3 rounded-xl transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Iniciando sesión…
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}