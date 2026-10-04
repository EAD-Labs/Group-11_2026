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
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Percent,
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

function parseTrend(widget = {}, displayValue = '', displaySub = '') {
  // 1. Explicit widget.trend ('up' | 'down' | 'growth' | 'decrease' | 'neutral')
  const t = String(widget.trend || '').toLowerCase();
  const dirFromWidget = (t === 'up' || t === 'growth' || t === 'increase' || t === 'positive') ? 'up' :
                        (t === 'down' || t === 'decrease' || t === 'drop' || t === 'decline' || t === 'negative') ? 'down' :
                        (t === 'neutral' || t === 'flat') ? 'neutral' : null;

  const explicitChange = String(widget.change || widget.delta || widget.diff || '').trim();

  if (dirFromWidget) {
    return {
      direction: dirFromWidget,
      change: explicitChange || (dirFromWidget === 'up' ? 'Growth' : dirFromWidget === 'down' ? 'Decrease' : 'Steady')
    };
  }

  // 2. Explicit change string starting with + or -
  if (explicitChange.startsWith('+') || explicitChange.includes('▲') || explicitChange.includes('↑')) {
    return { direction: 'up', change: explicitChange };
  }
  if (explicitChange.startsWith('-') || explicitChange.includes('▼') || explicitChange.includes('↓')) {
    return { direction: 'down', change: explicitChange };
  }

  // 3. Display value string starting with + or -
  const valStr = String(displayValue || '').trim();
  if (valStr.startsWith('+') || valStr.includes('▲') || valStr.includes('↑')) {
    return { direction: 'up', change: valStr };
  }
  if (valStr.startsWith('-') || valStr.includes('▼') || valStr.includes('↓')) {
    return { direction: 'down', change: valStr };
  }

  // 4. Subtitle patterns (+X%, -X%, "increased by", "growth of", etc.)
  const subStr = String(displaySub || '').trim();
  const plusMatch = subStr.match(/\+([\d.]+%?)/) || subStr.match(/(?:growth|increase|improved|higher|up|gain)\s+(?:of\s+)?([+\d.]+%?)/i);
  if (plusMatch) {
    return { direction: 'up', change: plusMatch[1]?.startsWith('+') ? plusMatch[1] : `+${plusMatch[1]}` };
  }

  const minusMatch = subStr.match(/-([\d.]+%?)/) || subStr.match(/(?:decrease|drop|decline|lower|down|loss)\s+(?:of\s+)?([-\d.]+%?)/i);
  if (minusMatch) {
    return { direction: 'down', change: minusMatch[1]?.startsWith('-') ? minusMatch[1] : `-${minusMatch[1]}` };
  }

  if (/\b(?:growth|increase|improved|higher|gain)\b/i.test(subStr)) {
    return { direction: 'up', change: 'Growth' };
  }
  if (/\b(?:decrease|drop|decline|lower|loss|dip)\b/i.test(subStr)) {
    return { direction: 'down', change: 'Decrease' };
  }

  return null;
}

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
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted, #94A3B8)', fontSize: '0.8rem', fontWeight: 600 }}>
              <Award size={14} color={accent.border} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{widget.title}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', marginTop: '10px' }}>
              {entries.map(([label, val]) => {
                const itemTrend = parseTrend({}, val, '');
                return (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: accent.text, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                      {itemTrend && (
                        <span style={{ color: itemTrend.direction === 'up' ? '#34D399' : '#FB7185' }}>
                          {itemTrend.direction === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    } else {
      displayValue = widget.data;
    }
  }

  const trend = parseTrend(widget, displayValue, displaySub);

  return (
    <div style={{
      background: 'var(--bg-2, #1A2540)',
      border: `1px solid ${accent.border}`,
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50px',
        height: '50px',
        background: `radial-gradient(circle at top right, ${accent.bg}, transparent 70%)`
      }} />

      {/* Top Header: Title and Icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted, #94A3B8)', fontSize: '0.8rem', fontWeight: 600 }}>
          <Award size={14} color={accent.border} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {widget.title}
          </span>
        </div>
      </div>

      {/* Value Row: Number and Growth/Decrease Arrow Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '8px',
        margin: '8px 0 4px 0',
        zIndex: 1,
        flexWrap: 'wrap'
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '1.6rem',
          fontWeight: '700',
          color: accent.text,
          lineHeight: 1.1
        }}>
          {displayValue ?? '-'}
        </div>

        {trend && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: '5px',
            background: trend.direction === 'up'
              ? 'rgba(52, 211, 153, 0.15)'
              : trend.direction === 'down'
              ? 'rgba(251, 113, 133, 0.15)'
              : 'rgba(148, 163, 184, 0.15)',
            color: trend.direction === 'up'
              ? '#34D399'
              : trend.direction === 'down'
              ? '#FB7185'
              : '#94A3B8',
            border: `1px solid ${
              trend.direction === 'up'
                ? 'rgba(52, 211, 153, 0.3)'
                : trend.direction === 'down'
                ? 'rgba(251, 113, 133, 0.3)'
                : 'rgba(148, 163, 184, 0.3)'
            }`
          }}>
            {trend.direction === 'up' && <TrendingUp size={11} />}
            {trend.direction === 'down' && <TrendingDown size={11} />}
            {trend.direction === 'neutral' && <Minus size={11} />}
            <span>{trend.change}</span>
          </div>
        )}
      </div>

      {/* Subtitle info */}
      {displaySub && (
        <div style={{ color: '#94A3B8', fontSize: '0.75rem', lineHeight: 1.3, zIndex: 1 }}>
          {displaySub}
        </div>
      )}
    </div>
  );
}

function formatSeriesName(key) {
  if (!key) return 'Value';
  if (key === 'avg_percentage' || key === 'avgPct') return 'Avg Score (%)';
  if (key === 'writtenScorePct') return 'Written Score (%)';
  if (key === 'oralProgressPct') return 'Oral Progress (%)';
  if (key === 'accuracyPct') return 'Accuracy (%)';
  if (key === 'value' || key === 'score') return 'Score (%)';
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function resolveChartKeys(data, widget) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      xKey: 'x',
      yKey: 'value',
      series: [{ key: 'value', name: 'Value', color: '#5EEAD4' }]
    };
  }

  const sample = data[0];
  const allKeys = Object.keys(sample);

  // 1. Resolve X Key
  let xKey = widget.xKey || widget.x_axis;
  if (!xKey || sample[xKey] === undefined) {
    const xCandidates = [
      'label', 'year', 'class', 'name', 'subject', 'school',
      'category', 'topic', 'academic_year', 'cohort', 'relation', 'level', 'x'
    ];
    xKey = xCandidates.find(k => sample[k] !== undefined) ||
           allKeys.find(k => typeof sample[k] === 'string') ||
           allKeys[0];
  }

  // 2. Resolve Series / Y Keys
  let series = widget.series;
  if (Array.isArray(series) && series.length > 0) {
    return { xKey, yKey: series[0].key || 'value', series };
  }

  // Check explicit yKey or y_axis
  let yKey = widget.yKey || widget.y_axis;
  if (yKey && sample[yKey] !== undefined) {
    return {
      xKey,
      yKey,
      series: [{
        key: yKey,
        name: widget.valueLabel || formatSeriesName(yKey),
        color: widget.color || '#5EEAD4'
      }]
    };
  }

  // Look for common metric keys
  const yCandidates = [
    'value', 'avg_percentage', 'avgPct', 'score', 'percentage',
    'avg', 'writtenScorePct', 'accuracyPct', 'rate', 'y'
  ];
  const foundY = yCandidates.find(k => k !== xKey && sample[k] !== undefined && typeof sample[k] === 'number');

  if (foundY) {
    return {
      xKey,
      yKey: foundY,
      series: [{
        key: foundY,
        name: widget.valueLabel || (foundY === 'value' ? (widget.title || 'Score (%)') : formatSeriesName(foundY)),
        color: widget.color || '#5EEAD4'
      }]
    };
  }

  // Find all numeric keys excluding xKey and metadata keys
  const metaKeys = new Set(['id', 'schoolId', 'student_count', 'count', 'total', 'attempted', 'n']);
  let numericKeys = allKeys.filter(k => k !== xKey && typeof sample[k] === 'number' && !metaKeys.has(k));

  if (numericKeys.length === 0) {
    numericKeys = allKeys.filter(k => k !== xKey && typeof sample[k] === 'number');
  }

  if (numericKeys.length === 0) {
    numericKeys = ['value'];
  }

  const palette = ['#5EEAD4', '#F59E0B', '#A78BFA', '#34D399', '#FB7185', '#60A5FA'];
  const generatedSeries = numericKeys.map((k, idx) => ({
    key: k,
    name: formatSeriesName(k),
    color: palette[idx % palette.length]
  }));

  return {
    xKey,
    yKey: numericKeys[0],
    series: generatedSeries
  };
}

function cleanChartData(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(row => {
    if (!row || typeof row !== 'object') return row;
    const cleanRow = { ...row };
    Object.keys(cleanRow).forEach(k => {
      const val = cleanRow[k];
      if (typeof val === 'string' && /^-?[\d.]+%$/.test(val.trim())) {
        cleanRow[k] = parseFloat(val.replace('%', ''));
      }
    });
    return cleanRow;
  });
}

function BarChartWidget({ widget }) {
  let rawData = widget.data || [];
  let series = widget.series || [];
  const palette = ['#5EEAD4', '#F59E0B', '#A78BFA', '#34D399', '#FB7185', '#60A5FA'];

  // Normalize nested series if present
  if ((!rawData || rawData.length === 0) && series.length > 0 && series[0].data) {
    const mapByX = {};
    series.forEach(s => {
      const sName = s.name || s.key;
      (s.data || []).forEach(pt => {
        const xVal = pt[widget.xKey || widget.x_axis] || pt.year || pt.class || pt.name || pt.label;
        if (!mapByX[xVal]) mapByX[xVal] = { [widget.xKey || 'x']: xVal };
        mapByX[xVal][sName] = pt.value ?? pt.avg_percentage ?? pt.score;
      });
    });
    rawData = Object.values(mapByX);
  }

  const data = cleanChartData(rawData);
  const { xKey, series: resolvedSeries } = resolveChartKeys(data, widget);
  const barColor = widget.color || '#5EEAD4';

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
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  background: '#0F1729',
                  border: '1px solid #5EEAD4',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.85rem'
                }}
                formatter={(val, name) => [
                  typeof val === 'number' && val <= 100 && !String(name).toLowerCase().includes('count') && !String(name).toLowerCase().includes('total')
                    ? `${val}%`
                    : val,
                  name
                ]}
              />
              {resolvedSeries.length > 1 ? (
                <>
                  <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94A3B8' }} />
                  {resolvedSeries.map((s, idx) => (
                    <Bar key={s.key} dataKey={s.key} name={s.name || s.key} fill={s.color || palette[idx % palette.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </>
              ) : (
                <Bar dataKey={resolvedSeries[0]?.key || 'value'} fill={barColor} radius={[4, 4, 0, 0]} name={resolvedSeries[0]?.name || 'Score'} />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function LineChartWidget({ widget }) {
  let rawData = widget.data || [];
  let series = widget.series || [];
  const palette = ['#5EEAD4', '#F59E0B', '#A78BFA', '#34D399', '#FB7185', '#60A5FA'];

  // Normalize nested series if present
  if ((!rawData || rawData.length === 0) && series.length > 0 && series[0].data) {
    const mapByX = {};
    series.forEach(s => {
      const sName = s.name || s.key;
      (s.data || []).forEach(pt => {
        const xVal = pt[widget.xKey || widget.x_axis] || pt.year || pt.class || pt.name || pt.label;
        if (!mapByX[xVal]) mapByX[xVal] = { [widget.xKey || 'x']: xVal };
        mapByX[xVal][sName] = pt.value ?? pt.avg_percentage ?? pt.score;
      });
    });
    rawData = Object.values(mapByX);
  }

  const data = cleanChartData(rawData);
  const { xKey, series: resolvedSeries } = resolveChartKeys(data, widget);

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
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  background: '#0F1729',
                  border: '1px solid #F59E0B',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.85rem'
                }}
                formatter={(val, name) => [
                  typeof val === 'number' && val <= 100 && !String(name).toLowerCase().includes('count') && !String(name).toLowerCase().includes('total')
                    ? `${val}%`
                    : val,
                  name
                ]}
              />
              {resolvedSeries.length > 1 && (
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94A3B8' }} />
              )}
              {resolvedSeries.map((s, idx) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name || s.key}
                  stroke={s.color || palette[idx % palette.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: s.color || palette[idx % palette.length] }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function formatCell(cell) {
  if (cell === null || cell === undefined || cell === '') return '-';
  if (typeof cell === 'object') {
    return cell.value ?? cell.text ?? cell.label ?? JSON.stringify(cell);
  }
  return String(cell);
}

function getCellValue(row, col, colIndex) {
  if (row === null || row === undefined) return '-';

  // 1. Array of values
  if (Array.isArray(row)) {
    const cell = row[colIndex];
    return formatCell(cell);
  }

  if (typeof row !== 'object') {
    return formatCell(row);
  }

  // 2. Direct exact match
  if (row[col] !== undefined) {
    return formatCell(row[col]);
  }

  // 3. Case-insensitive match
  const colLower = String(col).toLowerCase().trim();
  const directKey = Object.keys(row).find(k => k.toLowerCase().trim() === colLower);
  if (directKey && row[directKey] !== undefined) {
    return formatCell(row[directKey]);
  }

  // 4. Alphanumeric normalized match (e.g. "2018 Avg (%)" matches "2018_avg" or "avg_2018")
  const colNorm = colLower.replace(/[^a-z0-9]/g, '');
  const normKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === colNorm);
  if (normKey && row[normKey] !== undefined) {
    return formatCell(row[normKey]);
  }

  // 5. Year matching (e.g. column "2018 Average" matches row key "2018" or "avg_2018")
  const yearMatch = col.match(/\b(20\d\d)\b/);
  if (yearMatch) {
    const yearKey = Object.keys(row).find(k => k.includes(yearMatch[1]));
    if (yearKey && row[yearKey] !== undefined) {
      return formatCell(row[yearKey]);
    }
  }

  // 6. Common semantic field matching
  if (colLower.includes('class') || colLower.includes('standard') || colLower.includes('grade')) {
    const classKey = Object.keys(row).find(k => /class|grade|std/i.test(k));
    if (classKey && row[classKey] !== undefined) return formatCell(row[classKey]);
  }
  if (colLower.includes('trend') || colLower.includes('obs') || colLower.includes('note') || colLower.includes('change')) {
    const trendKey = Object.keys(row).find(k => /trend|obs|note|change|diff/i.test(k));
    if (trendKey && row[trendKey] !== undefined) return formatCell(row[trendKey]);
  }

  // 7. Fallback by column index in the object's entries
  const rowValues = Object.values(row);
  if (colIndex !== undefined && colIndex < rowValues.length) {
    return formatCell(rowValues[colIndex]);
  }

  return '-';
}

function renderTableCell(value, colIndex) {
  const str = String(value);

  // Check if it's a trend delta (+13.0%, -18.6%, +0.2%)
  const isPositiveDelta = /^\+[\d.]+%?$/.test(str.trim());
  const isNegativeDelta = /^-[\d.]+%?$/.test(str.trim());

  if (isPositiveDelta) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        color: '#34D399',
        fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        <TrendingUp size={11} />
        {str}
      </span>
    );
  }

  if (isNegativeDelta) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        color: '#FB7185',
        fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        <TrendingDown size={11} />
        {str}
      </span>
    );
  }

  const isMono = typeof value === 'number' || str.includes('%') || /^\d+$/.test(str.trim());

  return (
    <span style={{
      color: colIndex === 0 ? '#5EEAD4' : '#E2E8F0',
      fontWeight: colIndex === 0 ? 600 : 400,
      fontFamily: isMono ? "'JetBrains Mono', monospace" : 'inherit'
    }}>
      {str}
    </span>
  );
}

function TableWidget({ widget }) {
  let columns = widget.columns || widget.headers || [];
  const rawRows = widget.rows || widget.data || [];

  // If columns are missing, extract from the first object
  if ((!columns || columns.length === 0) && rawRows.length > 0) {
    const first = rawRows[0];
    if (Array.isArray(first)) {
      columns = first.map((_, idx) => `Column ${idx + 1}`);
    } else if (typeof first === 'object' && first !== null) {
      columns = Object.keys(first).map(k => k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
  }

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
      <div style={{ overflowX: 'auto', maxHeight: '340px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}>
              {columns.map((col, idx) => (
                <th key={idx} style={{ padding: '10px 14px', color: '#94A3B8', fontWeight: 600 }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rawRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>
                  No records to display
                </td>
              </tr>
            ) : (
              rawRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                  }}
                >
                  {columns.map((col, cIdx) => {
                    const val = getCellValue(row, col, cIdx);
                    return (
                      <td
                        key={cIdx}
                        style={{
                          padding: '10px 14px',
                          fontSize: '0.85rem'
                        }}
                      >
                        {renderTableCell(val, cIdx)}
                      </td>
                    );
                  })}
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

  const kpis = widgets.filter(w => w.type === 'kpi');
  const others = widgets.filter(w => w.type !== 'kpi');

  const renderKpiSection = () => {
    if (kpis.length === 0) return null;
    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        width: '100%',
        marginBottom: others.length > 0 ? '18px' : 0
      }}>
        {kpis.map(w => (
          <div
            key={w.id || Math.random()}
            style={{
              flex: kpis.length === 1 ? '0 1 240px' : '1 1 180px',
              maxWidth: kpis.length === 1 ? '240px' : '260px',
              minWidth: '160px'
            }}
          >
            <KpiWidget widget={w} />
          </div>
        ))}
      </div>
    );
  };

  const renderOthers = () => {
    if (others.length === 0) return null;

    if (layout_type === 'featured_top' && others.length > 1) {
      const [featured, ...rest] = others;
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

    if (layout_type === 'side_by_side') {
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          width: '100%'
        }}>
          {others.map(renderWidget)}
        </div>
      );
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: others.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px',
        width: '100%'
      }}>
        {others.map(renderWidget)}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {renderKpiSection()}
      {renderOthers()}
    </div>
  );
}
