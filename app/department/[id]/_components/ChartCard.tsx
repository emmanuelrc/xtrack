import { Card, CardContent } from "@/components/ui/card";

type Point = { month: number; total_mSv: number };

export default function ChartCard({ data, hint }: { data: Point[]; hint?: string }) {
  const max = Math.max(1, ...data.map((d) => d.total_mSv));
  const barW = 18;
  const gap = 10;
  const height = 140;
  const width = data.length * (barW + gap) + gap;

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-4">
        <svg width={width} height={height} className="w-full h-[160px]">
          {data.map((d, i) => {
            const h = Math.round((d.total_mSv / max) * (height - 24));
            const x = gap + i * (barW + gap);
            const y = height - h - 16;
            return <rect key={d.month} x={x} y={y} width={barW} height={h} rx={4} className="fill-green-600/70" />;
          })}
          <line x1={0} y1={height - 16} x2={width} y2={height - 16} className="stroke-gray-300" />
        </svg>
        {hint && <div className="text-xs text-right text-gray-600 -mt-2">{hint}</div>}
      </CardContent>
    </Card>
  );
}
