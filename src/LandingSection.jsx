import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

// Componente para renderizar un bloque individual
function BlockRenderer({ block, isDark }) {
  const { type, content, styles = {}, link = '#' } = block;

  switch (type) {
    case 'heading':
      return (
        <h2 
          className="text-3xl font-bold mb-4"
          style={{
            color: isDark ? '#ffffff' : '#111827',
            textAlign: styles?.textAlign || 'left',
            fontSize: styles?.fontSize || '1.875rem',
            fontFamily: styles?.fontFamily || 'inherit',
            fontWeight: styles?.fontWeight || 'bold',
            fontStyle: styles?.fontStyle || 'normal',
            ...styles
          }}
        >
          {content}
        </h2>
      );
    
    case 'text':
      return (
        <p 
          className="text-base leading-relaxed mb-4"
          style={{
            color: isDark ? '#d1d5db' : '#374151',
            textAlign: styles?.textAlign || 'left',
            fontSize: styles?.fontSize || '1rem',
            fontFamily: styles?.fontFamily || 'inherit',
            fontWeight: styles?.fontWeight || 'normal',
            fontStyle: styles?.fontStyle || 'normal',
            ...styles
          }}
        >
          {content}
        </p>
      );
    
    case 'image':
      if (!content) {
        return (
          <div className={`p-8 border-2 border-dashed rounded-lg text-center mb-4 ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
            Sin imagen
          </div>
        );
      }
      const alignment = styles?.alignment || 'left';
      return (
        <div className={`mb-4 flex ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
          <img 
            src={content} 
            alt="Section content" 
            className="max-w-full h-auto rounded-lg"
            style={{ 
              ...styles,
              maxWidth: alignment === 'center' ? '100%' : styles?.maxWidth || '100%'
            }}
          />
        </div>
      );
    
    case 'button':
      return (
        <div className="mb-4" style={{ textAlign: styles?.textAlign || 'left' }}>
          <a
            href={link}
            className="inline-block transition-transform hover:scale-105"
            style={{
              backgroundColor: styles?.backgroundColor || '#c8f135',
              color: styles?.color || '#000000',
              borderRadius: styles?.borderRadius || '0.5rem',
              padding: styles?.padding || '0.75rem 1.5rem',
              fontWeight: styles?.fontWeight || 'bold',
              fontSize: styles?.fontSize || '1rem',
              fontFamily: styles?.fontFamily || 'inherit',
              fontStyle: styles?.fontStyle || 'normal',
              textDecoration: 'none',
              ...styles
            }}
          >
            {content}
          </a>
        </div>
      );

    case 'divider':
      return (
        <hr 
          className="my-6" 
          style={{ 
            borderColor: isDark ? '#374151' : '#e5e7eb',
            borderWidth: styles?.borderWidth || '1px',
            borderStyle: styles?.borderStyle || 'solid'
          }} 
        />
      );

    case 'video': {
      const videoId = content?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/)?.[1];
      return (
        <div className="mb-6 aspect-video w-full rounded-lg overflow-hidden bg-black shadow-lg">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allowFullScreen
              title="YouTube Video"
            />
          ) : content ? (
            <video src={content} controls className="w-full h-full" />
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
      const mapUrl = content?.includes('iframe') 
        ? content.match(/src="([^"]+)"/)?.[1] 
        : content;
      return (
        <div className="mb-6 w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
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
      const columns = styles?.columns || 2;
      const gap = styles?.gap || '1.5rem';
      return (
        <div 
          className="grid w-full mb-6" 
          style={{ 
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: gap
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <div 
              key={i} 
              className={`p-6 rounded-xl border-2 border-dashed flex items-center justify-center ${
                isDark ? 'border-gray-700 bg-gray-800/30 text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
              style={{ minHeight: '150px' }}
            >
              <span className="text-sm font-medium">Columna {i + 1}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'spacer':
      return <div style={{ height: styles?.height || '2rem' }} />;
    
    case 'social': {
      const platforms = styles?.platforms || ['facebook', 'twitter', 'instagram', 'linkedin'];
      const layout = styles?.layout || 'horizontal';
      const platformUrls = content ? JSON.parse(content) : {};
      
      const platformIcons = {
        facebook: { name: 'Facebook', color: '#1877f2', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
        twitter: { name: 'Twitter', color: '#1da1f2', icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
        instagram: { name: 'Instagram', color: '#e4405f', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z' },
        linkedin: { name: 'LinkedIn', color: '#0077b5', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' }
      };
      
      return (
        <div className={`mb-6 w-full ${layout === 'horizontal' ? 'flex flex-wrap gap-4 justify-center' : 'grid grid-cols-2 gap-4 max-w-md mx-auto'}`}>
          {platforms.map((platform) => {
            const platformData = platformIcons[platform];
            const url = platformUrls[platform] || '#';
            
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:scale-105 hover:shadow-lg ${
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
    
    case 'stats': {
      const stats = styles?.stats || [{ type: 'static', number: '100+', label: 'Clientes' }, { type: 'static', number: '50+', label: 'Proyectos' }, { type: 'static', number: '24/7', label: 'Soporte' }];
      const columns = styles?.columns || 3;
      
      const getStatValue = (stat) => {
        if (stat.type === 'dynamic' && stat.entityType) {
          // Para el renderizado final, mostramos un placeholder o intentamos obtener el conteo
          // En una implementación real, esto podría obtenerse del servidor
          return '...';
        }
        return stat.number || '0';
      };
      
      return (
        <div className="mb-6 w-full">
          <div 
            className="grid w-full gap-8"
            style={{ 
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
            }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  isDark ? 'text-[#c8f135]' : 'text-[#c8f135]'
                }`}>
                  {getStatValue(stat)}
                </div>
                <div className={`text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {stat.label || 'Estadística'}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    case 'contact': {
      const fields = styles?.fields || ['name', 'email', 'message'];
      const submitText = styles?.submitText || 'Enviar mensaje';
      
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
        <div className={`mb-6 p-6 rounded-lg border-2 ${
          isDark 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {fields.map((field, index) => (
              <div key={index}>
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
    
    case 'gallery': {
      const images = styles?.images || [];
      const columns = styles?.columns || 3;
      const gap = styles?.gap || '0.5rem';
      
      return (
        <div className="mb-6 w-full">
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
                <div key={index} className="relative group overflow-hidden rounded-lg shadow-md">
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
    
    case 'testimonial': {
      const testimonialData = styles || {};
      return (
        <div className={`mb-6 p-6 rounded-lg border-2 ${
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
    
    default:
      return null;
  }
}

export default function LandingSection({ section, isPreview = false }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  // Si es preview en el builder, usar los datos directamente
  // Si es renderizado real, usar los datos de la sección
  const layoutData = section?.layout_data || section;
  const components = layoutData?.components || [];
  const sectionStyles = layoutData?.styles || {};

  if (!components.length) {
    return (
      <div className={`min-h-[300px] flex items-center justify-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <p>Esta sección no tiene contenido</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      {/* Header de la sección (solo en modo preview/edicion) */}
      {isPreview && section?.menu_name && (
        <div className={`border-b px-6 py-4 ${isDark ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'}`}>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {section.menu_name}
          </h1>
        </div>
      )}

      {/* Contenido de la sección */}
      <div className={`max-w-4xl mx-auto p-8 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
        <div 
          className={`p-8 rounded-xl ${
            !sectionStyles?.backgroundColor && !sectionStyles?.backgroundImage 
              ? (isDark ? 'bg-[#1a1a1a]' : 'bg-white')
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
          {components.map((block) => (
            <BlockRenderer 
              key={block.id} 
              block={block} 
              isDark={isDark} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
