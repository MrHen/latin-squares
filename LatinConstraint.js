/// <reference path="./LatinHive.ts" />
var LatinSquare;
(function (LatinSquare) {
    var LatinConstraint = (function () {
        function LatinConstraint(config) {
            this.config = _.defaults({}, config, LatinConstraint.defaultConfig);
            this.svg = d3.select(this.config.rootId)
                .append("svg")
                .attr("id", this.config.id)
                .attr("width", this.config.width)
                .attr("height", this.config.height);
        }
        // Generate a suitable constraints matrix. Columns are the outer dimension
        // (R1#1, R1#2, etc.) and rows are the inner dimension (R1C1#1, R1C1#2, etc.).
        //
        // Dancing links will convert these to a linked matrix but it is a little
        // easier to grok what is happening if we split up the constraint generation
        // and the linked matrix builder.
        LatinConstraint.prototype.build = function (nodes) {
            var _this = this;
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
                for (var a = 1; a <= _this.config.size; a++) {
                    for (var b = 1; b <= _this.config.size; b++) {
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
        };
        LatinConstraint.prototype.draw = function (constraints) {
            var height = this.config.height;
            var width = this.config.width;
            var columnIndex = "outer";
            var rowIndex = "inner";
            var pixelColor = d3.scale.linear()
                .domain([0, 1])
                .range([LatinSquare.colors["invalid"], LatinSquare.colors["valid"]]);
            var flat = _.flatten(_.map(_.values(constraints), _.values));
            var columnLabels = _.uniq(_.map(flat, columnIndex)).sort();
            var rowLabels = _.uniq(_.map(flat, rowIndex)).sort();
            var labelOffset = 4;
            var maxWidth = +width / (columnLabels.length + 2 + labelOffset);
            var maxHeight = +height / (rowLabels.length + 2 + labelOffset);
            var pixelSpacing = 1;
            var pixelSize = Math.min(maxWidth, maxHeight) - pixelSpacing;
            var labelSize = pixelSize * labelOffset;
            var offset = function (x) {
                return (x + 1) * (pixelSize + pixelSpacing);
            };
            var realWidth = (pixelSize + pixelSpacing) * (columnLabels.length + 2 + labelOffset);
            var realHeight = (pixelSize + pixelSpacing) * (rowLabels.length + 2 + labelOffset);
            this.svg.attr("width", realWidth)
                .attr("height", realHeight);
            var pixel = this.svg.selectAll("rect.pixel")
                .data(_.filter(flat, "value"));
            var newPixels = pixel.enter()
                .append("rect")
                .attr("class", "pixel")
                .attr("width", pixelSize)
                .attr("height", pixelSize)
                .style("stroke-width", 0.25)
                .attr("transform", function (constraint) {
                return "translate(" + offset(_.indexOf(columnLabels, constraint[columnIndex]) + labelOffset) + "," + offset(_.indexOf(rowLabels, constraint[rowIndex]) + labelOffset) + ")";
            });
            pixel.transition().duration(this.config.animationDuration)
                .style("stroke", function (constraint) {
                if (!constraint.value) {
                    return LatinSquare.borders["filler"];
                }
                return LatinSquare.getBorderColor(constraint.node, LatinSquare.getHighlight());
            })
                .style("fill", function (constraint) {
                if (!constraint.value) {
                    return LatinSquare.colors["filler"];
                }
                return LatinSquare.getColor(constraint.node, LatinSquare.getHighlight());
            });
            var columns = this.svg.selectAll("text.column")
                .data(columnLabels);
            columns.enter()
                .append("text")
                .attr("class", "column")
                .attr("transform", function (d, i) {
                return "translate(" + offset(labelOffset + i + 0.5) + "," + offset(labelOffset - 0.5) + ") rotate(270 0,0)";
            })
                .style("text-anchor", "start")
                .style("font-family", "monospace")
                .style("font-size", pixelSize)
                .text(function (d) { return d; });
            var rows = this.svg.selectAll("text.row")
                .data(rowLabels);
            rows.enter()
                .append("text")
                .attr("class", "row")
                .attr("transform", function (d, i) {
                return "translate(" + offset(labelOffset - 0.5) + "," + offset(labelOffset + i + 0.5) + ")";
            })
                .style("text-anchor", "end")
                .style("font-family", "monospace")
                .style("font-size", pixelSize)
                .text(function (d) { return d; });
            return newPixels;
        };
        LatinConstraint.defaultConfig = {
            animationDuration: 500,
            height: 400,
            id: "#constraints",
            rootId: "#constraints-container",
            size: 4,
            width: 400
        };
        return LatinConstraint;
    }());
    LatinSquare.LatinConstraint = LatinConstraint;
})(LatinSquare || (LatinSquare = {}));
