/// <reference path="./LatinHive.ts" />

interface LatinConstraint {
    inner: string;
    node: LatinHive.LatinNode;
    outer: string;
    skip: boolean;
    value: boolean;
}

interface LatinConstraintMatrix {
    [outer: string]: {
        [inner: string]: LatinConstraint;
    };
}

interface LatinSolution {
    nodes: LatinHive.LatinNode[];
    s?: number;
    success: boolean;
    valid?: boolean;
}

// Generate a suitable constraints matrix. Columns are the outer dimension
// (R1#1, R1#2, etc.) and rows are the inner dimension (R1C1#1, R1C1#2, etc.).
//
// Dancing links will convert these to a linked matrix but it is a little
// easier to grok what is happening if we split up the constraint generation
// and the linked matrix builder.
function buildConstraints(size: number, nodes: LatinHive.LatinNode[]) {
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
