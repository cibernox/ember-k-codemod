/**
 * This comment should be preserved, and included before the inserted import statements.
 */
import Ember from 'ember';

export default Ember.Component.extend({
  foo() {},
  bar() {},
  "Ember.K": 1,
  other(K) {
    return functionInScope(K);
  }
});

function functionInScope(K) {
  return {
    qux() {}
  };
}

