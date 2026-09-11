const fs = require('fs');
const path = require('path');
const readline = require('readline');

const inputFile = path.join(__dirname, '..', 'assmt_usage_data_dump_24.08.2026.sql');
const outputFile = path.join(__dirname, '..', 'migrations', '002_legacy_client_data.sql');

async function convertDump() {
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(inputFile);
  const outStream = fs.createWriteStream(outputFile);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inCreateTable = false;

  let previousLine = null;

  for await (let line of rl) {
    // 1. Skip MySQL specific directives
    if (
      line.startsWith('/*!') ||
      line.startsWith('SET ') ||
      line.startsWith('LOCK TABLES') ||
      line.startsWith('UNLOCK TABLES') ||
      line.startsWith('CREATE DATABASE') ||
      line.startsWith('USE ') ||
      line.includes('DEFAULT CHARACTER SET')
    ) {
      continue;
    }

    // 2. Convert Backticks to Double Quotes
    line = line.replace(/`/g, '"');

    if (line.includes('CREATE TABLE')) {
      inCreateTable = true;
    }
    
    if (inCreateTable) {
      // 3. Convert Data Types and Auto Increment
      line = line.replace(/tinyint\(\d+\)/gi, 'SMALLINT');
      line = line.replace(/tinyint/gi, 'SMALLINT');
      line = line.replace(/int NOT NULL AUTO_INCREMENT/gi, 'SERIAL');
      line = line.replace(/int\(\d+\) NOT NULL AUTO_INCREMENT/gi, 'SERIAL');
      line = line.replace(/\bint\(\d+\)/gi, 'INTEGER');
      line = line.replace(/\bint\b/gi, 'INTEGER'); // handle plain int
      line = line.replace(/datetime/gi, 'TIMESTAMP');
      
      // 4. Handle Inline Keys
      line = line.replace(/UNIQUE KEY "([^"]+)" \(([^)]+)\)/gi, 'UNIQUE ($2)');
      
      if (line.trim().match(/^KEY\s+"[^"]+"\s+\([^)]+\),?$/i) || line.trim().match(/^,\s*KEY\s+"[^"]+"\s+\([^)]+\)$/i) || line.trim().match(/^KEY\s+\([^)]+\),?$/i)) {
         continue; 
      }
      
      // Some keys might just be `KEY "idx_name" ("col1","col2")`
      if (line.match(/^\s*KEY\s+"[^"]+"\s+\([^)]+\)/i)) {
         continue;
      }
    }

    // 5. Handle end of CREATE TABLE
    if (line.match(/^\)\s*ENGINE=InnoDB/i)) {
      line = ');';
      inCreateTable = false;
    } else if (line.match(/^\)\s*;/)) {
      inCreateTable = false;
    }

    // 6. Handle single quote escaping for PostgreSQL
    line = line.replace(/\\'/g, "''");

    // Write buffer: handle trailing comma
    if (previousLine !== null) {
      if (line.trim() === ');' && previousLine.trim().endsWith(',')) {
        previousLine = previousLine.replace(/,\s*$/, '');
      }
      outStream.write(previousLine + '\n');
    }
    previousLine = line;
  }

  if (previousLine !== null) {
    outStream.write(previousLine + '\n');
  }

  outStream.close();
  console.log(`Conversion complete! Output saved to: ${outputFile}`);
  console.log(`Please review ${outputFile} for any syntax anomalies before migrating.`);
}

convertDump().catch(console.error);
