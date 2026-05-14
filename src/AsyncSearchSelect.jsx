import { useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

export default function AsyncSearchSelect({
  fetchOptions,
  value,
  onChange,
  placeholder = 'Buscar...',
  label = '',
  required = false,
  disabled = false,
  displayField = 'nombre',
  valueField = 'id',
}) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Cargar opciones cuando el componente se monta o cuando cambia el valor inicial
  useEffect(() => {
    if (value) {
      // Si hay un valor inicial, cargarlo
      loadOptions('', true, value);
    }
  }, [value]);

  // Cargar opciones basado en el término de búsqueda
  const loadOptions = async (term = '', forceLoad = false, exactValue = null) => {
    if (!forceLoad && term.length < 1 && !exactValue) {
      setOptions([]);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchOptions(term, exactValue);
      const optionsArray = Array.isArray(data) ? data : [];
      setOptions(optionsArray);
      
      // Si estamos cargando un valor exacto (modo edición), establecer el searchTerm
      if (exactValue && optionsArray.length > 0) {
        const selected = optionsArray.find(opt => opt[valueField] === exactValue);
        if (selected) {
          setSelectedOption(selected);
          setSearchTerm(selected[displayField]);
        }
      }
    } catch (err) {
      console.error('Error al cargar opciones:', err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOptions(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange(option[valueField]);
    setIsOpen(false);
    setSearchTerm(option[displayField]);
  };

  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(true);
    if (!term) {
      setSelectedOption(null);
      onChange('');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedOption(null);
    onChange('');
    setOptions([]);
    searchInputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (searchTerm.length >= 1 || !searchTerm) {
      loadOptions(searchTerm);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label} {required && '*'}
        </label>
      )}
      
      <div className="relative">
        {/* Icono de búsqueda */}
        <svg
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {/* Input de búsqueda */}
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${
            isDark 
              ? 'border-gray-600 bg-gray-900 text-gray-100 placeholder-gray-500' 
              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        {/* Botón para limpiar */}
        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Indicador de carga */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className={`animate-spin w-4 h-4 border-2 rounded-full ${isDark ? 'border-gray-600 border-t-[#c8f135]' : 'border-gray-300 border-t-[#c8f135]'}`}></div>
          </div>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && !disabled && (
        <div className={`absolute z-50 w-full mt-2 rounded-xl shadow-2xl border max-h-60 overflow-y-auto backdrop-blur-sm transition-all duration-200 ease-out ${
          isDark 
            ? 'bg-[#1a1a1a]/95 border-gray-700 shadow-[#c8f135]/10' 
            : 'bg-white/95 border-gray-200 shadow-[#c8f135]/15'
        }`}>
          {loading && options.length === 0 ? (
            <div className={`p-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Buscando...
            </div>
          ) : options.length === 0 ? (
            <div className={`p-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm ? 'No se encontraron resultados' : 'Escribe para buscar'}
            </div>
          ) : (
            <ul>
              {options.map((option) => (
                <li
                  key={option[valueField]}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-3 cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.01] rounded-md mx-2 my-1
                    ${isDark 
                      ? 'text-gray-100 hover:bg-gray-700 active:bg-gray-600 hover:shadow-lg'
                      : 'text-gray-900 hover:bg-gray-200 active:bg-gray-300 hover:shadow-lg'}
                    ${selectedOption?.[valueField] === option[valueField] 
                      ? (isDark ? 'bg-gray-700 font-semibold shadow-md' : 'bg-gray-200 font-semibold shadow-md') 
                      : ''}`}
                >
                  <div className="font-medium">{option[displayField]}</div>
                  {option.descripcion && (
                    <div className={`text-sm mt-1 truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {option.descripcion}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
