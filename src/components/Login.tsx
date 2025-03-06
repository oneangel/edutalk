import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { LoginCredentials, AuthResponse } from '../types/auth';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      setToken(response.data.token);
      navigate('/chat');
    } catch (err) {
      setError('Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="w-full max-w-md p-8 mx-auto space-y-8 bg-gray-800 border shadow-lg border-purple-500/30 shadow-purple-600/20 rounded-xl backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-400">Bienvenido a EduTalk</h1>
          <p className="mt-2 text-gray-400">Inicia sesión para continuar a tu cuenta</p>
        </div>

        {error && (
          <div className="flex items-center p-4 text-red-300 border border-red-800 rounded-lg bg-red-900/40">
            <AlertCircle className="flex-shrink-0 mr-3" size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute text-purple-400 transform -translate-y-1/2 left-3 top-1/2" size={20} />
              <input
                type="email"
                className="w-full py-3 pl-10 pr-4 text-gray-200 transition-all border rounded-lg bg-gray-700/50 border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="nombre@ejemplo.com"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <button
                type="button"
                className="text-sm font-medium text-purple-400 transition-colors hover:text-purple-300"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute text-purple-400 transform -translate-y-1/2 left-3 top-1/2" size={20} />
              <input
                type="password"
                className="w-full py-3 pl-10 pr-4 text-gray-200 transition-all border rounded-lg bg-gray-700/50 border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-offset-gray-800"
            />
            <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-300">
              Recordarme
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 text-sm font-medium text-white transition-colors rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="text-center">
          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-sm text-gray-500 bg-gray-800">O</span>
            </div>
          </div>

          <p className="text-gray-400">
            ¿No tienes una cuenta?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-medium text-purple-400 transition-colors hover:text-purple-300"
            >
              Crear cuenta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}