import { TileInput } from './TileInput';

/**
 * @description This function creates the MVT tiles from the appropriate TileInput
 */
export type TileRenderer<T> = (args: TileInput<T>) => Promise<ArrayBuffer>;
