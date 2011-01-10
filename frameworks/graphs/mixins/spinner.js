/*globals Sai*/
/**
  Spinner mixin providing functions for rendering a loading spinner.
  Usage: include the renderSpinner method at the end of the renderCanvas method.
  @example
    renderCanvas: function(canvas, firstTime) {
      ...
      this.renderSpinner(canvas, firstTime);
    }
*/
Sai.Spinner = {
  /**
    The color which to draw the overlay.
    
    @propert {String}
  */
  overlayColor: 'white',
  
  /**
    The opacity of the overlay.
    
    @property {Number}
  */
  overlayOpacity: 0.5,
  
  /**
    The size of the spinner to render.
    
    @property {Number}
  */
  spinnerSize: 40,
  
  /**
    The number of milliseconds after which the animation repeats.
    
    @property {Number}
  */
  cycle: 1000,
  
  /**
    Wheter to show the spinner or not.
    
    @property {Boolean}
  */
  showSpinner: YES,
  
  _elems: [],
  
  _animate: NO,
  
  displayProperties: ['overlayColor', 'overlayOpacity', 'spinnerSize', 'showSpinner'],
  
  /**
    Start the animation when the spinner is displayed.
    
    @observes showSpinner
  */
  updateAnimationStatus: function() {
    if (this.get('showSpinner')) {
      if (!this._animate) {
        this._animate = YES;
        this._startTime = new Date();
        this._animation_updateSpokes(this);
      }
    } else {
      this._animate = NO;
    }
  }.observes('showSpinner'),
  
  /**
    Render the spinner. This method should be called a the end of the renderCanvas
    method to display the spinner.
  */
  renderSpinner: function(canvas, firstTime) {
    if (!this.get('showSpinner')) return;
    
    var frame = this.get('frame'),
        size = Math.min(frame.width, frame.height, this.get('spinnerSize')),
        r = ~~(size /2),
        x = ~~((frame.width - size) / 2) + r,
        y = ~~((frame.height - size) / 2) + r,
        elems = [];
    
    canvas.rectangle(0, 0, frame.width, frame.height, 0, { fill: this.get('overlayColor') || 'white', opacity: this.get('overlayOpacity') });
    
    for (var angle = 0; angle < 360; angle += 30) {
      elems.push(this._spinner_renderSpoke(canvas, x, y, angle, r, 'black'));
    }
    this._elems = elems;
    this.invokeLater(function() { this.updateAnimationStatus(); });
  },
  
  /**
    Render a spoke of the spinner.
    
    @param {Number} x The x coordinate of the center of the spinner.
    @param {Number} y The y coordinate of the center of the spinner.
    @param {Number} a The angle of the spoke.
    @param {Number} r The radius of the spoke.
    @param {String} color The color to use for rendering.
    @private
  */
  _spinner_renderSpoke: function(canvas, x, y, a, r, color) {
    var rad = Math.PI / 180,
        sa = a - 5, ea = a + 5,
        ss = Math.sin(sa * rad), sc = Math.cos(sa * rad),
        es = Math.sin(ea * rad), ec = Math.cos(ea  *rad),
        sr = r * 0.5,
        x1 = x + sc * sr, y1 = y + ss * sr,
        x2 = x + sc * r,  y2 = y + ss * r,
        x3 = x + ec * r,  y3 = y + es * r,
        x4 = x + ec * sr, y4 = y + es * sr,
        path = 'M%@,%@L%@,%@L%@,%@L%@,%@Z'.fmt(x1, y1, x2, y2, x3, y3, x4, y4);
    
    return canvas.path(path, { fill: color }, 'spinner-%@deg'.fmt(a));
  },
  
  /**
    Update the spokes' opacity at each animation step.
    
    @param {Sai.Spinner} that The spinner to animate.
    @private
  */
  _animation_updateSpokes: function(that) {
    var now = new Date() - that._startTime,
        cycle = 600, // repeat every cycle milliseconds
        elems = that._elems,
        len = elems.length,
        count = len,
        display = Math.min(len, 4),
        offset, round, elem, dalpha, alpha, i;
    
    offset = (now % cycle) * len / cycle;
    round = ~~offset;
    dalpha = 1 - (offset - round);
    
    // Set the not displayed spokes as transparent
    for (i = 0; i < len; ++ i) {
      if (i < round || i >= round + count) {
        elem = elems.objectAt(i);
        if (elem && elem._element) elem._element.setAttributeNS(null, 'opacity', 0);
      }
    }
    // Set the displayed spokes' opacity
    for (i=0;i<count;++i) {
      elem = elems.objectAt( (i + round) % len );
      alpha = (i + dalpha) / count;
      if (elem && elem._element) {
        elem._element.setAttributeNS(null, 'opacity', alpha);
      }
    }
    
    if (that._animate) setTimeout(function() { that._animation_updateSpokes(that) }, 0);
  }
};