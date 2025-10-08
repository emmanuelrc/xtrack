require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
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

  // 2. Create Roles (including special roles)
  console.log('Creating roles...');
  const roleMap = new Map();
  
  // Add special roles to the list
  const allRoles = [...roles, "Radiation Protection Officer", "Head Of Department"];
  const uniqueRoles = [...new Set(allRoles)];
  
  for (const roleName of uniqueRoles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleMap.set(roleName, role.id);
    console.log(`  Created/found role: ${roleName} (ID: ${role.id})`);
  }

// 2a. Connect Roles to Departments
  console.log('Connecting roles to departments...');
  
  // Extract unique department-role combinations from CSV
  const deptRolePairs = [...new Set(data.map(r => 
    `${r.department_name}|${r.role_name}`
  ))].filter(pair => pair.split('|').every(p => p));
  
  for (const pair of deptRolePairs) {
    const [deptName, roleName] = pair.split('|');
    const deptId = departmentMap.get(deptName);
    const roleId = roleMap.get(roleName);
    
    if (!deptId || !roleId) continue;
    
    // Check if connection already exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { Department: true },
    });
    
    const alreadyConnected = role?.Department.some(d => d.id === deptId);
    
    if (!alreadyConnected) {
      await prisma.role.update({
        where: { id: roleId },
        data: {
          Department: {
            connect: { id: deptId },
          },
        },
      });
      console.log(`  Connected ${roleName} to ${deptName}`);
    }
  }
  
  // Connect special roles to all departments
  const specialRoles = ["Radiation Protection Officer", "Head Of Department"];
  const allDepartments = await prisma.department.findMany();
  
  for (const specialRoleName of specialRoles) {
    const roleId = roleMap.get(specialRoleName);
    if (!roleId) continue;
    
    for (const dept of allDepartments) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: { Department: true },
      });
      
      const alreadyConnected = role?.Department.some(d => d.id === dept.id);
      
      if (!alreadyConnected) {
        await prisma.role.update({
          where: { id: roleId },
          data: {
            Department: {
              connect: { id: dept.id },
            },
          },
        });
        console.log(`  Connected ${specialRoleName} to ${dept.name}`);
      }
    }
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

  // 4a. Assign special roles to workers
  console.log('Assigning special roles...');

  const rpoRoleId = roleMap.get("Radiation Protection Officer");
  const hodRoleId = roleMap.get("Head Of Department");

  // Flags to track if we've assigned these roles
  let rpoAssigned = false;
  let hodAssigned = false;

  // Find all workers and their current roles
  for (const workerData of workers) {
    const userId = userMap.get(workerData.user_email);
    if (!userId) continue;
    
    const worker = await prisma.worker.findUnique({
      where: { user_id: userId },
      include: { Role: true },
    });
    
    if (!worker) continue;
    
    // Assign RPO to first Oncologist or Nuclear Medicine Physician found
    if (!rpoAssigned && 
        (workerData.role_name === "Oncologist" || 
        workerData.role_name === "Nuclear Medicine Physician")) {
      const hasRPO = worker.Role.some(r => r.id === rpoRoleId);
      if (!hasRPO) {
        await prisma.worker.update({
          where: { id: worker.id },
          data: {
            Role: {
              connect: { id: rpoRoleId },
            },
          },
        });
        console.log(`  Added Radiation Protection Officer to ${worker.first_name} ${worker.last_name} (${workerData.role_name})`);
        rpoAssigned = true; // Mark as assigned
      }
    }
    
    // Assign HOD to first Nurse found
    if (!hodAssigned && workerData.role_name.includes("Nurse")) {
      const hasHOD = worker.Role.some(r => r.id === hodRoleId);
      if (!hasHOD) {
        await prisma.worker.update({
          where: { id: worker.id },
          data: {
            Role: {
              connect: { id: hodRoleId },
            },
          },
        });
        console.log(`  Added Head Of Department to ${worker.first_name} ${worker.last_name} (${workerData.role_name})`);
        hodAssigned = true; // Mark as assigned
      }
    }
    
    // Exit early if both roles have been assigned
    if (rpoAssigned && hodAssigned) {
      break;
    }
  }

  // 5. Create Permissions and assign to Roles
  console.log('Creating permissions...');
  const permissionNames = ["ALL", "DEPARTMENT", "WORKER"];
  const permissionMap = new Map();
  
  for (const permName of permissionNames) {
    const permission = await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: { name: permName },
    });
    permissionMap.set(permName, permission.id);
    console.log(`  Created/found permission: ${permName} (ID: ${permission.id})`);
  }
  
  // Assign permissions to roles
  console.log('Assigning permissions to roles...');
  
  // Radiation Protection Officer gets ALL, DEPARTMENT, WORKER
  const rpoRole = await prisma.role.findUnique({
    where: { name: "Radiation Protection Officer" },
    include: { Permission: true },
  });
  
  if (rpoRole) {
    const rpoPermissions = ["ALL", "DEPARTMENT", "WORKER"];
    for (const permName of rpoPermissions) {
      const hasPermission = rpoRole.Permission.some(p => p.name === permName);
      if (!hasPermission) {
        await prisma.role.update({
          where: { id: rpoRole.id },
          data: {
            Permission: {
              connect: { id: permissionMap.get(permName) },
            },
          },
        });
      }
    }
    console.log(`  Assigned ALL, DEPARTMENT, WORKER to Radiation Protection Officer`);
  }
  
  // Head Of Department gets DEPARTMENT, WORKER
  const hodRole = await prisma.role.findUnique({
    where: { name: "Head Of Department" },
    include: { Permission: true },
  });
  
  if (hodRole) {
    const hodPermissions = ["DEPARTMENT", "WORKER"];
    for (const permName of hodPermissions) {
      const hasPermission = hodRole.Permission.some(p => p.name === permName);
      if (!hasPermission) {
        await prisma.role.update({
          where: { id: hodRole.id },
          data: {
            Permission: {
              connect: { id: permissionMap.get(permName) },
            },
          },
        });
      }
    }
    console.log(`  Assigned DEPARTMENT, WORKER to Head Of Department`);
  }
  
  // All other roles get WORKER permission
  const allRolesList = await prisma.role.findMany({
    include: { Permission: true },
  });
  
  for (const role of allRolesList) {
    if (role.name !== "Radiation Protection Officer" && role.name !== "Head Of Department") {
      const hasWorkerPermission = role.Permission.some(p => p.name === "WORKER");
      if (!hasWorkerPermission) {
        await prisma.role.update({
          where: { id: role.id },
          data: {
            Permission: {
              connect: { id: permissionMap.get("WORKER") },
            },
          },
        });
        console.log(`  Assigned WORKER permission to ${role.name}`);
      }
    }
  }

  // 6. Create Dosimeters
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

  // 7. Create Limits with placement
  console.log('Creating limits with placement...');
  
  // Extract unique combinations of department, role, placement from non-control dosimeters
  const limitCombinations = new Map();
  
  for (const row of data) {
    // Skip control dosimeters (they don't have workers/roles)
    if (parseBoolean(row.dosimeter_is_control)) continue;
    
    const placement = parsePlacement(row.dosimeter_placement);
    // Skip if no valid placement
    if (!placement) continue;
    
    const key = `${row.department_name}-${row.role_name}-${placement}`;
    
    if (!limitCombinations.has(key)) {
      limitCombinations.set(key, {
        department_name: row.department_name,
        role_name: row.role_name,
        placement: placement,
        limit_dose_mSv: row.role_limit_mSv,
      });
    }
  }

  console.log(`Found ${limitCombinations.size} unique department-role-placement combinations`);

  for (const limitData of limitCombinations.values()) {
    const deptId = departmentMap.get(limitData.department_name);
    const roleId = roleMap.get(limitData.role_name);

    if (!deptId || !roleId) {
      console.log(`  Warning: Missing department or role for ${limitData.role_name} in ${limitData.department_name}`);
      continue;
    }

    // Check if limit already exists
    const existing = await prisma.limit.findFirst({
      where: {
        department_id: deptId,
        role_id: roleId,
        placement: limitData.placement,
      },
    });

    if (!existing) {
      await prisma.limit.create({
        data: {
          department_id: deptId,
          role_id: roleId,
          placement: limitData.placement,
          limit_dose_mSv: limitData.limit_dose_mSv,
        },
      });
      console.log(`  Created limit for ${limitData.role_name} in ${limitData.department_name} - ${limitData.placement}: ${limitData.limit_dose_mSv} mSv`);
    } else {
      console.log(`  Found existing limit for ${limitData.role_name} in ${limitData.department_name} - ${limitData.placement}`);
    }
  }

  // 8. Create Readings
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
          dose_mSv_chest: row.dose_mSv_chest,
          dose_mSv_eye: row.dose_mSv_eye,
          dose_mSv_extremities: row.dose_mSv_extremities,
          dose_mSv_foetal: row.dose_mSv_foetal,
          total_mSv_chest: row.total_mSv_chest,
          total_mSv_eye: row.total_mSv_eye,
          total_mSv_extremities: row.total_mSv_extremities,
          total_mSv_foetal: row.total_mSv_foetal,
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

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });