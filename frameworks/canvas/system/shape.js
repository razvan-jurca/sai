/*globals Sai */
sc_require('system/element');

Sai.Shape = Sai.Element.extend({
  
  fill: null,
  stroke: null,
  strokeWidth: null,
  
  basicAttrs: function(attrs){
    attrs = sc_super();
    
    // add the basic attrs
    attrs.fill = this.get('fill') || 'none';
    attrs.stroke = this.get('stroke') || 'none';
    attrs.opacity = SC.none(this.get('opacity')) ? 1 : this.get('opacity');
    attrs['stroke-width'] = Sai.isZeroOrValue(this.get('strokeWidth'), 0);
    return attrs;
  }
  
});

