import { useState, useEffect } from 'react';
import { API_URL } from './config';

export default function DynamicFormFields({ entityType, values, onChange, isDark }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFields = async () => {
      try {
        const response = await fetch(`${API_URL}/custom-fields?entity_type=${entityType}`);
        const data = await response.json();
        if (data.success) {
          setFields(data.data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    loadFields();
  }, [entityType]);

  if (loading || fields.length === 0) return null;

  const handleFieldChange = (fieldKey, value) => {
    onChange({
      ...values,
      [fieldKey]: value,
    });
  };

  const renderField = (field) => {
    const value = values[field.field_key] || '';
    const baseClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${
      isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
    }`;

    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={baseClass}
            placeholder={`Ingrese ${field.field_label.toLowerCase()}...`}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={baseClass}
            placeholder={`Ingrese ${field.field_label.toLowerCase()}...`}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            rows="2"
            className={baseClass}
            placeholder={`Ingrese ${field.field_label.toLowerCase()}...`}
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={baseClass}
            required={field.required}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value === '1' || value === true || value === 'true'}
              onChange={(e) => handleFieldChange(field.field_key, e.target.checked ? '1' : '0')}
              className="w-5 h-5 accent-[#c8f135]"
            />
            <span className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {value === '1' || value === true || value === 'true' ? 'Sí' : 'No'}
            </span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={baseClass}
            required={field.required}
          >
            <option value="">Seleccione...</option>
            {field.field_options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={baseClass}
            placeholder={`Ingrese ${field.field_label.toLowerCase()}...`}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="col-span-2 border-t pt-4 mt-4">
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-[#c8f135]' : 'text-gray-800'}`}>
        Campos Adicionales
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.id} className={field.field_type === 'textarea' ? 'col-span-2' : ''}>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {field.field_label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  );
}
