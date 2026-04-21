import { View, Text } from "react-native";
import Svg, { Line, Rect, Text as SvgText, G, Circle, Path } from "react-native-svg";

interface ActivityPoint {
  date: string;
  created: number;
  expired: number;
}

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  if (data.length === 0) {
    return (
      <View className="bg-card border border-border/50 rounded-xl p-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Key Activity (30 Days)</Text>
        <Text className="text-sm text-muted-foreground text-center py-8">No data available</Text>
      </View>
    );
  }

  const chartW = 300;
  const chartH = 180;
  const padL = 35;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxVal = Math.max(...data.flatMap((d) => [d.created, d.expired]), 1);
  const yTicks = 4;
  const yStep = maxVal / yTicks;

  const toX = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * plotW;
  const toY = (v: number) => padT + plotH - (v / maxVal) * plotH;

  const createdPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.created) }));
  const expiredPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.expired) }));

  const createdLine = createdPoints.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const expiredLine = expiredPoints.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");

  const createdArea =
    createdLine +
    ` L${createdPoints[createdPoints.length - 1].x},${padT + plotH} L${createdPoints[0].x},${padT + plotH} Z`;
  const expiredArea =
    expiredLine +
    ` L${expiredPoints[expiredPoints.length - 1].x},${padT + plotH} L${expiredPoints[0].x},${padT + plotH} Z`;

  return (
    <View className="bg-card border border-border/50 rounded-xl p-4">
      <Text className="text-lg font-semibold text-foreground mb-3">Key Activity (30 Days)</Text>
      <Svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}>
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = Math.round(i * yStep);
          const y = toY(val);
          return (
            <G key={i}>
              <Line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#333" strokeDasharray="3,3" opacity={0.3} />
              <SvgText x={padL - 5} y={y + 4} textAnchor="end" fill="#888" fontSize={10}>
                {val}
              </SvgText>
            </G>
          );
        })}

        <Path d={createdArea} fill="rgba(59,130,246,0.15)" />
        <Path d={createdLine} fill="none" stroke="#3b82f6" strokeWidth={2} />

        <Path d={expiredArea} fill="rgba(234,179,8,0.1)" />
        <Path d={expiredLine} fill="none" stroke="#eab308" strokeWidth={2} />

        {data.map((d, i) => {
          if (data.length <= 10 || i % Math.ceil(data.length / 8) === 0) {
            return (
              <SvgText key={i} x={toX(i)} y={chartH - 5} textAnchor="middle" fill="#888" fontSize={9}>
                {d.date.substring(5)}
              </SvgText>
            );
          }
          return null;
        })}
      </Svg>
      <View className="flex-row justify-center gap-4 mt-2">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-0.5 bg-blue-500" />
          <Text className="text-xs text-muted-foreground">Created</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-0.5 bg-yellow-500" />
          <Text className="text-xs text-muted-foreground">Expired</Text>
        </View>
      </View>
    </View>
  );
}