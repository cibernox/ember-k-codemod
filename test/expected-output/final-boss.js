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
  someFn(doNothing = function() {
    return this;
  }) {
    this.qux = function() {
      return this;
    };
    this.foobar = function() {
      return this;
    };
    this.parrot = this.get('bird') || function() {
      return this;
    };
    this.shepherd = this.get('dog') || function() {
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