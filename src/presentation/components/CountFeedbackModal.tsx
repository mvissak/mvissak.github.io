"use client";

import type { CountFeedbackChoice } from "@/application/trainerState";
import { ControlButton } from "@/presentation/components/ControlButton";
import { ModalFrame } from "@/presentation/components/ModalFrame";
import type { TrainerViewCountFeedback } from "@/presentation/view-models/buildCountFeedbackViewModel";

interface CountFeedbackModalProps {
  feedback: TrainerViewCountFeedback | null;
  onChoose: (choice: CountFeedbackChoice) => void;
}

export function CountFeedbackModal({ feedback, onChoose }: CountFeedbackModalProps) {
  if (!feedback) return null;
  return (
    <ModalFrame titleId="count-feedback-title">
      <p className="text-xs uppercase tracking-wide text-gold-muted">Count lesson</p>
      <h2 id="count-feedback-title" className="mt-3 font-display text-3xl text-success">{feedback.title}</h2>
      <p className="mt-4 text-base leading-7 text-ivory/90">{feedback.summary}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-card border border-gold-muted/50 px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-gold-muted">Basic strategy</dt>
          <dd className="mt-2 font-semibold text-ivory">{feedback.basicLabel}</dd>
        </div>
        <div className="rounded-card border border-success/60 bg-felt-dark px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-success">At true count {feedback.trueCountLabel}</dt>
          <dd className="mt-2 font-semibold text-success">{feedback.preferredLabel}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-gold">{feedback.explanation}</p>
      <p className="mt-3 text-sm leading-6 text-ivory/85">{feedback.rationale}</p>
      <p className="mt-3 text-sm leading-6 text-ivory/70">Keeping the chart move adds no mistake. The count-based play aims for a better long-run return.</p>
      <div className="mt-6 grid gap-3 mobile:grid-cols-2">
        <ControlButton className={feedback.keepLabel ? "" : "mobile:col-span-2"} variant="primary" onClick={() => onChoose(feedback.primaryChoice)}>{feedback.primaryLabel}</ControlButton>
        {feedback.keepLabel ? <ControlButton onClick={() => onChoose("original")}>{feedback.keepLabel}</ControlButton> : null}
      </div>
    </ModalFrame>
  );
}
