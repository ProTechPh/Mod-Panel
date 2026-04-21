import { View, Text } from "react-native";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";

interface GameEntry {
  game: string;
  count: number;
}

export function GameDistChart({ data }: { data: GameEntry[] }) {
  if (data.length === 0) {
    return (
      <View className="bg-card border border-border/50 rounded-xl p-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Keys by Game</Text>
        <Text className="text-sm text-muted-foreground text-center py-8">No data available</Text>
      </View>
    );
  }

  const chartW = 300;
  const chartH = 40 * data.length + 30;
  const padL = 70;
  const padR = 30;
  const padT = 10;
  const barH = 20;
  const gap = 20;
  const plotW = chartW - padL - padR;
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <View className="bg-card border border-border/50 rounded-xl p-4">
      <Text className="text-lg font-semibold text-foreground mb-3">Keys by Game</Text>
      <Svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}>
        {data.map((d, i) => {
          const y = padT + i * (barH + gap);
          const w = (d.count / maxCount) * plotW;
          return (
            <G key={i}>
              <SvgText x={padL - 5} y={y + barH / 2 + 4} textAnchor="end" fill="#888" fontSize={11}>
                {d.game}
              </SvgText>
              <Rect x={padL} y={y} width={w} height={barH} fill="#8b5cf6" rx={4} />
              <SvgText x={padL + w + 5} y={y + barH / 2 + 4} fill="#888" fontSize={10}>
                {d.count}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}