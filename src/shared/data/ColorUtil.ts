export function ciToRgb(ci: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [-0.4, [0.608, 0.722, 1.000]],
    [-0.2, [0.608, 0.722, 1.000]],
    [ 0.0, [0.784, 0.847, 1.000]],
    [ 0.3, [1.000, 1.000, 1.000]],
    [ 0.6, [1.000, 0.957, 0.878]],
    [ 1.0, [1.000, 0.824, 0.502]],
    [ 1.5, [1.000, 0.702, 0.278]],
    [ 2.0, [1.000, 0.376, 0.251]],
  ];
  if (ci <= stops[0][0]) return stops[0][1];
  if (ci >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 1; i < stops.length; i++) {
    if (ci <= stops[i][0]) {
      const t = (ci - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
      const a = stops[i - 1][1], b = stops[i][1];
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      ];
    }
  }
  return [1, 1, 1];
}
