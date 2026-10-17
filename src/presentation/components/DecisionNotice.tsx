interface DecisionNoticeProps { message: string | null }

export function DecisionNotice({ message }: DecisionNoticeProps) {
  return message ? <p role="status" className="table-panel px-4 py-3 text-sm leading-6 text-gold">{message}</p> : null;
}
