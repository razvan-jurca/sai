// ..........................................................
// A foundation chart that has axis
// 
/*globals Sai */

Sai.AxisChartView = Sai.CanvasView.extend({

  makeAxis: function(canvas, sx, sy, ex, ey, axisAttrs, ticks){
    var path, i, len, dir, tLen, tickPts = {}, currTick, tickLabels = [],
        space, tp, tOff, tickFunc, rounder = this.rounder, step;
    
    axisAttrs = axisAttrs || {};
    step = axisAttrs.step || 1;
    // Draw the line to the end
    path = 'M%@1,%@2L%@3,%@4M%@1,%@2'.fmt(rounder(sx), rounder(sy), rounder(ex), rounder(ey));
    if (ticks){
      // console.log('ticks: %@, space: %@, start: {x: %@, y: %@}, end: {x: %@, y: %@}'.fmt(ticks.count, ticks.space, sx, sy, ex, ey));
      dir = ticks.direction;
      tLen = ticks.len;
      space = ticks.space;
      
      // Find the right tick intremental function based off of the axis (X or Y)
      tickFunc = dir === 'x' ? function(x,y,sp){ return [x, (y+tLen), (x+sp), y]; } : function(x,y,sp){ return [(x-tLen), y, x, (y-sp)]; };
      
      // Some times you want to ofset the start of the ticks to center
      tOff = ticks.offset || 0;
      if (tOff > 0 && tOff < 1){
        tp = tickFunc(sx,sy,space*tOff);
        sx = tp[2];
        sy = tp[3];
        path += 'M%@,%@'.fmt(rounder(sx), rounder(sy));
      }
      
      // Draw all the ticks
      for(i = 0, len = ticks.count; i < len; i++){
        tp = tickFunc(sx,sy,space);
        sx = tp[2];
        sy = tp[3];
        currTick = {x: rounder(tp[0]), y: rounder(tp[1])};
        if ((SC.none(ticks.hidden) || !ticks.hidden) && ticks.hidden === NO) {
          path += 'L%@,%@M%@,%@'.fmt(currTick.x, currTick.y, rounder(tp[2]), rounder(tp[3]));
        }
        tickPts[i] = {t: currTick, idx: i*step};
        tickLabels.push(''+i*step);
      }
    }
    //console.log('Axis Path: '+path);
    
    // Do Labels
    if (!SC.none(axisAttrs.labels)) this.makeLabels(canvas, tickPts, axisAttrs, ticks, tickLabels);
    
    canvas.path(path, {stroke: axisAttrs.color || 'black', strokeWidth: axisAttrs.weight || 1}, '%@-axis'.fmt(dir));
  },
  
  makeLabels: function(canvas, tickPts, axisAttrs, ticks, tLabels){
    var dir, labels, l, lAttrs, tick, aa, t, labelPosFunc, col,
        lWidth, lHeight, lOff, lsw, iWidth, iHeight, img, imag;
    
    aa = axisAttrs || {};
    dir = ticks ? ticks.direction || 'x' : 'x';
    labels = aa.labels || [];
    lAttrs = aa.labelAttrs || {};
    lWidth = lAttrs.width || ticks.space*0.9 || 50;
    lHeight = lAttrs.height || 15;
    // FIXME: [EG] HATE THIS...need to find out how to calulate the middle point of a text
    lOff = lAttrs.offset || 0;
    col = aa.labelColor || aa.color || 'black';
    lsw = SC.none(lAttrs.strokeWidth) || 0;
    iWidth = lAttrs.imageWidth || 0;
    iHeight = lAttrs.imageHeight || 0;
    img = lAttrs.image || null;
    
    // Create the label positioning function
    if (dir === 'x'){
      labelPosFunc = function(t, label){ 
        var x, y;
        x = +t.x - (lWidth/2);
        y = +t.y + lOff;
        canvas.text(x, y, lWidth, lHeight, label, {fill: col, stroke: col, textAnchor: 'center', fontSize: lAttrs.fontSize, strokeWidth: lsw}, 'label-%@'.fmt(label));
        // canvas.rectangle(x, y, lWidth, lHeight, 0, {fill: aa.labelColor || aa.color || 'black', textAnchor: 'center', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        if (img) {
          imag = Sai.Image.create({
            x: x + (iWidth/2) - 2,
            y: y,
            width: iWidth,
            height: iHeight,
            image: img
          });
          imag = canvas.element(imag);
          //canvas.image(x, y, iWidth, iHeight, img);
        }
      };
    }
    else{
      labelPosFunc = function(t, label){ 
        var x, y;
        x = t.x - lWidth;
        y = t.y - (lHeight/2) + lOff;
        canvas.text(x, y, lWidth, lHeight, label, {fill: col, stroke: col, textAnchor: 'right', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        // canvas.rectangle(x, y, lWidth, lHeight, 0, {fill: aa.labelColor || aa.color || 'black', textAnchor: 'right', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        if (img) {
          imag = Sai.Image.create({
            x: x + (iWidth/2) - 2,
            y: y,
            width: iWidth,
            height: iHeight,
            image: img
          });
          imag = canvas.element(imag);
          //canvas.image(x, y, iWidth, iHeight, img);
        }
      };
    }
    
    if (SC.typeOf(labels) === SC.T_HASH){ 
      this._generateIncrementalLabels(tickPts, labels, labelPosFunc, YES);
    }
    else if (SC.typeOf(labels) === SC.T_ARRAY){
      this._generateIncrementalLabels(tickPts, labels, labelPosFunc, NO);
    }
    else if (SC.typeOf(labels) === SC.T_BOOL){
      this._generateIncrementalLabels(tickPts, tLabels, labelPosFunc, NO);
    }
  },
  
  _generateIncrementalLabels: function(pts, labels, func, useIndex){
    var tick, t, l, idx;
    for (t in pts){
      tick = pts[t].t;
      idx = pts[t].idx;
      l = useIndex ? labels[idx] : labels[t];
      if (!SC.none(tick) && l) func(tick, l);
    }
  },
  
  /**
    Draws the grid of the chart.
    
    @param {Sai.Canvas} canvas The canvas onto which to draw the grid.
    @param {Array} axis An array containing the x and y axis definition. Each of
    the axis definitions should have the attributes coordMin, coordMax and space.
    @param {Number} sx The x coordinate of the left of the grid.
    @param {Number} sy The y coordinate of the top of the grid.
    @param {Number} ex The x coordinate of the right of the grid.
    @param {Number} ey The y coordinate of the bottom of the grid.
    @param {Object} gridAttrs The attributes used to style the grid's lines.
  */
  makeGrid: function(canvas, axis, sx, sy, ex, ey, gridAttrs) {
    var min, max, space,
        path = '',
        xa = axis[0],
        ya = axis[1];
    if (SC.none(gridAttrs)) return;
    
    if ((SC.none(gridAttrs.verticals) || gridAttrs.verticals) && !SC.none(xa)) {
      // Draw vertical lines
      min = Math.min(xa.coordMin, xa.coordMax);
      max = Math.max(xa.coordMin, xa.coordMax);
      if (!SC.none(xa.tickCount)) {
        max = min + xa.space * xa.tickCount;
      }
      for (var x=min + xa.space; x < max; x += xa.space) {
        path += 'M%@,%@L%@,%@'.fmt(x, sy, x, ey);
      }
    }
    if ((SC.none(gridAttrs.horizontals) || gridAttrs.horizontals) && !SC.none(ya)) {
      // Draw horizontal lines
      min = Math.min(ya.coordMin, ya.coordMax);
      max = Math.max(ya.coordMin, ya.coordMax);
      if (!SC.none(ya.tickCount)) {
        max = min + ya.space * ya.tickCount;
      }
      for (var y=max - ya.space; y > min; y -= ya.space) {
        path += 'M%@,%@L%@,%@'.fmt(sx, y, ex, y);
      }
    }
    
    if (path.length) {
      canvas.path(path, gridAttrs.pathAttr || { stroke: '#999', strokeWidth: 1 }, 'grid-lines');
    }
  },
  
  rounder: function(x){
    if (x > (~~x+0.00051)) return x.toFixed(3);
    return x.toFixed(0);
  }
});

