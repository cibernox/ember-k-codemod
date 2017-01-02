import Em from 'ember';

const {
  computed,
  K: noop
} = Em;

export default Ember.Component.extend({
  ary: [],
  foo: noop,
  bar: Em.K,
  someFn(doNothing = noop) {
    this.qux = noop;
    this.foobar = Em.K;
    this.parrot = this.get('bird') || Ember.K;
    this.shepherd = this.get('dog') || noop;
    for (let e in ary) {
      // noop
    }
    Em.run(Em.K);
    Em.run(noop);
  }
});