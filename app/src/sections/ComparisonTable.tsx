import { motion } from "framer-motion";
import { XCircle, CheckCheck } from "lucide-react";
import { COMPARISON_ROWS } from "@/data/plans";

export default function ComparisonTable() {
  return (
    <section id="comparison" className="bg-white section-padding">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h2 className="section-heading text-gray-900">
            DM selling vs a real store. The difference is clear.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10"
        >
          <div className="md:hidden rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-[1fr_4.25rem_4.25rem] bg-gray-50 border-b border-gray-200">
              <div className="px-4 py-3 text-xs font-semibold text-gray-600">
                Feature
              </div>
              <div className="px-2 py-3 text-center text-[10px] font-semibold leading-tight text-red-500 border-l border-gray-200">
                Selling in DMs
              </div>
              <div className="px-2 py-3 text-center text-[10px] font-semibold leading-tight text-whatsapp-green border-l border-gray-200">
                CatalogHQ
              </div>
            </div>
            {COMPARISON_ROWS.map((row, index) => (
              <div
                key={index}
                className={`grid grid-cols-[1fr_4.25rem_4.25rem] border-b border-gray-100 last:border-0 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/80"
                }`}
              >
                <div className="px-4 py-3.5 text-sm text-gray-700 leading-snug">
                  {row.feature}
                </div>
                <div className="flex items-center justify-center border-l border-gray-100">
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex items-center justify-center border-l border-gray-100">
                  <CheckCheck className="h-4 w-4 text-whatsapp-green" />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[50%]">
                    Feature
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-red-500 w-[25%]">
                    Selling in DMs
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-whatsapp-green w-[25%]">
                    CatalogHQ
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-3 px-4 text-sm text-gray-700 border-b border-gray-100">
                      {row.feature}
                    </td>
                    <td className="py-3 px-4 text-center border-b border-gray-100">
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center border-b border-gray-100">
                      <CheckCheck className="h-5 w-5 text-whatsapp-green mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
