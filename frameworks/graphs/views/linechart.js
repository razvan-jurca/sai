// ..........................................................
// A basic Line chart
// 
/*globals Sai */
sc_require('views/axischart');

Sai.LineChartView = Sai.AxisChartView.extend({
  
  // ..........................................................
  // Properties
  
  // @param data: This is an array of arrays of pairs for the data points
  // @example: [[[1,2], [3,4]], [[5,6], [7,8]]]
  // Line #1: "x=1,y=2", "x=3,y=4"
  // Line #2: "x=5,y=6", "x=7,y=8"
  data: null,
  
  // @param: dataAttrs - Array of styling parameters
  // @example: [{color: 'red', weight: 1}, {color: 'green', weight: 2}]
  dataAttrs: null,
  
  // @param grid: show a grid for all the points
  grid: null,
  
  // @param yaxis: {min: 10, max: 100, step: 10}
  yaxis: null,
  
  // @param xaxis: {min: 10, max: 100, step: 10, weight: 1, color: 'blue'}
  xaxis: null,
  
  
  /**
    Offset the graph relative to the margins. Use only left, right, top, bottom.
    Use null to have default behaviour.
    
    @property {Object}
  */
  chartLayout: null,
  
  displayProperties: 'data dataAttrs grid yaxis xaxis'.w(),
  
  renderCanvas: function(canvas, firstTime) {
    var clayout, grid = this.get('grid'),
        f = this.get('frame'), axis,
        dAttrs = this.get('dataAttrs');
    if (!firstTime) canvas.clear();
    
    axis = this._makeAxi(f, canvas);
    this._makeGrid(f, canvas, axis, grid);
    this._processData(f, canvas, axis[0], axis[1]);
    
    clayout = {
      left: Math.min(axis[0].coordMin, axis[0].coordMax),
      right: Math.max(axis[0].coordMin, axis[0].coordMax),
      top: Math.min(axis[1].coordMin, axis[1].coordMax),
      bottom: Math.max(axis[1].coordMin, axis[1].coordMax)
    };
    this.makeLegend(canvas, f, clayout);
  },
  
  _processData: function(f, canvas, xaxis, yaxis){
    var d = this.get('data') || [],
        dAttrs = this.get('dataAttrs'), attrs,
        xScale = xaxis.coordScale, yScale = yaxis.coordScale, path,
        scaledX, scaledY, scaled, scaledData = [],
        xmin = xaxis.coordMin, xmax = xaxis.coordMax,
        ymin = yaxis.coordMin, ymax = yaxis.coordMax;
        
    // Calculate the scaling factor
    d.forEach( function(line, i){
      scaled = [];
      attrs = dAttrs[i] || {color: 'red', weight: 1};
      line.forEach( function(point, j){
        scaledX = xmin + (point[0]*xScale);
        scaledY = ymin - (point[1]*yScale);
        if (j > 0){
          path += '%@,%@ '.fmt(scaledX, scaledY);
        } else {
          path = 'M%@,%@L'.fmt(scaledX, scaledY);
        }
      });
      // console.log('Line Path: ' + path);
      canvas.path(path, attrs, 'line-%@'.fmt(i));
    });   
  },
  
  _makeAxi: function(f, canvas){
    var axis, path, buffer = 0.1, tCount, space,
        hidden,
        xa = this.get('xaxis') || {},
        startX = f.width*buffer,
        endX = f.width*(1.0 - buffer),
        // Y coordinate stuff
        ya = this.get('yaxis') || {}, yScale,
        startY = f.height*(1.0 - buffer),
        tmpStartX, tmpStartY, tmpEndX, tmpEndY,
        chartLayout = this.get('chartLayout'),
        endY = f.height*buffer;
    
    if (!SC.none(chartLayout)) {
      tmpStartX = chartLayout.left || 10;
      tmpStartY = f.height - (chartLayout.bottom || 10);
      tmpEndX = f.width - (chartLayout.right || 10);
      tmpEndY = chartLayout.top || 10;
    
      if (tmpStartX < tmpEndX) {
        startX = tmpStartX;
        endX = tmpEndX;
      }
    
      if (tmpStartY > tmpEndY) {
        startY = tmpStartY;
        endY = tmpEndY;
      }
    }
    
    // X Axis
    if (xa){
      // Calculate the coordinate system
      xa.coordMin = startX;
      xa.coordMax = endX;
      xa.coordScale = (endX - startX) / (xa.max - xa.min);
      tCount = ((xa.max - xa.min) / xa.step);
      space = (endX - startX)/tCount;
      xa.space = space;
      tCount = ~~tCount;
      if (!SC.none(xa.ticks)) {
        this.makeAxis(canvas, startX, startY, endX, startY, xa, {direction: 'x', len: 5, count: tCount+1, space: space, hidden: !xa.ticks});
      } else {
        this.makeAxis(canvas, startX, startY, endX, startY, xa, {direction: 'x', len: 5, count: tCount+1, space: space});
      }
    }
    // Y Axis
    if (ya){
      ya.coordMin = startY;
      ya.coordMax = endY;
      ya.coordScale = (startY - endY) / (ya.max - ya.min);
      tCount = ((ya.max - ya.min) / ya.step);
      space = (startY - endY)/tCount;
      ya.space = space;
      tCount = ~~tCount;
      if (!SC.none(ya.ticks)) {
        this.makeAxis(canvas, startX, startY, startX, endY, ya, {direction: 'y', len: 5, count: tCount+1, space: space, hidden: !ya.ticks});
      } else {
        this.makeAxis(canvas, startX, startY, startX, endY, ya, {direction: 'y', len: 5, count: tCount+1, space: space});
      }
    }
    
    return [xa, ya];
  },
  
  /**
    Draw the grid of the chart.
  
    @param {Object} f The frame of the view.
    @param {Sai.Canvas} canvas The canvas on which to draw the grid.
    @param {Array} axis An array containing the x and y axis definitions.
    @param {Object} grid The attribute hash used to style the grid.
    @private
  */
  _makeGrid: function(f, canvas, axis, grid) {
    var startX = Math.min(axis[0].coordMin, axis[0].coordMax),
        startY = Math.min(axis[1].coordMin, axis[1].coordMax),
        endX = Math.max(axis[0].coordMin, axis[0].coordMax),
        endY = Math.max(axis[1].coordMin, axis[1].coordMax);
    
    this.makeGrid(canvas, axis, startX, startY, endX, endY, grid);
  },
  
  mouseDown: function(evt) {
    // console.log(evt.target);
  }
  
});

