import fs from 'fs';
import path from 'path';

export default async function createSupportingSQLFunctions(pool) {
  console.log('attempting to create supporting SQL functions');
  try {
    await pool.query(
      fs.readFileSync(path.join(__dirname, '../../sql/First.sql'), 'utf-8')
    );
  } catch (e) {
    console.log('failure in creating First SQL function');
  }
  try {
    await pool.query(
      fs.readFileSync(path.join(__dirname, '../../sql/TileBBox.sql'), 'utf-8')
    );
  } catch (e) {
    console.log('failure in creating TileBBox SQL function');
  }
  try {
    await pool.query(
      fs.readFileSync(
        path.join(__dirname, '../../sql/TileDoubleBBox.sql'),
        'utf-8'
      )
    );
  } catch (e) {
    console.log('failure in creating TileDoubleBBox SQL function');
  }
}
