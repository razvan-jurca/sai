/*globals Sai */
sc_require('system/shape');

Sai.Path = Sai.Shape.extend({
  isPath: YES,
  path: null,
  
  render: function(canvas, firstTime) {
    var elem = null,
        path = this.get('path'),
        attrs = this.basicAttrs();
        
    elem = Sai.canvas_create('path', canvas, path, attrs);
    this._element = elem;
  },
  
  /**
    Override the basic attrs of a shape to include dotted, dashed line.
  */
  basicAttrs: function(attrs) {
    attrs = sc_super();    
    attrs.dotted = this.get('dotted') || 'none';
    return attrs;
  }
});

