import React, { useState } from "react";
import ReCAPTCHA from 'react-google-recaptcha';
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { RegisterData, AuthResponse } from "../types/auth";
import {
  User,
  Mail,
  Lock,
  GraduationCap,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const [formData, setFormData] = useState<RegisterData>({
    username: "",
    name: "",
    lastname: "",
    email: "",
    password: "",
    type: "student",
    grade: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post<AuthResponse>("/auth/register", formData);
      setToken(response.data.token);
      navigate("/chat");
    } catch (err) {
      setError("Error al registrarse");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaChange = (value: string | null) => {
    setCaptchaVerified(!!value);
  };

  // Opciones para el select de grado
  const gradeOptions = [
    { value: "", label: "Selecciona tu grado" },
    { value: "1", label: "1° Semestre" },
    { value: "2", label: "2° Semestre" },
    { value: "3", label: "3° Semestre" },
    { value: "4", label: "4° Semestre" },
    { value: "5", label: "5° Semestre" },
    { value: "6", label: "6° Semestre" },
    { value: "7", label: "7° Semestre" },
    { value: "8", label: "8° Semestre" },
    { value: "9", label: "9° Semestre" },
    { value: "Posgrado", label: "Posgrado" },
    { value: "Otro", label: "Otro" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-6 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="w-full max-w-md p-6 mx-auto space-y-5 bg-gray-800 border shadow-lg border-purple-500/30 shadow-purple-600/20 rounded-xl backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-400">
            Crear cuenta en EduTalk
          </h1>
          <p className="mt-2 text-gray-400">
            Completa el formulario para comenzar
          </p>
        </div>

        {error && (
          <div className="flex items-center p-4 text-red-300 border border-red-800 rounded-lg bg-red-900/40">
            <AlertCircle className="flex-shrink-0 mr-3" size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Nombre de usuario
            </label>
            <div className="relative">
              <User
                className="absolute text-purple-400 transform -translate-y-1/2 left-3 top-1/2"
                size={20}
              />
              <input
                type="text"
                className="w-full py-3 pl-10 pr-4 text-gray-200 transition-all border rounded-lg bg-gray-700/50 border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="usuario123"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Nombre
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 text-gray-200 transition-all border rounded-lg bg-gray-700/50 border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Juan"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Apellido
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 text-gray-200 transition-all border rounded-lg bg-gray-700/50 border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Pérez"
                value={formData.lastname}
                onChange={(e) =>
                  setFormData({ ...formData, lastname: e.target.value })
                }
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail
                className="absolute text-purple-400 transform -translate-y-1/2 left-3 top-1/2"
                size={20}
              />
              <input
                type="email"
                className="w-full py-3 pl-10 pr-4 text-gray-200 transition-all border rounded-lg bg-gray-700/50 border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="nombre@ejemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="absolute text-purple-400 transform -translate-y-1/2 left-3 top-1/2"
                  size={20}
                />
                <input
                  type="password"
                  className="w-full py-3 pl-10 pr-4 text-gray-200 transition-all border rounded-lg bg-gray-700/50 border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Grado</label>
              <div className="relative">
                <GraduationCap
                  className="absolute text-purple-400 transform -translate-y-1/2 left-3 top-1/2"
                  size={20}
                />
                <select
                  className="w-full py-3 pl-10 pr-10 text-gray-200 transition-all border rounded-lg appearance-none bg-gray-700/50 border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                  required
                >
                  {gradeOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="text-gray-200 bg-gray-700"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute text-purple-400 transform -translate-y-1/2 pointer-events-none right-3 top-1/2"
                  size={20}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-3">
            <ReCAPTCHA
              sitekey="6Lc-FOsqAAAAAIv-iRGEYYDMyTLHWlM8YlO2_d3q"
              onChange={handleCaptchaChange}
              theme="dark"
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-400">
              ¿Ya tienes una cuenta?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-medium text-purple-400 transition-colors hover:text-purple-300"
              >
                Iniciar sesión
              </button>
            </p>
            
            <button
              type="submit"
              disabled={isLoading || !captchaVerified}
              className="px-5 py-3 text-sm font-medium text-white transition-colors rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Registrando...
                </span>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}