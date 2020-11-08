/**
 * Creates an SQL fragment of the dynamic attributes to an sql select statement
 */
export const attributesToSelect = (attributes: string[]) =>
  attributes.length > 0 ? `, ${attributes.join(', ')}` : '';

/**
 * Creates an SQL fragmemt which selects the first value of an attribute using the FIRST aggregate function
 */
export const attributesFirstToSelect = (attributes: string[]) =>
  attributes.length > 0
    ? `${attributes
        .map((attribute) => `FIRST(${attribute}) as ${attribute}`)
        .join(', ')},`
    : '';

/**
 * Creates an SQL fragment that selects the dynamic attributes to be used by each zoom level query
 */
export const attributesToArray = (attributes: string[]) =>
  attributes.length > 0
    ? ', ' +
      attributes.map((attribute) => `'${attribute}', ${attribute}`).join(', ')
    : '';


export const customAttributesToArray = (attributes: string[], arrayAttrs) =>
	 attributes.length > 0
		? ', ' +
			attributes.map((attribute) => {
				const value = arrayAttrs.includes(attribute) ? `array_to_string(${attribute}, ',' , '*')` : attribute;

				return `'${attribute}', ${value}`
			}).join(', ')
		: '';


