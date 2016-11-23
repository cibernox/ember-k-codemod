const {
  computed,
  K: noop
} = Ember;

Ember.getWithDefault(this, 'attrs.onclose', Ember.K);
Ember.getWithDefault(this, 'attrs.onclose', noop);