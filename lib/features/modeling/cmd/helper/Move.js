var _ = require('lodash');

var Elements = require('../../../../util/Elements');

/**
 * A helper that is able to carry out serialized move operations on multiple elements.
 *
 * @param {Modeling} modeling
 */
function MoveHelper(modeling) {
  this._modeling = modeling;
}

module.exports = MoveHelper;

/**
 * Move the specified elements and all children by the given delta.
 *
 * This moves all enclosed connections, too and layouts all affected
 * external connections.
 *
 * @param  {Array<djs.model.Base>} elements
 * @param  {Point} delta
 * @param  {djs.model.Base} newParent applied to the first level of shapes
 *
 * @return {Array<djs.model.Base>} list of touched elements
 */
MoveHelper.prototype.moveRecursive = function(elements, delta, newParent) {
  return this.moveClosure(this.getClosure(elements), delta, newParent);
};

/**
 * Move the given closure of elmements
 */
MoveHelper.prototype.moveClosure = function(closure, delta, newParent) {

  var modeling = this._modeling;

  var allShapes = closure.allShapes,
      allConnections = closure.allConnections,
      enclosedConnections = closure.enclosedConnections,
      topLevel = closure.topLevel;

  // move all shapes
  _.forEach(allShapes, function(s) {

    modeling.moveShape(s, delta, topLevel[s.id] && newParent, {
      recurse: false,
      layout: false
    });
  });

  // move all child connections / layout external connections
  _.forEach(allConnections, function(c) {

    if (enclosedConnections[c.id]) {
      modeling.moveConnection(c, delta, topLevel[c.id] && newParent);
    } else {

      // TODO: update anchor for incoming / outgoing connections
      modeling.layoutConnection(c);
    }
  });
};

/**
 * Returns the closure for the selected elements
 *
 * @param  {Array<djs.model.Base>} elements
 * @return {Object} closure
 */
MoveHelper.prototype.getClosure = function(elements) {
  return Elements.getClosure(elements);
};