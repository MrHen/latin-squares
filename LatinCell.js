var LatinSquare;
(function (LatinSquare) {
    var LatinCell = (function () {
        function LatinCell(config) {
            var _this = this;
            this.build = function () {
                return d3.range(_this.config.size * _this.config.size).map(function (i) {
                    var cell = {
                        i: i,
                        x: i % _this.config.size,
                        y: Math.floor(i / _this.config.size),
                        guess: 0,
                        hint: false,
                        nodes: []
                    };
                    if (_this.config.reduced) {
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
            };
            this.drawLatin = function (cells) {
                var height = _this.config.height;
                var width = _this.config.width;
                var size = _this.config.size;
                var margin = 10;
                var maxWidth = (width - margin * 2) / size;
                var maxHeight = (height - margin * 2) / size;
                var cellSpacing = 2;
                var cellSize = Math.min(maxWidth, maxHeight) - cellSpacing;
                var offset = function (x) {
                    return (x) * (cellSize + cellSpacing) + margin;
                };
                var cell = _this.svg.selectAll(".cell")
                    .data(cells);
                var newCells = cell.enter()
                    .append("g")
                    .attr("class", "cell")
                    .attr("width", cellSize)
                    .attr("height", cellSize)
                    .attr("transform", function (cell) {
                    return "translate(" + offset(cell.x) + "," + offset(cell.y) + ")";
                });
                newCells.append("rect")
                    .attr("class", "box")
                    .attr("fill", "white")
                    .attr("stroke", "grey")
                    .attr("width", cellSize)
                    .attr("height", cellSize);
                newCells.append("text")
                    .attr("class", "label")
                    .attr("text-anchor", "middle")
                    .style("font-size", cellSize * 0.3)
                    .attr("dominant-baseline", "central")
                    .attr("transform", function (cell) {
                    return "translate(" + cellSize / 2 + "," + cellSize / 2 + ")";
                });
                cell.select(".box")
                    .transition().duration(_this.config.animationDuration)
                    .attr("stroke", function (cell) {
                    return LatinSquare.getBorderColor(cell, LatinSquare.getHighlight());
                })
                    .attr("fill", function (cell) {
                    return LatinSquare.getColor(cell, LatinSquare.getHighlight());
                });
                cell.select(".label")
                    .text(function (cell) {
                    var highlight = LatinSquare.getHighlight();
                    if (highlight && highlight.i === cell.i) {
                        return highlight.guess;
                    }
                    if (cell.guess) {
                        return cell.guess;
                    }
                    return null;
                })
                    .attr("fill", function (cell) {
                    return LatinSquare.getTextColor(cell, LatinSquare.getHighlight());
                });
                return newCells;
            };
            this.config = _.defaults({}, config, LatinCell.defaultConfig);
            this.svg = d3.select(this.config.rootId)
                .append("svg")
                .attr("id", this.config.id)
                .attr("width", this.config.width)
                .attr("height", this.config.height);
        }
        LatinCell.defaultConfig = {
            animationDuration: 500,
            height: 400,
            id: "#latin",
            reduced: true,
            rootId: "#latin-squares-container",
            size: 4,
            width: 400
        };
        return LatinCell;
    }());
    LatinSquare.LatinCell = LatinCell;
})(LatinSquare || (LatinSquare = {}));
