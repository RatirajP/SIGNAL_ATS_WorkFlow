import React from "react";

export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="empty-state animate-in">
      {Icon && (
        <div className="empty-state__icon">
          <Icon size={24} />
        </div>
      )}
      <p className="empty-state__title">{title}</p>
      {hint && <p className="empty-state__hint">{hint}</p>}
      {action}
    </div>
  );
}
