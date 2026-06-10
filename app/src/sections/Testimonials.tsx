import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCheck } from "lucide-react";

const testimonials = [
  {
    initials: "AO",
    name: "Amaka O.",
    city: "Lagos",
    text: "I used to spend my whole day confirming transfers and answering the same questions. Now I wake up and orders are already paid and waiting. I cannot go back to the old way.",
  },
  {
    initials: "TA",
    name: "Tunde A.",
    city: "Abuja",
    text: "My customers started asking if I have a proper website because my store looked so professional. My sales have tripled since I set this up.",
  },
  {
    initials: "CE",
    name: "Chidinma E.",
    city: "Port Harcourt",
    text: "I ran a 6-hour flash sale on a Saturday and made 180,000 naira before evening. The countdown timer made people act fast.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-gray-50 section-padding">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className="section-heading text-gray-900 text-center"
        >
          Nigerian vendors already growing.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
            >
              <Card className="bg-whatsapp-light border-0 rounded-3xl relative h-full">
                <CardContent className="p-5 sm:p-6">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-whatsapp-dark text-white text-sm font-semibold">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-tight">
                            {testimonial.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {testimonial.city}
                          </p>
                        </div>
                        <Badge className="flex-shrink-0 bg-whatsapp-green text-white text-[10px] px-2 py-0.5 rounded-full font-medium hover:bg-whatsapp-green">
                          Verified
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <p className="text-sm text-gray-700 leading-relaxed mt-4">
                    {testimonial.text}
                  </p>

                  {/* Footer with read receipt */}
                  <div className="flex justify-end items-center gap-1 mt-4">
                    <span className="text-[10px] text-gray-400">
                      10:{30 + index * 2} AM
                    </span>
                    <CheckCheck className="h-3.5 w-3.5 text-whatsapp-bubble" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
