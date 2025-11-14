// Quick script to set advocates online for testing
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL_CA ? {
    ca: fs.readFileSync(process.env.DB_SSL_CA),
    rejectUnauthorized: true
  } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
});

async function setAdvocatesOnline() {
  try {
    console.log('🔄 Setting advocates online for testing...');
    
    // ✅ FIXED: Get all approved advocates using parameterized query
    const [advocates] = await pool.execute(
      'SELECT id, full_name, email, status FROM advocates WHERE status = ?',
      ['approved']  // ✅ Fixed: Use parameterized query instead of string literal
    );
    
    if (advocates.length === 0) {
      console.log('❌ No approved advocates found. Run approve script first.');
      console.log('💡 Try running: curl -X POST http://localhost:5000/admin/advocates/approve-all');
      return;
    }
    
    console.log(`📋 Found ${advocates.length} approved advocates:`);
    advocates.forEach(advocate => {
      console.log(`   - ${advocate.full_name} (${advocate.email}) - ID: ${advocate.id}`);
    });
    
    // ✅ FIXED: Set all approved advocates online using parameterized query
    const [result] = await pool.execute(
      'UPDATE advocates SET is_online = true, last_seen = CURRENT_TIMESTAMP WHERE status = ?',
      ['approved']  // ✅ Fixed: Use parameterized query instead of string literal
    );
    
    console.log(`✅ Set ${result.affectedRows} advocates online`);
    
    // Verify the update
    const [onlineAdvocates] = await pool.execute(
      'SELECT id, full_name, is_online FROM advocates WHERE status = ? AND is_online = true',
      ['approved']  // ✅ Fixed: Use parameterized query
    );
    
    console.log(`🟢 Online advocates (${onlineAdvocates.length}):`);
    onlineAdvocates.forEach(advocate => {
      console.log(`   ✅ ${advocate.full_name} - Online`);
    });
    
    console.log('\n🎉 Ready for testing! All approved advocates are now online.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

setAdvocatesOnline();