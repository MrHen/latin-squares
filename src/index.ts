/// <reference path="./square.ts" />
/// <reference path="./LatinHive.ts" />
/// <reference path="./builder.ts" />
/// <reference path="./dlx.ts" />
/// <reference path="./colors.ts" />

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

let duration = 300;

let size = 4;
let reduced = true;

let latinSquare = new square.LatinSquare({
    height: side / 2,
    rootId: "#latin-squares-container",
    width: side / 2
});

let latinHive = new LatinHive.LatinHive({
    height: side,
    rootId: "#hive-chart-container",
    width: side
});

let latinConstraints = new Latin.LatinConstraint({
    height: height,
    rootId: "#constraints-container",
    width: width
});

// One for each cell (n^2 = 16 at size 4)
let cells: square.LatinCell[] = latinSquare.build();

// One for each cell + guess combination (n^3 = 64 at size 4)
let nodes: LatinHive.LatinNode[] = latinHive.buildNodes(cells);

let constraints: Latin.ConstraintMatrix = Latin.buildConstraints(size, nodes);
let result = dlx.solveWithDancingLinks(constraints, true);
let solutions: LatinHive.LatinSolution[] = result.solutions;

// One for each cell + solution combination (64 at size 4 with 4 solutions)
let links: LatinHive.LatinLink[] = latinHive.buildLinks(nodes, solutions);

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
    latinHive.drawLinks(links, cells);
    latinHive.drawAxes(cells);

    latinHive.drawNodes(nodes)
        .on("mouseover", (node) => {
            highlight = createHighlight(node);
            draw();
        })
        .on("mouseout", (node) => {
            highlight = createHighlight();
            draw();
        });

    latinSquare.drawLatin(cells)
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

    latinConstraints.drawConstraints(constraints);
}

// Rerun the solution filtering
function update() {
    let picked: square.LatinCell[] = [];
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

    d3.selectAll(".chart").style("display", () => {
        return toggleOn ? "block" : "inline-block";
    });
}

function createHighlight(target?: LatinHive.LatinNode | square.LatinCell): LatinHighlight {
    if (!target) {
        return null;
    }

    let highlight: LatinHighlight = {
        x: target.x,
        y: target.y,
        i: target.i,
        guess: target.guess || null,
        solutions: _.map<LatinHive.LatinSolution, number>(_.filter<LatinHive.LatinSolution>(target["solutions"], "valid"), "s")
    };

    return highlight;
}

function degrees(radians: number) {
    return radians / Math.PI * 180 - 90;
}
