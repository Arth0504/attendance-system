const StatCard = ({ label, value, icon, color, sub }) => (
  <div className={`rounded-2xl p-5 flex items-center gap-4 shadow-sm border ${color}`}>
    <div className="text-4xl">{icon}</div>
    <div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
    </div>
  </div>
);

export default StatCard;
