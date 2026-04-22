import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';

const FIELD_TYPES = {
  text: { label: 'Texto', icon: 'text' },
  number: { label: 'Número', icon: 'number' },
  select: { label: 'Selección', icon: 'list' },
  boolean: { label: 'Sí/No', icon: 'toggle' },
  date: { label: 'Fecha', icon: 'calendar' },
  textarea: { label: 'Texto largo', icon: 'text' },
};

export default function CustomFieldsManager() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newOption, setNewOption] = useState('');

  const ENTITY_OPTIONS = [
    { value: 'inmueble', label: 'Inmuebles' },
    { value: 'user', label: 'Usuarios' },
    { value: 'ubicacion', label: 'Ubicaciones' },
    { value: 'tipo_inmueble', label: 'Tipos de Inmuebles' },
  ];

  const [selectedEntity, setSelectedEntity] = useState('inmueble');

  const emptyField = {
    entity_type: selectedEntity,
    field_key: '',
    field_label: '',
    field_type: 'text',
    field_options: [],
    required: false,
    sort_order: 0,
  };

  const [formData, setFormData] = useState(emptyField);

  useEffect(() => {
    loadFields();
  }, [selectedEntity]);

  // Actualizar entity_type en formData cuando cambia selectedEntity
  useEffect(() => {
    if (!isEditing) {
      setFormData(prev => ({ ...prev, entity_type: selectedEntity }));
    }
  }, [selectedEntity, isEditing]);

  const loadFields = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/custom-fields?entity_type=${selectedEntity}`);
      const data = await response.json();

      if (data.success) {
        setFields(data.data);
      } else {
        setError('Error al cargar campos personalizados');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const url = isEditing
        ? `${API_URL}/custom-fields/${currentField.id}`
        : `${API_URL}/custom-fields`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(isEditing ? 'Campo actualizado' : 'Campo creado');
        setTimeout(() => setSuccessMessage(''), 3000);
        resetForm();
        loadFields();
      } else {
        setError(data.message || 'Error al guardar');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este campo?')) return;

    try {
      const response = await fetch(`${API_URL}/custom-fields/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Campo eliminado');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadFields();
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  const handleEdit = (field) => {
    setCurrentField(field);
    setFormData({
      entity_type: field.entity_type,
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      field_options: field.field_options || [],
      required: field.required,
      sort_order: field.sort_order,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData(emptyField);
    setIsEditing(false);
    setCurrentField(null);
    setShowForm(false);
    setNewOption('');
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    setFormData({
      ...formData,
      field_options: [...formData.field_options, newOption.trim()],
    });
    setNewOption('');
  };

  const removeOption = (index) => {
    setFormData({
      ...formData,
      field_options: formData.field_options.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className={`p-6 min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-[#c8f135] border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Campos Personalizados
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Define campos dinámicos para cada vista del sistema
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-[#2a2a2a] border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
          >
            {ENTITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#c8f135] hover:bg-[#d4f74e] text-black font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            + Nuevo Campo
          </button>
        </div>
      </div>

      {successMessage && (
        <div className={`mb-4 p-4 border rounded-lg ${isDark ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-100 border-green-400 text-green-700'}`}>
          {successMessage}
        </div>
      )}

      {error && (
        <div className={`mb-4 p-4 border rounded-lg ${isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-700'}`}>
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold underline">Cerrar</button>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className={`rounded-lg shadow-lg p-6 border mb-6 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {isEditing ? 'Editar Campo' : `Nuevo Campo para ${ENTITY_OPTIONS.find(e => e.value === selectedEntity)?.label}`}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vista seleccionada (solo mostrar, no editable aquí) */}
            {!isEditing && (
              <div className="p-3 rounded-lg bg-[#c8f135]/10 border border-[#c8f135]/30">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Vista:</strong> {ENTITY_OPTIONS.find(e => e.value === selectedEntity)?.label}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Clave (identificador)
                </label>
                <input
                  type="text"
                  value={formData.field_key}
                  onChange={(e) => setFormData({ ...formData, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#2a2a2a] border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="ej: numero_piso"
                  disabled={isEditing}
                  required
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Solo letras, números y guiones bajos
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Etiqueta
                </label>
                <input
                  type="text"
                  value={formData.field_label}
                  onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#2a2a2a] border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="ej: Número de Piso"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tipo de campo
                </label>
                <select
                  value={formData.field_type}
                  onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#2a2a2a] border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                >
                  {Object.entries(FIELD_TYPES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4 pt-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="w-4 h-4 accent-[#c8f135]"
                  />
                  <span className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Obligatorio</span>
                </label>
              </div>
            </div>

            {/* Opciones para tipo select */}
            {formData.field_type === 'select' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Opciones
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'bg-[#2a2a2a] border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                    placeholder="Nueva opción"
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="bg-[#c8f135] hover:bg-[#d4f74e] text-black font-semibold py-2 px-4 rounded-lg"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.field_options.map((opt, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-[#c8f135] hover:bg-[#d4f74e] text-black font-semibold py-2 px-6 rounded-lg"
              >
                {isEditing ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={`font-semibold py-2 px-6 rounded-lg ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de campos */}
      <div className={`rounded-lg shadow-lg overflow-hidden ${isDark ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white border border-gray-200'}`}>
        {fields.length === 0 ? (
          <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="text-4xl mb-2 block">📋</span>
            <p>No hay campos personalizados definidos</p>
            <p className="text-sm mt-2 opacity-70">Crea tu primer campo para empezar</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className={isDark ? 'bg-[#2a2a2a]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Clave</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Etiqueta</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tipo</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Req.</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fields.map((field) => (
                <tr key={field.id} className={isDark ? 'divide-gray-700' : ''}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {field.field_key}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {field.field_label}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {FIELD_TYPES[field.field_type]?.label || field.field_type}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {field.required ? '✓' : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleEdit(field)}
                      className="text-[#c8f135] hover:text-[#d4f74e] mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(field.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
