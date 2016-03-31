var LatinSquare;
(function (LatinSquare) {
    var highlight;
    function getHighlight() {
        return highlight;
    }
    LatinSquare.getHighlight = getHighlight;
    function setHighlight(target) {
        if (!target) {
            highlight = null;
            return;
        }
        highlight = {
            x: target.x,
            y: target.y,
            i: target.i,
            guess: target.guess || null,
            solutions: _.map(_.filter(target["solutions"], "valid"), "s")
        };
    }
    LatinSquare.setHighlight = setHighlight;
})(LatinSquare || (LatinSquare = {}));
