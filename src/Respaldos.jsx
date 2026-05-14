import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';
import * as LucideIcons from 'lucide-react';

export default function Respaldos() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [entityTypes, setEntityTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados del formulario
  const [selectedEntity, setSelectedEntity] = useState('');
  const [recordCount, setRecordCount] = useState('100');
  const [selectedField, setSelectedField] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [fieldValues, setFieldValues] = useState([]);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Cargar tipos de entidad disponibles
  useEffect(() => {
    const fetchEntityTypes = async () => {
      try {
        const response = await fetch(`${API_URL}/entity-types`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setEntityTypes(data.entity_types || []);
        }
      } catch {
        setError('Error al cargar los formularios disponibles');
      } finally {
        setLoading(false);
      }
    };

    fetchEntityTypes();
  }, []);

  // Obtener campos del formulario seleccionado
  const selectedEntityData = entityTypes.find(et => et.slug === selectedEntity);
  const availableFields = selectedEntityData?.fields || [];

  
  // Manejar cambio de entidad
  const handleEntityChange = (value) => {
    setSelectedEntity(value);
    setSelectedField('');
    setFieldValue('');
    setFieldValues([]);
  };

  // Cargar valores únicos de un campo
  const loadFieldValues = async (fieldName) => {
    if (!fieldName) {
      setFieldValues([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/dynamic/${selectedEntity}/field-values?field=${fieldName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFieldValues(data.values || []);
      }
    } catch (err) {
      console.error('Error al cargar valores del campo:', err);
      setFieldValues([]);
    }
  };

  // Manejar cambio de campo
  const handleFieldChange = (value) => {
    setSelectedField(value);
    setFieldValue('');
    setFieldValues([]);
    if (value) {
      loadFieldValues(value);
    }
  };

  // Función para exportar usando formulario (evita CORS)
  const handleExport = () => {
    if (!selectedEntity) {
      setError('Por favor selecciona un formulario para exportar');
      return;
    }

    setExporting(true);
    setError('');
    setSuccess('');

    try {
      // Crear formulario temporal
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = `${API_URL}/export/${selectedEntity}`;

      // Agregar campos ocultos
      const addField = (name, value) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      // Obtener token del user object en localStorage
      let token = '';
      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const user = JSON.parse(rawUser);
          token = user?.session_token || '';
        }
      } catch {
        token = '';
      }

      addField('format', exportFormat);
      addField('limit', recordCount);
      addField('token', token);
      if (selectedField && fieldValue) {
        addField('filter_field', selectedField);
        addField('filter_value', fieldValue);
      }

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      setSuccess(`Reporte generado exitosamente en formato ${exportFormat.toUpperCase()}`);
    } catch (err) {
      setError('Error al exportar los datos: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Función para limpiar el formulario
  const handleClear = () => {
    setSelectedEntity('');
    setRecordCount('100');
    setSelectedField('');
    setFieldValue('');
    setExportFormat('excel');
    setError('');
    setSuccess('');
  };

  // Función para previsualizar datos antes de exportar
  const handlePreview = async () => {
    if (!selectedEntity) {
      setError('Por favor selecciona un formulario para previsualizar');
      return;
    }

    setLoadingPreview(true);
    setError('');
    setSuccess('');

    try {
      // Construir URL con filtros usando el endpoint de export
      const params = new URLSearchParams();
      params.append('format', 'json'); // Pedir formato JSON en lugar de archivo
      params.append('limit', recordCount === 'all' ? '100' : recordCount);
      if (selectedField && fieldValue) {
        params.append('filter_field', selectedField);
        params.append('filter_value', fieldValue);
      }

      const response = await fetch(`${API_URL}/export/${selectedEntity}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPreviewData(data.records || []);
        setShowPreview(true);
        setSuccess(`Previsualización: Mostrando ${data.records?.length || 0} registros`);
      } else {
        setError(data.message || 'Error al cargar datos para previsualización');
      }
    } catch (err) {
      console.error('Error en handlePreview:', err);
      setError('Error al cargar datos para previsualización');
    } finally {
      setLoadingPreview(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c8f135]" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <LucideIcons.File className="w-8 h-8 text-[#c8f135]" />
          Reportes
        </h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Genera reportes de cualquier formulario a Excel, PDF o SQL
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400">
          {success}
        </div>
      )}

      {/* Formulario de exportación */}
      <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-[#c8f135]/10' : 'border-gray-200 bg-green-50'}`}>
          <h2 className="text-lg font-semibold text-[#c8f135]">
            Configuración de Reportes
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Selección de formulario */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Formulario a reportar <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => handleEntityChange(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#c8f135] outline-none ${
                isDark
                  ? 'bg-[#0f0f0f] border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Selecciona un formulario...</option>
              {entityTypes.map((entity) => (
                <option key={entity.slug} value={entity.slug}>
                  {entity.menu_name || entity.form_title || entity.slug}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad de registros */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Cantidad de registros a exportar
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={recordCount === 'all' ? '' : recordCount}
                onChange={(e) => setRecordCount(e.target.value || '100')}
                placeholder="Ingresa número de registros..."
                min="1"
                className={`flex-1 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#c8f135] outline-none ${
                  isDark
                    ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setRecordCount('all')}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  recordCount === 'all'
                    ? 'bg-[#c8f135] text-[#1a1a1a]'
                    : isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Todos
              </button>
            </div>
            <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Ingresa un número específico o selecciona "Todos" para reportar todos los registros
            </p>
          </div>

          {/* Filtro por campo */}
          <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-[#0f0f0f]/50' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Filtro (opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Campo a filtrar
                </label>
                <select
                  value={selectedField}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  disabled={!selectedEntity}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] outline-none disabled:opacity-50 ${
                    isDark
                      ? 'bg-[#0f0f0f] border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Sin filtro</option>
                  {availableFields.map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Valor del filtro
                </label>
                {selectedField && fieldValues.length > 0 ? (
                  <select
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] outline-none ${
                      isDark
                        ? 'bg-[#0f0f0f] border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Selecciona un valor...</option>
                    {fieldValues.map((item, index) => (
                      <option key={index} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    disabled={!selectedField}
                    placeholder={selectedField ? "Ingresa el valor a filtrar..." : "Selecciona un campo primero"}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] outline-none disabled:opacity-50 ${
                      isDark
                        ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-600'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Formato de exportación */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Formato de exportación
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'excel', label: 'Excel', icon: 'FileSpreadsheet' },
                { value: 'pdf', label: 'PDF', icon: 'FileText' },
                { value: 'sql', label: 'SQL', icon: 'Database' },
              ].map((format) => (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => setExportFormat(format.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    exportFormat === format.value
                      ? 'border-[#c8f135] bg-[#c8f135]/10 text-[#c8f135]'
                      : isDark
                        ? 'border-gray-700 hover:border-gray-600 text-gray-300'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  {format.icon === 'FileSpreadsheet' && <LucideIcons.FileSpreadsheet className="w-5 h-5" />}
                  {format.icon === 'FileText' && <LucideIcons.FileText className="w-5 h-5" />}
                  {format.icon === 'Database' && <LucideIcons.Database className="w-5 h-5" />}
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className={`flex gap-4 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
            <button
              onClick={handleExport}
              disabled={!selectedEntity || exporting}
              className="flex-1 px-6 py-3 bg-[#c8f135] hover:bg-[#b8e125] disabled:opacity-50 disabled:cursor-not-allowed text-[#1a1a1a] font-medium rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1a1a1a]" />
                  Generando reporte...
                </>
              ) : (
                <>
                  <LucideIcons.Download className="w-5 h-5" />
                  Generar Reporte {exportFormat.toUpperCase()}
                </>
              )}
            </button>
            <button
              onClick={handlePreview}
              disabled={!selectedEntity}
              className={`px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Previsualizar
            </button>
            <button
              onClick={handleClear}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                isDark 
                  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30' 
                  : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
              }`}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Previsualización de Datos */}
      {showPreview && (
        <div className={`mt-6 rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-gray-700 bg-[#c8f135]/10' : 'border-gray-200 bg-green-50'}`}>
            <h3 className="text-lg font-semibold text-[#c8f135]">
              Previsualización de Datos
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              Cerrar
            </button>
          </div>
          
          <div className="p-6">
            <div className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Mostrando {previewData.length} registros
            </div>

            {loadingPreview ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8f135]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                      {/* Columnas fijas */}
                      <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        ID
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Creado por
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Fecha
                      </th>
                      {/* Columnas dinámicas del DATA */}
                      {previewData.length > 0 && previewData[0]?.data && 
                        Object.keys(previewData[0].data).map((dataKey) => (
                          <th key={dataKey} className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {dataKey.replace('_', ' ').toUpperCase()}
                          </th>
                        ))
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.length === 0 ? (
                      <tr>
                        <td colSpan="100%" className="px-4 py-8 text-center text-gray-500">
                          No hay datos que coincidan con los filtros
                        </td>
                      </tr>
                    ) : (
                      previewData.map((row, index) => (
                        <tr key={index} className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-[#c8f135]/10' : 'border-gray-200 hover:bg-[#c8f135]/10'}`}>
                          {/* Columnas fijas */}
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {row.id}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {row.created_by || '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {new Date(row.created_at).toLocaleString('es-ES')}
                          </td>
                          {/* Columnas dinámicas del DATA */}
                          {row.data && Object.keys(row.data).map((dataKey) => (
                            <td key={dataKey} className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {row.data[dataKey] === null || row.data[dataKey] === '' ? (
                                '-'
                              ) : Array.isArray(row.data[dataKey]) ? (
                                row.data[dataKey].join(', ')
                              ) : (
                                String(row.data[dataKey])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-start gap-3">
          <LucideIcons.Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            <p className="font-medium mb-1">Información sobre los reportes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Los reportes en Excel incluyen todos los campos visibles del formulario</li>
              <li>Los PDFs mantienen el formato de tabla del listado actual</li>
              <li>Los archivos SQL generan sentencias INSERT para migración de datos</li>
              <li>Los filtros aplicados afectan todos los formatos de exportación</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
