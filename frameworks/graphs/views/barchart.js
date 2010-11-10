// ..........................................................
// A basic Line chart
// 
/*globals Sai */
sc_require('views/axischart');

Sai.BarChartView = Sai.AxisChartView.extend({
  
  // ..........................................................
  // Properties
  
  // @param data: This is an array of arrays of pairs for the data points
  // @example: [[1,2,3], [4,5,6], [7,8,9]]
  // Bar #1: "1, 2, 3"
  // Bar #2: "4, 5, 6"
  data: null,
  
  // @param: dataAttrs - Hash of styling parameters
  // @example: {stacked: true, horizontal: true, colors: ['red' , 'blue', 'green'], stroke: 'black', strokeWidth: 1}
  dataAttrs: null,
  
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
  
  /**
    Attributes to apply to the grid.
    Posible values:
      - verticals = show vertical lines
      - horizontals = show horizontal lines
      - pathAttr = attributes used for rendering the grid's path
    
    @property {Object}
  */
  grid: { 
    verticals: YES,
    horizontals: YES,
    pathAttr: { stroke: '#999', strokeWidth: 1 }
  },
  
  // @param yaxis: {color: 'black', step: 10}
  yaxis: null,
  
  // @param xaxis: {color: 'black', labels: ['Morning', 'Afternoon', 'Evening']}
  xaxis: null,
  
  displayProperties: 'data dataAttrs grid yaxis xaxis'.w(),
  
  renderCanvas: function(canvas, firstTime) {
    var grid = this.get('grid'), barFunc,
        d = this.get('data') || [],
        legend = this.get('legend'),
        dAttrs = this.get('dataAttrs') || {stacked: NO, horizontal: NO, colors: 'black'},
        f = this.get('frame'), axis;
    if(d.length === 0) return;

    if (!firstTime) canvas.clear();  
    axis = this._makeAxi(f, canvas, d, dAttrs.stacked, dAttrs.horizontal) || [];
    this._makeGrid(f, canvas, axis, grid);
    if (dAttrs.stacked){
      barFunc = dAttrs.horizontal ? this._processDataAsHStackedBarGraph : this._processDataAsVStackedBarGraph;
      barFunc(f, canvas, d, dAttrs, axis[0], axis[1]);
    }
    else {
      barFunc = dAttrs.horizontal ? this._processDataAsHRegularBarGraph : this._processDataAsVRegularBarGraph;
      barFunc(f, canvas, d, dAttrs, axis[0], axis[1]);
    }
    this._makeLegend(f, canvas, legend, dAttrs, this.get('legendAttrs'), Math.min(axis[1].coordMin, axis[1].coordMax));
  },
  
  _processDataAsVRegularBarGraph: function(f, canvas, d, dAttrs, xaxis, yaxis){
    var x, xBase, bWidth = dAttrs.barWidth || 16, xSpace = xaxis.space,
        xOffset = (xSpace*xaxis.offset), y, 
        bHeight, bSpacing = dAttrs.barSpacing || 0,
        colors = dAttrs.color || dAttrs.colors || 'blue',
        stroke = dAttrs.stroke || 'black',
        strokeWidth = SC.none(dAttrs.strokeWidth) ? 0 : dAttrs.strokeWidth,
        gmn = xaxis.maxGroupNum;
    
    xBase = xaxis.coordMin;
    d.forEach( function(series, i){
      xBase += xSpace;
      x = xBase - xOffset;
      if (SC.typeOf(series) === SC.T_ARRAY){
        x -= ((gmn*bWidth) + ((gmn-1)*bSpacing))/2;
        series.forEach( function(bar, j){
          bHeight = yaxis.coordScale*bar;
          y = yaxis.coordMin-bHeight;
          canvas.rectangle(~~x, ~~y, bWidth, ~~bHeight, 0, {stroke: stroke, fill: colors[j], strokeWidth: strokeWidth}, 'bar-%@-%@'.fmt(i,j));
          x += bWidth+bSpacing;
        });
      }
      else {
        x -= (bWidth/2); 
        bHeight = yaxis.coordScale*series;
        y = yaxis.coordMin-bHeight;
        canvas.rectangle(~~x, ~~y, bWidth, ~~bHeight, 0, {stroke: stroke, fill: colors, strokeWidth: strokeWidth}, 'bar-%@'.fmt(i));
      }
    });
  },
  
  _processDataAsHRegularBarGraph: function(f, canvas, d, dAttrs, xaxis, yaxis){
    var y, yBase, bHeight = dAttrs.barWidth || 16, ySpace = yaxis.space,
        yOffset = (ySpace*yaxis.offset), x, 
        bWidth, bSpacing = dAttrs.barSpacing || 0,
        colors = dAttrs.color || dAttrs.colors || 'blue',
        stroke = dAttrs.stroke || 'black',
        strokeWidth = SC.none(dAttrs.strokeWidth) ? 0 : dAttrs.strokeWidth,
        gmn = yaxis.maxGroupNum, gmnStart = ((gmn*bHeight) + ((gmn-1)*bSpacing))/2;
        
    yBase = yaxis.coordMin;
    x = xaxis.coordMin;
    d.forEach( function(series, i){
      yBase -= ySpace;
      y = yBase + yOffset;
      if (SC.typeOf(series) === SC.T_ARRAY){
        y -= gmnStart;
        series.forEach( function(bar, j){
          bWidth = xaxis.coordScale*bar;
          canvas.rectangle(x, ~~y, bWidth, bHeight, 0, {stroke: stroke, fill: colors[j], strokeWidth: strokeWidth}, 'bar-%@-%@'.fmt(i,j));
          y += bHeight+bSpacing;
        });
      }
      else {
        y -= (bHeight/2); 
        bWidth = xaxis.coordScale*series;
        canvas.rectangle(x, ~~y, ~~bWidth, bHeight, 0, {stroke: stroke, fill: colors, strokeWidth: strokeWidth}, 'bar-%@'.fmt(i));
      }
    });
  },
  
  _processDataAsVStackedBarGraph: function(f, canvas, d, dAttrs, xaxis, yaxis){
    // TODO: [EG] Stacked bar graph
    var x, xBase, bWidth = dAttrs.barWidth || 16, xSpace = xaxis.space,
        xOffset = (xSpace*xaxis.offset), y, 
        bHeight, bSpacing = dAttrs.barSpacing || 0,
        colors = dAttrs.color || dAttrs.colors || 'blue',
        stroke = dAttrs.stroke || 'black',
        strokeWidth = SC.none(dAttrs.strokeWidth) ? 0 : dAttrs.strokeWidth;
    
    xBase = xaxis.coordMin;
    d.forEach( function(series, i){
      xBase += xSpace;
      x = xBase - xOffset;
      x -= (bWidth/2); 
      if (SC.typeOf(series) === SC.T_ARRAY){
        y = yaxis.coordMin;
        series.forEach( function(bar, j){
          bHeight = yaxis.coordScale*bar;
          y = y-bHeight;
          canvas.rectangle(~~x, ~~y, bWidth, ~~bHeight, 0, {stroke: stroke, fill: colors[j], strokeWidth: strokeWidth}, 'bar-%@-%@'.fmt(i,j));
        });
      }
      else {
        bHeight = yaxis.coordScale*series;
        y = yaxis.coordMin-bHeight;
        canvas.rectangle(~~x, ~~y, bWidth, ~~bHeight, 0, {stroke: stroke, fill: colors, strokeWidth: strokeWidth}, 'bar-%@'.fmt(i));
      }
    });
  },
  
  _processDataAsHStackedBarGraph: function(f, canvas, d, dAttrs, xaxis, yaxis){
    // TODO: [EG] Stacked bar graph
    var y, yBase, bHeight = dAttrs.barWidth || 16, ySpace = yaxis.space,
        yOffset = (ySpace*yaxis.offset), x, 
        bWidth, bSpacing = dAttrs.barSpacing || 0,
        colors = dAttrs.color || dAttrs.colors || 'blue',
        stroke = dAttrs.stroke || 'black',
        strokeWidth = SC.none(dAttrs.strokeWidth) ? 0 : dAttrs.strokeWidth;
    
    yBase = yaxis.coordMin;
    d.forEach( function(series, i){
      yBase -= ySpace;
      y = yBase + yOffset;
      y -= (bHeight/2); 
      if (SC.typeOf(series) === SC.T_ARRAY){
        x = xaxis.coordMin;
        series.forEach( function(bar, j){
          bWidth = xaxis.coordScale*bar;
          canvas.rectangle(~~x, ~~y, ~~bWidth, bHeight, 0, {stroke: stroke, fill: colors[j], strokeWidth: strokeWidth}, 'bar-%@-%@'.fmt(i,j));
          x += bWidth;
        });
      }
      else {
        bHeight = xaxis.coordScale*series;
        x = xaxis.coordMin-bHeight;
        canvas.rectangle(~~x, ~~y, bWidth, ~~bHeight, 0, {stroke: stroke, fill: colors, strokeWidth: strokeWidth}, 'bar-%@'.fmt(i));
      }
    });
  },
  
  _makeAxi: function(f, canvas, d, isStacked, isHorizontal){
    var axis, path, tCount, space, offset, barGroups, tmp, aa,
        tmpStartX, tmpStartY, tmpEndX, tmpEndY,
        xa = this.get('xaxis') || {},
        ya = this.get('yaxis') || {}, yScale,
        chartLayout = this.get('chartLayout'),
        xBuffer = xa.buffer || 0.1,
        yBuffer = ya.buffer || 0.1,
        startX = f.width*yBuffer,
        endX = f.width*0.95,
        // Y coordinate stuff
        startY = f.height*(1.0 - xBuffer),
        endY = f.height*0.05, dLen = d.length || 0;
        
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
    
    barGroups = this._calculateBarGroups(d, isStacked);
    // X Axis
    if (xa){
      // Calculate the coordinate system
      xa.coordMin = startX;
      xa.coordMax = endX;
      aa = isHorizontal ? this._calcForLabelAlignment(xa, startX, endX, barGroups.maxHeight) : this._calcForBarAlignment(dLen, xa, startX, endX, barGroups.maxGroupNum);
      xa = aa[0]; tCount = aa[1];
      if (SC.none(xa.hidden) || !xa.hidden) this.makeAxis(canvas, startX, startY, endX, startY, xa, {direction: 'x', len: 5, count: tCount, space: xa.space, offset: xa.offset});
    }
    // Y Axis
    if (ya){
      ya.coordMin = startY;
      ya.coordMax = endY;
      aa = isHorizontal ? this._calcForBarAlignment(dLen, ya, endY, startY, barGroups.maxGroupNum) : this._calcForLabelAlignment(ya, endY, startY, barGroups.maxHeight);
      ya = aa[0]; tCount = aa[1];
      if (SC.none(ya.hidden) || !ya.hidden) this.makeAxis(canvas, startX, startY, startX, endY, ya, {direction: 'y', len: 5, count: tCount, space: ya.space, offset: ya.offset});
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
  _makeLegend: function(frame, canvas, legend, dAttrs, lAttrs, top) {
    var labelWidth, xLeft, xRight, textWidth,
        width = frame.width,
        num = legend.length,
        colors = (dAttrs.color ? [dAttrs.color] : (dAttrs.colors || [])),
        stroke = dAttrs.stroke || 'black',
        strokeWidth = SC.none(dAttrs.strokeWidth) ? 0 : dAttrs.strokeWidth,
        barSize = lAttrs.sampleBarSize || 14,
        legendSize = lAttrs.width || frame.width,
        labelColor = lAttrs.labelColor || 'black',
        fontSize = lAttrs.fontSize || 12,
        textAnchor = lAttrs.align || 'center',
        defaultBarColor = lAttrs.defaultBarColor || '#aaa';
    
    if (top < 20 || num < 1) return;
    
    while (colors.length < num) {
      colors.push(defaultBarColor);
    }
    
    labelWidth = legendSize / num;
    xLeft = (width - legendSize) / 2;
    textWidth = labelWidth - barSize - 2;
    for (var i=0; i < num; ++ i) {
      canvas.rectangle(~~xLeft, 2, barSize, ~~barSize, 0, {stroke: stroke, fill: colors[i], strokeWidth: strokeWidth}, 'legend-%@'.fmt(i));
      canvas.text(~~(xLeft + 6 + barSize), 1, labelWidth - barSize - 12, fontSize, legend[i], {fill: labelColor, stroke: labelColor, textAnchor: textAnchor, fontSize: fontSize}, 'legend-label-%@'.fmt(i));
      xLeft += labelWidth;
    }
  },
  
  _calcForBarAlignment: function(len, axis, start, end, maxGroupNum){
    var tCount, tmp = (end - start);
    axis = axis || {};
  
    axis.space =  tmp / len;
    axis.offset = 0.5;
    axis.maxGroupNum = maxGroupNum;
    tCount = len;
    
    return [axis, tCount];
  },
  
  _calcForLabelAlignment: function(axis, start, end, maxHeight){
    var tCount, hasStepIncrement, hasStepCount;
    axis = axis || {};
    hasStepIncrement = !SC.none(axis.step);
    hasStepCount = !SC.none(axis.steps);

    axis.coordScale = (end - start) / maxHeight;
    
    if(!hasStepIncrement && !hasStepCount){ // make and educated guess with 25 tick marks
      tCount = 25;
      axis.step = ~~(maxHeight/tCount);
    } else if(hasStepCount){ // use a total count of X
      tCount = axis.steps;
      axis.step = ~~(maxHeight/tCount);
    } else { // Use step increments of X
      tCount = ~~(maxHeight / axis.step);
    }
    
    axis.space = (end - start)/tCount;
    tCount += 1; // add the last tick to the line
    axis.offset = 0;
    
    // Return modified Axis and tick count
    return [axis, tCount];
  },
  
  _calculateBarGroups: function(d, isStacked){
    var ret = {maxGroupNum: 0, maxHeight: 0}, mmax = Math.max,
        tmpMax = 0, tmpLen = 0; 
    d = d || [];
    if(isStacked){
      ret.maxGroupNum = 1;
      if (SC.typeOf(d[0]) === SC.T_ARRAY){
        // Find the Max Value and total group number
        d.forEach( function(data){
          tmpMax = 0;
          data.forEach( function(x){ tmpMax += x; });
          ret.maxHeight = ret.maxHeight < tmpMax ? tmpMax : ret.maxHeight;
        });
      }
      else {
        ret.maxHeight = mmax.apply(0, d) || 0;
      }
    }
    else {
      if (SC.typeOf(d[0]) === SC.T_ARRAY){
        // Find the Max Value and total group number
        d.forEach( function(data){
          tmpLen = data.length || 0;
          ret.maxGroupNum = ret.maxGroupNum < tmpLen ? tmpLen : ret.maxGroupNum;
          tmpMax = mmax.apply(0, data);
          ret.maxHeight = ret.maxHeight < tmpMax ? tmpMax : ret.maxHeight;
        });
      }
      else {
        ret.maxGroupNum = d.length || 0;
        ret.maxHeight = mmax.apply(0, d) || 0;
      }
    }

    return ret;
  }
});

