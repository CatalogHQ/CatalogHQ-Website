import { useEffect, useState } from "react";
import { adminRepository } from "@/lib/repositories";

export function useAdminBadges() {
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const badges = await adminRepository.getBadges();
        if (!cancelled) {
          setPendingVerifications(badges.pendingVerifications);
          setOpenTickets(badges.openTickets);
        }
      } catch {
        if (!cancelled) {
          setPendingVerifications(0);
          setOpenTickets(0);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { pendingVerifications, openTickets };
}
