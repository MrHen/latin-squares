/// <reference path="./Highlight.ts" />
/// <reference path="./LatinCell.ts" />
/// <reference path="./LatinHive.ts" />
/// <reference path="./LatinConstraint.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./Dlx.ts" />
var LatinSquare;
(function (LatinSquare) {
    var width = 400;
    var height = 600;
    var side = Math.min(width, height);
    var radius = side / 2;
    var duration = 300;
    var size = 4;
    var reduced = true;
    var latinSquare = new LatinSquare.LatinCell({
        animationDuration: duration,
        height: side / 2,
        reduced: reduced,
        rootId: "#latin-squares-container",
        size: size,
        width: side / 2
    });
    var latinHive = new LatinSquare.LatinHive({
        animationDuration: duration,
        height: side,
        innerRadius: 20,
        outerRadius: Math.min(height, width) / 2 - 20,
        rootId: "#hive-chart-container",
        size: size,
        width: side
    });
    var latinConstraints = new LatinSquare.LatinConstraint({
        animationDuration: duration,
        height: height,
        rootId: "#constraints-container",
        size: size,
        width: width
    });
    // One for each cell (n^2 = 16 at size 4)
    var cells = latinSquare.build();
    // One for each cell + guess combination (n^3 = 64 at size 4)
    var nodes = latinHive.buildNodes(cells);
    // Latin Squares have 4 constraints per node:
    //
    // - RyCx#g is the full list of possible guesses (n^3 = 64 at size 4)
    // - Cx#g limits each column to only one of each guess (n^2)
    // - Ry#g limits each row to only one of each guess (n^2)
    // - CxRy limits each cell to only one guess (n^2)
    //
    // The largest constraint forms the row index (RyCx#g) and each of the
    // others are "appended" to each other to form columns (Cx#g, Ry#g, CxRy).
    //
    // Therefore, each node will have 3 * n^2 possible columns and n^3 possible
    // rows for a total of 3 * n^2 * n^3 entries in the matrix. (= 3072 at size
    // 4).
    //
    // The good news is that most of these are irrelevant. The solver only needs
    // to process row/column constraint that are consistent -- and we know that
    // each row matches exactly one from each of the other constraints. Instead
    // of 3 * n^2 possible columns, the solver only looks at 3 possible columns.
    // Therefore, the solver will only see 3 * n^3 (= 192 at size 4).
    var constraints = latinConstraints.build(nodes);
    var solver = new Dlx.Solver(constraints, true);
    var result = solver.solve();
    var solutions = result.solutions;
    // One for each cell + solution combination (64 at size 4 with 4 solutions)
    var links = latinHive.buildLinks(nodes, solutions);
    update();
    draw();
    // Our helper classes will send back new entries after drawing in case extra
    // setup is needed. We do our event handling here so the inner classes don't
    // have to know about the draw/update details.
    function draw() {
        latinHive.drawLinks(links, cells);
        latinHive.drawAxes(cells);
        latinHive.drawNodes(nodes)
            .on("mouseover", function (node) {
            LatinSquare.setHighlight(node);
            draw();
        })
            .on("mouseout", function (node) {
            LatinSquare.setHighlight();
            draw();
        });
        latinSquare.drawLatin(cells)
            .on("mouseover", function (cell) {
            LatinSquare.setHighlight(cell);
            draw();
        })
            .on("mouseout", function (cell) {
            LatinSquare.setHighlight();
            draw();
        })
            .on("click", function (cell) {
            if (!cell.hint) {
                cell.guess = (((cell.guess || 0) + 1) % (size + 1)) || null;
                update();
                LatinSquare.setHighlight(cell);
                draw();
            }
        });
        latinConstraints.draw(constraints)
            .on("mouseover", function (constraint) {
            if (constraint.value) {
                LatinSquare.setHighlight(constraint.node);
                draw();
            }
        })
            .on("mouseout", function (constraint) {
            if (LatinSquare.getHighlight()) {
                LatinSquare.setHighlight();
                draw();
            }
        });
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
})(LatinSquare || (LatinSquare = {}));
var toggleOn = true;
function textToggle() {
    toggleOn = !toggleOn;
    d3.selectAll(".text").style("display", function () {
        return toggleOn ? "block" : "none";
    });
    d3.selectAll(".chart").style("display", function () {
        return toggleOn ? "block" : "inline-block";
    });
}
