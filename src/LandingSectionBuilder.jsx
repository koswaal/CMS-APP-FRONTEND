import { useState, useContext, useEffect, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Bloques disponibles para agregar
const BLOCK_TYPES = {
  heading: { label: 'Título', icon: 'Type', defaultContent: 'Título de sección' },
  text: { label: 'Texto', icon: 'AlignLeft', defaultContent: 'Escribe tu contenido aquí...' },
  image: { label: 'Imagen', icon: 'Image', defaultContent: '', defaultStyles: { alignment: 'left' } },
  button: { label: 'Botón', icon: 'Square', defaultContent: 'Hacer clic aquí', defaultStyles: { backgroundColor: '#c8f135', color: '#000000', borderRadius: '0.5rem', padding: '0.75rem 1.5rem', fontWeight: 'bold' } },
  divider: { label: 'Divisor', icon: 'Minus', defaultContent: '' },
  video: { label: 'Video', icon: 'Video', defaultContent: '' },
  grid: { label: 'Cuadrícula', icon: 'Columns', defaultContent: '', defaultStyles: { columns: 2, gap: '1rem' } },
  map: { label: 'Mapa', icon: 'MapPin', defaultContent: '' },
  social: { label: 'Redes Sociales', icon: 'Share2', defaultContent: '', defaultStyles: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'], layout: 'horizontal' } },
  testimonial: { label: 'Testimonio', icon: 'MessageSquare', defaultContent: '', defaultStyles: { quote: 'Este es un testimonio increíble de nuestro servicio.', author: 'Juan Pérez', position: 'CEO, Empresa XYZ' } },
  gallery: { label: 'Galería', icon: 'Image', defaultContent: '', defaultStyles: { images: [], columns: 3, gap: '0.5rem' } },
  contact: { label: 'Formulario', icon: 'Mail', defaultContent: '', defaultStyles: { fields: ['name', 'email', 'message'], submitText: 'Enviar mensaje', recipientEmail: '' } },
  stats: { label: 'Estadísticas', icon: 'TrendingUp', defaultContent: '', defaultStyles: { stats: [{ type: 'static', number: '100+', label: 'Clientes' }, { type: 'static', number: '50+', label: 'Proyectos' }, { type: 'static', number: '24/7', label: 'Soporte' }], columns: 3 } },
  spacer: { label: 'Espaciador', icon: 'Move', defaultContent: '' }
};

// Hook para animar números con easeOutQuart
function useCountUp(target, duration = 1500) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) return;
    const from = 0;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const value = Math.floor(from + (target - from) * eased);
      setCurrent(value);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

function AnimatedNumber({ value, prefix, suffix }) {
  const num = typeof value === 'number' ? value : parseInt(value, 10) || 0;
  const animated = useCountUp(num);
  const formatted = new Intl.NumberFormat('es-ES').format(animated);
  return <span>{prefix}{formatted}{suffix}</span>;
}

// Componente de bloque individual
function BlockItem({ block, index, isDark, onUpdate, onRemove, availableEntities }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content);
  const [editStyles, setEditStyles] = useState(block.styles || {});
  const [entityCounts, setEntityCounts] = useState({});

  // Cargar conteos de entidades cuando el bloque es de tipo stats
  // Usa batch cuando hay múltiples stats dinámicos y cachea en localStorage
  useEffect(() => {
    if (block.type !== 'stats' || !block.styles?.stats) return;
    const dynamicStats = block.styles.stats.filter(stat => stat.type === 'dynamic' && stat.entityType);
    if (dynamicStats.length === 0) return;

    const loadCounts = async () => {
      const counts = {};

      // Cargar desde cache si existe y tiene menos de 5 minutos
      const cacheKey = `entity_counts_${dynamicStats.map(s => s.entityType).sort().join('_')}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setEntityCounts(data);
            return;
          }
        } catch {
          // cache corrupto, continuar con fetch
        }
      }

      if (dynamicStats.length === 1) {
        // Un solo stat: usar endpoint simple
        const stat = dynamicStats[0];
        try {
          const response = await fetch(`${API_URL}/dynamic/${stat.entityType}/count`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
            },
          });
          const data = await response.json();
          counts[stat.entityType] = data.count || 0;
        } catch {
          counts[stat.entityType] = 0;
        }
      } else {
        // Múltiples stats: usar endpoint batch
        try {
          const response = await fetch(`${API_URL}/dynamic/count-batch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
            },
            body: JSON.stringify({
              queries: dynamicStats.map(stat => ({
                slug: stat.entityType,
                filter: stat.filter || undefined,
              })),
            }),
          });
          const data = await response.json();
          if (data.success && data.counts) {
            Object.assign(counts, data.counts);
          }
        } catch {
          dynamicStats.forEach(stat => { counts[stat.entityType] = 0; });
        }
      }

      setEntityCounts(counts);
      localStorage.setItem(cacheKey, JSON.stringify({ data: counts, timestamp: Date.now() }));
    };

    loadCounts();
  }, [block.styles?.stats, block.type]);

  const handleSave = () => {
    onUpdate(index, { 
      ...block, 
      content: editContent,
      styles: editStyles 
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_URL}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setEditContent(data.url);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading':
        return (
          <h2 
            className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={block.styles}
          >
            {block.content}
          </h2>
        );
      case 'text':
        return (
          <p 
            className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            style={block.styles}
          >
            {block.content}
          </p>
        );
      case 'image': {
        const alignment = block.styles?.alignment || 'left';
        return block.content ? (
          <div className={`w-full flex ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
            <img 
              src={block.content} 
              alt="Section content" 
              className="max-w-full h-auto rounded-lg"
              style={{ 
                ...block.styles,
                maxWidth: alignment === 'center' ? '100%' : block.styles?.maxWidth || '100%'
              }}
            />
          </div>
        ) : (
          <div className={`p-8 border-2 border-dashed rounded-lg text-center ${isDark ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
            Sin imagen
          </div>
        );
      }
      case 'button':
        return (
          <div className="flex" style={{ justifyContent: block.styles?.textAlign || 'flex-start' }}>
            <a
              href={block.link || '#'}
              className="inline-block transition-transform hover:scale-105"
              style={{
                backgroundColor: block.styles?.backgroundColor || '#c8f135',
                color: block.styles?.color || '#000000',
                borderRadius: block.styles?.borderRadius || '0.5rem',
                padding: block.styles?.padding || '0.75rem 1.5rem',
                fontWeight: block.styles?.fontWeight || 'bold',
                fontSize: block.styles?.fontSize || '1rem',
                fontFamily: block.styles?.fontFamily || 'inherit',
                fontStyle: block.styles?.fontStyle || 'normal',
                textDecoration: 'none'
              }}
              onClick={(e) => e.preventDefault()}
            >
              {block.content}
            </a>
          </div>
        );
      case 'divider':
        return (
          <hr 
            className="my-4" 
            style={{ 
              borderColor: isDark ? '#374151' : '#e5e7eb',
              borderWidth: block.styles?.borderWidth || '1px',
              borderStyle: block.styles?.borderStyle || 'solid'
            }} 
          />
        );
      case 'video': {
        const videoId = block.content?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/)?.[1];
        return (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            {videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full"
                allowFullScreen
                title="YouTube Video"
              />
            ) : block.content ? (
              <video src={block.content} controls className="w-full h-full" />
            ) : (
              <div className={`flex flex-col items-center justify-center h-full ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p>Sin video configurado</p>
              </div>
            )}
          </div>
        );
      }
      case 'map': {
        const mapUrl = block.content?.includes('iframe') 
          ? block.content.match(/src="([^"]+)"/)?.[1] 
          : block.content;
        return (
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            {mapUrl ? (
              <iframe
                src={mapUrl}
                className="w-full h-full border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Map"
              />
            ) : (
              <div className={`flex flex-col items-center justify-center h-full ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>Sin mapa configurado</p>
              </div>
            )}
          </div>
        );
      }
      case 'grid': {
        const columns = block.styles?.columns || 2;
        const gap = block.styles?.gap || '1rem';
        return (
          <div 
            className="grid w-full" 
            style={{ 
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: gap
            }}
          >
            {Array.from({ length: columns }).map((_, i) => (
              <div 
                key={`grid-cell-${i}`} 
                className={`p-4 border-2 border-dashed rounded-lg flex items-center justify-center ${
                  isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
                }`}
                style={{ minHeight: '100px' }}
              >
                <span className="text-xs opacity-50 text-center">
                  Columna {i + 1}<br/>(Contenido pronto)
                </span>
              </div>
            ))}
          </div>
        );
      }
      case 'testimonial': {
        const testimonialData = block.styles || {};
        return (
          <div className={`p-6 rounded-lg border-2 ${
            isDark 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="flex-1">
                <blockquote className={`text-lg italic mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  "{testimonialData.quote || 'Este es un testimonio increíble de nuestro servicio.'}"
                </blockquote>
                <div>
                  <cite className={`font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {testimonialData.author || 'Juan Pérez'}
                  </cite>
                  {testimonialData.position && (
                    <span className={`block text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {testimonialData.position}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'gallery': {
        const images = block.styles?.images || [];
        const columns = block.styles?.columns || 3;
        const gap = block.styles?.gap || '0.5rem';
        
        return (
          <div className="w-full">
            {images.length === 0 ? (
              <div className={`p-8 border-2 border-dashed rounded-lg text-center ${
                isDark ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'
              }`}>
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Sin imágenes en la galería</p>
              </div>
            ) : (
              <div 
                className="grid w-full"
                style={{ 
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  gap: gap
                }}
              >
                {images.map((image, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-lg">
                    <img 
                      src={image} 
                      alt={`Gallery image ${index + 1}`}
                      className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'contact': {
        const fields = block.styles?.fields || ['name', 'email', 'message'];
        const submitText = block.styles?.submitText || 'Enviar mensaje';
        
        const renderField = (fieldType) => {
          switch (fieldType) {
            case 'name':
              return (
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              );
            case 'email':
              return (
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              );
            case 'phone':
              return (
                <input
                  type="tel"
                  placeholder="Tu teléfono"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              );
            case 'subject':
              return (
                <input
                  type="text"
                  placeholder="Asunto"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              );
            case 'message':
              return (
                <textarea
                  placeholder="Tu mensaje"
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              );
            default:
              return null;
          }
        };
        
        return (
          <div className={`p-6 rounded-lg border-2 ${
            isDark 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {fields.map((field, index) => (
                <div key={`field-${field}-${index}`}>
                  {renderField(field)}
                </div>
              ))}
              <button
                type="submit"
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-[#c8f135] text-black hover:bg-[#d4ff4d]' 
                    : 'bg-[#c8f135] text-black hover:bg-[#d4ff4d]'
                }`}
              >
                {submitText}
              </button>
            </form>
          </div>
        );
      }
      case 'stats': {
        const stats = block.styles?.stats || [{ type: 'static', number: '100+', label: 'Clientes' }, { type: 'static', number: '50+', label: 'Proyectos' }, { type: 'static', number: '24/7', label: 'Soporte' }];
        const columns = block.styles?.columns || 3;

        return (
          <div className="w-full">
            <div
              className="grid w-full gap-8"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
              }}
            >
              {stats.map((stat, idx) => (
                <div key={`stat-${stat.label || idx}-${idx}`} className="text-center">
                  {stat.icon && (
                    <div className="text-3xl mb-2">{stat.icon}</div>
                  )}
                  <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-[#c8f135]' : 'text-[#c8f135]'}`}>
                    {stat.type === 'dynamic' && stat.entityType ? (
                      entityCounts[stat.entityType] === undefined ? (
                        '...'
                      ) : (
                        <AnimatedNumber
                          value={entityCounts[stat.entityType]}
                          prefix={stat.prefix || ''}
                          suffix={stat.suffix || ''}
                        />
                      )
                    ) : (
                      <span>{stat.prefix}{stat.number || '0'}{stat.suffix}</span>
                    )}
                  </div>
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {stat.label || 'Estadística'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'spacer':
        return <div style={{ height: block.styles?.height || '2rem' }} />;
      case 'social': {
        const platforms = block.styles?.platforms || ['facebook', 'twitter', 'instagram', 'linkedin'];
        const layout = block.styles?.layout || 'horizontal';
        const platformUrls = block.content ? (() => {
          try {
            return JSON.parse(block.content);
          } catch {
            console.warn('Invalid JSON in block content:', block.content);
            return {};
          }
        })() : {};
        
        const platformIcons = {
          facebook: { name: 'Facebook', color: '#1877f2', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
          twitter: { name: 'Twitter', color: '#1da1f2', icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
          instagram: { name: 'Instagram', color: '#e4405f', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z' },
          linkedin: { name: 'LinkedIn', color: '#0077b5', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' }
        };
        
        return (
          <div className={`w-full ${layout === 'horizontal' ? 'flex flex-wrap gap-4 justify-center' : 'grid grid-cols-2 gap-4'}`}>
            {platforms.map((platform) => {
              const platformData = platformIcons[platform];
              const url = platformUrls[platform] || '#';
              
              return (
                <a
                  key={`social-${platform}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-transform hover:scale-105 ${
                    isDark ? 'hover:opacity-90' : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: platformData?.color || '#6b7280' }}
                  onClick={(e) => {
                    if (url === '#') {
                      e.preventDefault();
                    }
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={platformData?.icon || ''} />
                  </svg>
                  <span className="text-sm font-medium">{platformData?.name || platform}</span>
                </a>
              );
            })}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Draggable draggableId={block.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`relative p-4 rounded-lg border-2 mb-4 ${
            snapshot.isDragging ? 'shadow-2xl z-50 scale-[1.01] opacity-95' : ''
          } ${
            isDark 
              ? 'border-gray-700 bg-[#1a1a1a]' 
              : 'border-gray-200 bg-white'
          }`}
        >
          {/* Handle de arrastre */}
          <div 
            {...provided.dragHandleProps}
            className={`absolute left-2 top-2 p-1 rounded cursor-grab active:cursor-grabbing ${
              isDark ? 'bg-gray-800/50 text-gray-500 hover:text-gray-300' : 'bg-gray-100/50 text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>

          {/* Toolbar de bloque */}
          <div className={`absolute -top-3 right-4 flex items-center gap-1 px-2 py-1 rounded-full opacity-60 hover:opacity-100 transition-opacity z-10 ${
            isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100 shadow-sm'
          }`}>
            <button 
              onClick={() => setIsEditing(true)}
              className={`p-1.5 rounded-md ${isDark ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-gray-200 text-blue-600'}`}
              title="Editar contenido y estilos"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              onClick={() => onRemove(index)}
              className={`p-1.5 rounded-md ${isDark ? 'hover:bg-red-900/50 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
              title="Eliminar bloque"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Contenido del bloque */}
          <div className="pt-2">
            {renderBlockContent()}
          </div>

          {/* Modal de edición */}
          {isEditing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsEditing(false)}
              />
              <div className={`relative w-full max-w-lg p-6 rounded-xl shadow-2xl ${isDark ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Configuración de {BLOCK_TYPES[block.type].label}
                  </h3>
                  <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-1">
                  {/* Controles comunes de Estilo (Texto, Título, Botón) */}
                  {['heading', 'text', 'button'].includes(block.type) && (
                    <div className="space-y-4 mb-6 pt-4 border-t border-gray-700/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Tamaño de fuente
                          </label>
                          <select
                            value={editStyles?.fontSize || '1rem'}
                            onChange={(e) => setEditStyles({ ...editStyles, fontSize: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                          >
                            <option value="0.75rem">Pequeño</option>
                            <option value="1rem">Normal</option>
                            <option value="1.25rem">Grande</option>
                            <option value="1.5rem">Extra Grande</option>
                            <option value="2rem">Título 2</option>
                            <option value="2.5rem">Título 1</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Alineación
                          </label>
                          <select
                            value={editStyles?.textAlign || 'left'}
                            onChange={(e) => setEditStyles({ ...editStyles, textAlign: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                          >
                            <option value="left">Izquierda</option>
                            <option value="center">Centro</option>
                            <option value="right">Derecha</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Tipografía y Estilo
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditStyles({ ...editStyles, fontWeight: editStyles?.fontWeight === 'bold' ? 'normal' : 'bold' })}
                            className={`flex-1 py-2 rounded-lg border font-bold transition-all ${editStyles?.fontWeight === 'bold' ? 'bg-[#c8f135] border-[#c8f135] text-black shadow-lg shadow-[#c8f135]/20' : (isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-100 border-gray-300')}`}
                          >
                            B
                          </button>
                          <button
                            onClick={() => setEditStyles({ ...editStyles, fontStyle: editStyles?.fontStyle === 'italic' ? 'normal' : 'italic' })}
                            className={`flex-1 py-2 rounded-lg border italic transition-all ${editStyles?.fontStyle === 'italic' ? 'bg-[#c8f135] border-[#c8f135] text-black shadow-lg shadow-[#c8f135]/20' : (isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-100 border-gray-300')}`}
                          >
                            I
                          </button>
                          <select
                            value={editStyles?.fontFamily || 'inherit'}
                            onChange={(e) => setEditStyles({ ...editStyles, fontFamily: e.target.value })}
                            className={`flex-[2] px-3 py-2 text-sm rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                          >
                            <option value="inherit">Fuente del sistema</option>
                            <option value="'Inter', sans-serif">Inter (Moderna)</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Playfair Display', serif">Elegante (Serif)</option>
                            <option value="'Courier New', monospace">Código (Mono)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {block.type === 'image' ? (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            URL de la imagen
                          </label>
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            O subir archivo
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Alineación
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setEditStyles({ ...editStyles, alignment: 'left' })}
                              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                                editStyles?.alignment === 'left' || !editStyles?.alignment
                                  ? 'bg-[#c8f135] text-black'
                                  : isDark 
                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Izquierda
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditStyles({ ...editStyles, alignment: 'center' })}
                              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                                editStyles?.alignment === 'center'
                                  ? 'bg-[#c8f135] text-black'
                                  : isDark 
                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Centro
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditStyles({ ...editStyles, alignment: 'right' })}
                              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                                editStyles?.alignment === 'right'
                                  ? 'bg-[#c8f135] text-black'
                                  : isDark 
                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Derecha
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : block.type === 'button' ? (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Texto del botón
                          </label>
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Enlace (URL)
                          </label>
                          <input
                            type="text"
                            value={block.link || ''}
                            onChange={(e) => onUpdate(index, { ...block, link: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Color fondo
                            </label>
                            <input
                              type="color"
                              value={editStyles?.backgroundColor || '#c8f135'}
                              onChange={(e) => setEditStyles({ ...editStyles, backgroundColor: e.target.value })}
                              className="w-full h-11 p-1 rounded-lg bg-transparent border border-gray-600 cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Color texto
                            </label>
                            <input
                              type="color"
                              value={editStyles?.color || '#000000'}
                              onChange={(e) => setEditStyles({ ...editStyles, color: e.target.value })}
                              className="w-full h-11 p-1 rounded-lg bg-transparent border border-gray-600 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    ) : block.type === 'grid' ? (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Columnas
                          </label>
                          <select
                            value={editStyles?.columns || 2}
                            onChange={(e) => setEditStyles({ ...editStyles, columns: parseInt(e.target.value) })}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                          >
                            <option value={1}>1 Columna</option>
                            <option value={2}>2 Columnas</option>
                            <option value={3}>3 Columnas</option>
                            <option value={4}>4 Columnas</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Espaciado (Gap)
                          </label>
                          <input
                            type="text"
                            value={editStyles?.gap || '1rem'}
                            onChange={(e) => setEditStyles({ ...editStyles, gap: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            placeholder="1rem, 20px, etc."
                          />
                        </div>
                      </div>
                    ) : block.type === 'map' ? (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Google Maps Embed URL / iFrame
                        </label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                          placeholder="Pega aquí el código iFrame o la URL de inserción de Google Maps"
                        />
                        <p className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Ve a Google Maps, elige un lugar, dale a Compartir -{'>'} Insertar mapa y copia el código.
                        </p>
                      </div>
                    ) : block.type === 'video' ? (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          URL del Video
                        </label>
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                          placeholder="YouTube o archivo MP4"
                        />
                      </div>
                    ) : block.type === 'divider' ? (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Grosor (px)
                        </label>
                        <input
                          type="number"
                          value={parseInt(editStyles?.borderWidth) || 1}
                          onChange={(e) => setEditStyles({ ...editStyles, borderWidth: `${e.target.value}px` })}
                          className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                    ) : block.type === 'spacer' ? (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Altura (ej: 2rem)
                        </label>
                        <input
                          type="text"
                          value={editStyles?.height || '2rem'}
                          onChange={(e) => setEditStyles({ ...editStyles, height: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                    ) : block.type === 'social' ? (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Layout
                          </label>
                          <select
                            value={editStyles?.layout || 'horizontal'}
                            onChange={(e) => setEditStyles({ ...editStyles, layout: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                          >
                            <option value="horizontal">Horizontal</option>
                            <option value="grid">Cuadrícula (2x2)</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Plataformas
                          </label>
                          <div className="space-y-2">
                            {['facebook', 'twitter', 'instagram', 'linkedin'].map((platform) => (
                              <label key={`edit-platform-${platform}`} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editStyles?.platforms?.includes(platform) || false}
                                  onChange={(e) => {
                                    const platforms = editStyles?.platforms || ['facebook', 'twitter', 'instagram', 'linkedin'];
                                    if (e.target.checked) {
                                      setEditStyles({ ...editStyles, platforms: [...platforms, platform] });
                                    } else {
                                      setEditStyles({ ...editStyles, platforms: platforms.filter(p => p !== platform) });
                                    }
                                  }}
                                  className={`rounded ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                                />
                                <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {platform}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            URLs de Redes Sociales
                          </label>
                          {editStyles?.platforms?.map((platform) => {
                            const platformUrls = editContent ? (() => {
                              try {
                                return JSON.parse(editContent);
                              } catch {
                                console.warn('Invalid JSON in editContent:', editContent);
                                return {};
                              }
                            })() : {};
                            return (
                              <div key={`url-platform-${platform}`}>
                                <label className={`block text-xs mb-1 capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {platform}
                                </label>
                                <input
                                  type="text"
                                  value={platformUrls[platform] || ''}
                                  onChange={(e) => {
                                    const urls = editContent ? (() => {
                                          try {
                                            return JSON.parse(editContent);
                                          } catch {
                                            console.warn('Invalid JSON in editContent:', editContent);
                                            return {};
                                          }
                                        })() : {};
                                    urls[platform] = e.target.value;
                                    setEditContent(JSON.stringify(urls));
                                  }}
                                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                  placeholder={`https://${platform}..com/tu-perfil`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : block.type === 'testimonial' ? (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Testimonio
                          </label>
                          <textarea
                            value={editStyles?.quote || ''}
                            onChange={(e) => setEditStyles({ ...editStyles, quote: e.target.value })}
                            rows={4}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            placeholder="Escribe aquí el testimonio del cliente..."
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Nombre del autor
                          </label>
                          <input
                            type="text"
                            value={editStyles?.author || ''}
                            onChange={(e) => setEditStyles({ ...editStyles, author: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            placeholder="Juan Pérez"
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Cargo/Posición
                          </label>
                          <input
                            type="text"
                            value={editStyles?.position || ''}
                            onChange={(e) => setEditStyles({ ...editStyles, position: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            placeholder="CEO, Empresa XYZ"
                          />
                        </div>
                      </div>
                    ) : block.type === 'gallery' ? (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            URLs de Imágenes (una por línea)
                          </label>
                          <textarea
                            value={(editStyles?.images || []).join('\n')}
                            onChange={(e) => {
                              const urls = e.target.value.split('\n').filter(url => url.trim());
                              setEditStyles({ ...editStyles, images: urls });
                            }}
                            rows={6}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            placeholder="https://ejemplo.com/imagen1.jpg&#10;https://ejemplo.com/imagen2.jpg&#10;https://ejemplo.com/imagen3.jpg"
                          />
                          <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Pega una URL de imagen por línea
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Columnas
                            </label>
                            <select
                              value={editStyles?.columns || 3}
                              onChange={(e) => setEditStyles({ ...editStyles, columns: parseInt(e.target.value) })}
                              className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            >
                              <option value={1}>1 Columna</option>
                              <option value={2}>2 Columnas</option>
                              <option value={3}>3 Columnas</option>
                              <option value={4}>4 Columnas</option>
                            </select>
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Espaciado
                            </label>
                            <select
                              value={editStyles?.gap || '0.5rem'}
                              onChange={(e) => setEditStyles({ ...editStyles, gap: e.target.value })}
                              className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            >
                              <option value="0">Sin espaciado</option>
                              <option value="0.25rem">Muy pequeño</option>
                              <option value="0.5rem">Pequeño</option>
                              <option value="1rem">Mediano</option>
                              <option value="1.5rem">Grande</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : block.type === 'contact' ? (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Campos del formulario
                          </label>
                          <div className="space-y-2">
                            {['name', 'email', 'phone', 'subject', 'message'].map((field) => (
                              <label key={`contact-field-${field}`} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editStyles?.fields?.includes(field) || false}
                                  onChange={(e) => {
                                    const fields = editStyles?.fields || ['name', 'email', 'message'];
                                    if (e.target.checked) {
                                      setEditStyles({ ...editStyles, fields: [...fields, field] });
                                    } else {
                                      setEditStyles({ ...editStyles, fields: fields.filter(f => f !== field) });
                                    }
                                  }}
                                  className={`rounded ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                                />
                                <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {field === 'name' ? 'Nombre' : field === 'email' ? 'Correo electrónico' : field === 'phone' ? 'Teléfono' : field === 'subject' ? 'Asunto' : 'Mensaje'}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Texto del botón
                          </label>
                          <input
                            type="text"
                            value={editStyles?.submitText || 'Enviar mensaje'}
                            onChange={(e) => setEditStyles({ ...editStyles, submitText: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            placeholder="Enviar mensaje"
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Correo de destino (opcional)
                          </label>
                          <input
                            type="email"
                            value={editStyles?.recipientEmail || ''}
                            onChange={(e) => setEditStyles({ ...editStyles, recipientEmail: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            placeholder="contacto@ejemplo.com"
                          />
                          <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Correo donde se recibirán los mensajes del formulario
                          </p>
                        </div>
                      </div>
                    ) : block.type === 'stats' ? (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Estadísticas
                          </label>
                          <div className="space-y-3">
                            {(editStyles?.stats || [{ type: 'static', number: '', label: '' }]).map((stat, index) => (
                              <div key={`edit-stat-${stat.label || index}-${index}`} className="space-y-2 p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Tipo:
                                  </label>
                                  <select
                                    value={stat.type || 'static'}
                                    onChange={(e) => {
                                      const newStats = [...(editStyles?.stats || [])];
                                      newStats[index] = { ...newStats[index], type: e.target.value };
                                      if (e.target.value === 'static') {
                                        delete newStats[index].entityType;
                                        delete newStats[index].filter;
                                        delete newStats[index].filterField;
                                        delete newStats[index].filterValue;
                                      }
                                      setEditStyles({ ...editStyles, stats: newStats });
                                    }}
                                    className={`flex-1 px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                  >
                                    <option value="static">Valor estático</option>
                                    <option value="dynamic">Contar registros de entidad</option>
                                  </select>
                                  {editStyles?.stats?.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const newStats = editStyles?.stats?.filter((_, i) => i !== index) || [];
                                        setEditStyles({ ...editStyles, stats: newStats });
                                      }}
                                      className={`px-3 py-2 rounded-lg font-medium ${isDark ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>

                                {stat.type === 'static' ? (
                                  <input
                                    type="text"
                                    value={stat.number || ''}
                                    onChange={(e) => {
                                      const newStats = [...(editStyles?.stats || [])];
                                      newStats[index] = { ...newStats[index], number: e.target.value };
                                      setEditStyles({ ...editStyles, stats: newStats });
                                    }}
                                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                    placeholder="100+"
                                  />
                                ) : (
                                  <>
                                    <select
                                      value={stat.entityType || ''}
                                      onChange={(e) => {
                                        const newStats = [...(editStyles?.stats || [])];
                                        newStats[index] = { ...newStats[index], entityType: e.target.value };
                                        setEditStyles({ ...editStyles, stats: newStats });
                                      }}
                                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                    >
                                      <option value="">Seleccionar entidad...</option>
                                      {availableEntities.map((entity) => (
                                        <option key={`entity-${entity.id}-${entity.slug}`} value={entity.slug}>
                                          {entity.menu_name} ({entity.recordCount} registros)
                                        </option>
                                      ))}
                                    </select>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={stat.filterField || ''}
                                        onChange={(e) => {
                                          const newStats = [...(editStyles?.stats || [])];
                                          newStats[index] = { ...newStats[index], filterField: e.target.value };
                                          newStats[index].filter = e.target.value && stat.filterValue ? { [e.target.value]: stat.filterValue } : undefined;
                                          setEditStyles({ ...editStyles, stats: newStats });
                                        }}
                                        className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                        placeholder="Campo filtro (ej: status)"
                                      />
                                      <input
                                        type="text"
                                        value={stat.filterValue || ''}
                                        onChange={(e) => {
                                          const newStats = [...(editStyles?.stats || [])];
                                          newStats[index] = { ...newStats[index], filterValue: e.target.value };
                                          newStats[index].filter = stat.filterField && e.target.value ? { [stat.filterField]: e.target.value } : undefined;
                                          setEditStyles({ ...editStyles, stats: newStats });
                                        }}
                                        className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                        placeholder="Valor filtro (ej: activo)"
                                      />
                                    </div>
                                  </>
                                )}

                                {stat.type === 'dynamic' && availableEntities.length === 0 && (
                                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                                    No hay módulos disponibles con registros. Crea nuevos módulos desde la gestión de menús.
                                  </p>
                                )}

                                <input
                                  type="text"
                                  value={stat.label || ''}
                                  onChange={(e) => {
                                    const newStats = [...(editStyles?.stats || [])];
                                    newStats[index] = { ...newStats[index], label: e.target.value };
                                    setEditStyles({ ...editStyles, stats: newStats });
                                  }}
                                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                  placeholder="Clientes"
                                />

                                <div className="grid grid-cols-3 gap-2">
                                  <select
                                    value={stat.icon || ''}
                                    onChange={(e) => {
                                      const newStats = [...(editStyles?.stats || [])];
                                      newStats[index] = { ...newStats[index], icon: e.target.value || undefined };
                                      setEditStyles({ ...editStyles, stats: newStats });
                                    }}
                                    className={`px-2 py-2 rounded-lg border text-lg ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                  >
                                    <option value="">Sin icono</option>
                                    <option value="🔥">🔥 Fuego</option>
                                    <option value="👥">👥 Usuarios</option>
                                    <option value="💰">💰 Dinero</option>
                                    <option value="🏢">🏢 Edificio</option>
                                    <option value="⭐">⭐ Estrella</option>
                                    <option value="📈">📈 Gráfica</option>
                                    <option value="🛒">🛒 Carrito</option>
                                    <option value="🏠">🏠 Casa</option>
                                    <option value="🎯">🎯 Objetivo</option>
                                    <option value="⚡">⚡ Energía</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={stat.prefix || ''}
                                    onChange={(e) => {
                                      const newStats = [...(editStyles?.stats || [])];
                                      newStats[index] = { ...newStats[index], prefix: e.target.value };
                                      setEditStyles({ ...editStyles, stats: newStats });
                                    }}
                                    className={`px-3 py-2 rounded-lg border text-center ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                    placeholder="Prefijo ($, +)"
                                  />
                                  <input
                                    type="text"
                                    value={stat.suffix || ''}
                                    onChange={(e) => {
                                      const newStats = [...(editStyles?.stats || [])];
                                      newStats[index] = { ...newStats[index], suffix: e.target.value };
                                      setEditStyles({ ...editStyles, stats: newStats });
                                    }}
                                    className={`px-3 py-2 rounded-lg border text-center ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                    placeholder="Sufijo (+, %)"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              const newStats = [...(editStyles?.stats || []), { type: 'static', number: '', label: '' }];
                              setEditStyles({ ...editStyles, stats: newStats });
                            }}
                            className={`mt-2 px-3 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            + Agregar estadística
                          </button>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Columnas
                          </label>
                          <select
                            value={editStyles?.columns || 3}
                            onChange={(e) => setEditStyles({ ...editStyles, columns: parseInt(e.target.value) })}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                          >
                            <option value={1}>1 Columna</option>
                            <option value={2}>2 Columnas</option>
                            <option value={3}>3 Columnas</option>
                            <option value={4}>4 Columnas</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={6}
                        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white focus:border-[#c8f135]' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-700/50">
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 bg-[#c8f135] text-black font-bold rounded-lg hover:bg-[#d4ff4d] shadow-lg shadow-[#c8f135]/10"
                  >
                    Aplicar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function LandingSectionBuilder({ isOpen, onClose, section, onSuccess }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  
  const editSection = section; // Renombrar para consistencia
  const [title, setTitle] = useState(section?.menu_name || '');
  const [slug, setSlug] = useState(section?.slug || '');
  const [icon, setIcon] = useState(section?.icon || 'Layout');
  const [blocks, setBlocks] = useState(section?.layout_data?.components || []);
  const [sectionStyles, setSectionStyles] = useState(section?.layout_data?.styles || {});
  const [availableEntities, setAvailableEntities] = useState([]);
  const [saving, setSaving] = useState(false);

  // Sincronizar estados cuando cambia la sección a editar
  useEffect(() => {
    if (isOpen && section) {
      setTitle(section.menu_name || '');
      setSlug(section.slug || '');
      setIcon(section.icon || 'Layout');
      setBlocks(section.layout_data?.components || []);
      setSectionStyles(section.layout_data?.styles || {});
    }
  }, [isOpen, section]);

  // Cargar entidades disponibles cuando el componente se abre
  useEffect(() => {
    if (isOpen) {
      const fetchEntities = async () => {
        try {
          const response = await fetch(`${API_URL}/entity-types?all=true`);
          const data = await response.json();
          if (data.success) {
            // Filtrar entidades que realmente existen y tienen datos
            const validEntities = await Promise.all(
              (data.entity_types || []).map(async (entity) => {
                try {
                  // Verificar si la entidad tiene registros accediendo a su endpoint
                  const countResponse = await fetch(`${API_URL}/dynamic/${entity.slug}/count`, {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
                    },
                  });
                  const countData = await countResponse.json();
                  
                  // Solo incluir entidades que existen y tienen registros
                  return {
                    ...entity,
                    hasRecords: (countData.count || 0) > 0,
                    recordCount: countData.count || 0
                  };
                } catch (error) {
                  // Si hay error al contar, la entidad probablemente no existe
                  console.warn(`Entity ${entity.slug} not accessible:`, error.message);
                  return null;
                }
              })
            );
            
            // Filtrar nulos y ordenar por nombre
            const filteredEntities = validEntities
              .filter(entity => entity !== null && entity.hasRecords)
              .sort((a, b) => a.menu_name.localeCompare(b.menu_name));
            
            setAvailableEntities(filteredEntities);
          }
        } catch (error) {
          console.error('Error loading entities:', error);
        }
      };
      fetchEntities();
    }
  }, [isOpen]);

  const handleAddBlock = (type) => {
    const newBlock = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      content: BLOCK_TYPES[type].defaultContent,
      styles: type === 'spacer' ? { height: '2rem' } : {}
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleUpdateBlock = (index, updatedBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
  };

  const handleRemoveBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setBlocks(items);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('El título es obligatorio');
      return;
    }

    setSaving(true);
    
    const sectionData = {
      menu_name: title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      menu_icon: icon,
      menu_location: 'after_inicio',
      form_title: title,
      type: 'landing',
      layout_data: {
        type: 'landing',
        components: blocks,
        styles: sectionStyles
      }
    };

    try {
      const url = editSection 
        ? `${API_URL}/entity-types/${editSection.id}`
        : `${API_URL}/entity-types`;
      
      const response = await fetch(url, {
        method: editSection ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: JSON.stringify(sectionData)
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess?.(data.entity_type);
        onClose();
      } else {
        // Mostrar error detallado de validación
        let errorMsg = data.message || 'Error al guardar';
        if (data.errors) {
          errorMsg += '\n\n' + Object.entries(data.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n');
        }
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Error al guardar la sección: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`flex-shrink-0 border-b px-6 py-4 ${isDark ? 'bg-[#0a0a0a]/95 border-gray-800' : 'bg-white/95 border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editSection ? 'Editar Sección' : 'Nueva Sección'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className={`px-6 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 ${
                isDark 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-[#c8f135] text-black font-medium rounded-lg hover:bg-[#d4ff4d] disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Sección'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de configuración */}
        <div className={`w-80 border-r p-6 overflow-y-auto ${isDark ? 'border-gray-800 bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Título de la sección *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                placeholder="Ej: Sobre Nosotros"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Identificador (slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                placeholder="sobre-nosotros"
              />
              <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Se genera automáticamente desde el título
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Icono del menú
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="Layout">Layout (página)</option>
                <option value="FileText">Documento</option>
                <option value="Image">Imagen</option>
                <option value="Info">Información</option>
                <option value="Users">Equipo</option>
                <option value="Mail">Contacto</option>
                <option value="Star">Destacado</option>
                <option value="Heart">Favorito</option>
              </select>
            </div>

            {/* Configuración de fondo */}
            <div className="pt-6 border-t border-gray-700">
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Fondo de la sección
              </label>
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Color de fondo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={sectionStyles?.backgroundColor || '#ffffff'}
                      onChange={(e) => setSectionStyles({ ...sectionStyles, backgroundColor: e.target.value })}
                      className="w-12 h-10 p-1 rounded-lg bg-transparent border border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={sectionStyles?.backgroundColor || '#ffffff'}
                      onChange={(e) => setSectionStyles({ ...sectionStyles, backgroundColor: e.target.value })}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Imagen de fondo (URL)
                  </label>
                  <input
                    type="text"
                    value={sectionStyles?.backgroundImage || ''}
                    onChange={(e) => setSectionStyles({ ...sectionStyles, backgroundImage: e.target.value ? `url(${e.target.value})` : '' })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    placeholder="https://..."
                  />
                </div>
                {sectionStyles?.backgroundImage && (
                  <div>
                    <label className={`block text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Tamaño de imagen
                    </label>
                    <select
                      value={sectionStyles?.backgroundSize || 'cover'}
                      onChange={(e) => setSectionStyles({ ...sectionStyles, backgroundSize: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    >
                      <option value="cover">Cover (cubre todo)</option>
                      <option value="contain">Contain (ajusta)</option>
                      <option value="100% 100%">100% (estira)</option>
                      <option value="auto">Auto (original)</option>
                    </select>
                  </div>
                )}
                {sectionStyles?.backgroundImage && (
                  <div>
                    <label className={`block text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Posición de imagen
                    </label>
                    <select
                      value={sectionStyles?.backgroundPosition || 'center center'}
                      onChange={(e) => setSectionStyles({ ...sectionStyles, backgroundPosition: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    >
                      <option value="center center">Centro</option>
                      <option value="top center">Arriba centro</option>
                      <option value="bottom center">Abajo centro</option>
                      <option value="left center">Izquierda centro</option>
                      <option value="right center">Derecha centro</option>
                      <option value="top left">Arriba izquierda</option>
                      <option value="top right">Arriba derecha</option>
                      <option value="bottom left">Abajo izquierda</option>
                      <option value="bottom right">Abajo derecha</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Agregar bloques */}
            <div className="pt-6 border-t border-gray-700">
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Agregar bloques
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(BLOCK_TYPES).map(([type, config]) => (
                  <button
                    key={`block-type-${type}`}
                    onClick={() => handleAddBlock(type)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isDark 
                        ? 'border-gray-700 hover:border-[#c8f135] hover:bg-gray-800' 
                        : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {config.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Área de edición */}
        <div className={`flex-1 p-8 overflow-y-auto ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
          <div 
            className={`max-w-3xl mx-auto min-h-full p-8 rounded-xl ${
              !sectionStyles?.backgroundColor && !sectionStyles?.backgroundImage 
                ? (isDark ? 'bg-[#1a1a1a]' : 'bg-white shadow-sm border border-gray-200')
                : 'border border-gray-200'
            }`}
            style={{
              backgroundColor: sectionStyles?.backgroundColor || undefined,
              backgroundImage: sectionStyles?.backgroundImage || undefined,
              backgroundSize: sectionStyles?.backgroundSize || undefined,
              backgroundPosition: sectionStyles?.backgroundPosition || undefined,
              backgroundRepeat: sectionStyles?.backgroundRepeat || 'no-repeat'
            }}
          >
            {blocks.length === 0 ? (
              <div className={`text-center py-20 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <p className="text-lg font-medium mb-2">Tu lienzo está vacío</p>
                <p className="text-sm">Selecciona un bloque a la izquierda para comenzar</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="blocks-list">
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-4 min-h-[100px] transition-all rounded-lg ${
                        snapshot.isDraggingOver 
                          ? 'bg-blue-500/5 p-2' 
                          : 'p-0'
                      }`}
                      style={{ minHeight: '100px' }}
                    >
                      {blocks.map((block, index) => (
                        <BlockItem
                          key={`block-${block.id}-${index}`}
                          block={block}
                          index={index}
                          isDark={isDark}
                          onUpdate={handleUpdateBlock}
                          onRemove={handleRemoveBlock}
                          availableEntities={availableEntities}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
