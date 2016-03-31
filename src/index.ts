/// <reference path="./Highlight.ts" />
/// <reference path="./LatinCell.ts" />
/// <reference path="./LatinHive.ts" />
/// <reference path="./LatinConstraint.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./Dlx.ts" />

namespace LatinSquare {

    let width = 400;
    let height = 600;
    let side = Math.min(width, height);
    let radius = side / 2;

    let duration = 300;

    let size = 4;
    let reduced = true;

    let latinSquare = new LatinSquare.LatinCell({
        animationDuration: duration,
        height: side / 2,
        rootId: "#latin-squares-container",
        width: side / 2
    });

    let latinHive = new LatinSquare.LatinHive({
        animationDuration: duration,
        height: side,
        innerRadius: 20,
        outerRadius: Math.min(height, width) / 2 - 20,
        rootId: "#hive-chart-container",
        width: side
    });

    let latinConstraints = new LatinSquare.LatinConstraint({
        animationDuration: duration,
        height: height,
        rootId: "#constraints-container",
        width: width
    });

    // One for each cell (n^2 = 16 at size 4)
    let cells: LatinSquare.Cell[] = latinSquare.build();

    // One for each cell + guess combination (n^3 = 64 at size 4)
    let nodes: LatinSquare.Node[] = latinHive.buildNodes(cells);

    let constraints: LatinSquare.ConstraintMatrix = latinConstraints.build(size, nodes);
    let solver = new Dlx.Solver(constraints, true);
    let result = solver.solve();
    let solutions: LatinSquare.Solution[] = result.solutions;

    // One for each cell + solution combination (64 at size 4 with 4 solutions)
    let links: LatinSquare.Link[] = latinHive.buildLinks(nodes, solutions);

    update();
    draw();

    function draw() {
        latinHive.drawLinks(links, cells);
        latinHive.drawAxes(cells);

        latinHive.drawNodes(nodes)
            .on("mouseover", (node) => {
                LatinSquare.setHighlight(node);
                draw();
            })
            .on("mouseout", (node) => {
                LatinSquare.setHighlight();
                draw();
            });

        latinSquare.drawLatin(cells)
            .on("mouseover", (cell) => {
                LatinSquare.setHighlight(cell);
                draw();
            })
            .on("mouseout", (cell) => {
                LatinSquare.setHighlight();
                draw();
            })
            .on("click", (cell) => {
                console.log("cell debug", cell);

                if (!cell.hint) {
                    cell.guess = (((cell.guess || 0) + 1) % (size + 1)) || null;

                    update();
                    LatinSquare.setHighlight(cell);
                    draw();
                }
            });

        latinConstraints.draw(constraints)
            .on("mouseover", (constraint) => {
                if (constraint.value) {
                    LatinSquare.setHighlight(constraint.node);
                    draw();
                }
            })
            .on("mouseout", (constraint) => {
                if (LatinSquare.getHighlight()) {
                    LatinSquare.setHighlight();
                    draw();
                }
            });
    }

    // Rerun the solution filtering
    function update() {
        let picked: LatinSquare.Cell[] = [];
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

}
