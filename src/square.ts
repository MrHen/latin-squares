namespace square {
    let latinSvg: d3.Selection<LatinCell>;

    export interface SquareConfig {
        id?: string;
        height?: number;
        reduced?: boolean;
        rootId?: string;
        size?: number;
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

    export class LatinSquare {
        private static defaultConfig: SquareConfig = {
            height: 400,
            id: "#latin",
            reduced: true,
            rootId: "#latin-squares-container",
            size: 4,
            width: 400
        };

        private config: SquareConfig;

        private svg: d3.Selection<LatinCell>;

        constructor(config?: SquareConfig) {
            this.config = _.defaults({}, config, LatinSquare.defaultConfig);

            this.svg = d3.select(this.config.rootId)
                .append("svg")
                .attr("id", this.config.id)
                .attr("width", this.config.width)
                .attr("height", this.config.height);
        }

        public build = () => {
            return d3.range(this.config.size * this.config.size).map((i) => {
                let cell: LatinCell = {
                    i: i,
                    x: i % this.config.size,
                    y: Math.floor(i / this.config.size),
                    guess: 0,
                    hint: false,
                    nodes: []
                };

                if (this.config.reduced) {
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

        public drawLatin = (cells: square.LatinCell[]) => {
            let height = +latinSvg.attr("height");
            let width = +latinSvg.attr("width");

            let margin = 10;
            let maxWidth = (width - margin * 2) / size;
            let maxHeight = (height - margin * 2) / size;

            let cellSpacing = 2;
            let cellSize = Math.min(maxWidth, maxHeight) - cellSpacing;

            let offset = (x) => {
                return (x) * (cellSize + cellSpacing) + margin;
            };

            let cell = latinSvg.selectAll(".cell")
                .data(cells);

            let newCells = cell.enter()
                .append("g")
                .attr("class", "cell")
                .attr("width", cellSize)
                .attr("height", cellSize)
                .attr("transform", (cell) => {
                    return "translate(" + offset(cell.x) + "," + offset(cell.y) + ")";
                })
                .on("mouseover", (cell) => {
                    highlight = createHighlight(cell);
                    draw();
                })
                .on("mouseout", (cell) => {
                    highlight = createHighlight();
                    draw();
                })
                .on("click", (cell) => {
                    console.log("cell debug", cell);

                    if (!cell.hint) {
                        cell.guess = (((cell.guess || 0) + 1) % (size + 1)) || null;

                        update();
                        highlight = createHighlight(cell);
                        draw();
                    }
                });

            newCells.append("rect")
                .attr("class", "box")
                .attr("fill", "white")
                .attr("stroke", "grey")
                .attr("width", cellSize)
                .attr("height", cellSize);

            newCells.append("text")
                .attr("class", "label")
                .attr("text-anchor", "middle")
                .style("font-size", cellSize * 0.3)
                .attr("dominant-baseline", "central")
                .attr("transform", (cell) => {
                    return "translate(" + cellSize / 2 + "," + cellSize / 2 + ")";
                });

            cell.select(".box")
                .transition().duration(duration)
                .attr("stroke", (cell) => {
                    return latinColors.getBorderColor(cell, highlight);

                })
                .attr("fill", (cell) => {
                    return latinColors.getColor(cell, highlight);
                });

            cell.select(".label")
                .text((cell) => {
                    if (highlight && highlight.i === cell.i) {
                        return highlight.guess;
                    }

                    if (cell.guess) {
                        return cell.guess;
                    }

                    return null;
                })
                .attr("fill", (cell) => {
                    return latinColors.getTextColor(cell, highlight);
                });
        }
    }
}
