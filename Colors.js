/// <reference path="./Highlight.ts" />
var LatinSquare;
(function (LatinSquare) {
    // http://colorbrewer2.org/?type=qualitative&scheme=Pastel2&n=4
    LatinSquare.colors = {
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
    LatinSquare.borders = {
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
    LatinSquare.textColors = {
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
    LatinSquare.linkColors = d3.scale.category10();
    function getColorType(d, highlight) {
        function isNode(d) {
            return !!d["cell"];
        }
        var node = isNode(d) ? d : null;
        var cell = isNode(d) ? d.cell : d;
        var isNeighborX = highlight && highlight.x === d.x;
        var isNeighborY = highlight && highlight.y === d.y;
        var isNeighborI = highlight && highlight.i === d.i;
        var isNeighborGuess = highlight && highlight.guess === d.guess;
        var isHint = cell.hint;
        var isChange = highlight && cell.guess && cell.guess !== highlight.guess;
        var isInvalid = node && !_.filter(node.solutions, "valid").length;
        var isBad = cell.invalid && (!node || (node && cell.guess === d.guess));
        // if d.cell is missing, we have to "aggregate" results
        var isCellGuess = !node && d.guess;
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
    function getColor(d, highlight) {
        return LatinSquare.colors[getColorType(d, highlight)];
    }
    LatinSquare.getColor = getColor;
    function getBorderColor(d, highlight) {
        return LatinSquare.borders[getColorType(d, highlight)];
    }
    LatinSquare.getBorderColor = getBorderColor;
    function getTextColor(d, highlight) {
        return LatinSquare.textColors[getColorType(d, highlight)];
    }
    LatinSquare.getTextColor = getTextColor;
})(LatinSquare || (LatinSquare = {}));
