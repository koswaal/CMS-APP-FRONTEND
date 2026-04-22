import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { ThemeContext } from "./ThemeContext";

export default function Register() {
  const [form, setForm] = useState({ 
    name: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: ""
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, error: contextError } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const isDark = theme === 'dark';

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    if (form.password !== form.password_confirmation) {
      setErrorMessage("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const success = await register(form.email, form.password, form.name, form.username, form.password_confirmation);
      setLoading(false);
      
      if (success) {
        navigate('/dashboard');
      } else if (contextError) {
        setErrorMessage(contextError);
      }
    } catch (error) {
      setErrorMessage(error.message || "Error al registrar. Intenta nuevamente.");
      setLoading(false);
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
        <div className="relative border border-white/10 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          {/* Logo mark */}
          <div className="mb-8">
            <div className="w-9 h-9 rounded-lg bg-[#c8f135] flex items-center justify-center mb-6">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L16 14H2L9 2Z" fill="#0a0a0a" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">
              Crear cuenta
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Regístrate para continuar
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-medium tracking-wide uppercase">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handle}
                placeholder="Tu nombre"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#c8f135]/60 focus:bg-white/[0.07] transition-all duration-200"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-medium tracking-wide uppercase">
                Usuario
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handle}
                placeholder="tu_usuario"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#c8f135]/60 focus:bg-white/[0.07] transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-medium tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handle}
                placeholder="you@example.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#c8f135]/60 focus:bg-white/[0.07] transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-medium tracking-wide uppercase">
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
                  minLength="6"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-white/20 outline-none focus:border-[#c8f135]/60 focus:bg-white/[0.07] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
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

            {/* Password Confirmation */}
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-medium tracking-wide uppercase">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handle}
                  placeholder="••••••••"
                  required
                  minLength="6"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-white/20 outline-none focus:border-[#c8f135]/60 focus:bg-white/[0.07] transition-all duration-200"
                />
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
                  Registrando…
                </>
              ) : (
                "Registrarse"
              )}
            </button>
          </form>

          {/* Link to login */}
          <p className="text-center text-white/30 text-xs">
            ¿Ya tienes cuenta?{" "}
            <Link to="/" className="text-[#c8f135]/80 hover:text-[#c8f135] transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
