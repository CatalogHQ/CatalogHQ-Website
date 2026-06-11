import { useEffect, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { hasFeature } from "@/data/plans";
import {
  ABUJA_ZONE_PRESETS,
  LAGOS_ZONE_PRESETS,
  NATIONWIDE_ZONE_PRESET,
  type DeliveryZone,
} from "@/lib/delivery-zones";
import {
  vendorToolsRepository,
  type DiscountCode,
  type QuickReplyTemplate,
  type TeamMember,
} from "@/lib/repositories/vendor-tools-repository";
import { isApiMode } from "@/lib/use-api";

export default function VendorToolsCard() {
  const { user } = useAuth();
  const tier = user?.planTier ?? "starter";

  const [quickReplies, setQuickReplies] = useState<QuickReplyTemplate[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newCode, setNewCode] = useState({ code: "", value: "10", type: "percent" as const });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [replies, deliveryZones, codes, members] = await Promise.all([
          hasFeature(tier, "quick-reply-templates")
            ? vendorToolsRepository.getQuickReplies()
            : Promise.resolve([]),
          hasFeature(tier, "delivery-zones")
            ? vendorToolsRepository.getDeliveryZones()
            : Promise.resolve([]),
          hasFeature(tier, "discount-codes")
            ? vendorToolsRepository.listDiscountCodes()
            : Promise.resolve([]),
          hasFeature(tier, "staff-roles")
            ? vendorToolsRepository.listTeam()
            : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setQuickReplies(replies);
          setZones(deliveryZones);
          setDiscountCodes(codes);
          setTeam(members);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tier]);

  if (loading) return null;

  const saveQuickReplies = async (next: QuickReplyTemplate[]) => {
    setQuickReplies(next);
    await vendorToolsRepository.saveQuickReplies(next);
    toast.success("Quick replies saved.");
  };

  const saveZones = async (next: DeliveryZone[]) => {
    setZones(next);
    await vendorToolsRepository.saveDeliveryZones(next);
    toast.success("Delivery zones saved.");
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
  };

  return (
    <div className="space-y-6">
      {hasFeature(tier, "quick-reply-templates") && (
        <Card>
          <CardHeader>
            <CardTitle>Quick-reply templates</CardTitle>
            <CardDescription>
              Copy-paste blocks for WhatsApp: payment details, delivery time, store link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickReplies.map((template, index) => (
              <div key={template.id} className="space-y-2 rounded-lg border p-3">
                <Input
                  value={template.title}
                  onChange={(event) => {
                    const next = [...quickReplies];
                    next[index] = { ...template, title: event.target.value };
                    setQuickReplies(next);
                  }}
                  placeholder="Title"
                />
                <Textarea
                  value={template.body}
                  onChange={(event) => {
                    const next = [...quickReplies];
                    next[index] = { ...template, body: event.target.value };
                    setQuickReplies(next);
                  }}
                  placeholder="Message body"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyText(template.body)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setQuickReplies([
                    ...quickReplies,
                    {
                      id: crypto.randomUUID(),
                      title: "New template",
                      body: "",
                    },
                  ])
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add template
              </Button>
              <Button type="button" onClick={() => void saveQuickReplies(quickReplies)}>
                Save templates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasFeature(tier, "delivery-zones") && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery zones and fees</CardTitle>
            <CardDescription>
              Buyers see these fees at checkout for delivery orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void saveZones(LAGOS_ZONE_PRESETS)}
              >
                Lagos presets
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void saveZones(ABUJA_ZONE_PRESETS)}
              >
                Abuja presets
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void saveZones([NATIONWIDE_ZONE_PRESET])}
              >
                Nationwide
              </Button>
            </div>
            {zones.map((zone, index) => (
              <div key={zone.id} className="grid gap-2 sm:grid-cols-3">
                <Input
                  value={zone.name}
                  onChange={(event) => {
                    const next = [...zones];
                    next[index] = { ...zone, name: event.target.value };
                    setZones(next);
                  }}
                />
                <Input
                  type="number"
                  value={zone.fee}
                  onChange={(event) => {
                    const next = [...zones];
                    next[index] = {
                      ...zone,
                      fee: Number(event.target.value) || 0,
                    };
                    setZones(next);
                  }}
                />
              </div>
            ))}
            <Button type="button" onClick={() => void saveZones(zones)}>
              Save delivery zones
            </Button>
          </CardContent>
        </Card>
      )}

      {hasFeature(tier, "discount-codes") && isApiMode() && (
        <Card>
          <CardHeader>
            <CardTitle>Discount codes</CardTitle>
            <CardDescription>Run promos without negotiating in the DMs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="CODE"
                value={newCode.code}
                className="w-32 uppercase"
                onChange={(event) =>
                  setNewCode({ ...newCode, code: event.target.value.toUpperCase() })
                }
              />
              <Input
                type="number"
                placeholder="% off"
                className="w-24"
                value={newCode.value}
                onChange={(event) =>
                  setNewCode({ ...newCode, value: event.target.value })
                }
              />
              <Button
                type="button"
                onClick={async () => {
                  const created = await vendorToolsRepository.createDiscountCode({
                    code: newCode.code,
                    type: newCode.type,
                    value: Number(newCode.value),
                  });
                  setDiscountCodes([created, ...discountCodes]);
                  setNewCode({ code: "", value: "10", type: "percent" });
                  toast.success("Discount code created.");
                }}
              >
                Add code
              </Button>
            </div>
            {discountCodes.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>
                  <strong>{code.code}</strong>: {code.value}
                  {code.type === "percent" ? "%" : "₦"} off · used {code.useCount}
                  {code.maxUses ? `/${code.maxUses}` : ""}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={async () => {
                    await vendorToolsRepository.deleteDiscountCode(code.id);
                    setDiscountCodes(discountCodes.filter((c) => c.id !== code.id));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {hasFeature(tier, "staff-roles") && isApiMode() && (
        <Card>
          <CardHeader>
            <CardTitle>Team members</CardTitle>
            <CardDescription>
              Add helpers who can fulfil orders without changing store settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Helper phone (080...)"
                value={newMemberPhone}
                onChange={(event) => setNewMemberPhone(event.target.value)}
              />
              <Button
                type="button"
                onClick={async () => {
                  const member = await vendorToolsRepository.addTeamMember(
                    newMemberPhone,
                    "fulfiller",
                  );
                  setTeam([...team, member]);
                  setNewMemberPhone("");
                  toast.success("Team member added.");
                }}
              >
                Add
              </Button>
            </div>
            {team.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>
                  {member.phone} · {member.role}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await vendorToolsRepository.removeTeamMember(member.id);
                    setTeam(team.filter((m) => m.id !== member.id));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
