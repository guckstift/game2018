function Layer(seed, zoom, amp)
{
	this.seed = seed;
	this.zoom = zoom;
	this.amp = amp;
	this.samples = new Dyn2dArray();
	this.samples.cellFactory = this.cellFactory.bind(this);
}

Layer.prototype = {

	constructor: Layer,
	
	sample: function(x, y)
	{
		var zx = x / this.zoom;
		var zy = y / this.zoom;
		var flx = floor(zx);
		var fly = floor(zy);
		var p = zx - flx;
		var q = zy - fly;
		var aa = this.samples.get(flx,     fly);
		var ba = this.samples.get(flx + 1, fly);
		var ab = this.samples.get(flx,     fly + 1);
		var bb = this.samples.get(flx + 1, fly + 1);
		
		var mixFunc = smoothMix;//linearMix;
		
		return this.amp * mixFunc(mixFunc(aa, ba, p), mixFunc(ab, bb, p), q);
	},
	
	cellFactory: function(x, y)
	{
		return noise2d(x, y, this.seed);
	},
};

function Perlin()
{
	this.layers = [
		new Layer(0, 1, 1),
		new Layer(1, 2, 2),
		//new Layer(2, 4, 4),
		//new Layer(3, 8, 8),
		//new Layer(4, 16, 16),
		//new Layer(5, 32, 32),
	];
}

Perlin.prototype = {

	constructor: Perlin,
	
	sample: function(x, y)
	{
		var sum = 0;
		var ampsum = 0;
		
		for(var i=0; i < this.layers.length; i++) {
			sum += this.layers[i].sample(x, y);
			ampsum += this.layers[i].amp
		}
		
		return sum / ampsum;
	},
};