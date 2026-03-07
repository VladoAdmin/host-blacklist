/**
 * Migration Script: black_list → guests + reports
 * 
 * This script migrates data from the old black_list table (with Slovak columns)
 * to the new guests + reports structure.
 * 
 * Old table: black_list
 * - Meno (full name)
 * - Email
 * - Telefon (phone)
 * - "Co sa stalo" (description/incident)
 * - Check in/out dates
 * - Platforma
 * - Mesto
 * 
 * New tables:
 * - guests: id, full_name, email, phone, reports_count
 * - reports: id, guest_id, reporter_id, incident_type, description, severity, etc.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://kapgabgnezcurmgcrvif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcGdhYmduZXpjdXJtZ2NydmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODUxNDMsImV4cCI6MjA4NjA2MTE0M30.CZM-gEEY8RBiEcXnnR0pSahpW2GWhnO4PHAmhSkNvCg';

// Default values for migration
const DEFAULT_REPORTER_ID = '00000000-0000-0000-0000-000000000000'; // Placeholder - will need real user
const DEFAULT_SEVERITY = 3;
const DEFAULT_INCIDENT_TYPE = 'other';

// Platform mapping
const PLATFORM_MAP = {
  'airbnb': 'airbnb',
  'Airbnb': 'airbnb',
  'booking': 'booking',
  'Booking': 'booking',
  'Booking.com': 'booking',
  'direct': 'direct',
  'Direct': 'direct',
  'Priama rezervácia': 'direct',
  'other': 'other',
  '': 'other',
  null: 'other'
};

// Incident type detection keywords
const INCIDENT_KEYWORDS = {
  'damage': ['poškodenie', 'škoda', 'rozbil', 'rozbité', 'zlomené', 'chýbali', 'chyba', 'poškodený'],
  'theft': ['krádež', 'ukradol', 'ukradli', 'chýba', 'chýbalo', 'zobral', 'nevrátil'],
  'noise': ['hluk', 'hlučný', 'hlučne', 'rušil', 'rušenie', 'hlučnosť', 'party'],
  'fraud': ['podvod', 'podv', 'falošné', 'falosne', 'falošný', 'nesprávne'],
  'no_show': ['neprišiel', 'neprisiel', 'nevyužil', 'nezobral'],
  'other': ['neznesiteľný', 'fet', 'drog', 'prostitucia', 'neporiadok', 'špinavý', 'fajčenie', 'pes']
};

function detectIncidentType(description) {
  if (!description) return 'other';
  
  const descLower = description.toLowerCase();
  
  for (const [type, keywords] of Object.entries(INCIDENT_KEYWORDS)) {
    if (keywords.some(kw => descLower.includes(kw))) {
      return type;
    }
  }
  
  return 'other';
}

function detectSeverity(description) {
  if (!description) return 3;
  
  const descLower = description.toLowerCase();
  
  // High severity indicators
  const highSeverity = ['polícia', 'policia', 'podvod', 'krádež', 'ukradol', 'fet', 'drog', 'prostitucia', 'vyhrážky'];
  if (highSeverity.some(kw => descLower.includes(kw))) return 5;
  
  // Medium-high severity
  const medHigh = ['špinavý', 'neporiadok', 'horrible', 'disaster', 'terrible'];
  if (medHigh.some(kw => descLower.includes(kw))) return 4;
  
  // Low severity
  const low = ['mierny', 'menší', 'drobný', 'nevyužil'];
  if (low.some(kw => descLower.includes(kw))) return 2;
  
  return 3; // default medium
}

async function migrateBlackList() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('🚀 Starting migration from black_list to guests + reports...\n');
  
  try {
    // Get all records from black_list
    console.log('📥 Fetching black_list records...');
    const { data: oldRecords, error: fetchError } = await supabase
      .from('black_list')
      .select('*')
      .order('id');
    
    if (fetchError) throw fetchError;
    
    console.log(`Found ${oldRecords.length} records to migrate\n`);
    
    // Get existing profiles to use as reporters
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) throw profilesError;
    
    const reporterId = profiles?.[0]?.id || DEFAULT_REPORTER_ID;
    console.log(`Using reporter_id: ${reporterId}\n`);
    
    let migrated = 0;
    let failed = 0;
    
    for (const record of oldRecords) {
      try {
        const fullName = record.Meno?.trim() || 'Unknown Guest';
        const email = record.Email?.trim() || null;
        const phone = record.Telefon?.trim() || null;
        const description = record['Co sa stalo']?.trim();
        const platform = PLATFORM_MAP[record.Platforma] || 'other';
        const incidentType = detectIncidentType(description);
        const severity = detectSeverity(description);
        
        // Check in/out dates
        const checkIn = record['Check in'] ? new Date(record['Check in'].split('.').reverse().join('-')) : null;
        const checkOut = record['Check out'] ? new Date(record['Check out'].split('.').reverse().join('-')) : null;
        
        // 1. Create or find guest
        let guestId;
        
        if (email) {
          // Try to find existing guest by email
          const { data: existingGuest } = await supabase
            .from('guests')
            .select('id')
            .eq('email', email)
            .single();
          
          if (existingGuest) {
            guestId = existingGuest.id;
          }
        }
        
        if (!guestId) {
          // Create new guest
          const { data: newGuest, error: guestError } = await supabase
            .from('guests')
            .insert({
              full_name: fullName,
              email: email,
              phone: phone
            })
            .select('id')
            .single();
          
          if (guestError) throw guestError;
          guestId = newGuest.id;
        }
        
        // 2. Create report for this guest
        if (description) {
          const { error: reportError } = await supabase
            .from('reports')
            .insert({
              guest_id: guestId,
              reporter_id: reporterId,
              incident_type: incidentType,
              incident_date: checkOut || checkIn,
              severity: severity,
              description: description,
              platform: platform,
              property_name: record.Mesto || null
            });
          
          if (reportError) {
            console.warn(`⚠️  Failed to create report for ${fullName}: ${reportError.message}`);
          }
        }
        
        // 3. Increment reports_count on guest
        const { error: updateError } = await supabase
          .from('guests')
          .update({ reports_count: 1 })
          .eq('id', guestId);
        
        migrated++;
        
        if (migrated % 50 === 0) {
          console.log(`  ✅ Migrated ${migrated}/${oldRecords.length} records...`);
        }
        
      } catch (err) {
        failed++;
        console.error(`❌ Failed to migrate record ${record.id}:`, err.message);
      }
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migrated} records`);
    console.log(`   Failed: ${failed} records`);
    
    // Verify migration
    const { count: guestsCount } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true });
    
    const { count: reportsCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 New table counts:`);
    console.log(`   guests: ${guestsCount || 0}`);
    console.log(`   reports: ${reportsCount || 0}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateBlackList().then(() => {
  console.log('\n🏁 Done!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
