namespace square {
  let latinSvg: d3.Selection<LatinCell>;

  export interface SquareConfig {
    id?: string;
    height?: number;
    rootId?: string;
    width?: number;
  }

  export interface LatinCell {
      i: number;
      x: number;
      y: number;
      guess: number;
      hint: boolean;
      invalid?: boolean;

      nodes: LatinNode[];
  }

  let defaultConfig: SquareConfig = {
    rootId: "#latin-squares-container",
    height: 400,
    id: "#latin",
    width: 400
  };

  export function createSvg(config?: SquareConfig) {
    config = _.defaults({}, config, defaultConfig);

    latinSvg = d3.select(config.rootId)
        .append("svg")
        .attr("id", config.id)
        .attr("width", config.width)
        .attr("height", config.height);

    return latinSvg;
  }

  export function buildCells(size: number, reduced: boolean) {
      return d3.range(size * size).map((i) => {
          let cell: LatinCell = {
              i: i,
              x: i % size,
              y: Math.floor(i / size),
              guess: 0,
              hint: false,
              nodes: []
          };

          if (reduced) {
              if (cell.x === 0) {
                  cell.hint = true;
                  cell.guess = cell.y + 1;
              }
              if (cell.y === 0) {
                  cell.hint = true;
                  cell.guess = cell.x + 1;
              }
          }

          return cell;
      });
  }
}
