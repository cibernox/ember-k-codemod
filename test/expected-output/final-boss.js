import Em from 'ember';

const {
  computed
} = Em;

export default Ember.Component.extend({
  foo() {},
  bar() {},
  someFn() {
    this.qux = function() {};
    this.foobar = function() {};
    Em.run(function() {});
    Em.run(function() {});
  }
});