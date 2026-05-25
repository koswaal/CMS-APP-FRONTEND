import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const PAGE_SIZES = [5, 10, 20, 50];

export default function DataTable({
  columns = [],
  data = [],
  keyExtractor = (r) => r.id,
  isDark = false,
  loading = false,
  emptyMessage = 'Sin registros',
  pageSize = 10,
  onPageSizeChange,
  onCellEdit,
  actions,
  searchTerm,
  onSearchChange,
  currentPage,
  totalPages: totalPagesProp,
  totalRecords,
  onPageChange,
  hideToolbar,
  hideFooterPageInfo = false,
  showTotals = true,
  visibleKeys: externalVisibleKeys,
  onVisibleKeysChange,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [internalVisibleKeys, setInternalVisibleKeys] = useState(() => new Set(columns.map(c => c.key)));
  const visibleKeys = externalVisibleKeys ?? internalVisibleKeys;
  const setVisibleKeys = onVisibleKeysChange ?? setInternalVisibleKeys;
  const [editState, setEditState] = useState(null);
  const [page, setPage] = useState(1);
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [openFilter, setOpenFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [calcModes, setCalcModes] = useState({});

  const panelRef = useRef(null);
  const filterPopupRef = useRef(null);

  const defaultKeys = useMemo(() => new Set(columns.map(c => c.key)), [columns]);

  useEffect(() => {
    if (!showColumnPanel) return;
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setShowColumnPanel(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showColumnPanel]);

  useEffect(() => {
    if (!openFilter) return;
    const h = (e) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(e.target)) {
        const btn = document.querySelector(`[data-filter-btn="${openFilter}"]`);
        if (btn && btn.contains(e.target)) return;
        setOpenFilter(null); setFilterSearch('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openFilter]);

  const isServerSide = currentPage != null;

  const getValue = (row, key) => {
    const col = columns.find(c => c.key === key);
    return col?.valueGetter ? col.valueGetter(row) : row[key];
  };

  useEffect(() => { if (!isServerSide) setPage(1); }, [sortKey, sortDir, columnFilters, searchTerm, data, pageSize]);

  const processed = useMemo(() => {
    let r = [...data];
    Object.entries(columnFilters).forEach(([k, vals]) => {
      if (vals.size) r = r.filter(row => vals.has(String(getValue(row, k) ?? '')));
    });
    if (sortKey && sortDir) {
      r.sort((a, b) => {
        const av = getValue(a, sortKey) ?? '', bv = getValue(b, sortKey) ?? '';
        const c = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? c : -c;
      });
    }
    return r;
  }, [data, columnFilters, sortKey, sortDir]);

  const displayPage = isServerSide ? currentPage : page;
  const displayTotalPages = isServerSide ? (totalPagesProp ?? 1) : Math.max(1, Math.ceil(processed.length / pageSize));
  const start = isServerSide ? 0 : (page - 1) * pageSize;
  const pageData = isServerSide ? processed : processed.slice(start, start + pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
      else { setSortKey(key); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleFilter = (key, val) => {
    setColumnFilters(prev => {
      const s = new Set(prev[key] || []);
      if (s.has(val)) s.delete(val); else s.add(val);
      const u = { ...prev };
      if (s.size) u[key] = s; else delete u[key];
      return u;
    });
  };

  const toggleColumn = (key) => {
    setVisibleKeys(prev => {
      const u = new Set(prev);
      if (u.has(key)) u.delete(key); else u.add(key);
      return u;
    });
  };

  const visCols = columns.filter(c => visibleKeys.has(c.key));

  const uniqueVals = (key) => {
    const s = new Set();
    data.forEach(row => s.add(String(getValue(row, key) ?? '')));
    return [...s].filter(v => v.toLowerCase().includes(filterSearch.toLowerCase())).sort();
  };

  const sortIcon = (key) => {
    if (sortKey !== key) return <span className="ml-1 opacity-30">⇅</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  const startEdit = (row, key, val) => {
    const col = columns.find(c => c.key === key);
    if (!col?.editable) return;
    const raw = col.valueGetter ? col.valueGetter(row) : val;
    setEditState({ rowId: keyExtractor(row), key, value: raw ?? '' });
  };

  const commitEdit = () => {
    if (!editState || !onCellEdit) return;
    const row = data.find(r => keyExtractor(r) === editState.rowId);
    if (row) onCellEdit(row, editState.key, editState.value);
    setEditState(null);
  };

  const cancelEdit = () => setEditState(null);

  const cellValue = (row, col) => {
    const id = keyExtractor(row);
    const editing = editState && editState.rowId === id && editState.key === col.key;
    const val = col.render ? col.render(row) : row[col.key];

    if (editing) {
      if (col.renderEdit) {
        return col.renderEdit(row, editState.value, (val) => setEditState(p => ({ ...p, value: val })), commitEdit, cancelEdit);
      }
      return (
        <input
          autoFocus
          value={editState.value}
          onChange={e => setEditState(p => ({ ...p, value: e.target.value }))}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
          className={`w-full px-1 py-0.5 rounded border text-xs outline-none focus:ring-1 focus:ring-[#c8f135] ${isDark ? 'bg-[#0f0f0f] border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'}`}
          onClick={e => e.stopPropagation()}
        />
      );
    }

    return (
      <span
        onDoubleClick={col.editable ? () => startEdit(row, col.key, val) : undefined}
        className={`${isDark ? 'text-gray-200' : 'text-gray-800'} ${col.editable ? 'cursor-pointer border-b border-dashed border-gray-500/30 hover:border-[#c8f135]/50' : ''}`}
      >
        {val ?? '-'}
      </span>
    );
  };

  const isFilterActive = (key) => columnFilters[key] && columnFilters[key].size > 0;

  const isNumericCol = (col) => {
    if (col.numeric === false) return false;
    if (col.numeric) return true;
    return data.some(row => {
      const v = parseFloat(getValue(row, col.key));
      return !isNaN(v);
    });
  };

  const LABELS = { sum: 'Suma', avg: 'Promedio', min: 'Mínimo', max: 'Máximo', count: 'Total' };
  const CYCLE = ['sum', 'avg', 'min', 'max', 'count'];

  const columnTotals = useMemo(() => {
    const result = {};
    const hasActiveFilter = Object.keys(columnFilters).length > 0;
    const filteredCount = processed.length;
    const totalRowCount = hasActiveFilter ? filteredCount : (totalRecords ?? filteredCount);
    columns.forEach(col => {
      if (!isNumericCol(col)) return;
      const vals = processed.map(r => parseFloat(getValue(r, col.key))).filter(v => !isNaN(v));
      if (!vals.length) { result[col.key] = { sum: 0, avg: 0, min: 0, max: 0, count: totalRowCount }; return; }
      result[col.key] = {
        sum: vals.reduce((a, b) => a + b, 0),
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
        min: Math.min(...vals),
        max: Math.max(...vals),
        count: totalRowCount,
      };
    });
    return result;
  }, [columns, processed, totalRecords, columnFilters]);

  const cycleCalc = (key) => {
    setCalcModes(prev => {
      const cur = prev[key] || 'sum';
      const idx = CYCLE.indexOf(cur);
      const next = CYCLE[(idx + 1) % CYCLE.length];
      return { ...prev, [key]: next };
    });
  };

  const formatNum = (num) => {
    if (Number.isInteger(num)) return num.toLocaleString();
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const renderTotalCell = (col) => {
    const mode = calcModes[col.key] || 'sum';
    const t = columnTotals[col.key];
    if (!t) return <span className="text-xs opacity-50">—</span>;
    const val = mode === 'count' ? t.count : formatNum(t[mode]);
    return (
      <span className="text-xs font-semibold cursor-pointer hover:text-[#c8f135] transition-colors" onClick={() => cycleCalc(col.key)} title={CYCLE.map(m => `${LABELS[m]}: ${m === 'count' ? t.count : formatNum(t[m])}`).join(' | ')}>
        {LABELS[mode]}: {val}
      </span>
    );
  };

  const hasTotals = showTotals && !loading && pageData.length > 0 && visCols.some(isNumericCol);

  return (
    <div>
      {/* Toolbar */}
      {!hideToolbar && <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setShowColumnPanel(v => !v)}
              className={`mt-px px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Columnas
              {visibleKeys.size < columns.length && (
                <span className="text-[#c8f135] font-bold">{columns.length - visibleKeys.size}</span>
              )}
            </button>
            {showColumnPanel && (
              <div className={`absolute z-20 mt-1 w-52 rounded-lg border shadow-lg p-2 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className={`text-xs font-semibold mb-1.5 px-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Columnas visibles</p>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {columns.map(col => (
                    <label key={col.key} className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <input type="checkbox" checked={visibleKeys.has(col.key)} onChange={() => toggleColumn(col.key)} className="accent-[#c8f135] w-3.5 h-3.5" />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onSearchChange && (
            <div className="relative">
              <svg className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm || ''}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Buscar..."
                className={`pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none focus:ring-1 focus:ring-[#c8f135] w-48 ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
            </div>
          )}
          <span className={`text-xs mr-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{processed.length} registros</span>
        </div>
      </div>}

      {/* Table */}
      <div className={`overflow-x-auto rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`} style={{ maxHeight: 'calc(100vh - 360px)' }}>
        <table className="w-full text-sm">
          <thead className={`sticky top-0 z-10 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
            <tr>
              {visCols.map(col => (
                <th key={col.key} className={`px-4 py-3 text-left text-xs font-bold uppercase whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="flex items-center gap-1">
                    {col.sortable !== false ? (
                      <button onClick={() => handleSort(col.key)} className={`flex items-center hover:text-[#c8f135] transition-colors ${sortKey === col.key ? 'text-[#c8f135]' : ''}`}>
                        {col.label}{sortIcon(col.key)}
                      </button>
                    ) : <span>{col.label}</span>}
                    {col.filterable !== false && (
                      <button
                        data-filter-btn={col.key}
                        onClick={(e) => {
                          if (openFilter === col.key) { setOpenFilter(null); return; }
                          const r = e.currentTarget.getBoundingClientRect();
                          setFilterAnchor({ top: r.bottom + 4, left: r.left });
                          setOpenFilter(col.key);
                          setFilterSearch('');
                        }}
                        className={`p-0.5 rounded transition-colors ${isFilterActive(col.key) ? 'text-[#c8f135]' : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className={`px-4 py-3 text-right text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visCols.length + (actions ? 1 : 0)} className={`text-center py-10 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cargando...</td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={visCols.length + (actions ? 1 : 0)} className={`text-center py-10 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{emptyMessage}</td>
              </tr>
            ) : (
              pageData.map(row => (
                <tr key={keyExtractor(row)} className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {visCols.map(col => (
                    <td key={col.key} className={`px-4 py-3 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{cellValue(row, col)}</td>
                  ))}
                  {actions && (
                    <td className={`px-4 py-3 text-right ${isDark ? 'text-gray-200' : 'text-gray-800'}`}><div className="flex items-center justify-end gap-2">{actions.map((a, i) => <span key={i}>{a.render(row)}</span>)}</div></td>
                  )}
                </tr>
              ))
            )}
            {hasTotals && (
              <tr className={`border-t-2 ${isDark ? 'border-[#c8f135]/40 bg-[#c8f135]/5' : 'border-green-400/60 bg-green-50'}`}>
                {visCols.map(col => (
                  <td key={col.key} className={`px-4 py-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {isNumericCol(col) ? renderTotalCell(col) : <span className="text-xs opacity-40">—</span>}
                  </td>
                ))}
                {actions && <td className="px-4 py-2" />}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {displayTotalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 mb-4">
          <button onClick={() => isServerSide ? onPageChange?.(displayPage - 1) : setPage(p => Math.max(1, p - 1))} disabled={displayPage === 1}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Anterior
          </button>
          {!hideFooterPageInfo && (
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Página {displayPage} de {displayTotalPages}</span>
          )}
          <button onClick={() => isServerSide ? onPageChange?.(displayPage + 1) : setPage(p => Math.min(displayTotalPages, p + 1))} disabled={displayPage === displayTotalPages}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Siguiente
          </button>
        </div>
      )}

      {/* Filter popup (portal to body, avoids ancestor overflow/transform clipping) */}
      {openFilter && filterAnchor && createPortal(
        <div
          ref={filterPopupRef}
          style={{ position: 'fixed', top: filterAnchor.top, left: filterAnchor.left, zIndex: 9999 }}
          className={`min-w-[200px] max-h-64 rounded-lg border shadow-lg flex flex-col ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="p-2 border-b border-gray-700">
            <input
              autoFocus
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Buscar valor..."
              className={`w-full px-2 py-1 text-xs rounded border outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          <div className="overflow-y-auto p-1 space-y-0.5">
            <label className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-800'}`}>
              <input
                type="checkbox"
                checked={!isFilterActive(openFilter)}
                onChange={() => setColumnFilters(prev => { const u = { ...prev }; delete u[openFilter]; return u; })}
                className="accent-[#c8f135] w-3.5 h-3.5"
              />
              <span className="font-medium">Todas</span>
            </label>
            {uniqueVals(openFilter).map(val => (
              <label key={val} className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-800'}`}>
                <input
                  type="checkbox"
                  checked={columnFilters[openFilter]?.has(val) || false}
                  onChange={() => toggleFilter(openFilter, val)}
                  className="accent-[#c8f135] w-3.5 h-3.5"
                />
                <span className="truncate">{(columns.find(c => c.key === openFilter)?.filterLabel?.(val)) ?? (val || '(vacío)')}</span>
              </label>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
