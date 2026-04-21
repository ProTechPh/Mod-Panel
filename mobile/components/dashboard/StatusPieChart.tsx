import { View, Text } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

interface StatusEntry {
  status: string;
  count: number;
}

const COLORS = ["#22c55e", "#eab308", "#ef4444", "#6b7280"];

export function StatusPieChart({ data }: { data: StatusEntry[] }) {
  const filtered = data.filter((d) => d.count > 0);

  if (filtered.length === 0) {
    return (
      <View className="bg-card border border-border/50 rounded-xl p-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Key Status Distribution</Text>
        <Text className="text-sm text-muted-foreground text-center py-8">No data available</Text>
      </View>
    );
  }

  const total = filtered.reduce((sum, d) => sum + d.count, 0);
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 80;
  const innerR = 45;

  let angle = -Math.PI / 2;
  const slices = filtered.map((d, i) => {
    const sliceAngle = (d.count / total) * Math.PI * 2;
    const startAngle = angle;
    const endAngle = angle + sliceAngle;
    angle = endAngle;

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const midAngle = (startAngle + endAngle) / 2;

    const outerStart = { x: cx + outerR * Math.cos(startAngle), y: cy + outerR * Math.sin(startAngle) };
    const outerEnd = { x: cx + outerR * Math.cos(endAngle), y: cy + outerR * Math.sin(endAngle) };
    const innerStart = { x: cx + innerR * Math.cos(endAngle), y: cy + innerR * Math.sin(endAngle) };
    const innerEnd = { x: cx + innerR * Math.cos(startAngle), y: cy + innerR * Math.sin(startAngle) };

    const path = [
      `M${outerStart.x},${outerStart.y}`,
      `A${outerR},${outerR} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}`,
      `L${innerStart.x},${innerStart.y}`,
      `A${innerR},${innerR} 0 ${largeArc} 0 ${innerEnd.x},${innerEnd.y}`,
      "Z",
    ].join(" ");

    const labelR = (outerR + innerR) / 2;
    const labelPos = {
      x: cx + labelR * Math.cos(midAngle),
      y: cy + labelR * Math.sin(midAngle),
    };

    return { path, color: COLORS[i % COLORS.length], label: d.status, count: d.count, labelPos };
  });

  return (
    <View className="bg-card border border-border/50 rounded-xl p-4">
      <Text className="text-lg font-semibold text-foreground mb-3">Key Status Distribution</Text>
      <View className="items-center">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s, i) => (
            <G key={i}>
              <Path d={s.path} fill={s.color} />
              {s.count > 0 && (
                <SvgText
                  x={s.labelPos.x}
                  y={s.labelPos.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize={11}
                  fontWeight="bold"
                >
                  {s.count}
                </SvgText>
              )}
            </G>
          ))}
        </Svg>
      </View>
      <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {slices.map((s, i) => (
          <View key={i} className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <Text className="text-xs text-muted-foreground">
              {s.label} ({s.count})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}