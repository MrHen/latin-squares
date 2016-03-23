namespace dlx {
    export interface DlxLink<T> {
        name: string;
        size?: number;
        col?: DlxLink<T>;
        node?: T;

        down: DlxLink<T>;
        up: DlxLink<T>;
        left: DlxLink<T>;
        right: DlxLink<T>;
    }

    export interface DlxTree<T> {
        parent: DlxTree<T>;
        children: DlxTree<T>[];
        depth: number;
        node: T;
        success?: boolean;
    }

    export interface DlxSolution<T> {
        nodes: T[];
        success: boolean;
    }

    export interface DlxConstraint<T> {
        node: T;
        skip: boolean;
        value: boolean;
    }

    export interface DlxMatrix<T> {
        [outer: string]: {
            [inner: string]: DlxConstraint<T>
        };
    }

    ////// DANCING LINKS
    ////// Adapted from http://taeric.github.io/DancingLinks.html
    export function solveWithDancingLinks<T>(constraintMatrix: DlxMatrix<T>, dlx_showSteps: boolean) {
        let dlx_headers: DlxLink<T>;
        let dlx_solutions: DlxSolution<T>[] = [];
        let dlx_O: T[] = [];
        let dlx_current: DlxTree<T> = {
            parent: null,
            children: [],
            depth: 0,
            node: null
        };

        function dlx_search(k: number) {
            let c: DlxLink<T>, r: DlxLink<T>;
            if (dlx_showSteps || dlx_headers.right === dlx_headers) {
                let solution = {
                    nodes: _.clone(dlx_O),
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

        function dlx_cover(c: DlxLink<T>) {
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

        function dlx_uncover(c: DlxLink<T>) {
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

        function dlx_smallestColumn(): DlxLink<T> {
            let h: DlxLink<T>, c: DlxLink<T>, s = Number.MAX_VALUE;
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
            let i: string, j: string;

            let rowTrackers: { [index: string]: DlxLink<T> } = {};

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
                let curCol: DlxLink<T> = {
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
                    let curRow: DlxLink<T> = {
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
        dlx_search(0);

        return {
            tree: dlx_current,
            solutions: dlx_solutions
        };
    }
}
