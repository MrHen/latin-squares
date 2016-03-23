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

        solution.nodes = _.sortBy(solution.nodes, "i");
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
