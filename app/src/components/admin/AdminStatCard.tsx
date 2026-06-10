import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  description?: string;
};

export default function AdminStatCard({
  label,
  value,
  description,
}: AdminStatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-gray-600">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}
