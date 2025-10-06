const { PrismaClient, Placement, Radiation_Type } = require('./generated/prisma');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const prisma = new PrismaClient();

function parseBoolean(value) {
  return value?.toLowerCase() === 'true';
}

function parsePlacement(value) {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper in Placement) {
    return upper;
  }
  return null;
}

function parseRadiationType(value) {
  const upper = value.toUpperCase();
  if (upper in Radiation_Type) {
    return upper;
  }
  throw new Error(`Invalid radiation type: ${value}`);
}

function to3Decimals(value) {
  return Math.round(value * 1000) / 1000;
}

async function main() {
  console.log('Starting seed...');

  // Read and parse CSV
  const csvPath = path.join(__dirname, 'radia_onefile_dataset_v2.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const parseResult = Papa.parse(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  const data = parseResult.data;
  console.log(`Parsed ${data.length} rows from CSV`);

  // Extract unique entities
  const departments = [...new Set(data.map(r => r.department_name))].filter(d => d && typeof d === 'string');
  const roles = [...new Set(data.map(r => r.role_name))].filter(r => r && typeof r === 'string');
  const users = [...new Map(data.map(r => [r.user_email, {
    email: r.user_email,
    username: r.username,
    name: r.user_name,
  }])).values()].filter(u => u.email && u.username && u.name);

  // 1. Create Departments
  console.log('Creating departments...');
  const departmentMap = new Map();
  for (const deptName of departments) {
    const dept = await prisma.department.upsert({
      where: { name: deptName },
      update: {},
      create: { name: deptName },
    });
    departmentMap.set(deptName, dept.id);
    console.log(`  Created/found department: ${deptName} (ID: ${dept.id})`);
  }

  // 2. Create Roles
  console.log('Creating roles...');
  const roleMap = new Map();
  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleMap.set(roleName, role.id);
    console.log(`  Created/found role: ${roleName} (ID: ${role.id})`);
  }

  // 3. Create Users
  console.log('Creating users...');
  const userMap = new Map();
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        username: userData.username,
        name: userData.name,
        password_hash: '$2b$10$defaultHashForSeedData', // Placeholder hash
      },
    });
    userMap.set(userData.email, user.id);
    console.log(`  Created/found user: ${userData.email} (ID: ${user.id})`);
  }

  // 4. Create Workers
  console.log('Creating workers...');
  const workerMap = new Map();
  const workers = [...new Map(data.map(r => [r.user_email, {
    user_email: r.user_email,
    first_name: r.worker_first_name,
    last_name: r.worker_last_name,
    department_name: r.department_name,
    role_name: r.role_name,
  }])).values()];

  for (const workerData of workers) {
    const userId = userMap.get(workerData.user_email);
    if (!userId) continue;

    const worker = await prisma.worker.upsert({
      where: { user_id: userId },
      update: {},
      create: {
        first_name: workerData.first_name,
        last_name: workerData.last_name,
        user_id: userId,
        Department: {
          connect: { id: departmentMap.get(workerData.department_name) },
        },
        Role: {
          connect: { id: roleMap.get(workerData.role_name) },
        },
      },
    });
    workerMap.set(workerData.user_email, worker.id);
    console.log(`  Created/found worker: ${workerData.first_name} ${workerData.last_name} (ID: ${worker.id})`);
  }

  // 5. Create Dosimeters
  console.log('Creating dosimeters...');
  const dosimeterMap = new Map();
  const dosimeters = [...new Map(data.map(r => [r.dosimeter_id, {
    dosimeter_id: r.dosimeter_id,
    placement: r.dosimeter_placement,
    is_control: r.dosimeter_is_control,
    department_name: r.department_name,
    user_email: r.user_email,
  }])).values()];

  for (const dosData of dosimeters) {
    const deptId = departmentMap.get(dosData.department_name);
    const workerId = workerMap.get(dosData.user_email);
    const isControl = parseBoolean(dosData.is_control);
    const placement = parsePlacement(dosData.placement);

    if (!deptId) continue;

    // Check if dosimeter already exists
    const existing = await prisma.dosimeter.findFirst({
      where: {
        id: dosData.dosimeter_id,
      },
    });

    if (!existing) {
      const dosimeter = await prisma.dosimeter.create({
        data: {
          id: dosData.dosimeter_id,
          placement: placement,
          department_id: deptId,
          is_control: isControl,
          worker_id: isControl ? null : workerId,
        },
      });
      dosimeterMap.set(dosData.dosimeter_id, dosimeter.id);
      console.log(`  Created dosimeter ID: ${dosimeter.id} (Placement: ${placement || 'CONTROL'})`);
    } else {
      dosimeterMap.set(dosData.dosimeter_id, existing.id);
      console.log(`  Found existing dosimeter ID: ${existing.id}`);
    }
  }

  // 6. Create Limits
  console.log('Creating limits...');
  const limits = [...new Map(data.map(r => [`${r.department_name}-${r.role_name}`, {
    department_name: r.department_name,
    role_name: r.role_name,
    limit_dose_mSv: r.role_limit_mSv,
  }])).values()];

  for (const limitData of limits) {
    const deptId = departmentMap.get(limitData.department_name);
    const roleId = roleMap.get(limitData.role_name);

    if (!deptId || !roleId) continue;

    // Check if limit already exists
    const existing = await prisma.limit.findFirst({
      where: {
        department_id: deptId,
        role_id: roleId,
      },
    });

    if (!existing) {
      await prisma.limit.create({
        data: {
          department_id: deptId,
          role_id: roleId,
          limit_dose_mSv: limitData.limit_dose_mSv,
        },
      });
      console.log(`  Created limit for ${limitData.role_name} in ${limitData.department_name}`);
    } else {
      console.log(`  Found existing limit for ${limitData.role_name} in ${limitData.department_name}`);
    }
  }

  // 7. Create Readings
  console.log('Creating readings...');
  let readingCount = 0;
  for (const row of data) {
    const dosimeterId = dosimeterMap.get(row.dosimeter_id);
    if (!dosimeterId) {
      console.log(`  Warning: Dosimeter ${row.dosimeter_id} not found, skipping reading`);
      continue;
    }

    try {
      await prisma.reading.create({
        data: {
          dosimeter_id: dosimeterId,
          is_minimal: parseBoolean(row.is_minimal),
          is_null: parseBoolean(row.is_null),
          reading_date: new Date(row.reading_date),
          reading_period_start: new Date(row.reading_period_start),
          reading_period_end: new Date(row.reading_period_end),
          dose_mSv_chest:  to3Decimals(row.dose_mSv_chest),
          dose_mSv_eye:  to3Decimals(row.dose_mSv_eye),
          dose_mSv_extremities:  to3Decimals(row.dose_mSv_extremities),
          dose_mSv_foetal:  to3Decimals(row.dose_mSv_foetal),
          total_mSv_chest:  to3Decimals(row.total_mSv_chest),
          total_mSv_eye:  to3Decimals(row.total_mSv_eye),
          total_mSv_extremities:  to3Decimals(row.total_mSv_extremities),
          total_mSv_foetal:  to3Decimals(row.total_mSv_foetal),
          radiation_type: parseRadiationType(row.radiation_type),
        },
      });
      readingCount++;
    } catch (error) {
      console.log(`  Error creating reading: ${error.message}`);
    }
  }
  console.log(`  Created ${readingCount} readings`);

  console.log('Seed completed successfully!');
}


  // 8. Create Permissions
    console.log('Creating permissions');
// create 3 values and assign to roles
const [permALL, permDEPT, permWORKER] = await Promise.all([
  prisma.permission.upsert({
    where: { name: 'ALL' },
    update: {},
    create: { name: 'ALL' },
  }),
  prisma.permission.upsert({
    where: { name: 'DEPARTMENT' },
    update: {},
    create: { name: 'DEPARTMENT' },
  }),
  prisma.permission.upsert({
    where: { name: 'WORKER' },
    update: {},
    create: { name: 'WORKER' },
  }),
]);

// Fetch all roles once
const allRoles = await prisma.role.findMany({ select: { id: true, name: true } });

// Helper: choose permissions by role name
function permsForRole(name) {
  if (name === 'Radiation Protection Officer') {
    // ALL + DEPARTMENT + WORKER
    return [permALL.id, permDEPT.id, permWORKER.id];
  }
  if (name === 'Head of Department') {
    // DEPARTMENT + WORKER
    return [permDEPT.id, permWORKER.id];
  }
  // Everyone else: WORKER only
  return [permWORKER.id];
}

// Apply permissions (overwrite any existing with a clean set)
await Promise.all(
  allRoles.map((r) =>
    prisma.role.update({
      where: { id: r.id },
      data: {
        Permission: {
          set: permsForRole(r.name).map((id) => ({ id })),
        },
      },
    })
  )
);

 

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });