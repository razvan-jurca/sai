// ..........................................................
// Sai - Helper Functions for creating primatives in SVG
// for Sai
// 
sc_require('core_helpers');
sc_require('core_paths');
/*globals Sai */
Sai.mixin({
  
  svg_clear: function(canvas){
    var fc = canvas ? canvas.firstChild : 0;
    while (fc) {
      canvas.removeChild(fc);
      fc = canvas.firstChild || 0;
    }
    return canvas;
  },
  
  svg_canvas_create: function(id, width, height){
    var canvas;
    canvas = document.createElementNS(this.svgns, 'svg');
    canvas.setAttributeNS(null, 'id', id);
    canvas.setAttributeNS(null, 'version', '1.1');
    canvas.setAttributeNS(null, 'baseProfile', 'full');
    canvas.setAttributeNS(null, 'width', '%@px'.fmt(width));
    canvas.setAttributeNS(null, 'height', '%@px'.fmt(height));
    return canvas;
  },
  
  // ..........................................................
  // SVG Attr API
  // @param: attrs string | Hash 
  // @param: value (optional) ANY
  svg_attr_set: function(canvas, elem, attrs, value){
    var key, normVal;
    value = value || null;
    
    // defaults
    if (SC.typeOf(attrs) === SC.T_STRING){
      normVal = this.svg_format_attr(elem, attrs, value, null);
    }
    else if (SC.typeOf(attrs) === SC.T_HASH){
      attrs.stroke = attrs.stroke || 'none';
      attrs.fill = attrs.fill || 'none';
      for(key in attrs){
        normVal = this.svg_format_attr(elem, key, attrs[key], attrs);
      }
    }
    
    return elem;
  },
  
  svg_format_attr: function(elem, attr, val, attrs){
    var nVal = val, nAttr = attr, lookup, width, dWidth;
    attr = attr ? attr.toLowerCase() : null;
    
    if (attr === 'stroke-width'){
      // TODO: [EG] more code here to do the right thing...
      nVal = '%@px'.fmt(val);
    }
    else if (attr === 'fill'){
      nVal = Sai.toRGB(val).hex;
      // In the case where it is a gradient and not a color value
      // if (nVal.error){
      //   nVal = this._gradientFill(elem, val);
      // }
    }
    else if (attr === 'stroke'){
      nVal = Sai.toRGB(val).hex;
    }
    else if (attr === 'rotate'){
      nAttr = 'transform';
      nVal = 'rotate(%@ %@ %@)'.fmt(val.rotation, val.x, val.y);
    }
    // Text Only Params
    else if (attr === 'text-anchor'){
      lookup = {left: 'start', center: 'middle', right: 'end'};
      nVal = lookup[val] || 'start';
    }
    // Dotted line
    else if (attr === 'dotted') {
      if (SC.none(attrs)) {
        width = 2;
      } else {
        width = attrs['stroke-width'] || 2;
      }
      dWidth = width * 2;
      nAttr = 'stroke-dasharray';
      if (val === 'dot') {
        nVal = '%@, %@'.fmt(width, dWidth);
      } else if (val === 'dash') {
        nVal = '%@, %@'.fmt(4 * width,  dWidth);
      } else if (val === 'alternate') {
        nVal = '%@, %@, %@, %@'.fmt(width, dWidth, 4 * width, dWidth);
      } else {
        return '';
      }
    }
    elem.setAttributeNS(null, nAttr, nVal);
    return nVal;
  },
  
  // Radial code that can be optimized
  // TODO: [EG] look into doing this better
  radial_gradient: /^r(?:(([^,]+?)s*,s*([^)]+?)))?/,
  
  _gradientFill: function(elem, gradient){
    var type = "linear", radRepFunc,
        // s = elem.style,
        fx = 0.5, fy = 0.5;
        
    radRepFunc = function(all, _fx, _fy) {
      var dir, t1, pow = Math.pow;
      type = "radial";
      if (_fx && _fy) {
        fx = parseFloat(_fx);
        fy = parseFloat(_fy);
        dir = ((fy > 0.5) * 2 - 1);
        t1 = pow(fx - 0.5, 2) + pow(fy - 0.5, 2);
        if (t1 > 0.25){
          fy = Math.sqrt(0.25 - pow(fx - 0.5, 2)) * dir + 0.5;
          if (fy !== 0.5){
            fy = fy.toFixed(5) - 1e-5 * dir;
          }
        }
      }
      return '';
    };
    gradient = (gradient + '').replace(Sai.radial_gradient, radRepFunc);
    
    // gradient = gradient[split](/s*-s*/);
    // if (type == "linear") {
    //     var angle = gradient.shift();
    //     angle = -toFloat(angle);
    //     if (isNaN(angle)) {
    //         return null;
    //     }
    //     var vector = [0, 0, math.cos(angle * math.PI / 180), math.sin(angle * math.PI / 180)],
    //     max = 1 / (mmax(math.abs(vector[2]), math.abs(vector[3])) || 1);
    //     vector[2] *= max;
    //     vector[3] *= max;
    //     if (vector[2] < 0) {
    //         vector[0] = -vector[2];
    //         vector[2] = 0;
    //     }
    //     if (vector[3] < 0) {
    //         vector[1] = -vector[3];
    //         vector[3] = 0;
    //     }
    // }
    // var dots = parseDots(gradient);
    // if (!dots) {
    //     return null;
    // }
    // var id = o.getAttribute("fill");
    // id = id.match(/^url(#(.*))$/);
    // id && SVG.defs.removeChild(doc.getElementById(id[1]));
    // 
    // var el = $(type + "Gradient");
    // el.id = "r" + (R._id++)[toString](36);
    // $(el, type == "radial" ? {
    //     fx: fx,
    //     fy: fy
    // }: {
    //     x1: vector[0],
    //     y1: vector[1],
    //     x2: vector[2],
    //     y2: vector[3]
    // });
    // SVG.defs[appendChild](el);
    // for (var i = 0, ii = dots[length]; i < ii; i++) {
    //     var stop = $("stop");
    //     $(stop, {
    //         offset: dots[i].offset ? dots[i].offset: !i ? "0%": "100%",
    //         "stop-color": dots[i].color || "#fff"
    //     });
    //     el[appendChild](stop);
    // }
    // $(o, {
    //     fill: "url(#" + el.id + ")",
    //     opacity: 1,
    //     "fill-opacity": 1
    // });
    // s.fill = E;
    // s.opacity = 1;
    // s.fillOpacity = 1;
    // return 1;
    // 
  },
  
  // ..........................................................
  // Circle API
  // 
  svg_circle_create: function (canvas, x, y, radius, attrs) {
    var circle;
    x = Sai.round(x);
    y = Sai.round(y);
    circle = document.createElementNS(this.svgns, 'circle');
    circle.setAttributeNS(null, 'cx', x);
    circle.setAttributeNS(null, 'cy', y);
    circle.setAttributeNS(null, 'r', radius);
    // set the applied attrs
    circle = Sai.svg_attr_set(canvas, circle, attrs);

    return circle;
  },
  
  // ..........................................................
  // Ellipse API
  // 
  svg_ellipse_create: function (canvas, x, y, rx, ry, attrs){
    var ellipse, round = Math.round;
    
    // normalize basic params
    x = round(x);
    y = round(y);
    rx = round(rx);
    ry = round(ry);
    
    ellipse = document.createElementNS(this.svgns, 'ellipse');
    ellipse.setAttributeNS(null, 'cx', x);
    ellipse.setAttributeNS(null, 'cy', y);
    ellipse.setAttributeNS(null, 'rx', rx);
    ellipse.setAttributeNS(null, 'ry', ry);
    ellipse = Sai.svg_attr_set(canvas, ellipse, attrs);
    
    return ellipse;
  },
  
  // ..........................................................
  // Rectangle API
  // 
  svg_rect_create: function (canvas, x, y, h, w, cr, attrs){
    var rect, round = Math.round;

    // normalize basic params
    x = round(x);
    y = round(y);
    h = round(h);
    w = round(w);
    cr = round(cr);
    
    rect = document.createElementNS(this.svgns, 'rect');
    rect.setAttributeNS(null, 'x', x);
    rect.setAttributeNS(null, 'y', y);
    rect.setAttributeNS(null, 'height', h);
    rect.setAttributeNS(null, 'width', w);
    rect = Sai.svg_attr_set(canvas, rect, attrs);
    
    return rect;
  },
  
  // ..........................................................
  // Text API
  // 
  svg_text_create: function (canvas, x, y, h, w, text, attrs){
    var aPt, textElem, tn, round = Math.round;
    attrs = attrs || {};
    // normalize basic params
    x = round(x) || 0;
    y = round(y) || 0;
    h = round(h) || 0;
    w = round(w) || 0;
    aPt = this._anchor_helper(x, y, h, w, attrs['text-anchor']);
        
    textElem = document.createElementNS(this.svgns, 'text');
    // TODO: [EG] add creation of multiline text here...
    tn = document.createTextNode(text);
    
    textElem.setAttributeNS(null, 'x', aPt[0]);
    textElem.setAttributeNS(null, 'y', aPt[1]);
    textElem = Sai.svg_attr_set(canvas, textElem, attrs);
    // TODO: [EG] add appending of multiline text here...
    textElem.appendChild(tn);
    
    return textElem;
  },
  
  _anchor_helper: function(x, y, h, w, anchor){
    if (anchor === 'center'){
      return [x+(w/2), y+h];
    } 
    else if (anchor === 'right'){
      return [x+w, y+h];
    }
    else {
      return [x, y+h];
    }
  },
  
  svg_polygon_create: function (canvas, points, attrs){
    var poly, polyPoints = "", isFirst = true;
    
    // normalize basic params
    points = points || [];
    
    if (SC.typeOf(points) === SC.T_STRING){
      polyPoints = points;
    }
    else if(SC.typeOf(points) === SC.T_ARRAY){
      points.forEach( function(pt){
        if (isFirst){
          polyPoints = "%@,%@".fmt(pt.x, pt.y);
          isFirst = false;
        } 
        else {
          polyPoints += " %@,%@".fmt(pt.x, pt.y);
        }
      });
    }
    
    poly = document.createElementNS(this.svgns, 'polygon');
    poly.setAttributeNS(null, 'points', polyPoints);
    poly = Sai.svg_attr_set(canvas, poly, attrs);

    return poly;
  },
  
  svg_path_create: function(canvas, path, attrs){
    var pathElem, pathStr = "", type;
    // normalize basic params
    path = path || [];
    type = SC.typeOf(path); 
    if ( type === SC.T_STRING){
      pathStr =  Sai.parsePathString(path);
    }
    else if(type === SC.T_ARRAY){
      pathStr = Sai.parsePathString(path.join(" "));
    }
    
    pathElem = document.createElementNS(this.svgns, 'path');
    pathStr = Sai.roundPath(Sai.pathToAbsolute(pathStr));
    pathElem.setAttributeNS(null, 'd', pathStr);
    pathElem = Sai.svg_attr_set(canvas, pathElem, attrs);
    
    return pathElem;
  },
  
  svg_image_create: function(canvas, x, y, h, w, src, attrs){
    var img, round = Math.round;

    // normalize basic params
    x = round(x);
    y = round(y);
    h = round(h);
    w = round(w);
    
    img = document.createElementNS(this.svgns, 'image');
    img.setAttributeNS(null, 'x', x);
    img.setAttributeNS(null, 'y', y);
    img.setAttributeNS(null, 'height', h);
    img.setAttributeNS(null, 'width', w);
    img.setAttributeNS(this.xlink, "href", src);
    img = Sai.svg_attr_set(canvas, img, attrs);
    
    return img;
  }
  
});

