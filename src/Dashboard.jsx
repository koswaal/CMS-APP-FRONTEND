import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { ThemeContext } from './ThemeContext';
import { icons } from './icons'; // eslint-disable-line no-unused-vars
import * as LucideIcons from 'lucide-react';
import Users from './Users';
import Roles from './Roles';
import Auditoria from './Auditoria';
import CustomFieldsManager from './CustomFieldsManager';
import DynamicEntity from './DynamicEntity';
import LandingSection from './LandingSection';
import MenuOrder from './MenuOrder';
import StatsManager from './StatsManager';
import Respaldos from './Respaldos';
import DashboardModule from './DashboardModule';
import DashboardModuleBuilder from './DashboardModuleBuilder';
import UserCard from './UserCard';
import DashboardTimelineChart from './DashboardTimelineChart';
import StatCardSparkline, { sameId } from './StatCardSparkline';
import StatCardLatest from './StatCardLatest';
import StatCardPie from './StatCardPie';
import StatCardBar from './StatCardBar';
import { API_URL } from './config';

export default function Dashboard() {
  const navigate = useNavigate();
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
  const [editingDashboard, setEditingDashboard] = useState(null);

  // Popup para submenús cuando el sidebar está colapsado
  const [showSubmenuPopup, setShowSubmenuPopup] = useState(null);
  const submenuPopupRef = useRef(null);

  // Cerrar popup al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (submenuPopupRef.current && !submenuPopupRef.current.contains(event.target)) {
        setShowSubmenuPopup(null);
      }
    };
    if (showSubmenuPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSubmenuPopup]);

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
    const accesoSubmenus = ['users', 'roles', 'auditoria', 'menu-order', 'stats-manager', 'respaldos'];
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
  const [timelineDays, setTimelineDays] = useState(30);
  const [timelineSeries, setTimelineSeries] = useState([]);
  /** Gráfico grande: oculto hasta que el usuario pulse una tarjeta con mini gráfico */
  const [timelineOpen, setTimelineOpen] = useState(false);
  /** null = en el gráfico grande se muestran todas las series; número = solo esa estadística */
  const [timelineFocusId, setTimelineFocusId] = useState(null);
  const [timelineExiting, setTimelineExiting] = useState(false);
  const timelineSectionRef = useRef(null);
  const [expandedStat, setExpandedStat] = useState(null);
  const [expandedExiting, setExpandedExiting] = useState(false);

  // Función para refrescar estadísticas - expuesta para que otros componentes la usen
  const refreshStats = useCallback(async () => {
    if (!user) {
      setDynamicStats([]);
      setTimelineSeries([]);
      setLoadingStats(false);
      return;
    }
    try {
      setLoadingStats(true);
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('session_token')}`,
      };
      const [statsRes, tlRes] = await Promise.all([
        fetch(`${API_URL}/stats/values`, { headers }),
        fetch(`${API_URL}/stats/timeline?days=${timelineDays}`, { headers }),
      ]);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setDynamicStats(statsData.stats || []);
        }
      }
      if (tlRes.ok) {
        const tlData = await tlRes.json();
        if (tlData.success) {
          setTimelineSeries(tlData.series || []);
        }
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user, timelineDays]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats, activeMenu]);

  useEffect(() => {
    if (timelineSeries.length === 0) {
      closeTimelinePanel();
    }
  }, [timelineSeries.length]);

  useEffect(() => {
    if (!timelineOpen) return;
    const id = requestAnimationFrame(() => {
      timelineSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(id);
  }, [timelineOpen, timelineFocusId, timelineDays]);

  const openTimelineForStat = (statId) => {
    const hasSeries = timelineSeries.some((s) => sameId(s.id, statId));
    if (!hasSeries) return;

    // Close any expanded panel when opening a timeline
    if (expandedStat) {
      closeExpandedPanel();
    }

    if (timelineOpen && sameId(timelineFocusId, statId)) {
      closeTimelinePanel();
      return;
    }

    setTimelineFocusId(statId);
    setTimelineOpen(true);
  };

  const closeTimelinePanel = () => {
    setTimelineExiting(true);
    setTimeout(() => {
      setTimelineExiting(false);
      setTimelineOpen(false);
      setTimelineFocusId(null);
    }, 250);
  };

  // Expandir panel genérico para otros tipos de estadística (pie, bar, latest)
  const detectStatType = (stat) => {
    const isPieData = stat.data && stat.data.length > 0 && stat.data[0] && (stat.data[0].label || stat.data[0].name || stat.data[0].count !== undefined);
    return stat.type || (isPieData ? 'pie' : 'count');
  };

  const openExpandedForStat = (stat) => {
    const type = detectStatType(stat);
    // Si la estadística tiene timeline, preferir abrir timeline
    const hasSeries = timelineSeries.some((s) => sameId(s.id, stat.id));
    if (hasSeries) {
      openTimelineForStat(stat.id);
      return;
    }

    // Close timeline if open
    if (timelineOpen) {
      closeTimelinePanel();
    }

    if (expandedStat && sameId(expandedStat.id, stat.id)) {
      closeExpandedPanel();
      return;
    }

    // Replace any existing expanded stat with the new one (only one open at a time)
    setExpandedStat({ ...stat, _detectedType: type });
  };

  const closeExpandedPanel = () => {
    setExpandedExiting(true);
    setTimeout(() => {
      setExpandedExiting(false);
      setExpandedStat(null);
    }, 250);
  };

  const showAllTimelineSeries = () => {
    setTimelineFocusId(null);
  };

  const displayedTimelineSeries =
    (timelineOpen || timelineExiting) && timelineSeries.length > 0
      ? timelineFocusId != null
        ? timelineSeries.filter((s) => sameId(s.id, timelineFocusId))
        : timelineSeries
      : [];


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
            <button
              onClick={() => {
                setActiveMenu('dashboard');
                navigate('/dashboard');
              }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <LucideIcons.Layers className="w-8 h-8 text-[#c8f135]" />
              <span className="font-semibold text-gray-100">CMS APP</span>
            </button>
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
                onClick={() => {
                  if (sidebarOpen) {
                    setExpandedMenu(expandedMenu === 'acceso' ? null : 'acceso');
                  } else {
                    const items = [];
                    if (canAccess('users')) items.push({ key: 'users', label: 'Usuarios' });
                    if (canAccess('roles')) items.push({ key: 'roles', label: 'Roles' });
                    if (user?.role === 'desarrollador' || user?.role === 'administrador') items.push({ key: 'auditoria', label: 'Auditoría' });
                    if (user?.role === 'desarrollador' || user?.role === 'administrador') items.push({ key: 'menu-order', label: 'Orden de menúes' });
                    if (user?.role === 'desarrollador' || user?.role === 'administrador') items.push({ key: 'stats-manager', label: 'Gestión de Estadísticas' });
                    if (user?.role === 'desarrollador' || user?.role === 'administrador') items.push({ key: 'respaldos', label: 'Reportes' });
                    setShowSubmenuPopup({ name: 'Acceso', items });
                  }
                }}
                className={`group w-full flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98] ${
                  expandedMenu === 'acceso'
                    ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-4 border-[#c8f135] shadow-[0_0_10px_rgba(200,241,53,0.1)]'
                    : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                }`}
              >
                <span className="text-xl text-gray-100 transition-transform duration-200 group-hover:scale-110 w-5 flex items-center justify-center"><LucideIcons.Shield /></span>
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
                      {(user?.role === 'desarrollador' || user?.role === 'administrador') && (
                        <button
                          onClick={() => setActiveMenu('respaldos')}
                          className={`submenu-item group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                            activeMenu === 'respaldos'
                              ? 'bg-[#c8f135]/10 text-[#c8f135] border-l-2 border-[#c8f135]'
                              : 'text-gray-400 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                          }`}
                          style={{ transitionDelay: '200ms' }}
                        >
                          <span className="text-lg text-gray-400 w-4 flex items-center justify-center"><icons.chevronRight /></span>
                          {sidebarOpen && <span className="text-sm font-medium flex-1 text-left">Reportes</span>}
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
                          if (hasChildren) {
                            if (sidebarOpen) {
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
                              const items = children.map(child => ({
                                key: `dynamic-${child.slug}`,
                                label: child.name,
                                icon: child.icon,
                                entity: entityTypes.find((et) => et.slug === child.slug)
                              }));
                              setShowSubmenuPopup({ name: menu.name, items });
                            }
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

        {/* Popup de submenús cuando el sidebar está colapsado */}
        {showSubmenuPopup && (
          <div
            ref={submenuPopupRef}
            className={`fixed z-50 top-20 ${
              sidebarOpen ? 'left-64' : 'left-20'
            } ml-2 rounded-xl shadow-xl border p-3 min-w-[200px] animate-fade-in ${
              isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div className="mb-2 px-2 pb-2 border-b border-gray-700/50">
              <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {showSubmenuPopup.name}
              </p>
            </div>
            <div className="space-y-1">
              {showSubmenuPopup.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.entity) {
                      setActiveEntityType(item.entity);
                    }
                    setActiveMenu(item.key);
                    setShowSubmenuPopup(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeMenu === item.key
                      ? 'bg-[#c8f135]/10 text-[#c8f135]'
                      : isDark
                        ? 'text-gray-300 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                        : 'text-gray-700 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
                  }`}
                >
                  {item.icon && <DynamicIcon name={item.icon} className="w-4 h-4" />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
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
                    console.log('Stat:', stat.id, stat.label, 'type:', stat.type, 'data:', stat.data, 'hasData:', !!stat.data?.length);
                    
                    // Detect pie/bar by data structure if type is missing
                    const isPieData = stat.data && stat.data.length > 0 && stat.data[0] && (stat.data[0].label || stat.data[0].name || stat.data[0].count !== undefined);
                    const detectedType = stat.type || (isPieData ? 'pie' : 'count');
                    
                    if (detectedType === 'pie') {
                      const isExpanded = expandedStat && sameId(expandedStat.id, stat.id);
                      const btnClass = `w-full text-left rounded-xl overflow-hidden border ${isExpanded ? 'ring-2 ring-[#c8f135]/70 border-2 border-[#c8f135]/40' : 'border-transparent'}`;
                      return (
                        <button key={stat.id} type="button" className={btnClass} onClick={() => openExpandedForStat(stat)}>
                          <StatCardPie
                            data={stat.data || []}
                            label={stat.label}
                            icon={stat.icon}
                            total={stat.total}
                          />
                        </button>
                      );
                    }
                    if (detectedType === 'bar') {
                      const isExpanded = expandedStat && sameId(expandedStat.id, stat.id);
                      const btnClass = `w-full text-left rounded-xl overflow-hidden border ${isExpanded ? 'ring-2 ring-[#c8f135]/70 border-2 border-[#c8f135]/40' : 'border-transparent'}`;
                      return (
                        <button key={stat.id} type="button" className={btnClass} onClick={() => openExpandedForStat(stat)}>
                          <StatCardBar
                            data={stat.data || []}
                            label={stat.label}
                            icon={stat.icon}
                          />
                        </button>
                      );
                    }
                    if (stat.type === 'latest') {
                      const entityType = entityTypes.find(et => et.slug === stat.entity_type);
                      const fieldLabels = {};
                      const fieldDefs = {};
                      if (entityType?.fields) {
                        entityType.fields.forEach(f => {
                          fieldLabels[f.name] = f.label || f.name;
                          fieldDefs[f.name] = f;
                        });
                      }
                      const isExpanded = expandedStat && sameId(expandedStat.id, stat.id);
                      const btnClass = `w-full text-left rounded-lg overflow-hidden border ${isExpanded ? 'ring-2 ring-[#c8f135]/70 border-[#c8f135]/40' : 'border-transparent'}`;
                      return (
                        <button key={stat.id} type="button" className={btnClass} onClick={() => openExpandedForStat(stat)}>
                          <StatCardLatest
                            records={stat.records}
                            fields={stat.display_fields}
                            fieldLabels={fieldLabels}
                            fieldDefs={fieldDefs}
                            label={stat.label}
                            icon={stat.icon}
                            entitySlug={stat.entity_type}
                            canNavigate={!!entityTypes.find(et => et.slug === stat.entity_type)
                              || !!dynamicMenus.find(m => m.slug === stat.entity_type)
                              || ['users','roles','auditoria','custom-fields','menu-order','stats-manager','respaldos'].includes(stat.entity_type)}
                            onNavigate={(slug) => {
                              const entity = entityTypes.find(et => et.slug === slug)
                                || dynamicMenus.find(m => m.slug === slug);
                              if (entity && entity.fields) {
                                setActiveEntityType(entity);
                              }
                              const resolvedSlug = entity?.slug || slug;
                              const knownMenus = ['users','roles','auditoria','custom-fields','menu-order','stats-manager','respaldos'];
                              if (!entity && knownMenus.includes(slug)) {
                                setActiveMenu(slug);
                              } else {
                                setActiveMenu(`dynamic-${resolvedSlug}`);
                              }
                            }}
                          />
                        </button>
                      );
                    }

                    const IconComponent = LucideIcons[stat.icon
                      .split('-')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join('')] || LucideIcons.BarChart;
                    const seriesData = timelineSeries.find((s) => sameId(s.id, stat.id));
                    const hasSparkline = !!seriesData?.points?.length;
                    const isFocused = timelineOpen && timelineFocusId != null && sameId(timelineFocusId, stat.id);

                    const cardClass = `rounded-lg shadow-lg p-6 border ${
                      isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'
                    } ${
                      hasSparkline
                        ? `cursor-pointer transition hover:border-[#c8f135]/45 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f135]/60 ${
                            isFocused ? 'ring-2 ring-[#c8f135]/70 border-[#c8f135]/40' : ''
                          }`
                        : ''
                    }`;

                    const inner = (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {stat.label}
                            </p>
                            <p className={`text-2xl font-bold mt-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                              {stat.value}
                            </p>
                          </div>
                          <span className="text-4xl text-[#c8f135] flex shrink-0 items-center justify-center">
                            <IconComponent className="w-10 h-10" />
                          </span>
                        </div>
                        {hasSparkline && (
                          <>
                            <StatCardSparkline points={seriesData.points} />
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              Tocá la tarjeta para ver el gráfico completo
                            </p>
                          </>
                        )}
                      </>
                    );

                    if (hasSparkline) {
                      return (
                        <button
                          key={stat.id}
                          type="button"
                          className={`${cardClass} w-full text-left`}
                          onClick={() => openTimelineForStat(stat.id)}
                        >
                          {inner}
                        </button>
                      );
                    }

                    return (
                      <div key={stat.id} className={cardClass}>
                        {inner}
                      </div>
                    );
                  })
                )}
              </div>

              {!loadingStats &&
                dynamicStats.length > 0 &&
                timelineSeries.length === 0 &&
                (user?.role === 'desarrollador' || user?.role === 'administrador') && (
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Podés activar <span className="text-[#c8f135] font-medium">Mostrar evolución en el dashboard</span> al
                    editar una estadística en Gestión de estadísticas para ver el gráfico de líneas.
                  </p>
                )}

              {!loadingStats && timelineSeries.length > 0 && !timelineOpen && (
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Las tarjetas con mini gráfico verde son interactivas:{' '}
                  <span className="text-[#c8f135] font-medium">tocá una</span> para abrir la evolución detallada.
                </p>
              )}

              <div ref={timelineSectionRef}>
                {(timelineOpen || timelineExiting) && displayedTimelineSeries.length > 0 && (
                  <DashboardTimelineChart
                    series={displayedTimelineSeries}
                    days={timelineDays}
                    onDaysChange={setTimelineDays}
                    isDark={isDark}
                    loading={loadingStats}
                    onClose={closeTimelinePanel}
                    onShowAll={timelineSeries.length > 1 ? showAllTimelineSeries : undefined}
                    showShowAll={timelineFocusId != null && timelineSeries.length > 1}
                    exiting={timelineExiting}
                  />
                )}

                {/* Expanded panel para otros tipos de estadística (pie, bar, latest) */}
                {(expandedStat || expandedExiting) && (
                  <div className={`mt-6 ${expandedExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
                    <div className={`rounded-xl shadow-lg border p-6 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'} ${expandedStat && !expandedExiting ? 'ring-2 ring-[#c8f135]/70 border-2 border-[#c8f135]/40' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {expandedStat?.label}
                          </h2>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            Vista detallada
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          { /* Usar mismo botón que la línea de tiempo */ }
                          <button
                            type="button"
                            onClick={closeExpandedPanel}
                            className={`text-sm px-2 py-1 rounded-md border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-[#0f0f0f]' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                          >
                            Cerrar
                          </button>
                        </div>
                      </div>

                      {/* Contenido expandido según tipo */}
                      {expandedStat && (expandedStat._detectedType === 'pie') && (() => {
                        const items = expandedStat.data || [];
                        const sum = expandedStat.total || items.reduce((acc, d) => acc + (d.count || d.value || 0), 0);
                        const cx = 100, cy = 100, r = 80;
                        let currentAngle = 0;
                        const slices = items.map((d) => {
                          const portion = (d.count || d.value || 0) / (sum || 1);
                          const angle = portion * 360;
                          const slice = { ...d, startAngle: currentAngle, endAngle: currentAngle + angle };
                          currentAngle += angle;
                          return slice;
                        });

                        const polarToCartesian = (cx, cy, r, angleDeg) => {
                          const rad = (angleDeg - 90) * Math.PI / 180;
                          return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
                        };
                        const pieSlicePath = (cx, cy, r, startAngle, endAngle) => {
                          const start = polarToCartesian(cx, cy, r, endAngle);
                          const end = polarToCartesian(cx, cy, r, startAngle);
                          const angleDiff = (startAngle - endAngle + 360) % 360;
                          const largeArc = angleDiff > 180 ? 1 : 0;
                          return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
                        };

                        return (
                          <div className="w-full flex flex-col items-center gap-6">
                            <div className="shrink-0">
                              <svg width="320" height="320" viewBox="0 0 220 220">
                                {sum > 0 ? slices.map((slice, i) => (
                                  <path
                                    key={i}
                                    d={pieSlicePath(cx, cy, r, slice.startAngle, slice.endAngle)}
                                    fill={['#c8f135', '#7dd3fc', '#fbbf24', '#c4b5fd', '#fb7185', '#4ade80', '#fdba74', '#38bdf8'][i % 8]}
                                    stroke={isDark ? '#1a1a1a' : '#fff'}
                                    strokeWidth="1"
                                  />
                                )) : (
                                  <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? '#374151' : '#d1d5db'} strokeWidth="2" />
                                )}
                              </svg>
                            </div>
                            <div className="w-full max-w-md">
                              <p className={`text-sm mb-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Detalle</p>
                              <div className="space-y-2 max-h-48 overflow-auto">
                                {items.slice(0, 12).map((d, i) => {
                                  const cnt = d.count || d.value || 0;
                                  const pct = sum ? Math.round((cnt / sum) * 1000) / 10 : 0;
                                  const color = ['#c8f135', '#7dd3fc', '#fbbf24', '#c4b5fd', '#fb7185', '#4ade80', '#fdba74', '#38bdf8'][i % 8];
                                  return (
                                    <div key={i} className="flex items-center gap-3">
                                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                      <div className="flex-1 text-sm truncate">
                                        <div className={`${isDark ? 'text-gray-200' : 'text-gray-800'} font-medium`}>{d.label || d.name}</div>
                                        <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>{pct}% — {cnt}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {expandedStat && (expandedStat._detectedType === 'bar') && (() => {
                        const items = expandedStat.data || [];
                        const maxCount = Math.max(...items.map(d => d.count || d.value || 0), 1);
                        const COLORS = ['#c8f135', '#7dd3fc', '#fbbf24', '#c4b5fd', '#fb7185', '#4ade80', '#fdba74', '#38bdf8'];
                        return (
                          <div className="w-full">
                            <div className="space-y-2">
                              {items.slice(0, 12).map((d, i) => {
                                const cnt = d.count || d.value || 0;
                                const widthPct = Math.max((cnt / maxCount) * 100, 2);
                                return (
                                  <div key={i} className="flex items-center gap-3">
                                    <div className="w-36 text-xs text-right text-gray-400">{d.label || d.name}</div>
                                    <div className={`flex-1 h-4 rounded overflow-hidden ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
                                      <div style={{ width: `${widthPct}%`, backgroundColor: COLORS[i % COLORS.length] }} className="h-full rounded transition-all" />
                                    </div>
                                    <div className="w-10 text-right text-sm font-medium">{cnt}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {expandedStat && (expandedStat._detectedType === 'latest') && (
                        <div className="w-full">
                          <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Mostrando hasta 10 registros</p>
                          <StatCardLatest records={(expandedStat.records || []).slice(0, 10)} fields={expandedStat.display_fields || []} fieldLabels={{}} label={expandedStat.label} icon={expandedStat.icon} entitySlug={expandedStat.entity_type} onNavigate={(slug) => { setActiveMenu(`dynamic-${slug}`); }} />
                        </div>
                      )}

                      {/* Fallback: mostrar datos crudos */}
                      {expandedStat && !['pie','bar','latest'].includes(expandedStat._detectedType) && (
                        <pre className="text-xs mt-4 overflow-auto max-h-60 rounded border p-2 bg-gray-50 text-gray-700">
                          {JSON.stringify(expandedStat, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
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
            <StatsManager onStatsChanged={refreshStats} />
            ) : activeMenu === 'respaldos' ? (
            <Respaldos />
            ) : activeMenu.startsWith('dynamic-') ? (() => {
              const entityType = activeEntityType || entityTypes.find(et => et.slug === activeMenu.replace('dynamic-', ''));
              if (!entityType) {
                return <div className="p-6">EntityType no encontrado</div>;
              }
              // Si es un dashboard, renderizar con DashboardModule
              if (entityType.type === 'dashboard') {
                return (
                  <>
                    <DashboardModule
                      entityType={entityType}
                      entityTypes={entityTypes}
                      onNavigate={(targetEntity, action, record) => {
                        if (targetEntity) {
                          setActiveEntityType(targetEntity);
                          setActiveMenu(`dynamic-${targetEntity.slug}`);
                        }
                      }}
                    />
                    {editingDashboard && (
                      <DashboardModuleBuilder
                        entityType={editingDashboard}
                        entityTypes={entityTypes}
                        onCancel={() => setEditingDashboard(null)}
                        onSave={() => {
                          fetchDynamicMenus();
                          setEditingDashboard(null);
                        }}
                      />
                    )}
                  </>
                );
              }
              // Si es una sección landing, renderizar con LandingSection
              if (entityType.type === 'landing') {
                return (
                  <LandingSection
                    section={entityType}
                    onBack={() => {
                      setActiveMenu('dashboard');
                      setActiveEntityType(null);
                    }}
                  />
                );
              }
              // Si es un formulario normal, renderizar con DynamicEntity
              return (
                <DynamicEntity
                  entityType={entityType}
                  onBack={() => {
                    setActiveMenu('dashboard');
                    setActiveEntityType(null);
                  }}
                  onRecordChanged={refreshStats}
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
