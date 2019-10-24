import zlib from 'zlib';

export function zip(data: any): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    zlib.gzip(data, (err, result) => {
      if (err) {
        return reject(err);
      }

      resolve(result);
    });
  });
}
