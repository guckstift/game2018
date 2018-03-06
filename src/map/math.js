/*

	map coordinate and world view related math definitions and functions

	local coord - a 2d vertex coordinate local to a chunk
	linear local coord - a 1d vertex coordinate local to a chunk
	global coord - an absolute 2d vertex coordinate
	linear global coord - a absolute 1d vertex coordinate

*/

var triaHeight = sqrt(3) / 2;
var viewAngle = acos(1 / sqrt(3));
var viewAngleSin = sqrt(2 / 3);
var viewAngleCos = 1 / sqrt(3);
var heightScale = 1 / 3;
var stdDefZoom = 32;
var sqrt6 = sqrt(6);
var dsqrt3 = 2 * sqrt(3);
var sqrt2h = sqrt(2) / 2;

var sun = vec3(0, 0, -1);
sun = vec3.rotateX(sun, radians(-45));
sun = vec3.rotateZ(sun, radians(30));

var chunkSize = 32;
var chunkWidth = chunkSize;
var chunkHeight = chunkSize * 2;
var chunkVerts = chunkWidth * chunkHeight;
var numVertsPerRow = chunkWidth + 1;
var numVertRows = chunkHeight + 1;
var numVerts = numVertRows * numVertsPerRow;
var numTriasPerRow = chunkSize * 2;
var numTriaRows = chunkSize * 2;
var numTrias = numTriaRows * numTriasPerRow;
var numIndices = (numTriasPerRow + 2 + 2) * numTriaRows - 2;

function leftFrom(p)
{
	return [p[0] - 1, p[1]];
}

function rightFrom(p)
{
	return [p[0] + 1, p[1]];
}

function upFrom(p)
{
	return [p[0], p[1] - 1];
}

function downFrom(p)
{
	return [p[0], p[1] + 1];
}

function leftUpFromCartes(p)
{
	return [
		p[0] - 1,
		p[1] - 1,
	];
}

function leftUpFrom(p)
{
	return [
		p[0] - 1 + mod(p[1], 2),
		p[1] - 1,
	];
}

function rightUpFrom(p)
{
	return [
		p[0] + mod(p[1], 2),
		p[1] - 1,
	];
}

function leftDownFrom(p)
{
	return [
		p[0] - 1 + mod(p[1], 2),
		p[1] + 1,
	];
}

function rightDownFrom(p)
{
	return [
		p[0] + mod(p[1], 2),
		p[1] + 1,
	];
}

function allAdjacent(p)
{
	return [
		leftFrom(p),
		rightFrom(p),
		leftUpFrom(p),
		rightUpFrom(p),
		leftDownFrom(p),
		rightDownFrom(p),
	];
}

function hexRing(pivot, size)
{
	if(size === 0)  {
		return [pivot];
	}
	
	var set = [];
	var left = pivot;
	var leftup = pivot;
	var rightup = pivot;
	var right = pivot;
	var rightdown = pivot;
	var leftdown = pivot;

	for(var i=0; i < size; i++) {
		left = leftFrom(left);
		leftup = leftUpFrom(leftup);
		rightup = rightUpFrom(rightup);
		right = rightFrom(right);
		rightdown = rightDownFrom(rightdown);
		leftdown = leftDownFrom(leftdown);
	}
	
	for(var i=0; i < size; i++) {
		set.push(left);
		set.push(leftup);
		set.push(rightup);
		set.push(right);
		set.push(rightdown);
		set.push(leftdown);
		left = rightUpFrom(left);
		leftup = rightFrom(leftup);
		rightup = rightDownFrom(rightup);
		right = leftDownFrom(right);
		rightdown = leftFrom(rightdown);
		leftdown = leftUpFrom(leftdown);
	}
	
	return set;
}

function linearLocalCoord(p)
{
	return p[0] + p[1] * numVertsPerRow;
}

function chunkCoord(p)
{
	return [
		floor(p[0] / chunkWidth),
		floor(p[1] / chunkHeight),
	];
}

function localCoord(p)
{
	return [
		mod(p[0], chunkWidth),
		mod(p[1], chunkHeight),
	];
}

function globalCoord(cp, lp)
{
	return [
		cp[0] * chunkWidth + lp[0],
		cp[1] * chunkHeight + lp[1],
	];
}

function mapToWorld(p)
{
	return [
		p[0] + (mod(floor(p[1]), 2) === 0 ? frac(p[1]) * 0.5 : 0.5 - frac(p[1]) * 0.5),
		p[1] * triaHeight,
		p[2] * heightScale,
	];
}

function worldToScreen(p)
{
	var pyr = p[1] * viewAngleCos - p[2] * viewAngleSin;
	
	return [
		gl.size[0] / 2.0 + camera.zoom * (stdDefZoom * p[0] - camera.pos[0]),
		gl.size[1] / 2.0 + camera.zoom * (stdDefZoom * pyr - camera.pos[1]),
	];
}

function worldToSpriteSpace(p)
{
	var pyr = p[1] * viewAngleCos - p[2] * viewAngleSin;
	
	return [
		stdDefZoom * p[0],
		stdDefZoom * pyr,
	];
}

function mapToScreen(p)
{
	return worldToScreen(mapToWorld(p));
}

function pickMapCoord(p)
{
	// the map ground coord y at p
	var y = ((p[1] - gl.size[1] / 2) / camera.zoom + camera.pos[1]) / stdDefZoom * 2;
	// the nearest map ground coord row above p
	var fy = floor(y);
	// the map ground coord x in the chosen row
	var x = ((p[0] - gl.size[0] / 2) / camera.zoom + camera.pos[0]) / stdDefZoom - mod(fy, 2) / 2;
	// the nearest map ground coord column in the chosen row p lies between
	var fx = round(x);
	// lies p before or after the chosen column
	var before = x < fx;
	// is the chosen row an odd one
	var oddstart = mod(fy, 2);
	// the best fit to find
	var bestDist = undefined;
	var bestMapCoord = undefined;
	
	for(var i=0; i<256; i++) {
		// is the current row an odd one
		var oddrow = mod(fy + i, 2);
		// shift from start column by 0, -1 or +1
		var xshift = 1 * oddstart * !oddrow * !before - 1 * !oddstart * oddrow * before;
		// sample map coord
		var mapCoord2d = [fx + xshift, fy + i, 0];
		var mapCoord3d = [mapCoord2d[0], mapCoord2d[1], map ? map.getHeight(mapCoord2d) : 0];
		// sample screen point
		var screenPos = mapToScreen(mapCoord3d);
		// the squared distance from that sample to the input point
		var dist = vec2.sqdist(p, screenPos);
		
		if(bestDist !== undefined && dist > bestDist) {
			break;
		}
		
		bestDist = dist;
		bestMapCoord = mapCoord3d;
	}
	
	return bestMapCoord;
}
