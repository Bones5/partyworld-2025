# Redundant CSS Tests

This directory contains tests for detecting redundant CSS patterns using stylelint.

## Purpose

These tests ensure that the codebase maintains clean, efficient CSS by detecting and preventing:

1. **Duplicate properties** within the same rule
2. **Shorthand properties** that override longhand properties
3. **Duplicate selectors** in the same file
4. **Duplicate mixin definitions**

## Test Files

### Test Fixtures

Located in `assets/scss/test-fixtures/`:

- **`redundant-css-invalid.scss`** - Contains intentionally invalid CSS patterns that should be caught by stylelint
- **`redundant-css-valid.scss`** - Contains valid CSS patterns that should NOT trigger warnings

### Test Suite

- **`redundant-css.spec.js`** - Jest test suite that verifies stylelint correctly identifies redundant CSS

## Running Tests

```bash
# Run all tests
npm test

# Run only redundant CSS tests
npm test -- redundant-css.spec.js

# Run stylelint on all SCSS files
npm run stylelint

# Auto-fix stylelint issues where possible
npm run stylelint:fix
```

## Stylelint Rules

The following rules are enabled in `.stylelintrc`:

### `declaration-block-no-duplicate-properties`

Disallows duplicate properties within the same rule.

**Exception**: Consecutive duplicates with different values are allowed for browser fallbacks.

```scss
// ❌ Invalid
.foo {
    color: red;
    margin: 10px;
    color: blue; // Duplicate property
}

// ✅ Valid - browser fallback pattern
.bar {
    display: inline-block;
    display: flex; // Consecutive duplicate with different value is OK
}
```

### `declaration-block-no-shorthand-property-overrides`

Disallows shorthand properties that override related longhand properties.

```scss
// ❌ Invalid
.foo {
    margin-top: 10px;
    margin-right: 20px;
    margin: 5px; // Overrides the longhand properties above
}

// ✅ Valid - longhand refining shorthand
.bar {
    margin: 10px;
    margin-top: 20px; // This is OK - refining the shorthand
}
```

### `no-duplicate-selectors`

Disallows duplicate selectors within the same source.

```scss
// ❌ Invalid
.foo {
    color: red;
}

.foo {
    background: blue; // Duplicate selector
}

// ✅ Valid - different selectors
.foo {
    color: red;
}

.bar {
    color: blue;
}
```

### `scss/no-duplicate-mixins`

Disallows duplicate mixin definitions.

```scss
// ❌ Invalid
@mixin my-mixin {
    color: red;
}

@mixin my-mixin {
    color: blue; // Duplicate mixin definition
}

// ✅ Valid - different mixin names
@mixin mixin-one {
    color: red;
}

@mixin mixin-two {
    color: blue;
}
```

## Test Coverage

The test suite covers:

1. **Detection of invalid patterns** - Verifies stylelint catches each type of redundancy
2. **No false positives** - Ensures valid patterns are not flagged
3. **Browser fallback support** - Allows consecutive duplicates with different values
4. **Shorthand refinement** - Allows longhand properties after shorthand
5. **Configuration validation** - Verifies rules are properly configured

## Maintenance

When adding new CSS patterns:

1. Ensure they don't violate redundant CSS rules
2. If a legitimate exception is needed, document it
3. Update test fixtures if new edge cases are discovered
4. Run tests before committing to ensure compliance

## Why These Rules Matter

- **Performance**: Duplicate properties and selectors increase CSS file size
- **Maintainability**: Redundant code is harder to maintain and can lead to bugs
- **Developer Experience**: Clear, concise CSS is easier to understand and modify
- **Best Practices**: Follows industry standards for CSS authoring

## Related Documentation

- [Stylelint Rules](https://stylelint.io/user-guide/rules)
- [SCSS Guidelines](../../docs/design-system/design_system_rules.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)
