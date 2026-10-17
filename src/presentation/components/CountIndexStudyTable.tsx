import type { TrainerViewCardCountingReference } from "@/presentation/view-models/buildCardCountingReferenceViewModel";

interface CountIndexStudyTableProps {
  rows: TrainerViewCardCountingReference["studyRows"];
}

export function CountIndexStudyTable({ rows }: CountIndexStudyTableProps) {
  return (
    <details className="table-panel mt-5 px-4 py-4">
      <summary className="cursor-pointer font-semibold text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
        Supported Hi-Lo true-count indices
      </summary>
      <p className="mt-3 text-sm leading-6 text-ivory/85">
        These Hi-Lo plays are accepted alongside basic strategy when their index applies.
        Stand, double, or split at the threshold or higher. For hard-total stand indices,
        hitting below the threshold is also accepted. Double and split must be legal;
        hard totals exclude soft hands and pair guidance takes priority. Insurance is
        accepted at true count +3 or higher. Blackjack payout changes betting value;
        these non-natural hand plays use the same index rules at 6:5 and 3:2.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm leading-6 text-ivory/85">
          <caption className="sr-only">Supported Hi-Lo deviations by true count</caption>
          <thead>
            <tr className="border-b border-gold-muted/30 text-gold">
              <th scope="col" className="px-3 py-2">True count</th>
              <th scope="col" className="px-3 py-2">Index plays</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.threshold} className="border-b border-gold-muted/20 align-top">
                <th scope="row" className="whitespace-nowrap px-3 py-3 font-semibold text-gold">{row.threshold}</th>
                <td className="px-3 py-3">
                  <ul>{row.plays.map((play) => <li key={play}>{play}</li>)}</ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
