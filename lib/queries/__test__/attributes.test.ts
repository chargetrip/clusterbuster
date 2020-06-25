import {
  attributesFirstToSelect,
  attributesToArray,
  attributesToSelect,
} from '../attributes';

describe('attributesToSelect', () => {
  it('should work', () => {
    expect(attributesToSelect(['id', 'name', 'field'])).toMatchSnapshot();
    expect(attributesToSelect([])).toMatchSnapshot();
  });
});

describe('attributesFirstToSelect', () => {
  it('should work', () => {
    expect(attributesFirstToSelect(['id', 'name', 'field'])).toMatchSnapshot();
    expect(attributesFirstToSelect([])).toMatchSnapshot();
  });
});

describe('attributesToArray', () => {
  it('should work', () => {
    expect(attributesToArray(['id', 'name', 'field'])).toMatchSnapshot();
    expect(attributesToArray([])).toMatchSnapshot();
  });
});
