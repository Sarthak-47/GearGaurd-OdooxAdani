/**
 * GearGuard - Database Seed Script
 * Creates sample data for testing and demonstration
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.maintenanceRequest.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.maintenanceTeam.deleteMany();

  // ============================================
  // CREATE MAINTENANCE TEAMS
  // ============================================
  console.log('Creating maintenance teams...');

  const mechanicsTeam = await prisma.maintenanceTeam.create({
    data: {
      name: 'Mechanics',
    },
  });

  const electriciansTeam = await prisma.maintenanceTeam.create({
    data: {
      name: 'Electricians',
    },
  });

  const itSupportTeam = await prisma.maintenanceTeam.create({
    data: {
      name: 'IT Support',
    },
  });

  const hvacTeam = await prisma.maintenanceTeam.create({
    data: {
      name: 'HVAC Specialists',
    },
  });

  // ============================================
  // CREATE USERS
  // ============================================
  console.log('Creating users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Manager
  const manager = await prisma.user.create({
    data: {
      email: 'manager@gearguard.com',
      password: hashedPassword,
      name: 'Sarah Johnson',
      role: 'MANAGER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
  });

  // Technicians
  const techMike = await prisma.user.create({
    data: {
      email: 'mike@gearguard.com',
      password: hashedPassword,
      name: 'Mike Chen',
      role: 'TECHNICIAN',
      teamId: mechanicsTeam.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    },
  });

  const techEmma = await prisma.user.create({
    data: {
      email: 'emma@gearguard.com',
      password: hashedPassword,
      name: 'Emma Wilson',
      role: 'TECHNICIAN',
      teamId: electriciansTeam.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    },
  });

  const techJohn = await prisma.user.create({
    data: {
      email: 'john@gearguard.com',
      password: hashedPassword,
      name: 'John Smith',
      role: 'TECHNICIAN',
      teamId: itSupportTeam.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    },
  });

  const techAlex = await prisma.user.create({
    data: {
      email: 'alex@gearguard.com',
      password: hashedPassword,
      name: 'Alex Rodriguez',
      role: 'TECHNICIAN',
      teamId: hvacTeam.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    },
  });

  // Regular Users
  const user1 = await prisma.user.create({
    data: {
      email: 'user@gearguard.com',
      password: hashedPassword,
      name: 'Bob Anderson',
      role: 'USER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'lisa@gearguard.com',
      password: hashedPassword,
      name: 'Lisa Park',
      role: 'USER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    },
  });

  // ============================================
  // CREATE EQUIPMENT
  // ============================================
  console.log('Creating equipment...');

  const equipment1 = await prisma.equipment.create({
    data: {
      name: 'CNC Milling Machine',
      serialNumber: 'CNC-2024-001',
      department: 'Manufacturing',
      assignedEmployee: 'Tom Hardy',
      purchaseDate: new Date('2023-03-15'),
      warrantyEndDate: new Date('2026-03-15'),
      location: 'Building A - Floor 1',
      teamId: mechanicsTeam.id,
    },
  });

  const equipment2 = await prisma.equipment.create({
    data: {
      name: 'Industrial Generator',
      serialNumber: 'GEN-2024-002',
      department: 'Power Systems',
      assignedEmployee: 'Jane Doe',
      purchaseDate: new Date('2022-08-20'),
      warrantyEndDate: new Date('2025-08-20'),
      location: 'Building B - Basement',
      teamId: electriciansTeam.id,
    },
  });

  const equipment3 = await prisma.equipment.create({
    data: {
      name: 'Dell PowerEdge R750',
      serialNumber: 'SRV-2024-003',
      department: 'IT Infrastructure',
      assignedEmployee: null,
      purchaseDate: new Date('2024-01-10'),
      warrantyEndDate: new Date('2027-01-10'),
      location: 'Server Room - Rack 5',
      teamId: itSupportTeam.id,
    },
  });

  const equipment4 = await prisma.equipment.create({
    data: {
      name: 'Carrier HVAC Unit',
      serialNumber: 'HVAC-2024-004',
      department: 'Facilities',
      assignedEmployee: null,
      purchaseDate: new Date('2021-05-01'),
      warrantyEndDate: new Date('2024-05-01'),
      location: 'Building A - Rooftop',
      teamId: hvacTeam.id,
    },
  });

  const equipment5 = await prisma.equipment.create({
    data: {
      name: 'Hydraulic Press',
      serialNumber: 'HYD-2024-005',
      department: 'Manufacturing',
      assignedEmployee: 'Mark Wilson',
      purchaseDate: new Date('2020-11-30'),
      warrantyEndDate: new Date('2023-11-30'),
      location: 'Building A - Floor 2',
      teamId: mechanicsTeam.id,
    },
  });

  const equipment6 = await prisma.equipment.create({
    data: {
      name: 'Forklift Electric',
      serialNumber: 'FLT-2024-006',
      department: 'Warehouse',
      assignedEmployee: 'Carlos Martinez',
      purchaseDate: new Date('2023-07-15'),
      warrantyEndDate: new Date('2026-07-15'),
      location: 'Warehouse - Zone B',
      teamId: mechanicsTeam.id,
    },
  });

  // ============================================
  // CREATE MAINTENANCE REQUESTS
  // ============================================
  console.log('Creating maintenance requests...');

  // Corrective - New (Overdue)
  await prisma.maintenanceRequest.create({
    data: {
      subject: 'CNC Machine Making Strange Noise',
      description: 'The CNC machine has been making a grinding noise during operation. Needs immediate inspection.',
      type: 'CORRECTIVE',
      priority: 3,
      stage: 'NEW',
      equipmentId: equipment1.id,
      teamId: mechanicsTeam.id,
      createdById: user1.id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  // Corrective - In Progress
  await prisma.maintenanceRequest.create({
    data: {
      subject: 'Generator Voltage Fluctuation',
      description: 'The generator output voltage is fluctuating. Technician is investigating.',
      type: 'CORRECTIVE',
      priority: 4,
      stage: 'IN_PROGRESS',
      equipmentId: equipment2.id,
      teamId: electriciansTeam.id,
      createdById: user2.id,
      technicianId: techEmma.id,
    },
  });

  // Corrective - Repaired
  await prisma.maintenanceRequest.create({
    data: {
      subject: 'Server Memory Error',
      description: 'Memory module replaced. Server restored to normal operation.',
      type: 'CORRECTIVE',
      priority: 4,
      stage: 'REPAIRED',
      duration: 2.5,
      equipmentId: equipment3.id,
      teamId: itSupportTeam.id,
      createdById: manager.id,
      technicianId: techJohn.id,
      notes: 'Replaced faulty RAM module in slot 3. Tested and verified system stability.',
    },
  });

  // Preventive - Scheduled (Future)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  await prisma.maintenanceRequest.create({
    data: {
      subject: 'Quarterly HVAC Filter Replacement',
      description: 'Scheduled quarterly maintenance - replace filters and check refrigerant levels.',
      type: 'PREVENTIVE',
      priority: 2,
      stage: 'NEW',
      scheduledDate: nextWeek,
      equipmentId: equipment4.id,
      teamId: hvacTeam.id,
      createdById: manager.id,
    },
  });

  // Preventive - Scheduled (This Week)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.maintenanceRequest.create({
    data: {
      subject: 'Hydraulic Press Oil Change',
      description: 'Monthly oil change and hydraulic system inspection.',
      type: 'PREVENTIVE',
      priority: 2,
      stage: 'NEW',
      scheduledDate: tomorrow,
      equipmentId: equipment5.id,
      teamId: mechanicsTeam.id,
      createdById: manager.id,
      technicianId: techMike.id,
    },
  });

  // Corrective - New
  await prisma.maintenanceRequest.create({
    data: {
      subject: 'Forklift Battery Not Charging',
      description: 'The forklift battery is not holding charge. May need battery replacement.',
      type: 'CORRECTIVE',
      priority: 3,
      stage: 'NEW',
      equipmentId: equipment6.id,
      teamId: mechanicsTeam.id,
      createdById: user1.id,
    },
  });

  // Preventive - In Progress
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.maintenanceRequest.create({
    data: {
      subject: 'Annual CNC Calibration',
      description: 'Annual calibration check for precision machining.',
      type: 'PREVENTIVE',
      priority: 2,
      stage: 'IN_PROGRESS',
      scheduledDate: yesterday,
      equipmentId: equipment1.id,
      teamId: mechanicsTeam.id,
      createdById: manager.id,
      technicianId: techMike.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📧 Login Credentials:');
  console.log('Manager: manager@gearguard.com / password123');
  console.log('Technician: mike@gearguard.com / password123');
  console.log('User: user@gearguard.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
