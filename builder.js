function buildCells(size, reduced) {
    return d3.range(size * size).map(function (i) {
        var cell = {
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
function buildNodes(cells, size) {
    var nodes = [];
    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        for (var guess = 1; guess <= size; guess++) {
            var node = {
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
    var links = [];
    for (var s = 0; s < solutions.length; s++) {
        var solution = solutions[s];
        if (!solution.success) {
            continue;
        }
        solution.nodes = _.sortBy(solution.nodes, "i");
        solution.s = s;
        for (var i = 0; i < solution.nodes.length; i++) {
            var source = solution.nodes[i];
            var target = solution.nodes[(i + 1) % solution.nodes.length];
            var link = {
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
function buildConstraints(size, nodes) {
    var sparse = false;
    var matrix = {};
    // Use the existing data cells instead of three loops so we can prune hints
    nodes.forEach(function (node) {
        var i = node.cell.y + 1;
        var j = node.cell.x + 1;
        var k = node.guess;
        var key = "R" + i + "C" + j;
        var skip = node.cell.guess && node.cell.guess !== k;
        if (sparse && skip) {
            return;
        }
        var constraint;
        for (var a = 1; a <= size; a++) {
            for (var b = 1; b <= size; b++) {
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
