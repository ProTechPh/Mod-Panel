import { View, Text, Platform } from "react-native";
import Svg, { Line, Rect, Text as SvgText, G, Circle, Path } from "react-native-svg";

interface TrendPoint {
  date: string;
  count: number;
}

interface KeyTrendsChartProps {
  data: TrendPoint[];
}

export function KeyTrendsChart({ data }: KeyTrendsChartProps) {
  if (data.length === 0) {
    return (
      <View className="bg-card border border-border/50 rounded-xl p-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Key Creation Trends</Text>
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

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const yTicks = 4;
  const yStep = maxCount / yTicks;

  const points = data.map((d, i) => ({
    x: padL + (i / Math.max(data.length - 1, 1)) * plotW,
    y: padT + plotH - (d.count / maxCount) * plotH,
  }));

  const linePath = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(" ");

  const areaPath =
    linePath + ` L${points[points.length - 1].x},${padT + plotH} L${points[0].x},${padT + plotH} Z`;

  return (
    <View className="bg-card border border-border/50 rounded-xl p-4">
      <Text className="text-lg font-semibold text-foreground mb-3">Key Creation Trends</Text>
      <Svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}>
        <Path d={areaPath} fill="rgba(59,130,246,0.15)" />
        <Path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} />

        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
        ))}

        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = Math.round(i * yStep);
          const y = padT + plotH - (val / maxCount) * plotH;
          return (
            <G key={i}>
              <Line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#333" strokeDasharray="3,3" opacity={0.3} />
              <SvgText x={padL - 5} y={y + 4} textAnchor="end" fill="#888" fontSize={10}>
                {val}
              </SvgText>
            </G>
          );
        })}

        {data.map((d, i) => {
          if (data.length <= 10 || i % Math.ceil(data.length / 8) === 0) {
            const x = padL + (i / Math.max(data.length - 1, 1)) * plotW;
            return (
              <SvgText key={i} x={x} y={chartH - 5} textAnchor="middle" fill="#888" fontSize={9}>
                {d.date.substring(5)}
              </SvgText>
            );
          }
          return null;
        })}
      </Svg>
    </View>
  );
}