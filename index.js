const fs       = require("fs");

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
  replaceMemberExpressions(root);
  let aliasedName = removeDestructuringAlias(root);
  if (aliasedName) {
    replaceAliasedEmberKObjectProperty(root, aliasedName);
    replaceAliasedFunctionArgument(root, aliasedName);
    replaceAliasedAssignment(root, aliasedName);
    replaceAliasedInLogicalExpression(root, aliasedName);
    replaceAliasedInAssignmentPattern(root, aliasedName);
  }

  removeEmptyDestructure(root);

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
        node.arguments[index] = createEmberKReplacement();
      }
    });
  }

  /**
   * Replaces things like:
   * ```js
   * Ember.K;
   * ```
   */
  function replaceMemberExpressions(root) {
    root.find(j.MemberExpression)
    .filter(({ value: node }) => isEmberDotK(node))
    .replaceWith(() => createEmberKReplacement());
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
    .forEach(({ value: node }) => node.right = createEmberKReplacement());
  }

  /**
   * Replaces things like:
   * ```js
   * foo || noop
   * ```
   */
  function replaceAliasedInLogicalExpression(root, aliasedName) {
    root.find(j.LogicalExpression)
    .filter(({ value: node }) => node.right.name === aliasedName)
    .forEach(({ value: node }) => node.right = createEmberKReplacement());

    root.find(j.LogicalExpression)
    .filter(({ value: node }) => node.left.name === aliasedName)
    .forEach(({ value: node }) => node.left = createEmberKReplacement());
  }

  /**
   * Replaces things like:
   * ```js
   * function(doNothing = noop) {}
   * ```
   */
  function replaceAliasedInAssignmentPattern(root, aliasedName) {
    root.find(j.AssignmentPattern)
    .filter(({ value: node }) => node.right.name === aliasedName)
    .forEach(({ value: node }) => node.right = createEmberKReplacement());
  }

  /**
   * Deletes things like:
   * ```js
   * const {} = Ember;
   * ```
   */
  function removeEmptyDestructure(root) {
    root.find(j.VariableDeclarator)
    .filter(({ value: node }) => {
      return node.id.type === 'ObjectPattern' && node.id.properties.length === 0;
    }).remove();
  }

  function removeDestructuringAlias(root) {
    let aliasedName;
    root.find(j.VariableDeclarator)
      .filter(({ value: node }) => {
        return node.init &&
          (node.init.name === 'Ember' || node.init.name === 'Em') &&
          node.id.type === 'ObjectPattern';
      })
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
      (node.object.name === 'Ember' || node.object.name === 'Em') &&
      node.property.name === 'K';
  }

  function convertToEmptyMethod(node) {
    node.method = true;
    node.value = createEmberKReplacement();
  }

  function createEmberKReplacement() {
    let statements = [];
    if (process.env.RETURN_THIS === 'true') {
      statements.push(j.returnStatement(j.thisExpression()));
    }
    return j.functionExpression(null, [], j.blockStatement(statements));
  }
}

function arrayWithoutItemAt(ary, index) {
  return ary.slice(0, index).concat(ary.slice(index+1));
}