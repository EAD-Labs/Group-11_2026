import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Award,
  AlertCircle,
  Table as TableIcon,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';

const ACCENT_COLORS = {
  teal: { bg: 'rgba(94, 234, 212, 0.12)', border: '#5EEAD4', text: '#5EEAD4' },
  amber: { bg: 'rgba(245, 158, 11, 0.12)', border: '#F59E0B', text: '#F59E0B' },
  violet: { bg: 'rgba(167, 139, 250, 0.12)', border: '#A78BFA', text: '#A78BFA' },
  emerald: { bg: 'rgba(52, 211, 153, 0.12)', border: '#34D399', text: '#34D399' },
  rose: { bg: 'rgba(251, 113, 133, 0.12)', border: '#FB7185', text: '#FB7185' }
};

function KpiWidget({ widget }) {
  const accent = ACCENT_COLORS[widget.color] || ACCENT_COLORS.teal;

  let displayValue = widget.value;
  let displaySub = widget.sub;
  if ((displayValue === undefined || displayValue === null) && widget.data !== undefined) {
    if (typeof widget.data === 'object' && widget.data !== null) {
      const entries = Object.entries(widget.data);
      if (entries.length === 1) {
        displayValue = entries[0][1];
        displaySub = displaySub || entries[0][0];
      } else {
        return (
          <div style={{
            background: 'var(--bg-2, #1A2540)',
            border: `1px solid ${accent.border}`,
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted, #94A3B8)', fontSize: '0.85rem' }}>
              <Award size={16} color={accent.border} />
              <span>{widget.title}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginTop: '12px' }}>
              {entries.map(([label, val]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: accent.text, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    } else {
      displayValue = widget.data;
    }
  }

  return (
    <div style={{
      background: 'var(--bg-2, #1A2540)',
      border: `1px solid ${accent.border}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '80px',
        height: '80px',
        background: `radial-gradient(circle at top right, ${accent.bg}, transparent 70%)`
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted, #94A3B8)', fontSize: '0.85rem' }}>
        <Award size={16} color={accent.border} />
        <span>{widget.title}</span>
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '2rem',
        fontWeight: '700',
        color: accent.text,
        margin: '12px 0 6px 0'
      }}>
        {displayValue ?? '-'}
      </div>
      {displaySub && (
        <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
          {displaySub}
        </div>
      )}
    </div>
  );
}

function BarChartWidget({ widget }) {
  let data = widget.data || [];
  let series = widget.series || [];
  const xKey = widget.xKey || widget.x_axis || 'class';
  const yKey = widget.yKey || 'avg_percentage';
  const barColor = widget.color || '#5EEAD4';
  const palette = ['#5EEAD4', '#F59E0B', '#A78BFA', '#34D399', '#FB7185'];

  // Normalize nested series if present
  if ((!data || data.length === 0) && series.length > 0 && series[0].data) {
    const mapByX = {};
    series.forEach(s => {
      const sName = s.name || s.key;
      (s.data || []).forEach(pt => {
        const xVal = pt[xKey] || pt.year || pt.class || pt.name;
        if (!mapByX[xVal]) mapByX[xVal] = { [xKey]: xVal };
        mapByX[xVal][sName] = pt.value ?? pt.avg_percentage ?? pt.score;
      });
    });
    data = Object.values(mapByX);
    series = series.map((s, idx) => ({
      key: s.name || s.key,
      name: s.name || s.key,
      color: s.color || palette[idx % palette.length]
    }));
  }

  return (
    <div style={{
      background: 'var(--bg-2, #1A2540)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <BarChart3 size={18} color="#5EEAD4" />
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
          {widget.title}
        </h4>
      </div>
      <div style={{ width: '100%', height: 280 }}>
        {data.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
            No chart data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey={xKey} stroke="#94A3B8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#0F1729',
                  border: '1px solid #5EEAD4',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.85rem'
                }}
              />
              {series.length > 0 ? (
                <>
                  <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94A3B8' }} />
                  {series.map((s, idx) => (
                    <Bar key={s.key} dataKey={s.key} name={s.name || s.key} fill={s.color || palette[idx % palette.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </>
              ) : (
                <Bar dataKey={yKey} fill={barColor} radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function LineChartWidget({ widget }) {
  let data = widget.data || [];
  let series = widget.series || [];
  const xKey = widget.xKey || widget.x_axis || 'year';
  const palette = ['#5EEAD4', '#F59E0B', '#A78BFA', '#34D399', '#FB7185'];

  // Normalize nested series if present
  if ((!data || data.length === 0) && series.length > 0 && series[0].data) {
    const mapByX = {};
    series.forEach(s => {
      const sName = s.name || s.key;
      (s.data || []).forEach(pt => {
        const xVal = pt[xKey] || pt.year || pt.class || pt.name;
        if (!mapByX[xVal]) mapByX[xVal] = { [xKey]: xVal };
        mapByX[xVal][sName] = pt.value ?? pt.avg_percentage ?? pt.score;
      });
    });
    data = Object.values(mapByX);
    series = series.map((s, idx) => ({
      key: s.name || s.key,
      name: s.name || s.key,
      color: s.color || palette[idx % palette.length]
    }));
  }

  if (series.length === 0) {
    series = [{ key: 'score', name: 'Score', color: '#5EEAD4' }];
  }

  return (
    <div style={{
      background: 'var(--bg-2, #1A2540)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <LineChartIcon size={18} color="#F59E0B" />
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
          {widget.title}
        </h4>
      </div>
      <div style={{ width: '100%', height: 280 }}>
        {data.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
            No trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey={xKey} stroke="#94A3B8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#0F1729',
                  border: '1px solid #F59E0B',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.85rem'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94A3B8' }} />
              {series.map((s, idx) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name || s.key}
                  stroke={s.color || palette[idx % palette.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: s.color || palette[idx % palette.length] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function TableWidget({ widget }) {
  const columns = widget.columns || [];
  const rows = widget.rows || [];

  return (
    <div style={{
      background: 'var(--bg-2, #1A2540)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <TableIcon size={18} color="#A78BFA" />
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
          {widget.title}
        </h4>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: '320px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}>
              {columns.map((col, idx) => (
                <th key={idx} style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600 }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>
                  No records to display
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                  }}
                >
                  {Array.isArray(row)
                    ? row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            padding: '10px 12px',
                            color: cIdx === 0 ? '#5EEAD4' : '#E2E8F0',
                            fontFamily: typeof cell === 'number' || (typeof cell === 'string' && cell.includes('%')) ? "'JetBrains Mono', monospace" : 'inherit'
                          }}
                        >
                          {cell}
                        </td>
                      ))
                    : columns.map((col, cIdx) => (
                        <td key={cIdx} style={{ padding: '10px 12px', color: '#E2E8F0' }}>
                          {row[col] ?? '-'}
                        </td>
                      ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DynamicVisualizer({ layout }) {
  if (!layout || !layout.widgets || layout.widgets.length === 0) {
    return null;
  }

  const { layout_type = 'grid', widgets = [] } = layout;

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'kpi':
        return <KpiWidget key={widget.id || Math.random()} widget={widget} />;
      case 'bar_chart':
        return <BarChartWidget key={widget.id || Math.random()} widget={widget} />;
      case 'line_chart':
        return <LineChartWidget key={widget.id || Math.random()} widget={widget} />;
      case 'table':
        return <TableWidget key={widget.id || Math.random()} widget={widget} />;
      default:
        return null;
    }
  };

  // 1. Featured Top: Lead with first widget (full width), grid for the rest
  if (layout_type === 'featured_top' && widgets.length > 1) {
    const [featured, ...rest] = widgets;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div style={{ width: '100%' }}>
          {renderWidget(featured)}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: rest.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          width: '100%'
        }}>
          {rest.map(renderWidget)}
        </div>
      </div>
    );
  }

  // 2. Side-by-side: Equal columns
  if (layout_type === 'side_by_side') {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        width: '100%'
      }}>
        {widgets.map(renderWidget)}
      </div>
    );
  }

  // 3. Default Grid layout
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '20px',
      width: '100%'
    }}>
      {widgets.map(renderWidget)}
    </div>
  );
}
