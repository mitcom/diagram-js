var _ = require('lodash');

var GraphicsUtil = require('../util/GraphicsUtil'),
    Dom = require('../util/Dom');


/**
 * A factory that creates graphical elements
 *
 * @param {Renderer} renderer
 * @param {Snap} snap
 */
function GraphicsFactory(renderer, elementRegistry, snap) {
  this._renderer = renderer;
  this._elementRegistry = elementRegistry;
  this._snap = snap;
}

GraphicsFactory.$inject = [ 'renderer', 'elementRegistry', 'snap' ];

module.exports = GraphicsFactory;


GraphicsFactory.prototype._getChildren = function(element) {

  var gfx = this._elementRegistry.getGraphics(element);

  var childrenGfx;

  // root element
  if (!element.parent) {
    childrenGfx = gfx;
  } else {
    childrenGfx = GraphicsUtil.getChildren(gfx);
    if (!childrenGfx) {
      childrenGfx = gfx.parent().group().attr('class', 'djs-children');
    }
  }

  return childrenGfx;
};

/**
 * Clears the graphical representation of the element and returns the
 * cleared visual (the <g class="djs-visual" /> element).
 */
GraphicsFactory.prototype._clear = function(gfx) {
  var visual = GraphicsUtil.getVisual(gfx);

  Dom.clear(visual.node);

  return visual;
};

/**
 * Creates a gfx container for shapes and connections
 *
 * The layout is as follows:
 *
 * <g class="djs-group">
 *
 *   <!-- the gfx -->
 *   <g class="djs-element djs-(shape|connection)">
 *     <g class="djs-visual">
 *       <!-- the renderer draws in here -->
 *     </g>
 *
 *     <!-- extensions (overlays, click box, ...) goes here
 *   </g>
 *
 *   <!-- the gfx child nodes -->
 *   <g class="djs-children"></g>
 * </g>
 *
 * @param {Object} parent
 * @param {String} type the type of the element, i.e. shape | connection
 */
GraphicsFactory.prototype._createContainer = function(type, parentGfx) {
  var outerGfx = parentGfx.group().attr('class', 'djs-group'),
      gfx = outerGfx.group().attr('class', 'djs-element djs-' + type);

  // create visual
  gfx.group().attr('class', 'djs-visual');

  return gfx;
};

GraphicsFactory.prototype.create = function(type, element) {
  var childrenGfx = this._getChildren(element.parent);
  return this._createContainer(type, childrenGfx);
};


GraphicsFactory.prototype.updateContainments = function(elements) {

  var self = this,
      elementRegistry = this._elementRegistry,
      parents;


  parents = _.reduce(elements, function(map, e) {

    if (e.parent) {
      map[e.parent.id] = e.parent;
    }

    return map;
  }, {});

  // update all parents of changed and reorganized their children
  // in the correct order (as indicated in our model)
  _.forEach(parents, function(parent) {

    var childGfx = self._getChildren(parent),
        children = parent.children;

    if (!children) {
      return;
    }

    _.forEach(children.slice().reverse(), function(c) {
      var gfx = elementRegistry.getGraphics(c);
      gfx.parent().prependTo(childGfx);
    });
  });

};

GraphicsFactory.prototype.update = function(type, element, gfx) {

  var visual = this._clear(gfx);

  // redraw
  if (type === 'shape') {
    this._renderer.drawShape(visual, element);

    // update positioning
    gfx.translate(element.x, element.y);
  } else
  if (type === 'connection') {
    this._renderer.drawConnection(visual, element);
  } else {
    throw new Error('unknown type: ' + type);
  }

  gfx.attr('display', element.hidden ? 'none' : 'block');
};


GraphicsFactory.prototype.remove = function(element) {
  var gfx = this._elementRegistry.getGraphics(element);

  // remove
  gfx.parent().remove();
};