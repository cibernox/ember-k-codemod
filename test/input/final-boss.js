import Em from 'ember';

const {
  computed,
  K: noop
} = Em;

export default Ember.Component.extend({
  foo: noop,
  bar: Em.K,
  someFn() {
    this.qux = noop;
    this.foobar = Em.K;
    Em.run(Em.K);
    Em.run(noop);
  }
});