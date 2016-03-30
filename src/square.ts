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

    export function init(config?: SquareConfig) {
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

    export function drawLatin(cells: square.LatinCell[]) {
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
