/*globals Sai*/
/**
  @author Razvan Jurca
*/
Sai.PieChart2View = Sai.CanvasView.extend(Sai.ChartLegend, {
  
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
      Wheter to display the values/percentages on the pie slices.
    */
    values: {
      percent: YES,
      /**
        The position of the labels.
      */
      position: 'center',
      /**
        Attributes used for the labels.
      */
      attrs: {
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
  
  displayProperties: ['chartLayout', 'attrs', 'percentage', 'frame'],
  
  /**
    Renders the chart.
  */
  renderCanvas: function(canvas, firstTime) {
    var frame = this.get('frame'),
        layout = this.get('chartLayout') || {},
        attrs = this.get('attrs') || {},
        region;
    
    layout.left = layout.left || 0;
    layout.right = layout.right || 0;
    layout.top = layout.top || 0;
    layout.bottom = layout.bottom || 0;
    
    region = this._computeRegion(frame, layout, attrs);
    
    this.makeLegend(canvas, frame, layout);
  },
  
  _computeRegion: function(frame, layout, attrs) {
    var width = Math.max(frame.width - layout.left - layout.right, 0),
        height = Math.max(frame.height - layout.top - layout.bottom, 0),
        x = layout.left, y = layout.right,
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
  }
});