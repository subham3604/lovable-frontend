import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UsageProgressCardProps {
  title: string;
  used: number;
  limit: number;
  description?: string;
  unit?: string;
}

export const UsageProgressCard = ({
  title,
  used,
  limit,
  description,
  unit = "",
}: UsageProgressCardProps) => {
  const percentage = (used / limit) * 100;
  const remaining = limit - used;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          {title}
          <span className="text-sm font-normal text-slate-400">
            {used.toLocaleString()} / {limit.toLocaleString()}
            {unit && ` ${unit}`}
          </span>
        </CardTitle>
        <CardDescription>
          {percentage.toFixed(1)}% used
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress
          value={percentage}
          className="h-2"
        />
        <p className="text-xs text-slate-400 mt-4">
          {remaining.toLocaleString()} {unit} remaining
        </p>
      </CardContent>
    </Card>
  );
};
