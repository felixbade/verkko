// Code and design by Felix Bade

var canvas = document.getElementById("graafi");
var context = canvas.getContext("2d");
var vertexInfo = document.getElementById("vertex-info");
var dataInputElement = document.getElementById("data");

context.lineWidth = 1.5;
var maxAllowedForce = 10;

var radius, vertexXs, vertexYs, vertexNames, vertexNeighbours, vertexConnectsOthers, edges, numberOfVertices, graphCenterX, graphCenterY, delta_t, pull, push, dx, dy, stopped, vertexVXs, vertexVYs;

function initialize() {
    parseInput();
    resizeCanvas();
    clearCanvas();
    stopped = false;
    tick();
}

function tick() {
    simulateGraphForces();
    reDraw();
    if (!stopped) {
        requestAnimationFrame(tick);
    }
}

// Initialization stuff

function parseInput() {
    var edgeNames = GraphParser.parseString(dataInputElement.value).compatibilityForm();
    findUniqueVertices(edgeNames);
    parseEdges(edgeNames);
    checkVerticesThatConnectOtherVertices();
    randomCoordinates();
}

function findUniqueVertices(edgeNames) {
    vertexNames = new Array();
    for (var i = 0; i < edgeNames.length; i++) {
        var firstVertexName = edgeNames[i][0];
        var secondVertexName = edgeNames[i][1];
        pushIfNotPresent(vertexNames, firstVertexName);
        pushIfNotPresent(vertexNames, secondVertexName);
    }
    numberOfVertices = vertexNames.length;
}

function parseEdges(edgeNames) {
    edges = new Array();
    vertexNeighbours = new Array(numberOfVertices);
    for (var i = 0; i < edgeNames.length; i++) {
        var firstVertex = vertexNames.indexOf(edgeNames[i][0]);
        var secondVertex = vertexNames.indexOf(edgeNames[i][1]);
        edges.push([firstVertex, secondVertex]);
        addNeighbour(firstVertex, secondVertex);
        addNeighbour(secondVertex, firstVertex);
    }
}

function addNeighbour(vertex, neighbour) {
    if (vertexNeighbours[vertex] == undefined) {
        vertexNeighbours[vertex] = new Array();
    }
    pushIfNotPresent(vertexNeighbours[vertex], neighbour);
}

function pushIfNotPresent(array, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == value) {
            return;
        }
    }
    array.push(value);
}

function checkVerticesThatConnectOtherVertices() {
    vertexConnectsOthers = new Array(numberOfVertices);
    for (var vertex = 0; vertex < numberOfVertices; vertex++) {
        vertexConnectsOthers[vertex] = doesVertexConnectOtherVertices(vertex);
    }
}

function doesVertexConnectOtherVertices(vertex) {
    var neighbours = vertexNeighbours[vertex];
    if (neighbours.length < 2) {
        return false;
    }
    for (var a = 0; a < neighbours.length-1; a++) {
        for (var b = a+1; b < neighbours.length; b++) {
            if (!areNeighbours(neighbours[a], neighbours[b])) {
                return true;
            }
        }
    }
    return false;
}

function areNeighbours(x, y) {
    var xsNeighbours = vertexNeighbours[x];
    for (var i = 0; i < xsNeighbours.length; i++) {
        if (xsNeighbours[i] == y) {
            return true;
        }
    }
    return false;
}

function randomCoordinates() {
    vertexXs = new Array(numberOfVertices);
    vertexYs = new Array(numberOfVertices);
    vertexVXs = new Array(numberOfVertices);
    vertexVYs = new Array(numberOfVertices);
    for (var i = 0; i < numberOfVertices; i++) {
        vertexXs[i] = Math.random() * canvas.width;
        vertexYs[i] = Math.random() * canvas.height;
        vertexVXs[i] = 0;
        vertexVYs[i] = 0;
    }
}

// Simulation stuff

function simulateGraphForces() {
    var vertexForcesSumXs = new Array(numberOfVertices);
    var vertexForcesSumYs = new Array(numberOfVertices);
    var vertexForcesSumRs = new Array(numberOfVertices);
    var vertexNearestNeighbourDistance = new Array(numberOfVertices);

    for (var vertex = 0; vertex < numberOfVertices; vertex++) {
        var forcesSumX = 0;
        var forcesSumY = 0;
        
        // calculate pull
        var neighbours = vertexNeighbours[vertex];
        for (var i = 0; i < neighbours.length; i++) {
            var other = neighbours[i];
            dx = vertexXs[other] - vertexXs[vertex];
            dy = vertexYs[other] - vertexYs[vertex];
            // F ~ 1
            var dr = Math.sqrt(dx*dx + dy*dy);
            forcesSumX += dx / dr;
            forcesSumY += dy / dr;
        }

        // calculate push
        for (var other = 0; other < numberOfVertices; other++) {
            if (other == vertex) {
                continue;
            }
            dx = vertexXs[other] - vertexXs[vertex];
            dy = vertexYs[other] - vertexYs[vertex];
            // F ~ -1/(r^3)
            var drSquared = dx*dx + dy*dy;
            forcesSumX -= 100000 * dx / drSquared / drSquared;
            forcesSumY -= 100000 * dy / drSquared / drSquared;
            
            var dr = Math.sqrt(drSquared);
            if (vertexNearestNeighbourDistance[vertex] == undefined || dr < vertexNearestNeighbourDistance[vertex]) {
                vertexNearestNeighbourDistance[vertex] = dr;
            }
        }

        // Make sure that forcesSum is not arbitrarily big. If it is, two nodes are probably
        // just on top of each other
        forcesSumR = Math.sqrt(forcesSumX*forcesSumX + forcesSumY*forcesSumY);
        if (forcesSumR > maxAllowedForce) {
            vertexForcesSumXs[vertex] = forcesSumX * maxAllowedForce / forcesSumR;
            vertexForcesSumYs[vertex] = forcesSumY * maxAllowedForce / forcesSumR;
            vertexForcesSumRs[vertex] = maxAllowedForce;
        } else {
            vertexForcesSumXs[vertex] = forcesSumX;
            vertexForcesSumYs[vertex] = forcesSumY;
            vertexForcesSumRs[vertex] = forcesSumR;
        }
    }
    
    var minDistancePerForce; 
    var maxForce = 0;
    for (var vertex = 0; vertex < numberOfVertices; vertex++) {
        maxForce = Math.max(maxForce, vertexForcesSumRs[vertex]);
        var distancePerForce = vertexNearestNeighbourDistance[vertex] / vertexForcesSumRs[vertex];
        if (vertex == 0 || distancePerForce < minDistancePerForce) {
            minDistancePerForce = distancePerForce;
        }
    }
    //console.log(vertexForcesSumRs);

    var delta_t = minDistancePerForce / 30; // Prevent bad shaking
    if (maxForce < 1) {
        delta_t *= maxForce;
    }
    //console.log(minDistancePerForce);
    if (maxForce < 0.01) {
        stopped = true;
    }
    //console.log(maxForce, delta_t, minDistancePerForce);
    //console.log(minDistancePerForce);
    
    //delta_t = Math.min(10000, delta_t);
    for (var vertex = 0; vertex < numberOfVertices; vertex++) {
        // Just keep the vertex being dragged under the cursor
        if (vertex == selectedVertex) {
            continue;
        }
        vertexVXs[vertex] += vertexForcesSumXs[vertex] * delta_t;
        vertexVYs[vertex] += vertexForcesSumYs[vertex] * delta_t;
        vertexVXs[vertex] *= 0.9;
        vertexVYs[vertex] *= 0.9;
    }
    
    for (var vertex = 0; vertex < numberOfVertices; vertex++) {
        vertexXs[vertex] += vertexVXs[vertex];
        vertexYs[vertex] += vertexVYs[vertex];
    }
}

// Rendering stuff

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    reDraw();
}

function reDraw() {
    clearCanvas();
    if (!isMouseDown) {
        moveGraphTowardsCenter();
    }
    drawEdgesAndVertices();
}

function moveGraphTowardsCenter() {
    var imageCenterX = canvas.width / 2;
    var imageCenterY = canvas.height / 2;
    calculateGraphCenter();
    for (var i = 0; i < numberOfVertices; i++) {
        vertexXs[i] += (imageCenterX - graphCenterX) / 30;
        vertexYs[i] += (imageCenterY - graphCenterY) / 30;
    }
}

function calculateGraphCenter() {
    var xSum = 0;
    var ySum = 0;
    for (var i = 0; i < numberOfVertices; i++) {
        xSum += vertexXs[i];
        ySum += vertexYs[i];
    }
    graphCenterX = xSum / numberOfVertices;
    graphCenterY = ySum / numberOfVertices;
}

function drawEdgesAndVertices() {
    drawNonImportantEdges();
    drawNonImportantVertices();
    drawImportantEdges();
    drawImportantVertices();
}

function drawNonImportantEdges() {
    setNonImportantStyle();
    for (var edge = 0; edge < edges.length; edge++) {
        if (!isEdgeImportant(edge)) {
            drawEdge(edge);
        }
    }
}

function drawImportantEdges() {
    setImportantStyle();
    for (var edge = 0; edge < edges.length; edge++) {
        if (isEdgeImportant(edge)) {
            drawEdge(edge);
        }
    }
}

function drawNonImportantVertices() {
    setNonImportantStyle();
    for (var vertex = 0; vertex < numberOfVertices; vertex++) {
        if (!isVertexImportant(vertex)) {
            drawVertex(vertex);
        }
    }
}

function drawImportantVertices() {
    setImportantStyle();
    for (var vertex = 0; vertex < numberOfVertices; vertex++) {
        if (isVertexImportant(vertex)) {
            drawVertex(vertex);
        }
    }
}

function setNonImportantStyle() {
    context.strokeStyle = "#ccc";
    context.fillStyle = "#ccc";
    radius = 4;
}

function setImportantStyle() {
    context.strokeStyle = "#444";
    context.fillStyle = "#444";
    radius = 6;
}

function isEdgeImportant(edge) {
    var vertex1 = edges[edge][0];
    var vertex2 = edges[edge][1];
    return isVertexImportant(vertex1) && isVertexImportant(vertex2);
}

function isVertexImportant(vertex) {
    if (!document.getElementById("emphasize-important-vertices").checked) {
        return true;
    }
    return vertexConnectsOthers[vertex];
}

function drawEdge(edge) {
    var vertex1 = edges[edge][0];
    var vertex2 = edges[edge][1];
    var x1 = vertexXs[vertex1];
    var y1 = vertexYs[vertex1];
    var x2 = vertexXs[vertex2];
    var y2 = vertexYs[vertex2];
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
}

function drawVertex(vertex) {
    var x = vertexXs[vertex];
    var y = vertexYs[vertex];
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fill();
    context.stroke();
}

function clearCanvas() {
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

// Mouse stuff

var isMouseDown = false;
var mouseX, mouseY;
var selectedVertex = -1;

function onMouseDown(event) {
    if (event.button != 0) {
        return;
    }
    isMouseDown = true;
    updateMouseCoordinates(event);
    selectedVertex = getVertexByMouseCoordinates();
}

function onMouseMove(event) {
    updateMouseCoordinates(event);
    if (isMouseDown) {
        run();
        moveSelectedVertexToMouse();
    }
    updateLabel();
}

function onMouseUp(event) {
    isMouseDown = false;
    selectedVertex = -1;
}

function updateMouseCoordinates(event) {
    mouseX = event.offsetX;
    mouseY = event.offsetY;
}

function getVertexByMouseCoordinates() {
    for (var vertex = 0; vertex < numberOfVertices; vertex++) {
        var dx = vertexXs[vertex] - mouseX;
        var dy = vertexYs[vertex] - mouseY;
        var distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < 8) {
            return vertex;
        }
    }
    return -1;
}

function moveSelectedVertexToMouse() {
    if (selectedVertex != -1) {
        vertexXs[selectedVertex] = mouseX;
        vertexYs[selectedVertex] = mouseY;
        reDraw();
    }
}

function updateLabel() {
    if (isMouseDown) {
        hideLabel();
    } else {
        vertex = getVertexByMouseCoordinates();
        if (vertex != -1) {
            var name = vertexNames[vertex];
            showLabel(name, mouseX, mouseY);
        } else {
            hideLabel();
        }
    }
}

function hideLabel() {
    showLabel('', -1000, -1000);
}

function showLabel(text, x, y) {
    vertexInfo.innerHTML = text;
    vertexInfo.style.left = x + 'px';
    vertexInfo.style.top = y + 'px';
}

function run() {
    if (stopped) {
        stopped = false;
        tick();
    }
}

// These must be in the end :(

document.getElementById("emphasize-important-vertices").onclick = reDraw;
dataInputElement.oninput = initialize;
initialize();

document.body.onresize = resizeCanvas;

canvas.addEventListener("mousedown", onMouseDown, true);
canvas.addEventListener("mouseup", onMouseUp, true);
canvas.addEventListener("mousemove", onMouseMove, true);
