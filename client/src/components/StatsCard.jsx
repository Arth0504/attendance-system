const themes = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'bg-blue-100 text-blue-600',   border: 'border-blue-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-100' },
  green:  { bg: 'bg-emerald-50',text: 'text-emerald-700',icon: 'bg-emerald-100 text-emerald-600',border: 'border-emerald-100' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'bg-red-100 text-red-600',    border: 'border-red-100' },
  yellow: { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'bg-amber-100 text-amber-600',  border: 'border-amber-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'bg-violet-100 text-violet-600', border: 'border-violet-100' },
};

export default function StatsCard({ title, value, subtitle, color = 'indigo', icon, trend }) {
  const t = themes[color] || themes.indigo;
  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl border ${t.border} shadow-sm p-5 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className={`text-3xl font-bold mt-1.5 ${t.text}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`w-11 h-11 ${t.icon} rounded-xl flex items-center justify-center text-xl flex-shrink-0 ml-3`}>
            {icon}
          </div>
        )}
      </div>
      {/* Decorative accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${t.bg}`} />
    </div>
  );
}
