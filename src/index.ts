/// <reference path="./dlx.ts" />

interface LatinCell {
  i: number;
  x: number;
  y: number;
  guess: number;
  hint: boolean;
  invalid?: boolean;

  nodes: LatinNode[];
}

interface LatinNode {
  i: number;
  x: number;
  y: number;
  guess: number;

  cell: LatinCell;

  solutions: LatinSolution[];
}

interface LatinAxis {

}

interface LatinConstraint {
  inner: string;
  node: LatinNode;
  outer: string;
  skip: boolean;
  value: boolean;
}

interface LatinConstraintMatrix {
  [outer: string]: {
    [inner: string]: LatinConstraint;
  };
}

interface LatinLink {
  key: string;
  solution: LatinSolution;
}

interface LatinSolution {
  nodes: LatinNode[];
  s?: number;
  success: boolean;
  valid?: boolean;
}

interface LatinHighlight {
  x: number;
  y: number;
  i: number;
  guess: number;
  solutions: number[];
}

let width = 400;
let height = 600;
let side = Math.min(width, height);
let radius = side / 2;

// http://colorbrewer2.org/?type=qualitative&scheme=Pastel2&n=4
let colors = {
    "i-neighbor": "#cbd5e8",
    "x-neighbor": "#b3e2cd",
    "y-neighbor": "#fdcdac",
    "non-neighbor": "lightgrey",

    "filler": "white",

    "focus": "#444",
    "bad": "#e41a1c",
    "hint": "black",
    "picked": "#666",
    "invalid": "white",
    "valid": "lightgrey"
};

let borders = {
    "i-neighbor": "black",
    "x-neighbor": "black",
    "y-neighbor": "black",
    "non-neighbor": "lightgrey",

    "filler": "white",

    "focus": "black",
    "bad": "black",
    "hint": "black",
    "picked": "black",
    "invalid": "lightgrey",
    "valid": "black"
};

let textColors = {
    "i-neighbor": "black",
    "x-neighbor": "black",
    "y-neighbor": "black",
    "non-neighbor": "black",

    "filler": "black",

    "focus": "lightgrey",
    "bad": "black",
    "hint": "lightgrey",
    "picked": "lightgrey",
    "invalid": "black",
    "valid": "black"
};

let color = d3.scale.category10<number>();
let duration = 300;

let hiveSvg = d3.select("#hive-chart-container")
    .append("svg")
    .attr("width", side)
    .attr("height", side)
    .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

let latinSvg = d3.select("#latin-squares-container").append("svg").attr("id", "#latin")
    .attr("width", side / 2)
    .attr("height", side / 2);

let constraintsSvg = d3.select("#constraints-container").append("svg").attr("id", "#constraints")
    .attr("width", width)
    .attr("height", height);

let size = 4;
let reduced = true;

// One for each cell (n^2 = 16 at size 4)
let cells: LatinCell[] = buildCells(size, reduced);

// One for each cell + guess combination (n^3 = 64 at size 4)
let nodes: LatinNode[] = buildNodes(cells, size);

let constraints: LatinConstraintMatrix = buildConstraints(size, nodes);
let result = dlx.solveWithDancingLinks(constraints, true);
let solutions: LatinSolution[] = result.solutions;

// One for each cell + solution combination (64 at size 4 with 4 solutions)
let links: LatinLink[] = buildLinks(nodes, solutions);

let highlight: LatinHighlight = null;

interface HiveConfig {
  innerRadius: number;
  outerRadius: number;
  guessExtent: [number, number];
  angle: any;
  radius: any;
  link: d3.D3HiveLink;
}

let hiveConfig: HiveConfig = {
    innerRadius: 20,
    outerRadius: Math.min(height, width) / 2 - 20,
    guessExtent: [1, size],
    angle: d3.scale.ordinal<number, number>().domain(d3.range(cells.length + 1)).rangePoints([0, 2 * Math.PI]),
    radius: null,
    link: null
};

hiveConfig.radius = d3.scale.ordinal<number, number>().domain(d3.range(hiveConfig.guessExtent[0] - 1, hiveConfig.guessExtent[1] + 1)).rangePoints([hiveConfig.innerRadius, hiveConfig.outerRadius]);

hiveConfig.link = d3.hive.link()
    .angle((link) => hiveConfig.angle(link.cell.i))
    .radius((link) => hiveConfig.radius(link.guess));

update();
draw();

function draw() {
    drawHiveLinks(links, cells);
    drawHiveAxes(cells);
    drawHiveNodes(nodes);
    drawLatin(cells);
    drawConstraints(constraints);
}

// Rerun the solution filtering
function update() {
    let picked: LatinCell[] = [];
    cells.forEach((cell) => {
        if (cell.guess) {
            picked.push(cell);
        }

        cell.invalid = cell.guess && _.some(cells, (other) => {
            if (other.guess !== cell.guess) {
                return false;
            }

            if (other.i === cell.i) {
                return false;
            }

            return other.x === cell.x || other.y === cell.y;
        });
    });

    links.forEach((link) => {
        let valid = _.every(picked, (p) => {
            return _.some(link.solution.nodes, (node) => {
                return node.guess === p.guess && node.cell.i === p.i;
            });
        });

        link.solution.valid = valid;
    });
}

let toggleOn = true;
function textToggle() {
    toggleOn = !toggleOn;
    d3.selectAll(".text").style("display", () => {
        return toggleOn ? "block" : "none";
    });
}

function drawHiveNodes(nodes: LatinNode[]) {
    let node = hiveSvg.selectAll(".node")
        .data(nodes);

    let newNodes = node.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (node) => {
            return "rotate(" + degrees(hiveConfig.angle(node.cell.i)) + ")translate(" + hiveConfig.radius(node.guess) + ",0)";
        })
        .on("mouseover", (node) => {
            highlight = createHighlight(node);
            draw();
        })
        .on("mouseout", (node) => {
            highlight = createHighlight();
            draw();
        });

    newNodes.append("circle")
        .attr("class", "inner")
        .style("r", 5)
        .style("stroke-width", 1.5);

    node.transition().duration(duration)
        .style("fill", (node) => getColor(node, highlight))
        .style("stroke", (node) => getBorderColor(node, highlight));
}

function drawHiveAxes(cells: LatinCell[]) {
    let line = hiveSvg.selectAll(".axis").data(cells);

    let newLine = line.enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", (cell) => {
            return "rotate(" + degrees(hiveConfig.angle(cell.i)) + ")";
        });

    newLine.append("line")
        .style("stroke-width", 1.5)
        .attr("x1", hiveConfig.radius.range()[0])
        .attr("x2", _.last<number>(hiveConfig.radius.range()));

    line.selectAll("line")
        .transition().duration(duration)
        .style("stroke", (cell) => getBorderColor(cell, highlight));
}

function drawHiveLinks(links: LatinLink[], cells: LatinCell[]) {
    let picked = _.filter(cells, "guess");

    let link = hiveSvg.selectAll(".link")
        .data(links, (link) => link.key);

    link.enter()
        .append("path")
        .attr("class", "link")
        .attr("d", hiveConfig.link)
        .style("opacity", 0)
        .style("fill", "none")
        .style("stroke-width", 1.5)
        .style("stroke", (link) => color(link.solution.s));

    link.exit()
        .transition().duration(duration)
        .style("opacity", 0)
        .remove();

    link.transition().duration(duration)
        .style("opacity", (link) => {
            if (!link.solution.valid) {
                return 0;
            }

            if (highlight && highlight.solutions.length) {
                let match = _.includes(highlight.solutions, link.solution.s);
                return match ? 1 : 0;
            }

            return 1;
        });
}

function drawLatin(cells: LatinCell[]) {
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
            return getBorderColor(cell, highlight);

        })
        .attr("fill", (cell) => {
            return getColor(cell, highlight);
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
            return getTextColor(cell, highlight);
        });
}

function drawConstraints(constraints: LatinConstraintMatrix) {
    let height = constraintsSvg.attr("height");
    let width = constraintsSvg.attr("width");

    let columnIndex = "outer";
    let rowIndex = "inner";

    let pixelColor = d3.scale.linear<string, number>()
        .domain([0, 1])
        .range([colors["invalid"], colors["valid"]]);

    let flat: LatinConstraint[] = _.flatten<any>(_.map(_.values(constraints), _.values));
    let columnLabels: string[] = _.uniq(_.map<LatinConstraint, string>(flat, columnIndex)).sort();
    let rowLabels: string[] = _.uniq(_.map<LatinConstraint, string>(flat, rowIndex)).sort();

    let labelOffset = 4;
    let maxWidth = +width / (columnLabels.length + 2 + labelOffset);
    let maxHeight = +height / (rowLabels.length + 2 + labelOffset);

    let pixelSpacing = 1;
    let pixelSize = Math.min(maxWidth, maxHeight) - pixelSpacing;
    let labelSize = pixelSize * labelOffset;
    let offset = (x) => {
        return (x + 1) * (pixelSize + pixelSpacing);
    };

    let realWidth = (pixelSize + pixelSpacing) * (columnLabels.length + 2 + labelOffset);
    let realHeight = (pixelSize + pixelSpacing) * (rowLabels.length + 2 + labelOffset);

    constraintsSvg.attr("width", realWidth)
        .attr("height", realHeight);

    let pixel = constraintsSvg.selectAll("rect.pixel")
        .data(_.filter(flat, "value"));

    pixel.enter()
        .append("rect")
        .attr("class", "pixel")
        .attr("width", pixelSize)
        .attr("height", pixelSize)
        .style("stroke-width", 0.25)
        .attr("transform", (constraint) => {
            return "translate(" + offset(_.indexOf(columnLabels, constraint[columnIndex]) + labelOffset) + "," + offset(_.indexOf(rowLabels, constraint[rowIndex]) + labelOffset) + ")";
        })
        .on("mouseover", (constraint) => {
            if (constraint.value) {
                highlight = createHighlight(constraint.node);
                draw();
            }
        })
        .on("mouseout", (constraint) => {
            if (highlight) {
                highlight = createHighlight();
                draw();
            }
        });

    pixel.transition().duration(duration)
        .style("stroke", (constraint) => {
            if (!constraint.value) {
                return borders["filler"];
            }

            return getBorderColor(constraint.node, highlight);
        })
        .style("fill", (constraint) => {
            if (!constraint.value) {
                return colors["filler"];
            }

            return getColor(constraint.node, highlight);
        });

    let columns = constraintsSvg.selectAll("text.column")
        .data(columnLabels);

    columns.enter()
        .append("text")
        .attr("class", "column")
        .attr("transform", (d, i) => {
            return "translate(" + offset(labelOffset + i + 0.5) + "," + offset(labelOffset - 0.5) + ") rotate(270 0,0)";
        })
        .style("text-anchor", "start")
        .style("font-family", "monospace")
        .style("font-size", pixelSize)
        .text((d) => d);

    let rows = constraintsSvg.selectAll("text.row")
        .data(rowLabels);

    rows.enter()
        .append("text")
        .attr("class", "row")
        .attr("transform", (d, i) => {
            return "translate(" + offset(labelOffset - 0.5) + "," + offset(labelOffset + i + 0.5) + ")";
        })
        .style("text-anchor", "end")
        .style("font-family", "monospace")
        .style("font-size", pixelSize)
        .text((d) => d);
}

function buildCells(size: number, reduced: boolean) {
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

function buildNodes(cells: LatinCell[], size: number) {
    let nodes: LatinNode[] = [];

    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i];

        for (let guess = 1; guess <= size; guess++) {
            let node = {
                i: cell.i,
                x: cell.x,
                y: cell.y,
                cell: cell,
                guess: guess,
                solutions: []
            };
            cell.nodes.push(node);
            nodes.push(node);
        }
    }

    return nodes;
}

function buildLinks(nodes: LatinNode[], solutions: LatinSolution[]) {
    function key(d) {
        return d.x + ":" + d.y + ":" + d.guess;
    }

    let links: LatinLink[] = [];
    for (let s = 0; s < solutions.length; s++) {
        let solution = solutions[s];
        if (!solution.success) {
            continue;
        }

        solution.s = s;

        for (let i = 0; i < solution.nodes.length; i++) {
            let source = solution.nodes[i];
            let target = solution.nodes[(i + 1) % solution.nodes.length];

            let link = {
                key: s + ":" + key(source) + ":" + key(target),
                solution: solution,
                source: source,
                target: target
            };
            source.solutions.push(solution);
            links.push(link);
        }
    }

    return links;
}

function createHighlight(target?: LatinNode | LatinCell): LatinHighlight {
    if (!target) {
        return null;
    }

    let highlight: LatinHighlight = {
      x: target.x,
      y: target.y,
      i: target.i,
      guess: target.guess || null,
      solutions: _.map<LatinSolution, number>(_.filter<LatinSolution>(target["solutions"], "valid"), "s")
    };

    return highlight;
}

function getColorType(d, highlight: LatinHighlight) {
    let isNeighborX = highlight && highlight.x === d.x;
    let isNeighborY = highlight && highlight.y === d.y;
    let isNeighborI = highlight && highlight.i === d.i;
    let isNeighborGuess = highlight && highlight.guess && highlight.guess === d.guess;

    let isHint = (d.cell && d.cell.hint) || d.hint;
    let isChange = highlight && d.cell && d.cell.guess && d.cell.guess !== highlight.guess;
    let isInvalid = d.solutions && !_.filter(d.solutions, "valid").length;
    let isBad = d.invalid || (d.cell && d.cell.invalid && d.cell.guess === d.guess);

    // if d.cell is missing, we have to "aggregate" results
    let isCellGuess = !d.cell && d.guess;

    if (isBad) {
        return "bad";
    }

    if (isNeighborI) {
        if (isNeighborGuess) {
            return "focus";
        }
    }

    if (d.cell && d.cell.guess === d.guess) {
        if (!highlight) {
            if (isHint) {
                return "hint";
            }
            return "picked";
        }

        if (isNeighborGuess) {
            if (isNeighborX) {
                return "bad";
            }
            if (isNeighborY) {
                return "bad";
            }
        }
    }

    if (isInvalid) {
        return "invalid";
    }

    if (!highlight) {
        if (isCellGuess) {
            if (isHint) {
                return "hint";
            }

            return "picked";
        }

        return "valid";
    }

    if (isNeighborI) {
        if (!d.cell) {
            return "focus";
        }

        if (isChange) {
            return "bad";
        }

        return "i-neighbor";
    }

    if (isNeighborX) {
        if (isNeighborGuess && isCellGuess) {
            return "bad";
        }
        return "x-neighbor";
    }

    if (isNeighborY) {
        if (isNeighborGuess && isCellGuess) {
            return "bad";
        }
        return "y-neighbor";
    }

    return "non-neighbor";
}

function getColor(d, highlight: LatinHighlight): string {
    return colors[getColorType(d, highlight)];
}

function getBorderColor(d, highlight: LatinHighlight): string {
    return borders[getColorType(d, highlight)];
}

function getTextColor(d, highlight: LatinHighlight): string {
    return textColors[getColorType(d, highlight)];
}

function degrees(radians: number) {
    return radians / Math.PI * 180 - 90;
}

// Generate a suitable constraints matrix. Columns are the outer dimension
// (R1#1, R1#2, etc.) and rows are the inner dimension (R1C1#1, R1C1#2, etc.).
//
// Dancing links will convert these to a linked matrix but it is a little
// easier to grok what is happening if we split up the constraint generation
// and the linked matrix builder.
function buildConstraints(size: number, nodes: LatinNode[]) {
    let sparse = false;
    let matrix: LatinConstraintMatrix = {};

    // Use the existing data cells instead of three loops so we can prune hints
    nodes.forEach((node) => {
        let i = node.cell.y + 1;
        let j = node.cell.x + 1;
        let k = node.guess;

        let key = "R" + i + "C" + j;
        let skip = node.cell.guess && node.cell.guess !== k;

        if (sparse && skip) {
            return;
        }

        let constraint: LatinConstraint;
        for (let a = 1; a <= size; a++) {
            for (let b = 1; b <= size; b++) {
                matrix["R" + a + "#" + b] = matrix["R" + a + "#" + b] || {};
                matrix["C" + a + "#" + b] = matrix["C" + a + "#" + b] || {};
                matrix["R" + a + "C" + b] = matrix["R" + a + "C" + b] || {};

                constraint = {
                    outer: "R" + a + "#" + b,
                    inner: key + "#" + k,
                    node: node,
                    skip: skip,
                    value: (a === i && b === k)
                };

                if (constraint.value || !sparse) {
                    matrix[constraint.outer][constraint.inner] = constraint;
                }

                constraint = {
                    outer: "C" + a + "#" + b,
                    inner: key + "#" + k,
                    node: node,
                    skip: skip,
                    value: (a === j && b === k)
                };

                if (constraint.value || !sparse) {
                    matrix[constraint.outer][constraint.inner] = constraint;
                }

                constraint = {
                    outer: "R" + a + "C" + b,
                    inner: key + "#" + k,
                    node: node,
                    skip: skip,
                    value: (a === i && b === j)
                };

                if (constraint.value || !sparse) {
                    matrix[constraint.outer][constraint.inner] = constraint;
                }
            }
        }

    });

    return matrix;
}
