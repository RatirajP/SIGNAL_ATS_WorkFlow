import React from "react";
import { Check, X, Plus } from "lucide-react";

const VARIANTS = {
  matched: { className: "chip--matched", Icon: Check },
  missing: { className: "chip--missing", Icon: X },
  extra: { className: "chip--extra", Icon: Plus },
};

export default function SkillChip({ label, variant = "matched" }) {
  const { className, Icon } = VARIANTS[variant] || VARIANTS.matched;
  return (
    <span className={`chip ${className}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}
