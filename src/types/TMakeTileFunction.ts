import { IMakeTileProps } from '../interfaces';

export type TMakeTileFunction<T> = (
  prop: IMakeTileProps<T>
) => Promise<ArrayBuffer>;
