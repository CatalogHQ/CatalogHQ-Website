import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import {
  COMPARISON_ROWS,
  COMPARISON_SCORES,
  type ComparisonCell,
} from "@/data/plans";
import { cn } from "@/lib/utils";

const COLUMN_HEADERS = [
  {
    key: "whatsappTexting",
    label: "WhatsApp texting",
    pillClass: "border-gray-500/60 text-gray-300",
  },
  {
    key: "whatsappCatalog",
    label: "WhatsApp catalog",
    pillClass: "border-whatsapp-green/60 text-whatsapp-green",
  },
  {
    key: "cataloghq",
    label: "CatalogHQ",
    pillClass: "border-violet-400/60 text-violet-300",
  },
] as const;

const PARTIAL_LABELS: Record<
  Extract<ComparisonCell, "partial" | "basic" | "moderate">,
  string
> = {
  partial: "Partial",
  basic: "Basic",
  moderate: "Moderate",
};

function ComparisonCellValue({ value }: { value: ComparisonCell }) {
  if (value === "yes") {
    return (
      <Check
        className="mx-auto h-4 w-4 text-whatsapp-green sm:h-5 sm:w-5"
        aria-label="Yes"
      />
    );
  }

  if (value === "no") {
    return (
      <X
        className="mx-auto h-4 w-4 text-gray-500 sm:h-5 sm:w-5"
        aria-label="No"
      />
    );
  }

  return (
    <span className="text-xs font-medium text-gray-400 sm:text-sm">
      {PARTIAL_LABELS[value]}
    </span>
  );
}

function ScoreValue({
  score,
  highlight,
}: {
  score: string;
  highlight?: boolean;
}) {
  if (highlight) {
    return (
      <span className="inline-flex rounded-full border border-violet-400/50 bg-violet-500/15 px-3 py-1 text-sm font-semibold text-violet-200">
        {score}
      </span>
    );
  }

  return <span className="text-sm font-medium text-gray-400">{score}</span>;
}

export default function ComparisonTable() {
  return (
    <section id="comparison" className="bg-whatsapp-bg section-padding">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h2 className="section-heading text-white">
            DM selling vs a real store. The difference is clear.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 sm:mt-10"
        >
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 [-webkit-overflow-scrolling:touch]">
            <table className="min-w-[640px] w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="w-[34%] py-4 pl-4 pr-3 text-left text-sm font-semibold text-gray-400 sm:pl-6">
                    Feature
                  </th>
                  {COLUMN_HEADERS.map((column) => (
                    <th
                      key={column.key}
                      className="w-[22%] px-2 py-4 text-center"
                    >
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-tight sm:px-3 sm:text-xs",
                          column.pillClass,
                        )}
                      >
                        {column.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      "border-b border-white/5",
                      index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]",
                    )}
                  >
                    <td className="py-3.5 pl-4 pr-3 text-sm text-gray-300 sm:pl-6">
                      {row.feature}
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <ComparisonCellValue value={row.whatsappTexting} />
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <ComparisonCellValue value={row.whatsappCatalog} />
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <ComparisonCellValue value={row.cataloghq} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-white/[0.03]">
                  <td className="py-4 pl-4 pr-3 text-sm font-semibold text-white sm:pl-6">
                    Score
                  </td>
                  <td className="px-2 py-4 text-center">
                    <ScoreValue score={COMPARISON_SCORES.whatsappTexting} />
                  </td>
                  <td className="px-2 py-4 text-center">
                    <ScoreValue score={COMPARISON_SCORES.whatsappCatalog} />
                  </td>
                  <td className="px-2 py-4 text-center">
                    <ScoreValue
                      score={COMPARISON_SCORES.cataloghq}
                      highlight
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-gray-500 sm:hidden">
            Swipe sideways to compare all columns
          </p>
        </motion.div>
      </div>
    </section>
  );
}
