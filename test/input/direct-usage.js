/**
 * This comment should be preserved, and included before the inserted import statements.
 */
import Ember from 'ember';

export default Ember.Component.extend({
  foo: Ember.K,
  bar: Ember.K,
  "Ember.K": 1,
  other(K) {
    return functionInScope(K);
  }
});

function functionInScope(K) {
  return {
    qux: Ember.K
  };
}

