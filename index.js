/// <reference path="./builder.ts" />
/// <reference path="./dlx.ts" />
/// <reference path="./colors.ts" />
/// <reference path="./draw.ts" />
var width = 400;
var height = 600;
var side = Math.min(width, height);
var radius = side / 2;
var duration = 300;
var hiveSvg = d3.select("#hive-chart-container")
    .append("svg")
    .attr("width", side)
    .attr("height", side)
    .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");
var latinSvg = d3.select("#latin-squares-container").append("svg").attr("id", "#latin")
    .attr("width", side / 2)
    .attr("height", side / 2);
var constraintsSvg = d3.select("#constraints-container").append("svg").attr("id", "#constraints")
    .attr("width", width)
    .attr("height", height);
var size = 4;
var reduced = true;
// One for each cell (n^2 = 16 at size 4)
var cells = buildCells(size, reduced);
// One for each cell + guess combination (n^3 = 64 at size 4)
var nodes = buildNodes(cells, size);
var constraints = buildConstraints(size, nodes);
var result = dlx.solveWithDancingLinks(constraints, true);
var solutions = result.solutions;
// One for each cell + solution combination (64 at size 4 with 4 solutions)
var links = buildLinks(nodes, solutions);
var highlight = null;
var hiveConfig = {
    innerRadius: 20,
    outerRadius: Math.min(height, width) / 2 - 20,
    guessExtent: [1, size],
    angle: d3.scale.ordinal().domain(d3.range(cells.length + 1)).rangePoints([0, 2 * Math.PI]),
    radius: null,
    link: null
};
hiveConfig.radius = d3.scale.ordinal().domain(d3.range(hiveConfig.guessExtent[0] - 1, hiveConfig.guessExtent[1] + 1)).rangePoints([hiveConfig.innerRadius, hiveConfig.outerRadius]);
hiveConfig.link = d3.hive.link()
    .angle(function (link) { return hiveConfig.angle(link.cell.i); })
    .radius(function (link) { return hiveConfig.radius(link.guess); });
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
    var picked = [];
    cells.forEach(function (cell) {
        if (cell.guess) {
            picked.push(cell);
        }
        cell.invalid = cell.guess && _.some(cells, function (other) {
            if (other.guess !== cell.guess) {
                return false;
            }
            if (other.i === cell.i) {
                return false;
            }
            return other.x === cell.x || other.y === cell.y;
        });
    });
    links.forEach(function (link) {
        var valid = _.every(picked, function (p) {
            return _.some(link.solution.nodes, function (node) {
                return node.guess === p.guess && node.cell.i === p.i;
            });
        });
        link.solution.valid = valid;
    });
}
var toggleOn = true;
function textToggle() {
    toggleOn = !toggleOn;
    d3.selectAll(".text").style("display", function () {
        return toggleOn ? "block" : "none";
    });
}
function createHighlight(target) {
    if (!target) {
        return null;
    }
    var highlight = {
        x: target.x,
        y: target.y,
        i: target.i,
        guess: target.guess || null,
        solutions: _.map(_.filter(target["solutions"], "valid"), "s")
    };
    return highlight;
}
function degrees(radians) {
    return radians / Math.PI * 180 - 90;
}
