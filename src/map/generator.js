mapgen = {

	perlin: new Perlin(),
		
	height: function(p)
	{
		return 0;//this.perlin.sample(p) * 8;//25;
	},
	
	terra: function(p)
	{
		return floor(this.perlin.sample(p) * 3);
	},

};
