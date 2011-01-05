// ..........................................................
// A foundation chart that has axis
// 
/*globals Sai */

Sai.AxisChartView = Sai.CanvasView.extend({

  /**
    The chart's legend attributes and labels.
    
    Structure of the legend hash (+ = required, ? = optional):
    
      legend: {
        // An array of the labels to be displayed
        + labels: [ ... ],
        // The positioning of the legend
        // if not specified it will use the following values:
        // { valign: 'fill', halign: 'fill', hideOnOversize: YES, position: 'top' }
        ? layout: {
          ? left: Number,
          ? top: Number,
          ? width: Number,
          ? height: Number,
                     
          // the alignment of the chart in the space on the sides of the chart
          ? valign: 'top' | 'bottom' | 'center' | 'fill',
          ? halign: 'left' | 'right' | 'center' | 'fill',
          
          // whether to display the legend when it doesn't fit in the area on the
          // sides of the chart
          ? displayOnOversize: NO,
          
          // The position of the chart 
          //
          // For custom positioning use 'top' (horizontal legend) or 'left'
          // (vertical legend) with left, top attributes set and displayOnOversize: YES
          //
          // The left and top attributes above offset the position of the chart
          // from the position given by height/width, valign/halign and position
          position: 'top' | 'bottom' | 'left' | 'right'
        },
        
        text: {
          // any valid attributes for a Sai.Text element
        },
        
        // The sample shapes showing to which color the element of the legend corresponds
        ? sample: {
          + colors: [ ... ],
          // The shape to draw.
          // Other shapes can be drawn by using shape: 'custom_shape_name' and 
          // creating a function with the following signature:
          // legendShapeRenderer_custom_shape_name: function(canvas, position, layout, attr, index) {...}
          // canvas = the canvas to use for drawing
          // position = the position of the shape (position.cx, position.cy) are
          // the coordinates where the legend item begins
          // layout = the layout of the shape layout.w = width, layout.h = height
          // layout.r = radius for circular shapes, layout.dx = the recommended offset
          // from position.cx , layout.dy = the recommended offset from position.cy
          + shape: 'rect' | 'circle' | 'triangle' | define your own,
          + size: { width: 10, height: 10 },
          + stroke: color,
          + strokeWidth: Number
        }
      }
  */
  legend: null,
  
  displayProperties: ['legend'],

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
  },
  
  /**
    Draws the legend of the chart.
    
    @param {Sai.Canvas} canvas The canvas to use for rendering the legend.
    @param {Object} frame The frame of the chart.
    @param {Object} chartLayout The layout of the chart in the frame, must have
    top, left, right and bottom attributes set. The right and bottom are relative
    to the left and top of the canvas (not to the right / bottom).
  */
  makeLegend: function(canvas, frame, chartLayout) {
    var legend = this.get('legend');
    
    // if there is no legend to display avoid layout computations
    if (!legend || !legend.labels || legend.labels.length < 1) return;
    
    var layout, position, sampleLayout, textLayout, itemHeight, textHeight,
        labels = legend.labels,
        count = labels.length,
        text = legend.text || {},
        sample = legend.sample || { colors: [], shape: 'rect', hide: YES, size: {width: 0, height: 0} },
        sampleAttr = {stroke: 'black', fill: 'black', stroke: sample.stroke, strokeWidth: sample.strokeWidth},
        colors = sample.colors || [],
        defaultColor = '#999',
        // get the sample renderer
        shapeRenderer = this.get('legendShapeRenderer_' + sample.shape) || this.legendShapeRenderer_rect;
    text.fontSize = text.fontSize || 12;
    textHeight = ~~(text.fontSize * 0.8);
    text.fill = text.fill || 'black';
    // add colors to the sample shapes array untill we have enought of them
    while (colors.length < count) { colors.push(defaultColor); }
    
    // find the region in which we will draw the legend
    layout = this._parseLegendLayout(legend, frame, chartLayout);
    if (SC.none(layout)) return;
    
    // computer a positioning hash (X,Y) coordinate and coordinate offsets for
    // going to the next element
    position = {
      x: layout.left,
      y: layout.top,
      dx: 0,
      dy: 0
    };
    // The offset and size of the labels relative to the current legend element
    textLayout = { dy: 0, dx: 0, w: ~~layout.width, h: ~~layout.height };
    if (layout.direction === 'vertical') {
      position.dx = 0;
      position.dy = layout.height / count;
      itemHeight = position.dy;
      textLayout.h = ~~position.dy;
    } else {
      position.dx = layout.width / count;
      position.dy = 0;
      itemHeight = layout.height;
      textLayout.w = ~~position.dx;
    }
    if (textLayout.h > textHeight) {
      textLayout.dy = ~~((textLayout.h - textHeight) / 2);
      textLayout.h = textHeight;
    }
    position.cx = position.x; // current item x
    position.cy = position.y; // current item y
    
    // The offset and size of the sample shaped relative to the current legend element
    sampleLayout = { dy: ~~((itemHeight - sample.size.height) / 2), dx: 0, w: ~~sample.size.width, h: ~~sample.size.height };
    if (!sample.hide) {
      textLayout.dx = ~~(sampleLayout.dx + sampleLayout.w + 3);
      textLayout.w -= textLayout.dx;
    }
    sampleLayout.r = ~~(Math.min(sampleLayout.w, sampleLayout.h) / 2);
    
    // Draw the labels and shapes for of the legend
    for (var i=0; i < count; ++ i) {
      // Draw the sample shape of the legend if it shouldbe displayed
      if (!sample.hide) {
        sampleAttr.fill = colors.objectAt(i);
        shapeRenderer(canvas, position, sampleLayout, sampleAttr, i);
      }
      // Draw the text
      canvas.text(
        ~~(position.cx + textLayout.dx),
        ~~(position.cy + textLayout.dy),
        textLayout.w, textLayout.h, labels.objectAt(i), text);
      
      // Move to the coordinates of the next element
      position.cx += position.dx;
      position.cy += position.dy;
    }
    
  },
  
  legendShapeRenderer_rect: function(canvas, position, layout, attrs) {
    canvas.rectangle(
      ~~(position.cx + layout.dx),
      ~~(position.cy + layout.dy),
      layout.w, layout.h, 0, attrs);
  },
  
  legendShapeRenderer_circle: function(canvas, position, layout, attrs) {
    canvas.circle(
      ~~(position.cx + layout.dx + layout.r),
      ~~(position.cy + layout.dy + layout.r),
      layout.r, attrs);
  },
  
  legendShapeRenderer_triangle: function(canvas, position, layout, attrs) {
    var x = ~~(position.cx + layout.dx),
        y = ~~(position.cy + layout.dy),
        w = ~~layout.w,
        h = ~~layout.h,
        c = ~~(layout.w/2);
    var path = 'M'+(x+c)+','+y+'L'+(x+w)+','+(y+h)+'L'+x+','+(y+h)+'Z';
    canvas.path(path, attrs);
  },
  
  /**
    Parse the legend hash and compute the region in which the legend should be drawn.
    
    @param {Object} legend The legend hash.
    @param {Object} frame The frame of the chart.
    @param {Object} chartLayout A hash describing the empty sides of the chart.
    @private
  */
  _parseLegendLayout: function(legend, frame, chartLayout) {
    var left, top, width, height, region,
        layout = legend.layout || { },
        position = layout.position || 'right';
    
    // set attributes to defaults in not set
    layout.valign = (['top', 'bottom', 'center', 'fill'].indexOf(layout.valign) >= 0) ? layout.valign : 'fill';
    layout.halign = (['left', 'right', 'center', 'fill'].indexOf(layout.halign) >= 0) ? layout.halign : 'fill';
    layout.displayOnOversize = layout.displayOnOversize || NO;
    if (!SC.none(layout.width) && layout.halign === 'fill') layout.halign = 'center';
    if (!SC.none(layout.height) && layout.valign === 'fill') layout.valign = 'center';
    
    // compute the width and height of the legend area
    width = ~~((layout.halign === 'fill' || SC.none(layout.width)) ?
      (
        ['top', 'bottom'].indexOf(position) >= 0 ?
          frame.width
          : (position === 'left' ? chartLayout.left : frame.width - chartLayout.right)
      )
      : layout.width);
    height = ~~((layout.valign === 'fill' || SC.none(layout.height)) ?
      (
        ['left', 'right'].indexOf(position) >= 0 ?
          frame.height
          : (position === 'top' ? chartLayout.top : frame.height - chartLayout.bottom)
      )
      : layout.height);
    
    
    // Compute the region in which to render the legend
    switch (position) {
      case 'top':
        region = {left: 0, top: 0, width: frame.width, height: chartLayout.top};
        break;
      case 'bottom':
        region = {left: 0, top: chartLayout.bottom, width: frame.width, height: frame.height - chartLayout.bottom};
        break;
      case 'left':
        region = {left: 0, top: 0, width: chartLayout.left, height: frame.height};
        break;
      default:
        region = {left: chartLayout.right, top: 0, width: frame.width - chartLayout.right, height: frame.height};
        break;
    }
    
    if (!layout.displayOnOversize && (region.width < width || region.height < height)) return null;
    // compute the position of the chart in the region specified by the position attribute
    switch (layout.halign) {
      case 'right':
        left = region.left + Math.max(region.width - width, 0);
        break;
      case 'center':
        left = region.left + Math.max(region.width - width, 0) / 2;
        break;
      default: // left && fill
        left = region.left;
        break;
    }
    left += layout.left || 0;
    
    switch (layout.valign) {
      case 'bottom':
        top = region.top + Math.max(region.height - height, 0);
        break;
      case 'center':
        top = region.top + Math.max(region.height - height, 0) / 2;
        break;
      default: // top && fill
        top = region.top;
        break;
    }
    top += layout.top || 0;
    
    return {
      left: ~~left,
      top: ~~top,
      width: ~~width,
      height: ~~height,
      direction: (position === 'left' || position === 'right') ? 'vertical' : 'horizontal'
    };
  }
  
});

