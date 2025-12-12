import React from "react";
import { View } from "react-native";
import Svg, { G, Circle } from "react-native-svg";

const DonutChart = ({
  radius = 40,
  strokeWidth = 16,
  data = [
    { value: 29000, color: "#210F47" },
    { value: 45000, color: "#22C55E" },
    { value: 15000, color: "#D32F2F" },
    { value: 10000, color: "#FF9F3F" },
  ],
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  let cumulativePercent = 0;

  return (
    <View style={{ alignItems: "center", justifyContent: "center",marginTop:10, }}>
      <Svg width={radius * 2} height={radius * 2}>
        <G rotation="-90" origin={`${radius}, ${radius}`}>

          {data.map((item, index) => {
            const percent = item.value / total;
            const strokeDashoffset =
              circumference - circumference * percent;

            const rotation = cumulativePercent * 360;
            cumulativePercent += percent;

            return (
              <Circle
                key={index}
                cx={radius}
                cy={radius}
                r={normalizedRadius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                rotation={rotation}
                origin={`${radius}, ${radius}`}
                // 🔥 Rounded hataya → Flat edges
                strokeLinecap="butt"
              />
            );
          })}

        </G>
      </Svg>
    </View>
  );
};

export default DonutChart;
