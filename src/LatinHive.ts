namespace LatinSquare {
    export interface HiveConfig {
        animationDuration?: number;
        height?: number;
        id?: string;
        innerRadius?: number;
        outerRadius?: number;
        rootId?: string;
        size?: number;
        width?: number;
    }

    export interface Node {
        i: number;
        x: number;
        y: number;
        guess: number;

        cell: LatinSquare.Cell;

        solutions: Solution[];
    }

    export interface Link {
        key: string;
        solution: Solution;
    }

    export interface Solution {
        nodes: LatinSquare.Node[];
        s?: number;
        success: boolean;
        valid?: boolean;
    }

    export class LatinHive {
        private static defaultConfig: HiveConfig = {
            animationDuration: 500,
            height: 400,
            id: "#hive-chart",
            innerRadius: 20,
            outerRadius: 180,
            rootId: "#hive-chart-container",
            size: 4,
            width: 400
        };

        private config: HiveConfig;

        private angle: d3.scale.Ordinal<number, number>;

        private link: d3.D3HiveLink;

        private svg: d3.Selection<Node>;

        private radius: d3.scale.Ordinal<number, number>;

        constructor(config?: HiveConfig) {
            this.config = _.defaults({}, config, LatinHive.defaultConfig);

            this.svg = d3.select(this.config.rootId)
                .append("svg")
                .attr("id", this.config.id)
                .attr("width", this.config.width)
                .attr("height", this.config.height)
                .append("g")
                .attr("transform", "translate(" + this.config.width / 2 + "," + this.config.height / 2 + ")");

            this.angle = d3.scale.ordinal<number, number>()
                .domain(d3.range(this.config.size * this.config.size + 1))
                .rangePoints([0, 2 * Math.PI]);

            this.radius = d3.scale.ordinal<number, number>()
                .domain(d3.range(-1, this.config.size + 1))
                .rangePoints([this.config.innerRadius, this.config.outerRadius]);

            this.link = d3.hive.link()
                .angle((link) => this.angle(link.cell.i))
                .radius((link) => this.radius(link.guess));
        }

        public buildNodes = (cells: LatinSquare.Cell[]) => {
            let nodes: Node[] = [];

            for (let i = 0; i < cells.length; i++) {
                let cell = cells[i];

                for (let guess = 1; guess <= this.config.size; guess++) {
                    let node = {
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

        public buildLinks = (nodes: Node[], solutions: Solution[]) => {
            function key(d) {
                return d.x + ":" + d.y + ":" + d.guess;
            }

            let links: Link[] = [];
            for (let s = 0; s < solutions.length; s++) {
                let solution = solutions[s];
                if (!solution.success) {
                    continue;
                }

                solution.nodes = _.sortBy(solution.nodes, "i");
                solution.s = s;

                for (let i = 0; i < solution.nodes.length; i++) {
                    let source = solution.nodes[i];
                    let target = solution.nodes[(i + 1) % solution.nodes.length];

                    let link = {
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

        public drawNodes = (nodes: Node[]) => {
            let node = this.svg.selectAll(".node")
                .data(nodes);

            let newNodes = node.enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", (node) => {
                    return "rotate(" + LatinHive.degrees(this.angle(node.cell.i)) + ")translate(" + this.radius(node.guess) + ",0)";
                });

            newNodes.append("circle")
                .attr("class", "inner")
                .style("r", 5)
                .style("stroke-width", 1.5);

            node.transition().duration(this.config.animationDuration)
                .style("fill", (node) => latinColors.getColor(node, LatinSquare.getHighlight()))
                .style("stroke", (node) => latinColors.getBorderColor(node, LatinSquare.getHighlight()));

            return newNodes;
        };

        public drawAxes = (cells: LatinSquare.Cell[]) => {
            let line = this.svg.selectAll(".axis").data(cells);

            let newLine = line.enter()
                .append("g")
                .attr("class", "axis")
                .attr("transform", (cell) => {
                    return "rotate(" + LatinHive.degrees(this.angle(cell.i)) + ")";
                });

            newLine.append("line")
                .style("stroke-width", 1.5)
                .attr("x1", this.radius.range()[0])
                .attr("x2", _.last<number>(this.radius.range()));

            line.selectAll("line")
                .transition().duration(this.config.animationDuration)
                .style("stroke", (cell) => latinColors.getBorderColor(cell, LatinSquare.getHighlight()));

            return newLine;
        };

        public drawLinks = (links: Link[], cells: LatinSquare.Cell[]) => {
            let picked = _.filter(cells, "guess");

            let link = this.svg.selectAll(".link")
                .data(links, (link) => link.key);

            let newLinks = link.enter()
                .append("path")
                .attr("class", "link")
                .attr("d", this.link)
                .style("opacity", 0)
                .style("fill", "none")
                .style("stroke-width", 1.5)
                .style("stroke", (link) => latinColors.linkColors(link.solution.s));

            link.exit()
                .transition().duration(this.config.animationDuration)
                .style("opacity", 0)
                .remove();

            link.transition().duration(this.config.animationDuration)
                .style("opacity", (link) => {
                    if (!link.solution.valid) {
                        return 0;
                    }

                    let highlight = LatinSquare.getHighlight();

                    if (highlight && highlight.solutions.length) {
                        let match = _.includes(highlight.solutions, link.solution.s);
                        return match ? 1 : 0;
                    }

                    return 1;
                });

            return newLinks;
        };

        private static degrees = (radians: number) => {
            return radians / Math.PI * 180 - 90;
        };
    }
}
