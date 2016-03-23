declare namespace d3 {
  interface D3Hive {
    link: () => D3HiveLink;
  }

  export interface D3HiveLink {
    angle: (_) => D3HiveLink;
    radius: (_) => D3HiveLink;
  }

  export interface D3HiveLink {
    (d: any, i: number): string;
  }

  export var hive: D3Hive;
}
