namespace latinColors {
    // http://colorbrewer2.org/?type=qualitative&scheme=Pastel2&n=4
    export let colors = {
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

    export let borders = {
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

    export let textColors = {
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

    export let linkColors = d3.scale.category10<number>();

    function getColorType(d: LatinNode | LatinCell, highlight: LatinHighlight) {
        function isNode(d: LatinNode | LatinCell): d is LatinNode {
            return !!d["cell"];
        }

        let node: LatinNode = isNode(d) ? d : null;
        let cell: LatinCell = isNode(d) ? d.cell : d;

        let isNeighborX = highlight && highlight.x === d.x;
        let isNeighborY = highlight && highlight.y === d.y;
        let isNeighborI = highlight && highlight.i === d.i;
        let isNeighborGuess = highlight && highlight.guess === d.guess;

        let isHint = cell.hint;
        let isChange = highlight && cell.guess && cell.guess !== highlight.guess;
        let isInvalid = node && !_.filter(node.solutions, "valid").length;
        let isBad = cell.invalid && (!node || (node && cell.guess === d.guess));

        // if d.cell is missing, we have to "aggregate" results
        let isCellGuess = !node && d.guess;

        if (isBad) {
            return "bad";
        }

        if (isNeighborI) {
            if (isNeighborGuess) {
                return "focus";
            }
        }

        if (node && node.cell.guess === d.guess) {
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
            if (!node) {
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

    export function getColor(d: LatinNode | LatinCell, highlight: LatinHighlight): string {
        return colors[getColorType(d, highlight)];
    }

    export function getBorderColor(d: LatinNode | LatinCell, highlight: LatinHighlight): string {
        return borders[getColorType(d, highlight)];
    }

    export function getTextColor(d: LatinNode | LatinCell, highlight: LatinHighlight): string {
        return textColors[getColorType(d, highlight)];
    }
}
