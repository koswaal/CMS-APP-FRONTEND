import React, { useState, useEffect, useContext } from 'react';
import { API_URL } from './config';
import ModuleBuilder from './ModuleBuilder';
import SubmenuManager from './SubmenuManager';
import DashboardModuleBuilder from './DashboardModuleBuilder';
import { AuthContext } from './AuthContext';
import { ThemeContext } from './ThemeContext';
import * as LucideIcons from 'lucide-react';

// Agregar estilos para las animaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    0% {
      transform: translateY(var(--distance, 50px));
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  @keyframes slideDown {
    0% {
      transform: translateY(calc(-1 * var(--distance, 50px)));
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

export default function MenuOrder({ onBack, onModuleCreated }) {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [movingMenuId, setMovingMenuId] = useState(null);

  // Modal de confirmación para menú padre con submenús
  const [parentDeleteModal, setParentDeleteModal] = useState({
    isOpen: false,
    menu: null,
    childrenCount: 0
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Gestión de submenús
  const [submenuManagerOpen, setSubmenuManagerOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState(null);

  // Estado para controlar contenedores expandidos/collapsados
  const [expandedContainers, setExpandedContainers] = useState(new Set());

  // Edición de menú
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [editForm, setEditForm] = useState({ menu_name: '', menu_icon: '' });
  const [editIconSearch, setEditIconSearch] = useState('');

  // Dashboard Builder
  const [dashboardBuilderOpen, setDashboardBuilderOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState(null);

  // Mapa de children por parent_id (calculado una vez)
  const getChildrenMap = () => {
    const map = new Map();
    for (const m of menus) {
      if (m.parent_id) {
        if (!map.has(m.parent_id)) map.set(m.parent_id, []);
        map.get(m.parent_id).push(m);
      }
    }
    return map;
  };

  const moveMenu = (index, direction) => {
    const newMenus = [...menus];
    const menu = newMenus[index];
    let targetIndex = index;

    if (direction === 'up') {
      // Buscar el menú anterior que no sea hijo del mismo padre
      targetIndex = index - 1;
      while (targetIndex >= 0) {
        const targetMenu = newMenus[targetIndex];
        if (targetMenu.parent_id === menu.parent_id) break;
        targetIndex--;
      }

      if (targetIndex >= 0 && targetIndex !== index) {
        // Solo calcular children cuando realmente se va a mover
        const children = newMenus.filter(m => m.parent_id === menu.id);
        const movedMenus = [menu, ...children];
        newMenus.splice(index, 1 + children.length);
        newMenus.splice(targetIndex, 0, ...movedMenus);
      } else {
        return; // No hay movimiento válido
      }
    } else if (direction === 'down') {
      // Calcular children solo si es necesario
      const children = newMenus.filter(m => m.parent_id === menu.id);
      targetIndex = index + 1 + children.length;

      while (targetIndex < newMenus.length) {
        const targetMenu = newMenus[targetIndex];
        if (targetMenu.parent_id === menu.parent_id) break;
        targetIndex++;
      }

      if (targetIndex < newMenus.length) {
        const movedMenus = [menu, ...children];
        newMenus.splice(index, 1 + children.length);
        newMenus.splice(targetIndex, 0, ...movedMenus);
      } else {
        return; // No hay movimiento válido
      }
    }

    // Establecer el menú que se está moviendo para la animación
    setMovingMenuId(menu.id);

    // Recalcular órdenes
    const updatedMenus = recalculateOrders(newMenus);
    setMenus(updatedMenus);

    // Limpiar el estado después de la animación
    setTimeout(() => {
      setMovingMenuId(null);
    }, 400);
  };

  // Mover submenú arriba/abajo dentro de su contenedor
  const moveSubmenu = (menu, direction) => {
    const parentId = menu.parent_id;
    if (!parentId) return;

    // Usar el childrenMap para obtener siblings eficientemente
    const childrenMap = getChildrenMap();
    const siblings = childrenMap.get(parentId) || [];
    const currentIndexInSiblings = siblings.findIndex(m => m.id === menu.id);

    if (currentIndexInSiblings === -1) return;

    // Verificar límites antes de continuar
    if (direction === 'up' && currentIndexInSiblings === 0) return;
    if (direction === 'down' && currentIndexInSiblings === siblings.length - 1) return;

    const newIndexInSiblings = direction === 'up'
      ? currentIndexInSiblings - 1
      : currentIndexInSiblings + 1;

    // Crear nuevo array de siblings intercambiando posiciones
    const newSiblings = [...siblings];
    [newSiblings[currentIndexInSiblings], newSiblings[newIndexInSiblings]] =
    [newSiblings[newIndexInSiblings], newSiblings[currentIndexInSiblings]];

    // Reconstruir el array de menús eficientemente
    const parentIndex = menus.findIndex(m => m.id === parentId);
    if (parentIndex === -1) return;

    const newMenus = [];
    let siblingIndex = 0;

    for (const m of menus) {
      if (m.id === parentId) {
        newMenus.push(m);
      } else if (m.parent_id === parentId) {
        // Reemplazar con el orden nuevo
        if (siblingIndex < newSiblings.length) {
          newMenus.push(newSiblings[siblingIndex++]);
        }
      } else {
        newMenus.push(m);
      }
    }

    setMovingMenuId(menu.id);
    const updatedMenus = recalculateOrders(newMenus);
    setMenus(updatedMenus);

    setTimeout(() => setMovingMenuId(null), 400);
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/entity-types?all=true`);
      const data = await response.json();

      if (data.success) {
        const loadedMenus = data.entity_types || [];
        setMenus(loadedMenus);

        // Contenedores colapsados por defecto (Set vacío)
        setExpandedContainers(new Set());
        setCurrentPage(1); // Resetear página al cargar
      } else {
        setError('Error al cargar menús');
      }
    } catch {
      setError('Error al cargar menús');
    } finally {
      setLoading(false);
    }
  };

  // Calcular profundidad de un menú en la jerarquía
  const getMenuDepth = (menuList, menu) => {
    if (!menu.parent_id) return 0;
    const parent = menuList.find(m => m.id === menu.parent_id);
    if (!parent) return 0;
    return 1 + getMenuDepth(menuList, parent);
  };

  // Alternar expansión de un contenedor padre
  const toggleContainerExpansion = (menuId) => {
    setExpandedContainers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
    // Resetear a página 1 al expandir/colapsar
    setCurrentPage(1);
  };

  // Recalcular órdenes considerando jerarquía
  const recalculateOrders = (menuList) => {
    // Menús de nivel raíz primero
    const rootMenus = menuList.filter(m => !m.parent_id);
    let order = 0;
    
    const processMenu = (menu) => {
      menu.menu_order = order++;
      // Procesar hijos
      const children = menuList.filter(m => m.parent_id === menu.id);
      children.forEach(processMenu);
    };
    
    rootMenus.forEach(processMenu);
    
    // Reconstruir lista en el orden correcto
    const result = [];
    const addWithChildren = (menu) => {
      result.push(menu);
      const children = menuList.filter(m => m.parent_id === menu.id);
      children.forEach(addWithChildren);
    };
    
    rootMenus.forEach(addWithChildren);
    
    return result;
  };

  const saveOrder = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Enviar el nuevo orden y jerarquía al backend
      const updates = menus.map((menu) => ({
        id: menu.id,
        menu_order: menu.menu_order,
        parent_id: menu.parent_id || null
      }));

      const response = await fetch(`${API_URL}/entity-types/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ menus: updates })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Orden guardado correctamente');
        onModuleCreated?.(); // Recargar menús del Dashboard
      } else {
        setError(data.message || 'Error al guardar el orden');
      }
    } catch {
      setError('Error al guardar el orden');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (menu) => {
    try {
      setError('');
      setSuccess('');

      const response = await fetch(`${API_URL}/entity-types/${menu.id}/toggle-active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar el menú en la lista local
        setMenus(menus.map(m => 
          m.id === menu.id ? { ...m, active: data.active } : m
        ));
        setSuccess(`Menú ${data.active ? 'activado' : 'desactivado'} correctamente`);
      } else {
        setError(data.message || 'Error al cambiar estado');
      }
    } catch {
      setError('Error al cambiar estado del menú');
    }
  };

  // Iniciar proceso de eliminación - detectar si es padre con hijos
  const initiateDelete = (menu) => {
    const children = menus.filter(m => m.parent_id === menu.id);
    if (children.length > 0) {
      // Es un padre con submenús - mostrar modal de confirmación especial
      setDeleteConfirmText('');
      setParentDeleteModal({
        isOpen: true,
        menu: menu,
        childrenCount: children.length
      });
    } else {
      // No tiene hijos - usar confirmación simple
      setDeleteConfirm(menu.id);
    }
  };

  // Confirmar eliminación de menú padre con submenús
  const confirmParentDelete = async () => {
    if (parentDeleteModal.menu) {
      await deleteMenu(parentDeleteModal.menu.id);
      setParentDeleteModal({ isOpen: false, menu: null, childrenCount: 0 });
    }
  };

  const deleteMenu = async (menuId) => {
    try {
      setError('');
      setSuccess('');

      const response = await fetch(`${API_URL}/entity-types/${menuId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Remover el menú de la lista local
        setMenus(menus.filter(m => m.id !== menuId));
        setSuccess('Menú eliminado correctamente');
        setDeleteConfirm(null);
        onModuleCreated?.(); // Recargar menús del Dashboard
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch {
      setError('Error al eliminar el menú');
    }
  };

  // Abrir modal de edición
  const openEditModal = (menu) => {
    setEditingMenu(menu);
    setEditForm({
      menu_name: menu.menu_name || '',
      menu_icon: menu.menu_icon || 'folder-open'
    });
    setEditModalOpen(true);
  };

  // Guardar cambios de edición
  const saveEdit = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(`${API_URL}/entity-types/${editingMenu.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: JSON.stringify({
          menu_name: editForm.menu_name,
          menu_icon: editForm.menu_icon
        })
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar el menú en la lista local
        setMenus(menus.map(m => 
          m.id === editingMenu.id 
            ? { ...m, menu_name: editForm.menu_name, menu_icon: editForm.menu_icon }
            : m
        ));
        setSuccess('Menú actualizado correctamente');
        setEditModalOpen(false);
        setEditingMenu(null);
        onModuleCreated?.(); // Recargar menús del Dashboard
      } else {
        setError(data.message || 'Error al actualizar');
      }
    } catch {
      setError('Error al actualizar el menú');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <p>Cargando menús...</p>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-6xl mx-auto min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
      {/* Header con botón Nuevo */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#c8f135]">Gestión de Módulos</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Administra los módulos personalizados del sistema</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#c8f135] text-black font-medium rounded-lg hover:bg-[#d4ff4d] transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Módulo
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Volver
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={`mb-4 p-4 border rounded-lg ${isDark ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-red-50 border-red-300 text-red-700'}`}>
          {error}
        </div>
      )}

      {success && (
        <div className={`mb-4 p-4 border rounded-lg ${isDark ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-green-50 border-green-500 text-green-700'}`}>
          {success}
        </div>
      )}

      {/* Contador de registros */}
      {(() => {
        const visibleMenus = menus.filter(menu => !menu.parent_id || expandedContainers.has(menu.parent_id));
        const totalPages = Math.ceil(visibleMenus.length / itemsPerPage);
        return (
          <div className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {visibleMenus.length} de {menus.length} {menus.length === 1 ? 'módulo' : 'módulos'} visibles
            {totalPages > 1 && (
              <span className="ml-2">• Página {currentPage} de {totalPages}</span>
            )}
            {menus.some(m => m.parent_id && !expandedContainers.has(m.parent_id)) && (
              <span className="ml-2 text-xs opacity-60">(algunos colapsados)</span>
            )}
          </div>
        );
      })()}

      {/* Tabla de menús */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'}`}>
        {menus.length === 0 ? (
          <div className={`p-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            <p>No hay módulos personalizados creados</p>
            <p className="text-sm mt-2">Haz clic en "Nuevo Módulo" para crear uno</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-100'}`}>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Orden
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-16 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Icono
                </th>
                <th className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider w-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {/* Conector */}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Nombre
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-24 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Estado
                </th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider w-32 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {(() => {
                // Solo mostrar menús visibles (filtrar hijos de padres colapsados)
                const visibleMenus = menus.filter(menu => {
                  if (!menu.parent_id) return true;
                  return expandedContainers.has(menu.parent_id);
                });
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedMenus = visibleMenus.slice(startIndex, startIndex + itemsPerPage);
                // Contador separado para padres (no se afecta por hijos)
                let parentCounter = 0;
                // Calcular cuántos padres hay en páginas anteriores
                const visibleParentsBefore = visibleMenus.slice(0, startIndex).filter(m => !m.parent_id).length;
                parentCounter = visibleParentsBefore;
                return paginatedMenus.map((menu) => {
                const realIndex = menus.findIndex(m => m.id === menu.id);
                const depth = getMenuDepth(menus, menu);
                const hasChildren = menus.some(m => m.parent_id === menu.id);
                const isExpanded = expandedContainers.has(menu.id);
                const isChild = menu.parent_id;

                // Incrementar contador de padres solo para padres
                if (!menu.parent_id) {
                  parentCounter++;
                }

                return (
                <tr
                  key={menu.id}
                  className={`relative transition-all duration-300 ease-out group ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} ${isChild ? (isDark ? 'bg-gray-900/30' : 'bg-gray-50') : ''} ${
                    movingMenuId === menu.id
                      ? 'bg-[#c8f135]/20'
                      : ''
                  }`}
                >
                  {/* Orden */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {!menu.parent_id && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveMenu(realIndex, 'up')}
                            disabled={realIndex === 0}
                            className={`p-1 rounded transition-colors ${
                              realIndex === 0
                                ? 'opacity-30 cursor-not-allowed'
                                : `${isDark ? 'text-gray-400 hover:text-[#c8f135] hover:bg-gray-700' : 'text-gray-500 hover:text-[#c8f135] hover:bg-gray-200'}`
                            }`}
                            title="Subir"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveMenu(realIndex, 'down')}
                            disabled={realIndex === menus.length - 1}
                            className={`p-1 rounded transition-colors ${
                              realIndex === menus.length - 1
                                ? 'opacity-30 cursor-not-allowed'
                                : `${isDark ? 'text-gray-400 hover:text-[#c8f135] hover:bg-gray-700' : 'text-gray-500 hover:text-[#c8f135] hover:bg-gray-200'}`
                            }`}
                            title="Bajar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}
                      {!menu.parent_id && (
                        <span className="w-6 h-6 flex items-center justify-center font-bold rounded text-xs bg-[#c8f135] text-black">
                          {parentCounter}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Icono */}
                  <td className="px-4 py-4">
                    <div className="w-10 h-10 flex items-center justify-center">
                      <DynamicIcon name={menu.menu_icon || 'box'} className={`w-6 h-6 ${isDark ? 'text-[#c8f135]' : 'text-green-600'}`} />
                    </div>
                  </td>

                  {/* Conector visual - vacío, solo espaciador */}
                  <td className="px-2 py-4 w-8"></td>
                  
                  {/* Nombre */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${menu.active ? (isDark ? 'text-gray-200' : 'text-gray-800') : (isDark ? 'text-gray-500' : 'text-gray-400') + ' line-through'} ${hasChildren ? 'cursor-pointer select-none' : ''}`}
                          onClick={() => hasChildren && toggleContainerExpansion(menu.id)}
                        >
                          {menu.menu_name}
                        </span>
                        {/* Flecha de expansión para contenedores padre - a la derecha del nombre */}
                        {hasChildren && (
                          <button
                            onClick={() => toggleContainerExpansion(menu.id)}
                            className={`ml-2 p-1 rounded transition-all duration-200 hover:bg-[#c8f135]/20 ${isDark ? 'text-[#c8f135]' : 'text-green-600'}`}
                            title={isExpanded ? 'Colapsar' : 'Expandir'}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7-7 7 7" />
                            </svg>
                          </button>
                        )}
                        {hasChildren && (
                          <span className="px-2 py-0.5 text-xs bg-[#c8f135] text-black rounded-full font-medium">
                            padre
                          </span>
                        )}
                        {depth > 0 && (
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${isDark ? 'bg-[#c8f135]/20 text-[#c8f135] border-[#c8f135]/30' : 'bg-green-100 text-green-700 border-green-300'}`}>
                            hijo
                          </span>
                        )}
                      </div>
                      <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{menu.name}</span>
                    </div>
                  </td>
                  
                  {/* Estado */}
                  <td className="px-4 py-4">
                    {menu.active ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                        Activo
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                        Inactivo
                      </span>
                    )}
                  </td>
                  
                  {/* Acciones */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Flechas para reordenar submenús (solo para hijos) */}
                      {depth > 0 && (
                        <div className="flex flex-col gap-0.5 mr-1">
                          <button
                            onClick={() => moveSubmenu(menu, 'up')}
                            disabled={menus.filter(m => m.parent_id === menu.parent_id)[0]?.id === menu.id}
                            className={`p-1 rounded transition-colors ${
                              menus.filter(m => m.parent_id === menu.parent_id)[0]?.id === menu.id
                                ? 'opacity-30 cursor-not-allowed'
                                : `${isDark ? 'text-gray-400 hover:text-[#c8f135] hover:bg-gray-700' : 'text-gray-500 hover:text-[#c8f135] hover:bg-gray-200'}`
                            }`}
                            title="Subir"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveSubmenu(menu, 'down')}
                            disabled={menus.filter(m => m.parent_id === menu.parent_id).slice(-1)[0]?.id === menu.id}
                            className={`p-1 rounded transition-colors ${
                              menus.filter(m => m.parent_id === menu.parent_id).slice(-1)[0]?.id === menu.id
                                ? 'opacity-30 cursor-not-allowed'
                                : `${isDark ? 'text-gray-400 hover:text-[#c8f135] hover:bg-gray-700' : 'text-gray-500 hover:text-[#c8f135] hover:bg-gray-200'}`
                            }`}
                            title="Bajar"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Agregar submenú (solo para contenedores - admin/desarrollador) */}
                      {(menu.is_container || hasChildren) && (user?.role === 'desarrollador' || user?.role === 'administrador') && (
                        <button
                          onClick={() => {
                            setSelectedContainer({ id: menu.id, name: menu.menu_name });
                            setSubmenuManagerOpen(true);
                          }}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'text-[#c8f135] hover:bg-[#c8f135]/20' : 'text-green-600 hover:bg-green-100'}`}
                          title="Agregar submenú"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      )}

                      {/* Editar dashboard (solo para tipo dashboard) */}
                      {menu.type === 'dashboard' && (
                        <button
                          onClick={() => {
                            setEditingDashboard(menu);
                            setDashboardBuilderOpen(true);
                          }}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'text-[#c8f135] hover:bg-[#c8f135]/20' : 'text-green-600 hover:bg-green-100'}`}
                          title="Editar secciones del dashboard"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      )}

                      {/* Editar menú */}
                      <button
                        onClick={() => openEditModal(menu)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-100'}`}
                        title="Editar título e ícono"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Toggle activo/inactivo */}
                      <button
                        onClick={() => toggleActive(menu)}
                        className={`p-2 rounded-lg transition-colors ${
                          menu.active
                            ? `${isDark ? 'text-green-400 hover:bg-green-500/20' : 'text-green-600 hover:bg-green-100'}`
                            : `${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`
                        }`}
                        title={menu.active ? 'Desactivar' : 'Activar'}
                      >
                        {menu.active ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>

                      {/* Eliminar */}
                      {deleteConfirm === menu.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteMenu(menu.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            title="Confirmar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
                            title="Cancelar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => initiateDelete(menu)}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-100'}`}
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            )})()}
            </tbody>
          </table>
        )}
      </div>

      {/* Controles de paginación */}
      {(() => {
        const visibleMenus = menus.filter(menu => !menu.parent_id || expandedContainers.has(menu.parent_id));
        const totalPages = Math.ceil(visibleMenus.length / itemsPerPage);
        if (totalPages <= 1) return null;
        return (
          <div className={`mt-4 flex items-center justify-center gap-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : `${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
              }`}
            >
              ← Anterior
            </button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : `${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
              }`}
            >
              Siguiente →
            </button>
          </div>
        );
      })()}

      {/* Botón guardar orden */}
      {menus.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={saveOrder}
            disabled={saving}
            className="px-6 py-3 bg-[#c8f135] text-black font-medium rounded-lg hover:bg-[#d4ff4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar orden'}
          </button>
        </div>
      )}

      {/* Modal de Constructor de Módulos */}
      {showModal && (
        <ModuleBuilder
          isModal={true}
          onSuccess={() => {
            setShowModal(false);
            loadMenus(); // Recargar la lista
            onModuleCreated?.(); // Recargar menús del Dashboard
          }}
          onCancel={() => setShowModal(false)}
        />
      )}

      {/* Modal de gestión de submenús */}
      <SubmenuManager
        isOpen={submenuManagerOpen}
        onClose={() => {
          setSubmenuManagerOpen(false);
          setSelectedContainer(null);
        }}
        containerId={selectedContainer?.id}
        containerName={selectedContainer?.name}
        onSuccess={() => {
          loadMenus();
          onModuleCreated?.();
        }}
      />

      {/* Dashboard Module Builder */}
      {dashboardBuilderOpen && editingDashboard && (
        <DashboardModuleBuilder
          entityType={editingDashboard}
          entityTypes={menus}
          onCancel={() => {
            setDashboardBuilderOpen(false);
            setEditingDashboard(null);
          }}
          onSave={() => {
            loadMenus();
            onModuleCreated?.();
            setDashboardBuilderOpen(false);
            setEditingDashboard(null);
          }}
        />
      )}

      {/* Modal de confirmación estilo notificación iPhone - Eliminación de menú padre */}
      {parentDeleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop simple sin blur para mejor rendimiento */}
          <div
            className="absolute inset-0 bg-black/50"
            style={{ willChange: 'opacity' }}
            onClick={() => {
              setDeleteConfirmText('');
              setParentDeleteModal({ isOpen: false, menu: null, childrenCount: 0 });
            }}
          />

          {/* Notificación estilo iPhone - optimizada para GPU */}
          <div
            className={`relative w-full max-w-sm ${
              isDark
                ? 'bg-[#1c1c1e]'
                : 'bg-white'
            } rounded-3xl overflow-hidden`}
            style={{
              boxShadow: isDark
                ? '0 20px 40px rgba(0, 0, 0, 0.6)'
                : '0 20px 40px rgba(0, 0, 0, 0.2)',
              willChange: 'transform, opacity',
              animation: 'modalIn 200ms ease-out forwards'
            }}
          >
            {/* Icono de advertencia */}
            <div className={`flex justify-center pt-8 pb-4 ${isDark ? 'bg-[#2c2c2e]' : 'bg-gray-50'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-[#3a3a3c]' : 'bg-white shadow-md'
              }`}>
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-6 pb-6 text-center">
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Eliminar "{parentDeleteModal.menu?.menu_name}"
              </h3>

              <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Este menú contiene{' '}
                <span className={`font-semibold ${isDark ? 'text-[#c8f135]' : 'text-green-600'}`}>
                  {parentDeleteModal.childrenCount} submenú{parentDeleteModal.childrenCount > 1 ? 's' : ''}
                </span>
                . Al eliminarlo, todos los submenús serán eliminados permanentemente.
              </p>

              <div className={`p-3 rounded-xl mb-4 text-xs ${
                isDark
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Esta acción no se puede deshacer</span>
                </div>
              </div>

              {/* Input de confirmación estilo GitHub */}
              <div className="mb-5">
                <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Para confirmar, escribe <span className="font-bold text-[#c8f135]">CONFIRMAR</span> en mayúsculas:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="CONFIRMAR"
                  className={`w-full px-4 py-3 rounded-xl border-2 text-center font-mono text-sm tracking-wider uppercase transition-all duration-200 ${
                    isDark
                      ? 'bg-[#2c2c2e] border-gray-600 text-white placeholder-gray-500 focus:border-[#c8f135] focus:outline-none'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none'
                  } ${deleteConfirmText === 'CONFIRMAR' ? (isDark ? 'border-green-500/50' : 'border-green-500') : ''}`}
                  autoFocus
                />
              </div>

              {/* Botones estilo iOS */}
              <div className="space-y-3">
                {/* Botón Cancelar */}
                <button
                  onClick={() => {
                    setDeleteConfirmText('');
                    setParentDeleteModal({ isOpen: false, menu: null, childrenCount: 0 });
                  }}
                  className={`w-full py-3.5 rounded-xl font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-[#2c2c2e] text-[#0a84ff] hover:bg-[#3a3a3c] active:scale-[0.98]'
                      : 'bg-gray-100 text-blue-600 hover:bg-gray-200 active:scale-[0.98]'
                  }`}
                >
                  Cancelar
                </button>

                {/* Botón Eliminar - solo habilitado cuando se escribe CONFIRMAR */}
                <button
                  onClick={confirmParentDelete}
                  disabled={deleteConfirmText !== 'CONFIRMAR'}
                  className={`w-full py-3.5 rounded-xl font-medium transition-all duration-200 ${
                    deleteConfirmText === 'CONFIRMAR'
                      ? 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] shadow-lg shadow-red-500/25'
                      : isDark
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Eliminar todo
                </button>
              </div>
            </div>

            {/* Indicador de home bar (decorativo) */}
            <div className="flex justify-center pb-2">
              <div className={`w-1/3 h-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
            </div>
          </div>
        </div>
      )}

      {/* Animación ligera para modal - solo transform y opacity */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Modal de edición de menú */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Editar {editingMenu?.parent_id ? 'Submenú' : 'Módulo'}
            </h2>
            
            <div className="space-y-4">
              {/* Campo de nombre */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nombre del menú
                </label>
                <input
                  type="text"
                  value={editForm.menu_name}
                  onChange={(e) => setEditForm({ ...editForm, menu_name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="Ej: Mantenimiento"
                />
              </div>

              {/* Campo de ícono */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Ícono
                </label>
                <input
                  type="text"
                  value={editIconSearch}
                  onChange={(e) => setEditIconSearch(e.target.value)}
                  placeholder="Buscar ícono..."
                  className={`w-full px-3 py-2 mb-2 rounded-lg border text-sm ${
                    isDark
                      ? 'bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <div className={`grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  {[
                    // Carpetas y archivos
                    'folder-open', 'folder', 'folder-plus', 'folder-minus',
                    'file-text', 'file', 'file-plus', 'file-minus', 'files',
                    'box', 'package', 'archive', 'database', 'save', 'download', 'upload',
                    // Comunicación
                    'mail', 'inbox', 'send', 'message-circle', 'message-square', 'phone', 'smartphone', 'at-sign',
                    // Documentos y escritura
                    'clipboard', 'clipboard-list', 'clipboard-check', 'paperclip', 'pen-tool', 'edit',
                    'book', 'book-open', 'bookmark', 'book-marked',
                    // Compras y transporte
                    'shopping-cart', 'shopping-bag', 'truck', 'warehouse',
                    'credit-card', 'dollar-sign', 'banknote', 'receipt', 'calculator',
                    // Usuarios y personas
                    'users', 'user', 'user-plus', 'user-minus', 'user-check', 'user-x',
                    'heart', 'star', 'thumbs-up', 'smile', 'frown',
                    // Configuración y herramientas
                    'settings', 'tool', 'wrench', 'sliders', 'filter', 'search',
                    'cog', 'toggle-right', 'toggle-left', 'power', 'zap', 'flashlight',
                    // Gráficos y estadísticas
                    'bar-chart', 'bar-chart-2', 'pie-chart', 'line-chart', 'trending-up', 'trending-down',
                    'activity', 'gauge', 'percent', 'target', 'award', 'trophy',
                    // Calendario y tiempo
                    'calendar', 'calendar-days', 'calendar-check', 'calendar-x',
                    'clock', 'watch', 'timer', 'hourglass', 'sun', 'moon',
                    // UI y navegación
                    'home', 'menu', 'grid', 'grid-3x3', 'layout', 'list',
                    'plus', 'plus-circle', 'plus-square', 'minus', 'minus-circle', 'minus-square',
                    'check', 'check-circle', 'check-square', 'x', 'x-circle', 'x-square',
                    'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down',
                    'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down',
                    'corner-up-right', 'corner-up-left', 'maximize', 'minimize',
                    // Alertas y estados
                    'alert-circle', 'alert-triangle', 'alert-octagon', 'info', 'help-circle',
                    'bell', 'bell-ring', 'bell-off', 'shield', 'shield-check', 'shield-alert',
                    // Mapas y ubicación
                    'map', 'map-pin', 'navigation', 'compass', 'globe', 'locate',
                    'pin', 'flag', 'flag-triangle-right',
                    // Hardware y dispositivos
                    'monitor', 'laptop', 'tablet', 'printer', 'server',
                    'hard-drive', 'cpu', 'wifi', 'bluetooth', 'battery',
                    // Multimedia
                    'camera', 'video', 'mic', 'headphones', 'image', 'images',
                    'music', 'play', 'pause', 'skip-forward', 'skip-back',
                    // Vehículos y transporte
                    'car', 'bus', 'train', 'plane', 'ship', 'bike',
                    // Edificios
                    'building', 'building-2', 'store', 'factory', 'landmark',
                    // Médico y salud
                    'heart-pulse', 'stethoscope', 'syringe', 'pill',
                    // Otros objetos
                    'briefcase', 'glasses', 'key', 'lock', 'unlock', 'umbrella',
                    'coffee', 'utensils', 'wine', 'beer',
                    'code', 'terminal', 'github', 'git-branch',
                    'layers', 'tag', 'tags', 'hash', 'link', 'anchor',
                  ].filter(icon => icon.includes(editIconSearch.toLowerCase())).map((icon, idx) => (
                    <button
                      key={idx}
                      onClick={() => setEditForm({ ...editForm, menu_icon: icon })}
                      className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                        editForm.menu_icon === icon
                          ? 'bg-[#c8f135] text-black'
                          : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title={icon}
                    >
                      <DynamicIcon name={icon} className={`w-5 h-5 ${editForm.menu_icon === icon ? '' : isDark ? 'text-white' : 'text-gray-600'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingMenu(null);
                  setEditIconSearch('');
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editForm.menu_name.trim()}
                className="px-4 py-2 bg-[#c8f135] text-black font-medium rounded-lg hover:bg-[#d4ff4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
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
