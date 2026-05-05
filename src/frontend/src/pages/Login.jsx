import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import logo from '../assets/logo.svg';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate(from, { replace: true });
        } catch (err) {
            console.error(err);
            if (err.response) {
                // Server responded with a status code
                setError(err.response.data.detail || 'Error de credenciales');
            } else if (err.request) {
                // The request was made but no response was received
                setError('Error de conexión con el servidor. Verifica que el PC esté encendido y en la misma red.');
            } else {
                // Something happened in setting up the request that triggered an Error
                setError('Error desconocido: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-10 flex flex-col items-center">
                    <img
                        src={logo}
                        alt="Eldera"
                        className="h-48 w-48 animate-in fade-in zoom-in duration-1000 drop-shadow-md"
                    />
                    <h1 className="text-5xl font-black text-[#1E82E5] tracking-tighter mt-6 uppercase">ELDERA</h1>
                    <p className="text-gray-500 mt-3 font-semibold tracking-widest text-xs uppercase opacity-80">Gestión Inteligente de Residencias</p>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Usuario
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="admin"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full justify-center"
                            disabled={loading}
                        >
                            {loading ? 'Iniciando sesión...' : 'Entrar'}
                        </Button>
                    </form>
                </Card>

                <p className="text-center text-sm text-gray-500 mt-8">
                    &copy; 2025 Eldera System
                </p>
            </div>
        </div>
    );
};

export default Login;
