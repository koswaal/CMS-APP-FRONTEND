import { useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { ThemeContext } from './ThemeContext';
import { icons } from './icons';
import * as LucideIcons from 'lucide-react';
import Users from './Users';
import Roles from './Roles';
import Auditoria from './Auditoria';
import CustomFieldsManager from './CustomFieldsManager';
import DynamicEntity from './DynamicEntity';
import MenuOrder from './MenuOrder';
import StatsManager from './StatsManager';
// import BaseDatos from './BaseDatos';
import UserCard from './UserCard';
import { API_URL } from './config';

export default function Dashboard() {
  const { user, canAccess } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState(() => {
    const saved = localStorage.getItem('activeMenu');
    return saved || 'dashboard';
  });
  const [expandedMenu, setExpandedMenu] = useState(() => {
    // Si hay un submenú activo, expandirlo al cargar
    const saved = localStorage.getItem('activeMenu');
    return saved && ['users', 'roles'].includes(saved) ? 'acceso' : null;
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Menús dinámicos creados desde el Constructor de Módulos
  const [entityTypes, setEntityTypes] = useState([]);
  const [dynamicMenus, setDynamicMenus] = useState([]);
  const [expandedDynamicMenus, setExpandedDynamicMenus] = useState(new Set());
  const [activeEntityType, setActiveEntityType] = useState(null);

  // Limpiar localStorage de navegación al cargar
  useEffect(() => {
    localStorage.removeItem('dashboard_activeEntityType');
  }, []);

  // Guardar el menú activo cuando cambie
  useEffect(() => {
    localStorage.setItem('activeMenu', activeMenu);
  }, [activeMenu]);

  // Cerrar menús expandidos cuando se selecciona un menú diferente
  useEffect(() => {
    // Si el menú activo no es un submenú de 'acceso', cerrar el menú acceso
    const accesoSubmenus = ['users', 'roles', 'auditoria', 'menu-order', 'stats-manager'];
    if (!accesoSubmenus.includes(activeMenu)) {
      setExpandedMenu((prev) => prev === 'acceso' ? null : prev);
    }
    
    // Para menús dinámicos: mantener expandido solo si el menú activo es hijo de ese menú
    setExpandedDynamicMenus((prev) => { // eslint-disable-line no-unused-vars
      const newSet = new Set();
      // Verificar si el menú activo es un submenú dinámico
      if (activeMenu?.startsWith('dynamic-')) {
        const activeSlug = activeMenu.replace('dynamic-', '');
        // Buscar si el menú activo es hijo de algún menú padre
        const parentMenu = dynamicMenus.find((m) => {
          const children = dynamicMenus.filter((child) => child.parent_id === m.id);
          return children.some((child) => child.slug === activeSlug);
        });
        if (parentMenu) {
          newSet.add(parentMenu.slug);
        }
      }
      return newSet;
    });
  }, [activeMenu, dynamicMenus]);

  // Verificar permisos al cargar - si no tiene acceso al menú activo, ir al dashboard
  useEffect(() => {
    if (activeMenu === 'dashboard' || activeMenu === 'profile') return;
    
    // Verificar si el usuario tiene permisos para el menú activo
    if (!canAccess(activeMenu)) {
      setActiveMenu('dashboard');
      setExpandedMenu(null);
    }
  }, [user, activeMenu, canAccess]);

  // Cargar menús dinámicos desde el Constructor de Módulos
  const fetchDynamicMenus = async () => {
    try {
      const response = await fetch(`${API_URL}/entity-types`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setEntityTypes(data.entity_types);
        // Solo mostrar menús activos en el sidebar
        const activeMenus = data.entity_types.filter(et => et.active !== false);
        setDynamicMenus(
          activeMenus.map((et) => ({
            id: et.id,
            slug: et.slug,
            name: et.menu_name,
            icon: et.menu_icon,
            location: et.menu_location,
            order: et.menu_order,
            parent_id: et.parent_id,
            is_container: et.is_container,
          }))
        );
      }
    } catch (error) {
      console.error('Error al cargar menús dinámicos:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDynamicMenus();
    }
  }, [user]);

  // Cargar estadísticas dinámicas configuradas
  const [dynamicStats, setDynamicStats] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Cargar estadísticas dinámicas
        const statsRes = await fetch(`${API_URL}/stats/values`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            setDynamicStats(statsData.stats || []);
          }
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);


  const isDark = theme === 'dark';


  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'} border-b shadow-lg z-40`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#c8f135]/10 text-gray-300' : 'hover:bg-[#c8f135]/10 text-gray-700'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <LucideIcons.Layers className="w-8 h-8 text-[#c8f135]" />
              <span className="font-semibold text-gray-100">CMS APP</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Card */}
            <UserCard />
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-64px)] border-r transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <div className="pt-6 pb-4 px-4 space-y-3">
          {/* Sección INICIO */}
          <div>
            <button
              onClick={() => setActiveMenu('dashboard')}
              className={`group w-full flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98] ${
                activeMenu === 'dashboard'
                  ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-4 border-[#c8f135] shadow-[0_0_10px_rgba(200,241,53,0.1)]'
                  : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
              }`}
            >
              <span className="text-xl text-gray-100 transition-transform duration-200 group-hover:scale-110 w-5 flex items-center justify-center"><icons.home /></span>
              {sidebarOpen && <span className="font-medium flex-1 text-left transition-all duration-200">Inicio</span>}
            </button>
          </div>

          {/* Acceso - solo visible para desarrollador y administrador */}
          {(canAccess('users') || canAccess('roles') || user?.role === 'desarrollador' || user?.role === 'administrador') && (
            <div>
              <button
                onClick={() => setExpandedMenu(expandedMenu === 'acceso' ? null : 'acceso')}
                className={`group w-full flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98] ${
                  expandedMenu === 'acceso'
                    ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-4 border-[#c8f135] shadow-[0_0_10px_rgba(200,241,53,0.1)]'
                    : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                }`}
              >
                <span className="text-xl text-gray-100 transition-transform duration-200 group-hover:scale-110 w-5 flex items-center justify-center"><icons.users /></span>
                {sidebarOpen && (
                  <>
                    <span className="font-medium flex-1 text-left transition-all duration-200">Acceso</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${expandedMenu === 'acceso' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
                </button>
                <div className={`submenu-container ${expandedMenu === 'acceso' && sidebarOpen ? 'open' : ''}`}>
                  <div className="submenu-content">
                    <div className="mt-3 ml-6 space-y-3">
                      {canAccess('users') && (
                        <button
                          onClick={() => setActiveMenu('users')}
                          className={`submenu-item group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                            activeMenu === 'users'
                              ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-2 border-[#c8f135]'
                              : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                          }`}
                          style={{ transitionDelay: '0ms' }}
                        >
                          <span className="text-lg text-gray-400 w-4 flex items-center justify-center"><icons.chevronRight /></span>
                          {sidebarOpen && <span className="text-sm font-medium flex-1 text-left">Usuarios</span>}
                        </button>
                      )}
                      {canAccess('roles') && (
                        <button
                          onClick={() => setActiveMenu('roles')}
                          className={`submenu-item group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                            activeMenu === 'roles'
                              ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-2 border-[#c8f135]'
                              : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                          }`}
                          style={{ transitionDelay: '40ms' }}
                        >
                          <span className="text-lg text-gray-400 w-4 flex items-center justify-center"><icons.chevronRight /></span>
                          {sidebarOpen && <span className="text-sm font-medium flex-1 text-left">Roles</span>}
                        </button>
                      )}
                      {(user?.role === 'desarrollador' || user?.role === 'administrador') && (
                        <button
                          onClick={() => setActiveMenu('auditoria')}
                          className={`submenu-item group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                            activeMenu === 'auditoria'
                              ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-2 border-[#c8f135]'
                              : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                          }`}
                          style={{ transitionDelay: '80ms' }}
                        >
                          <span className="text-lg text-gray-400 w-4 flex items-center justify-center"><icons.chevronRight /></span>
                          {sidebarOpen && <span className="text-sm font-medium flex-1 text-left">Auditoría</span>}
                        </button>
                      )}
                      {(user?.role === 'desarrollador' || user?.role === 'administrador') && (
                        <button
                          onClick={() => setActiveMenu('menu-order')}
                          className={`submenu-item group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                            activeMenu === 'menu-order'
                              ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-2 border-[#c8f135]'
                              : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                          }`}
                          style={{ transitionDelay: '120ms' }}
                        >
                          <span className="text-lg text-gray-400 w-4 flex items-center justify-center"><icons.chevronRight /></span>
                          {sidebarOpen && <span className="text-sm font-medium flex-1 text-left">Orden de menúes</span>}
                        </button>
                      )}
                      {(user?.role === 'desarrollador' || user?.role === 'administrador') && (
                        <button
                          onClick={() => setActiveMenu('stats-manager')}
                          className={`submenu-item group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                            activeMenu === 'stats-manager'
                              ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-2 border-[#c8f135]'
                              : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                          }`}
                          style={{ transitionDelay: '160ms' }}
                        >
                          <span className="text-lg text-gray-400 w-4 flex items-center justify-center"><icons.chevronRight /></span>
                          {sidebarOpen && <span className="text-sm font-medium flex-1 text-left">Gestión de Estadísticas</span>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {dynamicMenus.length > 0 && (
            <div className="space-y-3">
              {dynamicMenus
                .filter((menu) => !menu.parent_id)
                .map((menu) => {
                  const children = dynamicMenus.filter((m) => m.parent_id === menu.id);
                  const hasChildren = children.length > 0;
                  const isExpanded = expandedDynamicMenus.has(menu.slug);

                  return (
                    <div key={menu.slug}>
                      <button
                        onClick={() => {
                          // Si tiene hijos, es un contenedor: solo expandir/colapsar
                          if (hasChildren) {
                            setExpandedDynamicMenus((prev) => {
                              const newSet = new Set(prev);
                              if (newSet.has(menu.slug)) {
                                newSet.delete(menu.slug);
                              } else {
                                newSet.add(menu.slug);
                              }
                              return newSet;
                            });
                          } else {
                            // Menú sin hijos: navegar al formulario
                            const entity = entityTypes.find((et) => et.slug === menu.slug);
                            setActiveEntityType(entity);
                            setActiveMenu(`dynamic-${menu.slug}`);
                          }
                        }}
                        className={`group w-full flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98] ${
                          activeMenu === `dynamic-${menu.slug}`
                            ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-4 border-[#c8f135] shadow-[0_0_10px_rgba(200,241,53,0.1)]'
                            : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                        }`}
                      >
                        <span className="text-xl text-gray-100 transition-transform duration-200 group-hover:scale-110 w-5 flex items-center justify-center">
                          <DynamicIcon name={menu.icon} />
                        </span>
                        {sidebarOpen && (
                          <>
                            <span className="font-medium flex-1 text-left transition-all duration-200">{menu.name}</span>
                            {hasChildren && (
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </>
                        )}
                      </button>
                      {/* Submenús */}
                      {hasChildren && (
                        <div className={`submenu-container ${isExpanded && sidebarOpen ? 'open' : ''}`}>
                          <div className="submenu-content">
                            <div className="mt-3 ml-6 space-y-3">
                              {children.map((child, childIndex) => (
                                <button
                                  key={child.slug}
                                  onClick={() => {
                                    setActiveMenu(`dynamic-${child.slug}`);
                                    const entity = entityTypes.find((et) => et.slug === child.slug);
                                    setActiveEntityType(entity);
                                  }}
                                  className={`submenu-item group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                    activeMenu === `dynamic-${child.slug}`
                                      ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-2 border-[#c8f135]'
                                      : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                                  }`}
                                  style={{
                                    transitionDelay: `${childIndex * 40}ms`
                                  }}
                                >
                                  <span className="text-lg text-gray-100 w-4 flex items-center justify-center">
                                    <DynamicIcon name={child.icon} />
                                  </span>
                                  <span className="text-sm font-medium flex-1 text-left">{child.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-20 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Mostrar componente según menú seleccionado con animación */}
        <div key={activeMenu} className="animate-fade-in">
          {activeMenu === 'dashboard' || !activeMenu ? (
            <div className="p-6">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3">
                  <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Bienvenido, {user?.name}!</h1>
                  {user?.role && (
                    <span className="px-3 py-1 bg-[#c8f135] text-black text-sm font-bold rounded-full uppercase">
                      {user.role}
                    </span>
                  )}
                </div>
                <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Aquí está tu inicio</p>
              </div>

              {/* Stats Cards - Dinámicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {loadingStats ? (
                  <div className="col-span-4 text-center py-8">
                    <p className={`text-gray-400`}>Cargando estadísticas...</p>
                  </div>
                ) : dynamicStats.length === 0 ? (
                  <div className="col-span-4 text-center py-8">
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No hay estadísticas configuradas.
                      {(user?.role === 'desarrollador' || user?.role === 'administrador') && (
                        <>
                          {' '}
                          <button
                            onClick={() => setActiveMenu('stats-manager')}
                            className="text-[#c8f135] hover:underline"
                          >
                            Configurar estadísticas →
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  dynamicStats.map((stat) => {
                    const IconComponent = LucideIcons[stat.icon
                      .split('-')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join('')] || LucideIcons.BarChart;
                    return (
                      <div
                        key={stat.id}
                        className={`rounded-lg shadow-lg p-6 border ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {stat.label}
                            </p>
                            <p className={`text-2xl font-bold mt-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                              {stat.value}
                            </p>
                          </div>
                          <span className="text-4xl text-[#c8f135] flex items-center justify-center">
                            <IconComponent className="w-10 h-10" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          ) : activeMenu === 'users' ? (
            <Users />
            ) : activeMenu === 'roles' ? (
            <Roles />
            ) : activeMenu === 'auditoria' ? (
            <Auditoria />
            ) : activeMenu === 'custom-fields' ? (
            <CustomFieldsManager />
            ) : activeMenu === 'menu-order' ? (
            <MenuOrder
              onBack={() => setActiveMenu('dashboard')}
              onModuleCreated={fetchDynamicMenus}
            />
            ) : activeMenu === 'stats-manager' ? (
            <StatsManager />
            ) : activeMenu.startsWith('dynamic-') ? (() => {
              const entityType = activeEntityType || entityTypes.find(et => et.slug === activeMenu.replace('dynamic-', ''));
              if (!entityType) {
                return <div className="p-6">EntityType no encontrado</div>;
              }
              return (
                <DynamicEntity
                  entityType={entityType}
                  onBack={() => {
                    setActiveMenu('dashboard');
                    setActiveEntityType(null);
                  }}
                />
              );
            })() : (
              <div className="p-6">Componente no encontrado</div>
            )}
        </div>
      </main>
    </div>
  );
}

// Componente auxiliar para renderizar iconos dinámicos usando Lucide React
function DynamicIcon({ name, className = "w-5 h-5" }) {
  // Convertir nombres kebab-case a PascalCase para Lucide React
  const iconName = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const IconComponent = LucideIcons[iconName] || LucideIcons.Box;

  return <IconComponent className={className} />;
}
