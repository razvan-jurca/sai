/*globals Sai*/
/**
  
  
  @author Razvan Jurca
  @class
*/
Sai.ClickablePieChartView = Sai.CanvasView.extend(Sai.ChartLegend, {
  
  ///
  /// Chart attributes
  ///
  
  /**
    Array of numerical data.
    
    @property {Array}
  */
  data: [],
  
  /**
    Array of percentages for the data.
    
    @property {Array}
  */
  percentage: function() {
    var data = this.get('data') || [],
        sum = data.reduce(function(a,b) {return a + b;}, 0);
    if (sum === 0) return data.map(function(v) { return 1 / data.length; });
    return data.map(function(v) { return v/sum; });
  }.property('data').cacheable(),
  
  /**
    Attributes for styling the chart.
    
    @property {Object}
  */
  attrs: {
    /**
      Colors use for the pie slices.
    */
    colors: [],
    /**
      Stroke color used for the pie slices.
    */
    stroke: 'black',
    /**
      Stroke width used for the pie slices.
    */
    strokeWidth: 1,
    /**
      Vertical align of the chart in the available space.
      
      top | bottom | center
    */
    valign: 'center',
    /**
      Horizontal align of the chart in the available space.
      
      left | right | center
    */
    halign: 'center',
    /**
      Wheter to trigger events for slice clicks.
    */
    clicks: NO,
    /**
      Wheter to display the values/percentages on the pie slices.
    */
    values: {
      percent: YES,
      /**
        Attributes used for the labels.
      */
      text: {
        fontSize: 9,
        fill: 'black'
      },
      /**
        Background for the label boxes
      */
      fill: 'white',
      /**
        Stroke for the label boxes
      */
      stroke: 'black',
      strokeWidth: 1
    }
  },
  
  /**
    Chart layout in the canvas frame.
  */
  chartLayout: { left: 5, right: 5, top: 5, bottom: 5 },
  
  displayProperties: ['chartLayout', 'attrs', 'percentage', 'frame', 'percentage'],
  
  ///
  /// Chart methods
  ///
  
  /**
    The event triggered when a slice was clicked. For the events to be called
    you must set the clicks attribute of the attrs property to YES.
    
    @param {Number} sliceIndex The index of the slice that was clicked.
  */
  sliceClicked: function(sliceIndex) {
    return NO;
  },
  
  /**
    Renders the chart.
  */
  renderCanvas: function(canvas, firstTime) {
    var frame = this.get('frame'),
        layout = this.get('chartLayout') || {},
        attrs = this.get('attrs') || {},
        percentage = this.get('percentage') || [],
        colors = attrs.colors || [],
        sliceAttrs = {
          strokeWidth: SC.none(attrs.strokeWidth) ? 1 : attrs.strokeWidth,
          stroke: attrs.stroke || 'black'
        },
        region, slices, cx, cy, r, i;
    
    layout.left = layout.left || 0;
    layout.right = layout.right || 0;
    layout.top = layout.top || 0;
    layout.bottom = layout.bottom || 0;
    
    if (!firstTime) canvas.clear();
    region = this._computeRegion(frame, layout, attrs);
    r = region.radius;
    cx = region.left + r;
    cy = region.top + r;
    
    slices = this._computeSlices(region, percentage, colors);
    for (i=0; i < slices.length; ++ i) {
      this._renderSlice(canvas, cx, cy, r, slices.objectAt(i), sliceAttrs, attrs.clicks || NO);
    }
    if (slices.length === 0) {
      canvas.circle(cx, cy, r, { stroke: '#777', strokeWidth: 1, fill: '#ddd' }, 'invalid-data-slice');
    }
    
    if (attrs.values) {
      var values = (attrs.values.percents ? percentage : this.get('data')) || [],
          mul = attrs.values.percents ? 100 : 1,
          extra = attrs.values.percents ? '%' : '',
          rattrs = { 
            fill: attrs.values.fill || 'transparent', 
            stroke: attrs.values.stroke || 'transparent', 
            strokeWidth: attrs.values.strokeWidth || 1 
          },
          tattrs = attrs.values.text || {}, text;
      
      tattrs.fontSize = tattrs.fontSize || 9;
      tattrs.fill = tattrs.fill || 'black';
      tattrs.textAnchor = 'center';
      
      for (i=0; i < slices.length; ++ i) {
        text = (Math.round(values.objectAt(i) * mul * 100) / 100).toString() + extra;
        this._renderValues(canvas, cx, cy, r, slices.objectAt(i), text, rattrs, tattrs, attrs.clicks || NO);
      }
    }
    
    this.makeLegend(canvas, frame, region);
  },
  
  ///
  /// Chart internals
  ///
  
  /**
    Computes the region in which to draw the chart.
    
    @param {Object} frame The frame of the chart.
    @param {Object} layout The chart's layout.
    @param {Object} attrs Chart attributes.
  */
  _computeRegion: function(frame, layout, attrs) {
    var width = Math.max(frame.width - layout.left - layout.right, 0),
        height = Math.max(frame.height - layout.top - layout.bottom, 0),
        x = layout.left, y = layout.top,
        diameted = Math.min(width, height),
        radius = diameted / 2;
    
    switch (attrs.valign) {
      case 'top':
        // y is already good
        break;
      case 'bottom':
        y += height - diameted;
        break;
      default:
        y += (height - diameted) / 2;
        break;
    }
    
    switch (attrs.halign) {
      case 'left':
        // x in already good
        break;
      case 'right':
        x += width - diameted;
        break;
      default:
        x += (width - diameted) / 2;
        break;
    }
    
    return { left: ~~x, top: ~~y, right: ~~(x + diameted), bottom: ~~(y + diameted), radius: ~~radius };
  },
  
  /**
    Computes the slices of the chart.
    
    @param {Object} region The region in which to draw the chart.
    @param {Array} percentage The array of percentages for the input data.
    @param {Array} colors The colors used to render the slices.
  */
  _computeSlices: function(region, percentage, colors) {
    var result = [], da = -90, sa, ea = da,
        percent = 0,
        plen = percentage.length;
    
    for (var i=0; i < plen; ++ i) {
      percent += percentage.objectAt(i);
      if (percentage.objectAt(i) > 0.001) {
        sa = ea;
        ea = percent * 360 + da;
        result.push({
          index: i,
          color: colors.objectAt(i) || '#aaa',
          sangle: sa,
          eangle: ea
        });
      }
    }
    
    return result;
  },
  
  /**
    Renders a slice of the chart.
    
    @param {Sai.Canvas} canvas The canvas onto which to draw.
    @param {Number} cx The x coordinate of the center of the chart.
    @param {Number} cy The y coordinate of the center of the chart.
    @param {Number} r The radius of the chart.
    @param {Object} slice The slice's properties.
    @param {Boolean} clicks Wheter to trigger click events.
    @private
  */
  _renderSlice: function(canvas, cx, cy, r, slice, attrs, clicks) {
    var that = this, x1, x2, y1, y2, path, rad = Math.PI / 180, elem;
    
    attrs.fill = slice.color;
    
    x1 = cx + r * Math.cos(slice.sangle * rad);
    x2 = cx + r * Math.cos(slice.eangle * rad);
    y1 = cy + r * Math.sin(slice.sangle * rad);
    y2 = cy + r * Math.sin(slice.eangle * rad);
    path = ['M', cx, cy, 'L', x1, y1, 'A', r, r, 0, +(Math.abs(slice.eangle - slice.sangle) > 180), 1, x2, y2, 'Z'];
    
    elem = canvas.path(path, attrs, 'slice-%@'.fmt(slice.index));
    // click support
    if (clicks) {
      elem.touchStart = elem.mouseDown = function() { return that.sliceClicked(slice.index); };
    }
  },
  
  /**
    Renders the labels on the chart's slices, showing the value or percentages.
    
    @param {Sai.Canvas} canvas The canvas onto which to draw.
    @param {Number} cx The x coordinate of the center of the chart.
    @param {Number} cy The y coordinate of the center of the chart.
    @param {Number} r The radius of the chart.
    @param {Object} slice The slice's properties.
    @param {String} text The text to display on the slice.
    @param {Object} rattrs The attributes used to render the background of the label.
    @param {Object} tattrs The attributes used to render the text.
    @private
  */
  _renderValues: function(canvas, cx, cy, r, slice, text, rattrs, tattrs, clicks) {
    var angle = (slice.eangle + slice.sangle) * Math.PI / 360,
        dm = r / 2,
        xm = cx + dm * Math.cos(angle),
        ym = cy + dm * Math.sin(angle),
        height = tattrs.fontSize * 1.1 + 4,
        width = Math.max(tattrs.fontSize * text.length * 0.8, height),
        w = width / 2,
        h = height / 2,
        that = this,
        elem1, elem2;
    
    elem1 = canvas.rectangle(xm - w, ym - h, width, height, 0, rattrs);
    elem2 = canvas.text(xm - w, ym - height / 1.2 + 2, width, height, text, tattrs);
    // click support
    if (clicks) {
      elem1.touchStart = elem1.mouseDown = elem2.touchStart = elem2.mouseDown = function() { return that.sliceClicked(slice.index); };
    }
  }
});