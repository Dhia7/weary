const { sequelize } = require('../config/database');

async function checkConstraints() {
  try {
    const [results] = await sequelize.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'Cart' 
      AND constraint_type = 'UNIQUE'
    `);
    
    console.log('All UNIQUE constraints on Cart table:');
    console.log(JSON.stringify(results, null, 2));
    
    // Also check constraint details
    for (const constraint of results) {
      const [columns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.key_column_usage 
        WHERE constraint_name = $1
        AND table_name = 'Cart'
        ORDER BY ordinal_position
      `, {
        bind: [constraint.constraint_name]
      });
      console.log(`\nConstraint "${constraint.constraint_name}" columns:`, columns.map(c => c.column_name));
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

checkConstraints();
