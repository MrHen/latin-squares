namespace square {
  let latinSvg: d3.Selection<LatinCell>;

  export interface SquareConfig {
    id?: string;
    height?: number;
    rootId?: string;
    width?: number;
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
}
