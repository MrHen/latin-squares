/// <reference path="./Highlight.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./LatinHive.ts" />

namespace LatinSquare {
    export interface CellConfig {
        animationDuration?: number;
        id?: string;
        height?: number;
        reduced?: boolean;
        rootId?: string;
        size?: number;
        width?: number;
    }

    export interface Cell {
        i: number;
        x: number;
        y: number;
        guess: number;
        hint: boolean;
        invalid?: boolean;

        nodes: LatinSquare.Node[];
    }

    export class LatinCell {
        private static defaultConfig: CellConfig = {
            animationDuration: 500,
            height: 400,
            id: "#latin",
            reduced: true,
            rootId: "#latin-squares-container",
            size: 4,
            width: 400
        };

        private config: CellConfig;

        private svg: d3.Selection<Cell>;

        constructor(config?: CellConfig) {
            this.config = _.defaults({}, config, LatinCell.defaultConfig);

            this.svg = d3.select(this.config.rootId)
                .append("svg")
                .attr("id", this.config.id)
                .attr("width", this.config.width)
                .attr("height", this.config.height);
        }

        public build = () => {
            return d3.range(this.config.size * this.config.size).map((i) => {
                let cell: Cell = {
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
        };

        public drawLatin = (cells: LatinSquare.Cell[]) => {
            let height = this.config.height;
            let width = this.config.width;
            let size = this.config.size;

            let margin = 10;
            let maxWidth = (width - margin * 2) / size;
            let maxHeight = (height - margin * 2) / size;

            let cellSpacing = 2;
            let cellSize = Math.min(maxWidth, maxHeight) - cellSpacing;

            let offset = (x) => {
                return (x) * (cellSize + cellSpacing) + margin;
            };

            let cell = this.svg.selectAll(".cell")
                .data(cells);

            let newCells = cell.enter()
                .append("g")
                .attr("class", "cell")
                .attr("width", cellSize)
                .attr("height", cellSize)
                .attr("transform", (cell) => {
                    return "translate(" + offset(cell.x) + "," + offset(cell.y) + ")";
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
                .transition().duration(this.config.animationDuration)
                .attr("stroke", (cell) => {
                    return LatinSquare.getBorderColor(cell, LatinSquare.getHighlight());

                })
                .attr("fill", (cell) => {
                    return LatinSquare.getColor(cell, LatinSquare.getHighlight());
                });

            cell.select(".label")
                .text((cell) => {
                    let highlight = LatinSquare.getHighlight();
                    if (highlight && highlight.i === cell.i) {
                        return highlight.guess;
                    }

                    if (cell.guess) {
                        return cell.guess;
                    }

                    return null;
                })
                .attr("fill", (cell) => {
                    return LatinSquare.getTextColor(cell, LatinSquare.getHighlight());
                });

            return newCells;
        };
    }
}
