#!/usr/bin/env node
/**
 * FreightIQ (SIH26006) — Secure Terminal Administrator Provisioning Tool
 * 
 * Usage:
 *   Interactive mode:
 *     node createAdmin.js
 * 
 *   Command line flag mode:
 *     node createAdmin.js --name "Officer Name" --email "admin@steel.gov.in" --password "Admin@123" --org "Ministry of Steel"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ADMINS_FILE = path.join(__dirname, 'data', 'admins.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      params[key] = val;
    }
  }
  return params;
}

function promptInteractive(query, defaultValue = '') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const promptText = defaultValue ? `${query} [${defaultValue}]: ` : `${query}: `;
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(' 🛡️  FreightIQ — Ministry of Steel Root Administrator Provisioning');
  console.log('     SIH26006 Enterprise Role-Based Access Control (RBAC)');
  console.log('='.repeat(70) + '\n');

  const cliArgs = parseArgs();

  let name = cliArgs.name;
  let email = cliArgs.email;
  let password = cliArgs.password;
  let organization = cliArgs.org || cliArgs.organization;
  let department = cliArgs.dept || cliArgs.department;

  // Interactive fallback if missing arguments
  if (!name) {
    name = await promptInteractive('Enter Administrator Full Name', 'Priyanshu Kumar');
  }

  if (!email) {
    email = await promptInteractive('Enter Official Email Address', 'admin@steel.gov.in');
  }

  if (!password) {
    password = await promptInteractive('Enter Secure Access Password', 'Admin@123');
  }

  if (!organization) {
    organization = await promptInteractive('Enter Organization', 'Ministry of Steel, Govt of India');
  }

  if (!department) {
    department = await promptInteractive('Enter Department / Unit', 'National Steel Logistics & Security Oversight');
  }

  // Basic Validation
  if (!email || !email.includes('@') || !email.includes('.')) {
    console.error('\n❌ Error: Please provide a valid official email address.');
    process.exit(1);
  }

  if (!password || password.length < 6) {
    console.error('\n❌ Error: Password must be at least 6 characters long.');
    process.exit(1);
  }

  const cleanEmail = email.toLowerCase().trim();

  // Load existing admins
  let adminsList = [];
  try {
    if (fs.existsSync(ADMINS_FILE)) {
      const raw = fs.readFileSync(ADMINS_FILE, 'utf8');
      adminsList = JSON.parse(raw);
    }
  } catch (err) {
    adminsList = [];
  }

  const existingIdx = adminsList.findIndex((a) => a.email.toLowerCase().trim() === cleanEmail);
  const adminId = existingIdx !== -1 ? adminsList[existingIdx].id : `usr_admin_${Date.now()}`;
  const now = new Date().toISOString().split('T')[0];

  const adminRecord = {
    id: adminId,
    name: name.trim(),
    email: cleanEmail,
    password: password,
    role: 'admin',
    department: department.trim(),
    organization: organization.trim(),
    status: 'active',
    createdAt: existingIdx !== -1 ? adminsList[existingIdx].createdAt : now,
    lastLogin: 'Just provisioned via CLI',
    createdBy: 'Terminal CLI (createAdmin.js)',
  };

  if (existingIdx !== -1) {
    adminsList[existingIdx] = adminRecord;
  } else {
    adminsList.unshift(adminRecord);
  }

  // Ensure data directory exists
  const dataDir = path.dirname(ADMINS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(ADMINS_FILE, JSON.stringify(adminsList, null, 2), 'utf8');

  console.log('\n' + '─'.repeat(70));
  console.log(' ✅ Administrator Account Successfully Provisioned in System Database!');
  console.log('─'.repeat(70));
  console.log(` 👤 Name:         ${adminRecord.name}`);
  console.log(` 📧 Email:        ${adminRecord.email}`);
  console.log(` 🛡️  Role:         Ministry Administrator (admin / ministry_admin)`);
  console.log(` 🏢 Organization: ${adminRecord.organization}`);
  console.log(` 🏷️  Department:   ${adminRecord.department}`);
  console.log(` 🔑 Password:     ${'*'.repeat(adminRecord.password.length)} (${adminRecord.password})`);
  console.log(` 📁 Stored At:    data/admins.json`);
  console.log('─'.repeat(70));
  console.log(' 🚀 You can now sign in at http://localhost:3000/login with these credentials.\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Provisioning Error:', err);
  process.exit(1);
});
