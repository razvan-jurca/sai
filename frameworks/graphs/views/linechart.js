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
  
  /**
    The labels of the chart's legend.
    
    @property {Array}
  */
  legend: [],
  
  /**
    The attributes to use for displaying the legend.
      - width = the width of the legend area
      - sampleBarSize = the size of the colored bar to be displayed
      - align = text align: center, left, right
      - fontSize = the size of the font used for the labels
      - labelColor = the color of the labels
      - defaultBarColor = the color to be used for the sample bars that don't 
    have a corresponding color in data attributes color.
      
    @property {Object}
  */
  legendAttrs: { 
    width: 200, 
    sampleBarSize: 14,
    align: 'left',
    fontSize: 12,
    labelColor: 'black',
    defaultBarColor: '#aaa'
  },
  
  displayProperties: 'data dataAttrs grid yaxis xaxis'.w(),
  
  renderCanvas: function(canvas, firstTime) {
    var grid = this.get('grid'),
        f = this.get('frame'), axis,
        legend = this.get('legend'),
        dAttrs = this.get('dataAttrs');
    if (!firstTime) canvas.clear();
    
    axis = this._makeAxi(f, canvas);
    this._makeGrid(f, canvas, axis, grid);
    if (legend) {
      this._makeLegend(f, canvas, legend, dAttrs, this.get('legendAttrs'), Math.max(axis[0].coordMin, axis[0].coordMax));
    }
    this._processData(f, canvas, axis[0], axis[1]);
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
      tCount = ~~((xa.max - xa.min) / xa.step);
      space = (endX - startX)/tCount;
      xa.space = space;
      this.makeAxis(canvas, startX, startY, endX, startY, xa, {direction: 'x', len: 5, count: tCount+1, space: space});
    }
    // Y Axis
    if (ya){
      ya.coordMin = startY;
      ya.coordMax = endY;
      ya.coordScale = (startY - endY) / (ya.max - ya.min);
      tCount = ~~((ya.max - ya.min) / ya.step);
      space = (startY - endY)/tCount;
      ya.space = space;
      this.makeAxis(canvas, startX, startY, startX, endY, ya, {direction: 'y', len: 5, count: tCount+1, space: space});
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
  
  /**
    Draw the legend of the chart.
    
    @param {Object} frame The frame of the view.
    @param {Sai.Canvas} canvas The canvas on which to draw the legend.
    @param {Array} legend The array of labels for the legend.
    @param {Object} dAttrs The attributes of the bar's.
    @param {Object} lAttrs The attributes used to style the legend.
    @param {Number} top The y coordinate of the top of the chart.
  */
  _makeLegend: function(frame, canvas, legend, dAttrs, lAttrs, left) {
    var xLeft, width, height, xTop,
        num = legend.length,
        colors = [],
        stroke = '#555',
        strokeWidth = 1,
        barSize = lAttrs.sampleBarSize || 14,
        legendSize = lAttrs.height || frame.height,
        labelColor = lAttrs.labelColor || 'black',
        fontSize = lAttrs.fontSize || 12,
        textAnchor = lAttrs.align || 'center',
        defaultBarColor = lAttrs.defaultBarColor || '#aaa';
    
    for (var idx=0; idx < dAttrs.length; ++ idx) {
      if (!SC.none(dAttrs.objectAt(idx)) && !SC.none(dAttrs.objectAt(idx).stroke)) {
        colors.push(dAttrs.objectAt(idx).stroke);
      }
    }
    
    if (width - left < 100 || num < 1) return;
    
    while (colors.length < num) {
      colors.push(defaultBarColor);
    }
    
    xLeft = left + 10;
    width = ~~(frame.width - left - 20 - barSize);
    if (width < 50) return;
    height = legendSize / num;
    xTop = ~~((frame.height - legendSize) / 2);
    
    for (var i=0; i < num; ++ i) {
      canvas.rectangle(~~xLeft, ~~xTop + 1, ~~barSize, ~~barSize, 0, {
          stroke: stroke,
          fill: colors[i],
          strokeWidth: strokeWidth
        }, 'legend-%@'.fmt(i));
      canvas.text(~~(xLeft + 4 + barSize), ~~xTop, width, fontSize, legend[i], {
          fill: labelColor,
          stroke: labelColor,
          textAnchor: textAnchor,
          fontSize: fontSize
        }, 'legend-label-%@'.fmt(i));
      xTop += height;
    }
  },
  
  mouseDown: function(evt) {
    // console.log(evt.target);
  }
  
});

