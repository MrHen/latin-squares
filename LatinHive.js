var LatinSquare;
(function (LatinSquare) {
    var LatinHive = (function () {
        function LatinHive(config) {
            var _this = this;
            this.buildNodes = function (cells) {
                var nodes = [];
                for (var i = 0; i < cells.length; i++) {
                    var cell = cells[i];
                    for (var guess = 1; guess <= _this.config.size; guess++) {
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
            };
            this.buildLinks = function (nodes, solutions) {
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
            };
            this.drawNodes = function (nodes) {
                var node = _this.svg.selectAll(".node")
                    .data(nodes);
                var newNodes = node.enter()
                    .append("g")
                    .attr("class", "node")
                    .attr("transform", function (node) {
                    return "rotate(" + LatinHive.degrees(_this.angle(node.cell.i)) + ")translate(" + _this.radius(node.guess) + ",0)";
                });
                newNodes.append("circle")
                    .attr("class", "inner")
                    .style("r", 5)
                    .style("stroke-width", 1.5);
                node.transition().duration(_this.config.animationDuration)
                    .style("fill", function (node) { return LatinSquare.getColor(node, LatinSquare.getHighlight()); })
                    .style("stroke", function (node) { return LatinSquare.getBorderColor(node, LatinSquare.getHighlight()); });
                return newNodes;
            };
            this.drawAxes = function (cells) {
                var line = _this.svg.selectAll(".axis").data(cells);
                var newLine = line.enter()
                    .append("g")
                    .attr("class", "axis")
                    .attr("transform", function (cell) {
                    return "rotate(" + LatinHive.degrees(_this.angle(cell.i)) + ")";
                });
                newLine.append("line")
                    .style("stroke-width", 1.5)
                    .attr("x1", _this.radius.range()[0])
                    .attr("x2", _.last(_this.radius.range()));
                line.selectAll("line")
                    .transition().duration(_this.config.animationDuration)
                    .style("stroke", function (cell) { return LatinSquare.getBorderColor(cell, LatinSquare.getHighlight()); });
                return newLine;
            };
            this.drawLinks = function (links, cells) {
                var picked = _.filter(cells, "guess");
                var link = _this.svg.selectAll(".link")
                    .data(links, function (link) { return link.key; });
                var newLinks = link.enter()
                    .append("path")
                    .attr("class", "link")
                    .attr("d", _this.link)
                    .style("opacity", 0)
                    .style("fill", "none")
                    .style("stroke-width", 1.5)
                    .style("stroke", function (link) { return LatinSquare.linkColors(link.solution.s); });
                link.exit()
                    .transition().duration(_this.config.animationDuration)
                    .style("opacity", 0)
                    .remove();
                link.transition().duration(_this.config.animationDuration)
                    .style("opacity", function (link) {
                    if (!link.solution.valid) {
                        return 0;
                    }
                    var highlight = LatinSquare.getHighlight();
                    if (highlight && highlight.solutions.length) {
                        var match = _.includes(highlight.solutions, link.solution.s);
                        return match ? 1 : 0;
                    }
                    return 1;
                });
                return newLinks;
            };
            this.config = _.defaults({}, config, LatinHive.defaultConfig);
            this.svg = d3.select(this.config.rootId)
                .append("svg")
                .attr("id", this.config.id)
                .attr("width", this.config.width)
                .attr("height", this.config.height)
                .append("g")
                .attr("transform", "translate(" + this.config.width / 2 + "," + this.config.height / 2 + ")");
            this.angle = d3.scale.ordinal()
                .domain(d3.range(this.config.size * this.config.size + 1))
                .rangePoints([0, 2 * Math.PI]);
            this.radius = d3.scale.ordinal()
                .domain(d3.range(-1, this.config.size + 1))
                .rangePoints([this.config.innerRadius, this.config.outerRadius]);
            this.link = d3.hive.link()
                .angle(function (link) { return _this.angle(link.cell.i); })
                .radius(function (link) { return _this.radius(link.guess); });
        }
        LatinHive.defaultConfig = {
            animationDuration: 500,
            height: 400,
            id: "#hive-chart",
            innerRadius: 20,
            outerRadius: 180,
            rootId: "#hive-chart-container",
            size: 4,
            width: 400
        };
        LatinHive.degrees = function (radians) {
            return radians / Math.PI * 180 - 90;
        };
        return LatinHive;
    }());
    LatinSquare.LatinHive = LatinHive;
})(LatinSquare || (LatinSquare = {}));
