import Em from 'ember';

const {
  computed
} = Em;

export default Ember.Component.extend({
  ary: [],
  foo() {},
  bar() {},
  someFn() {
    this.qux = function() {};
    this.foobar = function() {};
    for (let e in ary) {
      // noop
    }
    Em.run(function() {});
    Em.run(function() {});
  }
});