import { useContext, useState } from 'react';
import { ThemeContext } from './ThemeContext';
import { icons } from './icons';
import { API_URL } from './config';

export default function BaseDatos() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleBackup = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = await fetch(`${API_URL}/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Respaldo de base de datos creado exitosamente');
      } else {
        setErrorMessage(data.message || 'Error al crear el respaldo');
      }
    } catch (err) {
      setErrorMessage('Error al crear el respaldo de base de datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Base de Datos</h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gestión de respaldos de la base de datos</p>
      </div>

      {errorMessage && (
        <div className={`mb-4 p-4 border rounded-lg ${isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-700'}`}>
          {errorMessage}
          <button onClick={clearMessage} className="ml-2 font-bold underline">Cerrar</button>
        </div>
      )}

      {successMessage && (
        <div className={`mb-4 p-4 border rounded-lg ${isDark ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-100 border-green-400 text-green-700'}`}>
          {successMessage}
          <button onClick={clearMessage} className="ml-2 font-bold underline">Cerrar</button>
        </div>
      )}

      <div className={`rounded-lg shadow-lg p-6 border mb-6 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Crear Respaldo</h2>
        <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Crea un respaldo completo de la base de datos. El archivo se guardará en la carpeta "respaldo" del sistema.
        </p>
        
        {loading && (
          <div className="mb-4">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Procesando...</p>
          </div>
        )}
        
        <button
          onClick={handleBackup}
          disabled={loading}
          className="bg-[#c8f135] hover:bg-[#d4f74e] text-black font-semibold py-3 px-6 rounded-lg transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-[0_0_20px_rgba(200,241,53,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="inline-flex items-center gap-2">
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full"></div>
                Procesando...
              </>
            ) : (
              <>
                <span className="text-xl"><icons.database /></span>
                Crear Respaldo
              </>
            )}
          </span>
        </button>
      </div>

      <div className={`rounded-lg shadow-lg p-6 border ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Historial de Respaldos</h2>
        <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No hay respaldos disponibles
        </p>
      </div>
    </div>
  );
}
