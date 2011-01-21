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
  spinnerOverlayColor: 'white',
  
  /**
    The opacity of the overlay.
    
    @property {Number}
  */
  spinnerOverlayOpacity: 0.5,
  
  /**
    The size of the spinner to render.
    
    @property {Number}
  */
  spinnerSize: 40,
  
  /**
    The color used to draw the spokes of the spinner.
    
    @property {String}
  */
  spinnerColor: 'black',
  
  /**
    The number of milliseconds after which the animation repeats.
    
    @property {Number}
  */
  spinnerAnimationCycle: 800,
  
  /**
    Wheter to show the spinner or not.
    
    @property {Boolean}
  */
  showSpinner: YES,
  
  /**
    The desired framerate for the spinne animation (in frames per second).
    
    @property {Number}
  */
  spinnerFrameRate: 30,
  
  /**
    The timeout between animation frames in number of milliseconds.
    By default it is computed from the spinnerFrameRate property but it can be
    set to an explicit timeout value (in number of milliseconds).
    
    @property {Number}
  */
  spinnerAnimationTimeOut: function() {
    var rate = this.get('spinnerFrameRate') || 30;
    return ~~(1000 / rate);
  }.property('spinnerFrameRate').cacheable(),
  
  _spinner_elems: [],
  
  _spinner_animate: NO,
  
  displayProperties: ['spinnerOverlayColor', 'spinnerOverlayOpacity', 'spinnerSize', 'showSpinner', 'spinnerColor'],
  
  /**
    Start the animation when the spinner is displayed.
    
    @observes showSpinner
  */
  updateAnimationStatus: function() {
    if (this.get('showSpinner')) {
      if (!this._spinner_animate) {
        this._spinner_animate = YES;
        this._startTime = new Date();
        this._spinner_animation_updateSpokes(this);
      }
    } else {
      this._spinner_animate = NO;
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
        elems = [],
        spokeColor = this.get('spinnerColor');
    
    canvas.rectangle(0, 0, frame.width, frame.height, 0, { fill: this.get('spinnerOverlayColor') || 'white', opacity: this.get('spinnerOverlayOpacity') });
    
    for (var angle = 0; angle < 360; angle += 30) {
      elems.push(this._spinner_renderSpoke(canvas, x, y, angle, r, spokeColor));
    }
    this._spinner_elems = elems;
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
    
    @private
  */
  _spinner_animation_updateSpokes: function() {
    var now = new Date() - this._startTime,
        cycle = this.get('spinnerAnimationCycle'),
        elems = this._spinner_elems,
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
    
    if (this._spinner_animate) {
      this.invokeLater(this._spinner_animation_updateSpokes, this.get('spinnerAnimationTimeOut'), this);
    }
  }
};