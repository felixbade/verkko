var GraphParser = (function () {
    "use strict";

    /**
     * Creates a new Node
     * @class
     */
    var Node = function (key) {
        this.key = key;
        this.edges = [];
        this.attributes = {};
    };

    /**
     * Adds a edge from this node to the other node
     * @param {Object} other The node to be added to the list of edges
     * @method
     */
    Node.prototype.addEdge = function (other) {
        this.edges.push(other);
    };

    Node.prototype.setAttribute = function (key, value) {
        this.attributes[key] = value;
    };

    /**
     * Creates a new Graph
     * @class
     */
    var Graph = function () {
        this.nodes = {};
    };

    /**
     * Ensures that a specific node is known to the graph
     * @param {*} key The key that the node will be associated with
     * @method
     */
    Graph.prototype.ensureNode = function (key) {
        this.nodes[key] = this.nodes[key] || new Node(key);
        return this.nodes[key];
    };

    /**
     * Adds a single edge to the graph from first to second
     * @param {*} first The first nodes key
     * @param {*} second The second nodes key
     * @method
     */
    Graph.prototype.addSingleEdge = function (first, second) {
        this.ensureNode(first);
        this.ensureNode(second);

        this.nodes[first].addEdge(this.nodes[second]);
    };

    /**
     * Adds a two sided edge between first and second
     * @param {*} first The first nodes key
     * @param {*} second The second nodes key
     * @method
     */
    Graph.prototype.addEdge = function (first, second) {
        this.addSingleEdge(first, second);
        this.addSingleEdge(second, first);
    };

    /**
     * Returns the graph represented in a list of edges
     * @returns {string[][]}
     * @method
     */
    Graph.prototype.compatibilityForm = function () {
        var result = {};
        /* This gets rid of all of the duplicate edges, since our Graph
           supports both directed and undirected edges
        */
        for(var key in this.nodes) {
            var node = this.nodes[key];
            for(var other_key in node.edges) {
                var other = node.edges[other_key];
                var tmp = [node.key, other.key];
                tmp.sort();
                result[tmp[0] + "-" + tmp[1]] = 1;
            }
        };
        var compatibility = [];
        for(var key in result) {
            compatibility.push(key.split("-"));
        }
        return compatibility;
    };

    var parser = {};

    var parserRegex = /([\w ]+)(--|->|;|$|\ *\[(\w+)=(\w+)\])/gm;

    /**
     * Parses a specially formatted string to create the list of connections.
     * @param {string} input The string input
     * @returns {object} The graph representing the different nodes and edges
     */
    parser.parseString = function (input) {
        var graph = new Graph();
        var result;
        var linkNext = 0;
        var prevKey = "";
        while((result = parserRegex.exec(input)) !== null) {
            var key = result[1].trim();
            var oper = result[2];

            if(linkNext === 1) {
                graph.addEdge(prevKey, key);
            } else if(linkNext === 2) {
                graph.addSingleEdge(prevKey, key);
            }
            
            if(oper === "--") {
                linkNext = 1;
            } else if(oper === "->") {
                linkNext = 2;
            } else {
                linkNext = 0;
            }
            if(oper[0] == "[") {
                graph.ensureNode(key).setAttribute(result[3], result[4]);
            }
            prevKey = key;
        }
        return graph;
    };

    return parser;
}());