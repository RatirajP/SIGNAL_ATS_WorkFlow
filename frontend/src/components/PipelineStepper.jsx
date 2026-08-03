import React from "react";
import { Check, X } from "lucide-react";

const STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired"];

export default function PipelineStepper({ status }) {
  if (status === "Rejected") {
    return (
      <div className="pipeline-stepper">
        {STAGES.map((stage, i) => (
          <div key={stage} className={`pipeline-step ${i === 0 ? "pipeline-step--rejected" : ""}`}>
            {i > 0 && <div className="pipeline-step__line" />}
            <div className="pipeline-step__dot">{i === 0 ? <X size={14} /> : i + 1}</div>
            <span className="pipeline-step__label">{stage}</span>
          </div>
        ))}
        <p className="text-body" style={{ color: "var(--danger)", marginTop: 8 }}>
          This candidate was rejected from the pipeline.
        </p>
      </div>
    );
  }

  const currentIndex = STAGES.indexOf(status);

  return (
    <div className="pipeline-stepper">
      {STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <div
            key={stage}
            className={`pipeline-step ${done ? "pipeline-step--done" : ""} ${current ? "pipeline-step--current" : ""}`}
          >
            {i > 0 && <div className="pipeline-step__line" />}
            <div className="pipeline-step__dot">{done ? <Check size={14} /> : i + 1}</div>
            <span className="pipeline-step__label">{stage}</span>
          </div>
        );
      })}
    </div>
  );
}
