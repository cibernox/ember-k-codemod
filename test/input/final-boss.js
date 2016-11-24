import Em from 'ember';

const {
  computed,
  K: noop
} = Em;

export default Ember.Component.extend({
  ary: [],
  foo: noop,
  bar: Em.K,
  someFn() {
    this.qux = noop;
    this.foobar = Em.K;
    for (let e in ary) {
      // noop
    }
    Em.run(Em.K);
    Em.run(noop);
  }
});