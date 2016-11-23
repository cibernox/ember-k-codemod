const {
  computed,
  K: noop 
} = Ember;

this['foo'] = Ember.K;
this.foo = Ember.K;
this['bar'] = noop;
this.bar = noop;