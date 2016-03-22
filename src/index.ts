interface LatinCell {
  i: number;
  x: number;
  y: number;
  guess?: number;
  hint?: boolean;
  invalid?: boolean;
}

interface LatinNode {
  cell: LatinCell;
  guess: string;
}

interface LatinAxis {

}

interface LatinConstraint {
  node: LatinNode;
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
  s: number;
  valid: boolean;
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
let nodes = buildNodes(cells, size);

let constraints = buildConstraints(cells, size, nodes);
let dlx = solveWithDancingLinks(constraints, true);
let solutions = dlx.solutions;

// One for each cell + solution combination (64 at size 4 with 4 solutions)
let links: LatinLink[] = buildLinks(nodes, solutions);

let highlight = null;

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
    .angle(function(link) {
        return hiveConfig.angle(link.cell.i);
    })
    .radius(function(link) {
        return hiveConfig.radius(link.guess);
    });

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
    let picked = [];
    cells.forEach(function(cell) {
        if (cell.guess) {
            picked.push(cell);
        }

        cell.invalid = cell.guess && _.some(cells, function(other) {
            if (other.guess !== cell.guess) {
                return false;
            }

            if (other.i === cell.i) {
                return false;
            }

            return other.x === cell.x || other.y === cell.y;
        });
    });

    links.forEach(function(link) {
        let valid = _.every(picked, function(p) {
            return _.some(link.solution.nodes, function(node) {
                return node.guess === p.guess && node.cell.i === p.i;
            });
        });

        link.solution.valid = valid;
    });
}

let toggleOn = true;
function textToggle() {
    toggleOn = !toggleOn;
    d3.selectAll(".text").style("display", function() {
        return toggleOn ? "block" : "none";
    });
}

function drawHiveNodes(nodes: LatinNode[]) {
    let node = hiveSvg.selectAll(".node")
        .data(nodes);

    let newNodes = node.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(node) {
            return "rotate(" + degrees(hiveConfig.angle(node.cell.i)) + ")translate(" + hiveConfig.radius(node.guess) + ",0)";
        })
        .on("mouseover", function(node) {
            highlight = createHighlight(node);
            draw();
        })
        .on("mouseout", function(node) {
            highlight = createHighlight();
            draw();
        })
        .on("click", function(node) {
            console.log("node debug", node);
        });

    newNodes.append("circle")
        .attr("class", "inner")
        .style("r", 5)
        .style("stroke-width", 1.5);

    node.transition().duration(duration)
        .style("fill", function(node) {
            return getColor(node, highlight);
        })
        .style("stroke", function(node) {
            return getBorderColor(node, highlight);
        });
}

function drawHiveAxes(cells: LatinCell[]) {
    let line = hiveSvg.selectAll(".axis").data(cells);

    let newLine = line.enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", function(cell) {
            return "rotate(" + degrees(hiveConfig.angle(cell.i)) + ")";
        });

    newLine.append("line")
        .style("stroke-width", 1.5)
        .attr("x1", hiveConfig.radius.range()[0])
        .attr("x2", _.last<number>(hiveConfig.radius.range()));
    // .on("mouseover", function(cell) {
    //   highlight = createHighlight(cell);
    //   draw();
    // })
    // .on("mouseout", function(cell) {
    //   highlight = createHighlight();
    //   draw();
    // });

    line.selectAll("line")
        .transition().duration(duration)
        .style("stroke", function(cell) {
            return getBorderColor(cell, highlight);
        });
}

function drawHiveLinks(links: LatinLink[], cells) {
    let picked = _.filter(cells, "guess");

    let link = hiveSvg.selectAll(".link")
        .data(links, function(link) {
            return link.key;
        });

    link.enter()
        .append("path")
        .attr("class", "link")
        .attr("d", hiveConfig.link)
        .style("opacity", 0)
        .style("fill", "none")
        .style("stroke-width", 1.5)
        .style("stroke", function(link) {
            return color(link.solution.s);
        });

    link.exit()
        .transition().duration(duration)
        .style("opacity", 0)
        .remove();

    link.transition().duration(duration)
        .style("opacity", function(link) {
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

    let offset = function(x) {
        return (x) * (cellSize + cellSpacing) + margin;
    };

    let cell = latinSvg.selectAll(".cell")
        .data(cells);

    let newCells = cell.enter()
        .append("g")
        .attr("class", "cell")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("transform", function(cell) {
            return "translate(" + offset(cell.x) + "," + offset(cell.y) + ")";
        })
        .on("mouseover", function(cell) {
            highlight = createHighlight(cell);
            draw();
        })
        .on("mouseout", function(cell) {
            highlight = createHighlight();
            draw();
        })
        .on("click", function(cell) {
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
        .attr("transform", function(cell) {
            return "translate(" + cellSize / 2 + "," + cellSize / 2 + ")";
        });

    cell.select(".box")
        .transition().duration(duration)
        .attr("stroke", function(cell) {
            return getBorderColor(cell, highlight);

        })
        .attr("fill", function(cell) {
            return getColor(cell, highlight);
        });

    cell.select(".label")
        .text(function(cell) {
            if (highlight && highlight.i === cell.i) {
                return highlight.guess;
            }

            if (cell.guess) {
                return cell.guess;
            }

            return null;
        })
        .attr("fill", function(cell) {
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
    let offset = function(x) {
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
        .attr("transform", function(constraint) {
            return "translate(" + offset(_.indexOf(columnLabels, constraint[columnIndex]) + labelOffset) + "," + offset(_.indexOf(rowLabels, constraint[rowIndex]) + labelOffset) + ")";
        })
        .on("mouseover", function(constraint) {
            if (constraint.value) {
                highlight = createHighlight(constraint.node);
                draw();
            }
        })
        .on("mouseout", function(constraint) {
            if (highlight) {
                highlight = createHighlight();
                draw();
            }
        });

    pixel.transition().duration(duration)
        .style("stroke", function(constraint) {
            if (!constraint.value) {
                return borders["filler"];
            }

            return getBorderColor(constraint.node, highlight);
        })
        .style("fill", function(constraint) {
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
        .attr("transform", function(d, i) {
            return "translate(" + offset(labelOffset + i + 0.5) + "," + offset(labelOffset - 0.5) + ") rotate(270 0,0)";
        })
        .style("text-anchor", "start")
        .style("font-family", "monospace")
        .style("font-size", pixelSize)
        .text(function(d) {
            return d;
        });

    let rows = constraintsSvg.selectAll("text.row")
        .data(rowLabels);

    rows.enter()
        .append("text")
        .attr("class", "row")
        .attr("transform", function(d, i) {
            return "translate(" + offset(labelOffset - 0.5) + "," + offset(labelOffset + i + 0.5) + ")";
        })
        .style("text-anchor", "end")
        .style("font-family", "monospace")
        .style("font-size", pixelSize)
        .text(function(d) {
            return d;
        });
}

function buildCells(size, reduced) {
    return d3.range(size * size).map(function(i) {
        let cell: LatinCell = {
            i: i,
            x: i % size,
            y: Math.floor(i / size)
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

function buildNodes(cells, size) {
    let nodes = [];

    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i];
        cell.nodes = cell.nodes || [];

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

function buildLinks(nodes, solutions) {
    function key(d) {
        return d.x + ":" + d.y + ":" + d.guess;
    }

    let links = [];
    for (let s = 0; s < solutions.length; s++) {
        let solution = solutions[s];
        if (!solution.success) {
            continue;
        }

        solution["s"] = s;

        for (let i = 0; i < solution.nodes.length; i++) {
            let source = solution.nodes[i];
            let target = solution.nodes[(i + 1) % solution.nodes.length];

            let link = {
                key: s + ":" + key(source) + ":" + key(target),
                solution: solution,
                source: source,
                target: target
            };
            if (!source.solutions) {
                source.solutions = [];
            }
            source.solutions.push(solution);
            links.push(link);
        }
    }

    return links;
}

function createHighlight(target?) {
    // console.log("test", target);
    if (!target) {
        return null;
    }

    let highlight = {
        x: target.x,
        y: target.y,
        i: target.i,
        guess: target.guess || null,
        solutions: _.map(_.filter(target.solutions, "valid"), "s")
    };

    return highlight;
}

function getColorType(d, highlight) {
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

function getColor(d, highlight) {
    return colors[getColorType(d, highlight)];
}

function getBorderColor(d, highlight) {
    return borders[getColorType(d, highlight)];
}

function getTextColor(d, highlight) {
    return textColors[getColorType(d, highlight)];
}

function degrees(radians) {
    return radians / Math.PI * 180 - 90;
}

// Generate a suitable constraints matrix. Columns are the outer dimension
// (R1#1, R1#2, etc.) and rows are the inner dimension (R1C1#1, R1C1#2, etc.).
//
// Dancing links will convert these to a linked matrix but it is a little
// easier to grok what is happening if we split up the constraint generation
// and the linked matrix builder.
function buildConstraints(data, size, nodes) {
    let sparse = false;
    let matrix:LatinConstraintMatrix = {};

    // Use the existing data cells instead of three loops so we can prune hints
    nodes.forEach(function(node) {
        let i = node.cell.y + 1;
        let j = node.cell.x + 1;
        let k = node.guess;

        let key = "R" + i + "C" + j;
        let skip = node.cell.guess && node.cell.guess !== k;

        if (sparse && skip) {
            return;
        }

        let constraint;
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

                if (constraint.value || !constraint.sparse) {
                    matrix[constraint.outer][constraint.inner] = constraint;
                }

                constraint = {
                    outer: "C" + a + "#" + b,
                    inner: key + "#" + k,
                    node: node,
                    skip: skip,
                    value: (a === j && b === k)
                };

                if (constraint.value || !constraint.sparse) {
                    matrix[constraint.outer][constraint.inner] = constraint;
                }

                constraint = {
                    outer: "R" + a + "C" + b,
                    inner: key + "#" + k,
                    node: node,
                    skip: skip,
                    value: (a === i && b === j)
                };

                if (constraint.value || !constraint.sparse) {
                    matrix[constraint.outer][constraint.inner] = constraint;
                }
            }
        }

    });

    return matrix;
}

interface DlxLink {
  name?: string;
  down: DlxLink;
  up: DlxLink;
  left: DlxLink;
  right: DlxLink;
}

interface DlxTree {
  parent: DlxTree;
  children: DlxTree[];
  depth: number;
  node: LatinNode;
  success?: boolean;
}

////// DANCING LINKS
////// Adapted from http://taeric.github.io/DancingLinks.html
function solveWithDancingLinks(constraintMatrix, dlx_showSteps) {
    let dlx_headers: DlxLink;
    let dlx_solutions = [];
    let dlx_O = [];
    let dlx_current: DlxTree = {
        parent: null,
        children: [],
        depth: 0,
        node: null
    };

    function dlx_search(k) {
        let c, r;
        if (dlx_showSteps || dlx_headers.right === dlx_headers) {
            let solution = {
                nodes: _.sortBy(dlx_O, "i"),
                success: dlx_headers.right === dlx_headers
            };

            dlx_current.success = dlx_headers.right === dlx_headers;
            dlx_solutions.push(solution);
            if (dlx_headers.right === dlx_headers) {
                return;
            }
        }
        c = dlx_smallestColumn();
        dlx_cover(c);
        r = c.down;
        while (r !== c) {
            dlx_current = {
                parent: dlx_current,
                children: [],
                depth: k,
                node: r.node
            };
            dlx_current.parent.children.push(dlx_current);

            dlx_O.push(r.node);
            r = r.right;
            while (r.col !== c) {
                dlx_cover(r.col);
                r = r.right;
            }
            dlx_search(k + 1);
            r = r.left;
            while (r.col !== c) {
                dlx_uncover(r.col);
                r = r.left;
            }
            r = r.down;
            dlx_O.pop();
            dlx_current = dlx_current.parent;
        }
        dlx_uncover(c);
    }

    function dlx_cover(c) {
        let r = c.down;
        c.right.left = c.left;
        c.left.right = c.right;
        while (r !== c) {
            r = r.right;
            while (r.col !== c) {
                r.up.down = r.down;
                r.down.up = r.up;
                r.col.size--;
                r = r.right;
            }
            r = r.down;
        }
    }

    function dlx_uncover(c) {
        let r = c.up;
        c.right.left = c;
        c.left.right = c;
        while (r !== c) {
            r = r.left;
            while (r.col !== c) {
                r.up.down = r;
                r.down.up = r;
                r.col.size++;
                r = r.left;
            }
            r = r.up;
        }
    }

    function dlx_smallestColumn() {
        let h, c, s = Number.MAX_VALUE;
        h = dlx_headers.right;
        while (h !== dlx_headers) {
            if (h.size < s) {
                c = h;
                s = c.size;
            }
            h = h.right;
        }
        return c;
    }

    function dlx_initializeHeaders() {
        let i, j;

        let rowTrackers = {};

        dlx_headers = {
            name: "root",
            right: null,
            left: null,
            up: null,
            down: null
        };
        dlx_headers.right = dlx_headers;
        dlx_headers.left = dlx_headers;

        for (i in constraintMatrix) {
            let curCol = {
                name: i,
                right: dlx_headers,
                left: dlx_headers.left,
                size: 0,
                down: null,
                up: null,
            };

            dlx_headers.left.right = curCol;
            dlx_headers.left = curCol;
            curCol.up = curCol;
            curCol.down = curCol;

            for (j in constraintMatrix[i]) {
                let constraint = constraintMatrix[i][j];
                let value = constraint.value;
                if (!value || constraint.skip) {
                    continue;
                }
                let curRow = {
                    name: j,
                    node: constraint.node,
                    right: null,
                    left: null,
                    down: curCol,
                    up: curCol.up,
                    col: curCol
                };
                curCol.size++;
                curCol.up.down = curRow;
                curCol.up = curRow;

                let prevRow = rowTrackers[j];
                if (!prevRow) {
                    curRow.right = curRow;
                    curRow.left = curRow;

                    rowTrackers[j] = curRow;
                } else {
                    curRow.right = prevRow;
                    curRow.left = prevRow.left;
                    prevRow.left.right = curRow;
                    prevRow.left = curRow;
                }
            }
        }
    }

    dlx_initializeHeaders();
    // console.log("headers ", dlx_headers);
    dlx_search(0);

    console.log("current", dlx_current);
    return {
        tree: dlx_current,
        solutions: dlx_solutions
    };
}
