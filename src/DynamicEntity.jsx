import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';

export default function DynamicEntity({ entityType: initialEntityType, onBack, onRecordChanged }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [entityType, setEntityType] = useState(initialEntityType);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 5,
    current_page: 1,
    last_page: 1,
  });
  const [itemsPerPage, setItemsPerPage] = useState(5); // Selector de registros por página
  const [expandedEntityTypes, setExpandedEntityTypes] = useState(new Set());
  const [groupedRecords, setGroupedRecords] = useState([]);
  const [entityTypePagination, setEntityTypePagination] = useState({});
  const [selectOptions, setSelectOptions] = useState({}); // Opciones para campos select-entity
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda

  // Resetear búsqueda cuando cambia el entityType
  useEffect(() => {
    setSearchTerm('');
  }, [entityType.slug]);

  // Debounce para la búsqueda - recargar registros cuando cambia el término
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords(1, searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar entityType completo con campos
  useEffect(() => {
    const loadEntityType = async () => {
      try {
        const response = await fetch(
          `${API_URL}/entity-types/${initialEntityType.id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
            },
          }
        );
        const data = await response.json();
        console.log('EntityType API response:', data);
        if (data.success) {
          setEntityType(data.entity_type);
          console.log('EntityType fields:', data.entity_type?.fields);
        }
      } catch (error) {
        console.error('Error loading entity type:', error);
      }
    };
    
    if (initialEntityType?.id) {
      loadEntityType();
    }
  }, [initialEntityType?.id]);

  // Cargar opciones para campos select-entity
  useEffect(() => {
    const loadSelectOptions = async () => {
      if (!entityType?.fields) return;
      
      // Debug: ver todos los campos y sus configs
      console.log('All fields:', entityType.fields);
      
      const selectEntityFields = entityType.fields.filter(
        f => f.type === 'select-entity' && f.config?.entity_source
      );
      
      console.log('Select-entity fields found:', selectEntityFields);
      
      for (const field of selectEntityFields) {
        console.log(`Loading options for ${field.name} from ${field.config.entity_source}`);
        console.log('Field config:', field.config);
        console.log('Field name:', field.name);
        console.log('Field type:', field.type);
        try {
          const response = await fetch(
            `${API_URL}/dynamic/${field.config.entity_source}/options`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
              },
            }
          );
          const data = await response.json();
          if (data.success) {
            setSelectOptions(prev => ({
              ...prev,
              [field.name]: data.options || []
            }));
          }
        } catch (error) {
          console.error(`Error loading options for ${field.name}:`, error);
        }
      }
    };
    
    loadSelectOptions();
  }, [entityType]);

  // Cargar registros (perPageOverride evita estado obsoleto al cambiar el select antes del re-render)
  const fetchRecords = async (page = 1, search = searchTerm, perPageOverride = null) => {
    setLoading(true);
    try {
      const perPage = perPageOverride != null ? perPageOverride : itemsPerPage;
      // Construir URL con parámetros de búsqueda
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await fetch(
        `${API_URL}/dynamic/${entityType.slug}?page=${page}&per_page=${perPage}${searchParam}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        const allRecords = [...data.records];
        const entityTypes = [{
          ...entityType,
          records: data.records,
          pagination: {
            current_page: data.current_page,
            last_page: data.last_page,
            per_page: data.per_page,
            total: data.total
          }
        }];

        // Si el EntityType es contenedor, cargar registros de sus hijos
        if (entityType.is_container && !searchTerm) {
          try {
            const childTypesResponse = await fetch(
              `${API_URL}/entity-types`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
                },
              }
            );
            const childTypesData = await childTypesResponse.json();

            if (childTypesData.success) {
              const childTypes = childTypesData.entity_types.filter(
                et => et.parent_id === entityType.id && et.active !== false
              );

              // Inicializar paginación para el contenedor principal
              setEntityTypePagination(prev => ({
                ...prev,
                [entityType.id]: { current_page: 1, last_page: 1 }
              }));

              // Cargar registros de cada hijo con paginación
              for (const childType of childTypes) {
                const childPage = entityTypePagination[childType.id]?.current_page || 1;
                const childRecordsResponse = await fetch(
                  `${API_URL}/dynamic/${childType.slug}?page=${childPage}&per_page=5`,
                  {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
                    },
                  }
                );
                const childRecordsData = await childRecordsResponse.json();

                if (childRecordsData.success) {
                  allRecords.push(...childRecordsData.records);
                  entityTypes.push({
                    ...childType,
                    records: childRecordsData.records,
                    is_child: true,
                    pagination: {
                      current_page: childRecordsData.current_page,
                      last_page: childRecordsData.last_page,
                      per_page: childRecordsData.per_page,
                      total: childRecordsData.total
                    }
                  });

                  // Actualizar paginación del hijo
                  setEntityTypePagination(prev => ({
                    ...prev,
                    [childType.id]: {
                      current_page: childRecordsData.current_page,
                      last_page: childRecordsData.last_page
                    }
                  }));
                }
              }
            }
          } catch (err) {
            console.error('Error al cargar registros de hijos:', err);
          }
        }

        setRecords(allRecords);
        setGroupedRecords(entityTypes);
        setPagination({
          total: data.total,
          per_page: data.per_page,
          current_page: data.current_page,
          last_page: data.last_page,
        });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error al cargar registros: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar estado del formulario desde localStorage primero
    const savedFormState = localStorage.getItem(`dynamicForm_${entityType.slug}`);
    if (savedFormState) {
      try {
        const parsed = JSON.parse(savedFormState);
        if (parsed.showForm) {
          setShowForm(true);
          setEditingRecord(parsed.editingRecord);
          setFormData(parsed.formData);
        }
      } catch (err) {
        console.error('Error al cargar estado del formulario:', err);
      }
    }

    // Luego cargar los registros
    fetchRecords();
  }, [entityType.slug]);

  // Guardar estado del formulario en localStorage cuando cambie
  useEffect(() => {
    const formState = {
      showForm,
      editingRecord,
      formData
    };
    localStorage.setItem(`dynamicForm_${entityType.slug}`, JSON.stringify(formState));
  }, [showForm, editingRecord, formData]);

  // Inicializar formulario vacío
  const initializeForm = (record = null) => {
    const initial = {};
    entityType.fields?.forEach((field) => {
      if (record) {
        initial[field.name] = record.data?.[field.name] ?? '';
      } else {
        initial[field.name] = field.type === 'boolean' ? false : '';
      }
    });
    setFormData(initial);
  };

  // Abrir formulario para crear
  const handleCreate = () => {
    setEditingRecord(null);
    initializeForm();
    setShowForm(true);
  };

  // Abrir formulario para editar
  const handleEdit = (record) => {
    setEditingRecord(record);
    initializeForm(record);
    setShowForm(true);
  };

  // Limpiar estado del formulario
  const clearFormState = () => {
    localStorage.removeItem(`dynamicForm_${entityType.slug}`);
    setShowForm(false);
    setEditingRecord(null);
    setFormData({});
  };

  // Cambiar cantidad de registros por página
  const handleItemsPerPageChange = (value) => {
    const newValue = parseInt(value, 10);
    if (Number.isNaN(newValue) || newValue < 1) return;
    setItemsPerPage(newValue);
    setPagination((prev) => ({ ...prev, per_page: newValue, current_page: 1 }));
    fetchRecords(1, searchTerm, newValue);
  };

  // Cambiar página de un EntityType específico
  const handleEntityTypePageChange = (entityTypeId, newPage) => {
    setEntityTypePagination(prev => ({
      ...prev,
      [entityTypeId]: {
        ...prev[entityTypeId],
        current_page: newPage
      }
    }));
    // Recargar registros con la nueva página
    fetchRecords(pagination.current_page);
  };

  // Eliminar registro
  const handleDelete = async (record) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      const response = await fetch(
        `${API_URL}/dynamic/${entityType.slug}/${record.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchRecords(pagination.current_page);
        // Notificar al dashboard que hay cambios para refrescar estadísticas
        if (onRecordChanged) onRecordChanged();
      } else {
        alert(data.message || 'Error al eliminar');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Guardar (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingRecord
      ? `${API_URL}/dynamic/${entityType.slug}/${editingRecord.id}`
      : `${API_URL}/dynamic/${entityType.slug}`;

    const method = editingRecord ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        clearFormState();
        fetchRecords(pagination.current_page);
        // Notificar al dashboard que hay cambios para refrescar estadísticas
        if (onRecordChanged) onRecordChanged();
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert('Errores de validación:\n' + errorMessages);
        } else {
          alert(data.message || 'Error al guardar');
        }
      }
    } catch (err) {
      alert('Error de conexión: ' + err.message);
    }
  };

  // Función auxiliar para mostrar valor en tabla
  const getFieldDisplayValue = (field, value, recordId = null) => {
    if (field.type === 'id') {
      return recordId || '-';
    }
    
    if (field.type === 'correlativo') {
      return value || '-';
    }
    
    if (value === undefined || value === null || value === '') return '-';
    
    if (field.type === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    if (field.type === 'select-entity') {
      const options = selectOptions[field.name] || [];
      const option = options.find(opt => String(opt.id) === String(value));
      return option?.label || value;
    }
    
    return value;
  };

  // Renderizar campo según tipo
  const renderFormField = (field) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            rows={4}
            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] outline-none ${
              isDark
                ? 'bg-[#0f0f0f] border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 text-[#c8f135] focus:ring-[#c8f135]"
            />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Sí / No</span>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] outline-none ${
              isDark
                ? 'bg-[#0f0f0f] border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        );

      case 'select-entity': {
        const options = selectOptions[field.name] || [];
        return (
          <select
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] outline-none ${
              isDark
                ? 'bg-[#0f0f0f] border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Seleccionar...</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] outline-none ${
              isDark
                ? 'bg-[#0f0f0f] border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        );

      case 'id':
        return (
          <input
            type="text"
            value={editingRecord ? editingRecord.id : 'Se generará automáticamente'}
            disabled
            className={`w-full px-4 py-2 rounded-lg border bg-gray-100 text-gray-500 cursor-not-allowed ${
              isDark ? 'border-gray-700 bg-[#1a1a1a] text-gray-500' : 'border-gray-300'
            }`}
            placeholder={editingRecord ? '' : 'Se asignará automáticamente'}
          />
        );

      case 'correlativo':
        return (
          <input
            type="text"
            value={editingRecord ? value : 'Se generará automáticamente'}
            disabled
            className={`w-full px-4 py-2 rounded-lg border bg-gray-100 text-gray-500 cursor-not-allowed ${
              isDark ? 'border-gray-700 bg-[#1a1a1a] text-gray-500' : 'border-gray-300'
            }`}
            placeholder={editingRecord ? '' : 'Se asignará automáticamente'}
          />
        );

      default:
        return (
          <input
            type={field.type === 'email' ? 'email' : 'text'}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] outline-none ${
              isDark
                ? 'bg-[#0f0f0f] border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        );
    }
  };

  // Formulario
  if (showForm) {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0f0f0f] text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        <div className={`max-w-4xl mx-auto rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-[#c8f135]/10' : 'border-gray-200 bg-green-50'}`}>
            <h2 className="text-xl font-bold text-[#c8f135]">
              {editingRecord ? 'Editar' : 'Nuevo'} {entityType.form_title}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
              {entityType.fields?.map((field) => (
                <div key={field.name} className={`p-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderFormField(field)}
                </div>
              ))}
            </div>

            <div className={`flex gap-4 pt-8 mt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-[#c8f135] hover:bg-[#b8e125] text-[#1a1a1a] font-medium rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={clearFormState}
                className={`px-6 py-3 rounded-lg font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Listado
  return (
    <div className={`p-6 ${isDark ? 'bg-[#0f0f0f] text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-2xl font-bold">{entityType.form_title}</h1>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[#c8f135] hover:bg-[#b8e125] text-[#1a1a1a] font-medium rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo
          </button>
        </div>

        {/* Search Bar */}
        <div className={`mb-4 p-4 rounded-lg border ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="relative">
            <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Buscar en ${entityType.form_title || 'registros'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100 placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {!loading && records.length > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {pagination.total} {pagination.total === 1 ? 'registro encontrado' : 'registros encontrados'}
                {searchTerm && ` para "${searchTerm}"`}
                {pagination.last_page > 1 && ` • Página ${pagination.current_page} de ${pagination.last_page}`}
              </div>
              {/* Selector de registros por página */}
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Mostrar:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className={`pl-3 pr-10 py-1.5 min-w-[4.75rem] rounded-lg text-sm border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none cursor-pointer ${
                    isDark
                      ? 'bg-[#1a1a1a] border-gray-700 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-6 py-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c8f135]" />
          </div>
        ) : records.length === 0 ? (
          <div className={`py-16 px-6 rounded-xl flex flex-col items-center justify-center text-center ${isDark ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No hay registros aún
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 px-6 py-2 text-[#c8f135] hover:underline"
            >
              Crear el primero →
            </button>
          </div>
        ) : (
          <>
            {/* Tabla */}
            <div className={`rounded-xl overflow-hidden shadow-lg ${isDark ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} w-8`}></th>
                      <th className={`pl-4 pr-2 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Acciones
                      </th>
                      {entityType.fields?.map((field) => (
                        <th
                          key={field.name}
                          className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {groupedRecords.length > 0 ? (
                      groupedRecords.map((et) => {
                        const isExpanded = expandedEntityTypes.has(et.id);
                        const isChild = et.is_child;

                        return (
                          <React.Fragment key={et.id}>
                            {/* Fila de encabezado del EntityType */}
                            {et.is_container && (
                              <tr className={`${isDark ? 'bg-[#c8f135]/10' : 'bg-green-50'}`}>
                                <td className="px-6 py-4">
                                  {et.records.length > 0 && (
                                    <button
                                      onClick={() => {
                                        setExpandedEntityTypes(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(et.id)) {
                                            newSet.delete(et.id);
                                          } else {
                                            newSet.add(et.id);
                                          }
                                          return newSet;
                                        });
                                      }}
                                      className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-[#c8f135]/20' : 'hover:bg-green-100'}`}
                                    >
                                      <svg
                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                  )}
                                </td>
                                <td colSpan={entityType.fields?.length + 1} className={`px-6 py-4 font-semibold ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>
                                  {isChild && <span className="mr-2 ml-4">→</span>}
                                  {et.menu_name || et.form_title}
                                  <span className="ml-2 text-xs opacity-60">({et.records?.length || 0} registros)</span>
                                </td>
                                <td></td>
                              </tr>
                            )}
                            {/* Registros del EntityType */}
                            {(!entityType.is_container || isExpanded) && et.records?.length === 0 && searchTerm && (
                              <tr key="no-results">
                                <td colSpan={entityType.fields?.length + 2} className={`px-6 py-4 text-left text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  No se encontraron registros que coincidan con &quot;{searchTerm}&quot;
                                </td>
                              </tr>
                            )}
                            {(!entityType.is_container || isExpanded) && et.records?.map((record) => (
                                <tr
                                  key={record.id}
                                  className={`transition-colors ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-50'} ${isChild ? 'bg-gray-900/30' : ''}`}
                                >
                                  <td className="px-6 py-4">
                                    {isChild && <div className="w-4 h-4 border-l-2 border-[#c8f135]/50 ml-2"></div>}
                                  </td>
                                  <td className="pl-4 pr-6 py-4 text-left">
                                    <div className="flex items-center justify-start gap-2">
                                      <button
                                        onClick={() => handleEdit(record)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#c8f135]/20 text-[#c8f135]' : 'hover:bg-green-100 text-green-600'}`}
                                        title="Editar"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDelete(record)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
                                        title="Eliminar"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                  {entityType.fields?.map((field) => (
                                    <td
                                      key={field.name}
                                      className={`px-6 py-4 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} ${isChild ? 'pl-8' : ''}`}
                                    >
                                      {getFieldDisplayValue(field, record.data?.[field.name], record.id)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            {/* Paginación del EntityType */}
                            {(!entityType.is_container || isExpanded) && et.pagination && et.pagination.last_page > 1 && (
                              <tr>
                                <td colSpan={entityType.fields?.length + 2} className="px-4 py-2">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleEntityTypePageChange(et.id, et.pagination.current_page - 1)}
                                      disabled={et.pagination.current_page === 1}
                                      className={`px-2 py-1 rounded text-xs ${
                                        et.pagination.current_page === 1
                                          ? 'opacity-50 cursor-not-allowed'
                                          : 'hover:bg-[#c8f135]/20 text-[#c8f135]'
                                      }`}
                                    >
                                      ←
                                    </button>
                                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {et.pagination.current_page} / {et.pagination.last_page}
                                    </span>
                                    <button
                                      onClick={() => handleEntityTypePageChange(et.id, et.pagination.current_page + 1)}
                                      disabled={et.pagination.current_page === et.pagination.last_page}
                                      className={`px-2 py-1 rounded text-xs ${
                                        et.pagination.current_page === et.pagination.last_page
                                          ? 'opacity-50 cursor-not-allowed'
                                          : 'hover:bg-[#c8f135]/20 text-[#c8f135]'
                                      }`}
                                    >
                                      →
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : records.length === 0 && searchTerm ? (
                      <tr>
                        <td colSpan={entityType.fields?.length + 2} className={`px-4 py-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          No se encontraron registros que coincidan con &quot;{searchTerm}&quot;
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr
                          key={record.id}
                          className={`transition-colors ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-6 py-4"></td>
                          <td className="pl-4 pr-6 py-4 text-left">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(record)}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#c8f135]/20 text-[#c8f135]' : 'hover:bg-green-100 text-green-600'}`}
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(record)}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
                                title="Eliminar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          {entityType.fields?.map((field) => (
                            <td
                              key={field.name}
                              className={`px-6 py-4 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                            >
                              {getFieldDisplayValue(field, record.data?.[field.name], record.id)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => fetchRecords(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className={`px-3 py-2 rounded-lg ${
                    pagination.current_page === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#c8f135]/20 text-[#c8f135]'
                  }`}
                >
                  ← Anterior
                </button>
                <span className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                  Página {pagination.current_page} de {pagination.last_page}
                </span>
                <button
                  onClick={() => fetchRecords(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className={`px-3 py-2 rounded-lg ${
                    pagination.current_page === pagination.last_page
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#c8f135]/20 text-[#c8f135]'
                  }`}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
