// Adapted from http://taeric.github.io/DancingLinks.html
var Dlx;
(function (Dlx) {
    var Solver = (function () {
        function Solver(constraintMatrix, showSteps) {
            var _this = this;
            if (showSteps === void 0) { showSteps = false; }
            this.solutions = [];
            this.currentSolution = [];
            this.currentTree = {
                parent: null,
                children: [],
                depth: 0,
                node: null
            };
            this.solve = function () {
                _this.initialize();
                _this.search(0);
                return {
                    tree: _this.currentTree,
                    solutions: _this.solutions
                };
            };
            this.constraintMatrix = constraintMatrix;
            this.showSteps = showSteps;
        }
        Solver.prototype.search = function (depth) {
            if (this.showSteps || this.root.right === this.root) {
                this.recordSolution(this.root.right === this.root);
                if (this.root.right === this.root) {
                    return;
                }
            }
            var column = this.smallestColumn();
            this.cover(column);
            var row = column.down;
            while (row !== column) {
                this.step(row, depth);
                row = row.right;
                while (row.col !== column) {
                    this.cover(row.col);
                    row = row.right;
                }
                this.search(depth + 1);
                row = row.left;
                while (row.col !== column) {
                    this.uncover(row.col);
                    row = row.left;
                }
                row = row.down;
                this.unstep();
            }
            this.uncover(column);
        };
        Solver.prototype.step = function (row, depth) {
            this.currentTree = {
                parent: this.currentTree,
                children: [],
                depth: depth,
                node: row.node
            };
            this.currentTree.parent.children.push(this.currentTree);
            this.currentSolution.push(row.node);
        };
        Solver.prototype.recordSolution = function (success) {
            var solution = {
                nodes: _.clone(this.currentSolution),
                success: success
            };
            this.currentTree.success = success;
            this.solutions.push(solution);
        };
        Solver.prototype.unstep = function () {
            this.currentSolution.pop();
            this.currentTree = this.currentTree.parent;
        };
        Solver.prototype.cover = function (column) {
            column.right.left = column.left;
            column.left.right = column.right;
            var row = column.down;
            while (row !== column) {
                row = row.right;
                while (row.col !== column) {
                    row.up.down = row.down;
                    row.down.up = row.up;
                    row.col.size--;
                    row = row.right;
                }
                row = row.down;
            }
        };
        Solver.prototype.uncover = function (column) {
            column.right.left = column;
            column.left.right = column;
            var row = column.up;
            while (row !== column) {
                row = row.left;
                while (row.col !== column) {
                    row.up.down = row;
                    row.down.up = row;
                    row.col.size++;
                    row = row.left;
                }
                row = row.up;
            }
        };
        Solver.prototype.smallestColumn = function () {
            var column;
            var min = Number.MAX_VALUE;
            for (var header = this.root.right; header !== this.root; header = header.right) {
                if (header.size < min) {
                    column = header;
                    min = column.size;
                }
            }
            return column;
        };
        Solver.prototype.initialize = function () {
            var rows = {};
            this.root = {
                right: null,
                left: null,
                up: null,
                down: null
            };
            this.root.right = this.root;
            this.root.left = this.root;
            for (var i in this.constraintMatrix) {
                var column = {
                    right: this.root,
                    left: this.root.left,
                    size: 0,
                    down: null,
                    up: null,
                };
                this.root.left.right = column;
                this.root.left = column;
                column.up = column;
                column.down = column;
                for (var j in this.constraintMatrix[i]) {
                    var constraint = this.constraintMatrix[i][j];
                    // Value is for 0's in the constraint matrix; skip is for
                    // filtered out options based on user input.
                    if (!constraint.value || constraint.skip) {
                        continue;
                    }
                    var row = {
                        node: constraint.node,
                        right: null,
                        left: null,
                        down: column,
                        up: column.up,
                        col: column
                    };
                    column.size++;
                    column.up.down = row;
                    column.up = row;
                    // If we haven't seen this row yet, remember it. Otherwise,
                    // append this node to the row's left/right chain.
                    if (!rows[j]) {
                        row.right = row;
                        row.left = row;
                        rows[j] = row;
                    }
                    else {
                        row.right = rows[j];
                        row.left = rows[j].left;
                        rows[j].left.right = row;
                        rows[j].left = row;
                    }
                }
            }
        };
        return Solver;
    }());
    Dlx.Solver = Solver;
})(Dlx || (Dlx = {}));
