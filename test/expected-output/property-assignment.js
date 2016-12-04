const {
  computed
} = Ember;

this['foo'] = function() {
  return this;
};
this.foo = function() {
  return this;
};
this['bar'] = function() {
  return this;
};
this.bar = function() {
  return this;
};