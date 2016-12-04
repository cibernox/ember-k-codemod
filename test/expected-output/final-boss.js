import Em from 'ember';

const {
  computed
} = Em;

export default Ember.Component.extend({
  ary: [],
  foo() {
    return this;
  },
  bar() {
    return this;
  },
  someFn() {
    this.qux = function() {
      return this;
    };
    this.foobar = function() {
      return this;
    };
    for (let e in ary) {
      // noop
    }
    Em.run(function() {
      return this;
    });
    Em.run(function() {
      return this;
    });
  }
});