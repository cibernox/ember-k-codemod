const fs       = require("fs");

const ERROR_WARNING = 1;
const MISSING_GLOBAL_WARNING = 2;

module.exports = transform;

/**
 * This is the entry point for this jscodeshift transform.
 * It scans JavaScript files that use the Ember global and updates
 * them to use the module syntax from the proposed new RFC.
 */
function transform(file, api, options) {
  let source = file.source;
  let j = api.jscodeshift;

  let root = j(source);
  replaceDirectEmberKObjectProperty(root);
  replaceDirectEmberKFunctionArgument(root);
  replaceDirectEmberKAssignment(root);
  let aliasedName = removeDestructuringAlias(root);
  if (aliasedName) {
    replaceAliasedEmberKObjectProperty(root, aliasedName);
    replaceAliasedFunctionArgument(root, aliasedName);
    replaceAliasedAssignment(root, aliasedName);
  }

  return root.toSource();

  /**
   * Replaces things like
   * {
   *   foo: Ember.K
   * }
   */
  function replaceDirectEmberKObjectProperty(root) {
    root.find(j.Property, {
      method: false,
      shorthand: false,
      computed: false
    })
    .filter(({ value: node }) => isEmberDotK(node.value))
    .forEach(({ value: node }) => convertToEmptyMethod(node)); 
  }

  /**
   * Replaces things like
   * Ember.set(this, 'propName', Ember.K)
   */
  function replaceDirectEmberKFunctionArgument() {
    root.find(j.CallExpression)
    .forEach(({ value: node }) => {
      let index = node.arguments.findIndex(isEmberDotK);
      if (index > -1) {
        node.arguments[index] = createEmptyFn();
      }
    });
  }

  /**
   * Replaces things like:
   * ```js
   * const { computed, K } = Ember;
   * export default {
   *   foo: K
   * }
   * ```
   *
   * It also handles aliases like:
   * ```js
   * const { computed, K: noop } = Ember;
   * export default {
   *   foo: noop
   * }
   * ```
   */
  function replaceAliasedEmberKObjectProperty(root, aliasedName) {
    root.find(j.Property, {
      method: false,
      shorthand: false,
      computed: false
    })
    .filter(({ value: node }) => node.value.name === aliasedName)
    .forEach(({ value: node }) => convertToEmptyMethod(node));
  }

  /**
   * Replaces things like:
   * ```js
   * const { K: noop } = Ember;
   * Ember.set(this, 'propName', noop)
   * ```
   */
  function replaceAliasedFunctionArgument(root, aliasedName) {
    root.find(j.CallExpression)
    .forEach(({ value: node }) => {
      let index = node.arguments.findIndex((arg) => j.Identifier.check(arg) && arg.name === aliasedName);
      if (index > -1) {
        node.arguments[index] = createEmptyFn();
      }
    });
  }
  /**
   * Replaces things like:
   * ```js
   * obj['foo'] = Ember.K;
   * obj.foo = Ember.K;
   * ```
   */
  function replaceDirectEmberKAssignment(root) {
    root.find(j.AssignmentExpression)
    .filter(({ value: node }) => isEmberDotK(node.right))
    .forEach(({ value: node }) => node.right = createEmptyFn());
  }


  /**
   * Replaces things like:
   * ```js
   * const { K } = Ember;
   * obj['foo'] = K;
   * obj.foo = K;
   * ```
   */
  function replaceAliasedAssignment(root, aliasedName) {
    root.find(j.AssignmentExpression)
    .filter(({ value: node }) => node.right.name === aliasedName)
    .forEach(({ value: node }) => node.right = createEmptyFn());
  }

  function removeDestructuringAlias(root) {
    let aliasedName;
    root.find(j.VariableDeclarator)
      .filter(({ value: node }) => node.init.name === 'Ember' && node.id.type === 'ObjectPattern')
      .forEach(({ value: node }) => {
        if (!aliasedName) {
          let index = node.id.properties.findIndex((prop) => prop.key.name === 'K');
          if (index > -1) {
            aliasedName = node.id.properties[index].value.name;
            node.id.properties = arrayWithoutItemAt(node.id.properties, index);
          }
        }
      });
      return aliasedName;    
  }

  function isEmberDotK(node) {
    return j.MemberExpression.check(node) &&
      node.object.name === 'Ember' &&
      node.property.name === 'K';
  }

  function convertToEmptyMethod(node) {
    node.method = true;
    node.value = createEmptyFn();    
  }

  function createEmptyFn() {
    return j.functionExpression(null, [], j.blockStatement([]));
  }
}

function arrayWithoutItemAt(ary, index) {
  return ary.slice(0, index).concat(ary.slice(index+1));
}