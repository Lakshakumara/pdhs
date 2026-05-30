module.exports = {
  districts: [
    { id: 'dist_rat', name: 'Rathnapura' },
    { id: 'dist_keg', name: 'Kegalle' }
  ],
  institutions: [
    { id: 'inst_pdhs', name: 'Sabaragamuwa PDHS Office', type: 'PDHS Office', active: true },
    { id: 'inst_rdhs_rat', name: 'Rathnapura RDHS Office', type: 'RDHS Office', districtId: 'dist_rat', active: true },
    { id: 'inst_rdhs_keg', name: 'Kegalle RDHS Office', type: 'RDHS Office', districtId: 'dist_keg', active: true },
    { id: 'inst_bh_rat', name: 'Rathnapura Base Hospital', type: 'Base Hospital', districtId: 'dist_rat', active: true },
    { id: 'inst_bh_keg', name: 'Kegalle Base Hospital', type: 'Base Hospital', districtId: 'dist_keg', active: true },
    { id: 'inst_dh_bal', name: 'Balangoda Divisional Hospital', type: 'Divisional Hospital', districtId: 'dist_rat', active: true },
    { id: 'inst_dh_kar', name: 'Karawanella Divisional Hospital', type: 'Divisional Hospital', districtId: 'dist_keg', active: true },
    { id: 'inst_pmcu_kal', name: 'Kalawana PMCU', type: 'PMCU', districtId: 'dist_rat', active: true },
    { id: 'inst_moh_rat', name: 'MOH Office Rathnapura', type: 'MOH Office', districtId: 'dist_rat', active: true },
    { id: 'inst_clinic_std', name: 'STD Clinic Rathnapura', type: 'STD Clinic', districtId: 'dist_rat', active: true },
    { id: 'inst_rmsd_rat', name: 'RMSD Rathnapura', type: 'Regional Medical Supply Division (RMSD)', districtId: 'dist_rat', active: true }
  ],
  users: [
    { id: 'usr_admin', username: 'admin', fullName: 'YML Kumara (Admin)', role: 'System Administrator', active: true },
    { id: 'usr_tech1', username: 'tech_nuwan', fullName: 'Nuwan Perera (Technician)', role: 'Biomedical Technician', active: true },
    { id: 'usr_proc1', username: 'proc_sajith', fullName: 'Sajith Bandara (Procurement)', role: 'Procurement Officer', active: true },
    { id: 'usr_viewer', username: 'pdhs_director', fullName: 'Dr. K. Pathirana (PDHS Director)', role: 'PDHS Viewer', active: true },
    { id: 'usr_rdhs_rat', username: 'rdhs_rat', fullName: 'Mrs. D. Wickramasinghe (RDHS Rat)', role: 'RDHS Officer', districtId: 'dist_rat', active: true },
    { id: 'usr_bh_rat', username: 'bh_rat_user', fullName: 'Dr. Saman Silva (Rathnapura BH)', role: 'Institution User', institutionId: 'inst_bh_rat', active: true },
    { id: 'usr_dh_bal', username: 'dh_bal_user', fullName: 'Sister Priyanthi (Balangoda DH)', role: 'Institution User', institutionId: 'inst_dh_bal', active: true }
  ],
  suppliers: [
    { id: 'sup_prime', name: 'Prime Diagnostics Ltd', contactName: 'M. Fernando', phone: '+94 11 2345678', email: 'sales@primediag.lk', performanceNotes: 'Excellent support on MRI/CT calibrations.', rating: 5 },
    { id: 'sup_medi', name: 'MediEquipment Pvt Ltd', contactName: 'K. Ratnayake', phone: '+94 11 7654321', email: 'service@mediequip.lk', performanceNotes: 'Prompt delivery of parts, pricing moderate.', rating: 4 },
    { id: 'sup_supplies', name: 'Sabaragamuwa Medical Supplies', contactName: 'R. Perera', phone: '+94 45 2234123', email: 'sabsupplies@gmail.com', performanceNotes: 'Good local supplier for consumables.', rating: 3 }
  ],
  inventoryItems: [
    { id: 'inv_bat_philips', name: 'Philips Defibrillator Battery M5070A', category: 'spare part', currentStock: 2, minStockThreshold: 3, unitOfMeasure: 'Pcs', costPerUnit: 25000 },
    { id: 'inv_spo2_goldway', name: 'Goldway SpO2 Sensor (Reusable)', category: 'spare part', currentStock: 8, minStockThreshold: 5, unitOfMeasure: 'Pcs', costPerUnit: 12000 },
    { id: 'inv_ecg_leads', name: '3-Lead ECG Patient Cable', category: 'spare part', currentStock: 15, minStockThreshold: 10, unitOfMeasure: 'Pcs', costPerUnit: 6000 },
    { id: 'inv_helium', name: 'Helium Refill Cylinder 50L', category: 'consumable', currentStock: 1, minStockThreshold: 2, unitOfMeasure: 'Cylinder', costPerUnit: 150000 },
    { id: 'inv_nibp_cuff', name: 'Adult NIBP Cuff (Double Tube)', category: 'consumable', currentStock: 10, minStockThreshold: 8, unitOfMeasure: 'Pcs', costPerUnit: 4500 }
  ],
  equipment: [
    {
      id: 'eq_mri_01',
      name: 'Siemens Magnetom Altea 1.5T MRI',
      description: 'High-end diagnostic magnetic resonance imaging scanner.',
      category: 'Radiology',
      manufacturer: 'Siemens Healthineers',
      countryOfOrigin: 'Germany',
      supplierName: 'Prime Diagnostics Ltd',
      tenderNumber: 'TND/2024/MED/089',
      purchaseOrderNumber: 'PO-2024-88392',
      modelNumber: 'Magnetom Altea 1.5T',
      serialNumber: 'SN-MRI-88329-SIE',
      batchNumber: 'BATCH-2024-01',
      quantityReceived: 1,
      dateOfManufacture: '2024-02-15',
      dateOfReceipt: '2024-06-20',
      warrantyPeriodMonths: 60,
      status: 'PDHS Store',
      servicePlan: {
        id: 'sp_mri_01',
        agreementReference: 'SVC-SIE-9902',
        expiryDate: '2029-06-20',
        sparePartDiscountPercent: 20,
        yearlyPricing: { 1: 500000, 2: 520000, 3: 540000, 4: 560000, 5: 580000 }
      },
      components: [
        { id: 'eqc_mri_01_1', name: 'RF Body Coil', description: 'Radiofrequency transmit/receive coil', partNumber: 'RF-B-101', serialNumber: 'COIL-7762', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2029-06-20' },
        { id: 'eqc_mri_01_2', name: 'Helium Compressor Unit', description: 'Coldhead compressor unit', partNumber: 'HC-COMP-99', serialNumber: 'COMP-11029', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2029-06-20' },
        { id: 'eqc_mri_01_3', name: 'Console PC Workstation', description: 'Reconstruction and acquisition computer host', partNumber: 'WS-SIE-X8', serialNumber: 'PC-998827', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2027-06-20' },
        { id: 'eqc_mri_01_4', name: 'MRI Patient Table', description: 'Motorized sliding patient table', partNumber: 'TBL-ALTEA', quantity: 1, componentType: 'Minor/Non-tracked' }
      ]
    },
    {
      id: 'eq_defib_01',
      name: 'Philips HeartStart XL+ Defibrillator',
      description: 'Biphasic defibrillator/monitor with pacing and ECG recording.',
      category: 'Life Support',
      manufacturer: 'Philips Healthcare',
      countryOfOrigin: 'USA',
      supplierName: 'MediEquipment Pvt Ltd',
      tenderNumber: 'TND/2023/MED/102',
      purchaseOrderNumber: 'PO-2023-77402',
      modelNumber: 'HeartStart XL+',
      serialNumber: 'SN-DF-77632-PHI',
      batchNumber: 'B-PHI-2023',
      quantityReceived: 1,
      dateOfManufacture: '2023-01-10',
      dateOfReceipt: '2023-04-15',
      warrantyPeriodMonths: 24,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_rat',
      components: [
        { id: 'eqc_defib_1_1', name: 'Rechargeable Li-Ion Battery', description: '14.8V battery pack', partNumber: 'M5070A', serialNumber: 'BATT-99281', quantity: 1, componentType: 'Consumable', expiryOrWarrantyDate: '2025-04-15' },
        { id: 'eqc_defib_1_2', name: 'External Defibrillating Paddles', description: 'Hard paddles set with adult/pediatric sliding contact', partNumber: 'PADDLE-XL', serialNumber: 'PAD-66271', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2025-04-15' },
        { id: 'eqc_defib_1_3', name: '3-Lead ECG Patient Cable', description: 'ECG connector lead wire set', partNumber: 'ECG-3L', quantity: 1, componentType: 'Minor/Non-tracked' }
      ]
    },
    {
      id: 'eq_monitor_01',
      name: 'Goldway G30E Patient Monitor',
      description: 'Multi-parameter bedside monitor tracking SpO2, NIBP, Pulse, and Temp.',
      category: 'Diagnostic',
      manufacturer: 'Goldway (Philips)',
      countryOfOrigin: 'China',
      supplierName: 'MediEquipment Pvt Ltd',
      tenderNumber: 'TND/2024/MED/012',
      purchaseOrderNumber: 'PO-2024-11029',
      modelNumber: 'G30E',
      serialNumber: 'SN-PM-55419-GW',
      batchNumber: 'B-GW-2024',
      quantityReceived: 1,
      dateOfManufacture: '2024-01-05',
      dateOfReceipt: '2024-03-10',
      warrantyPeriodMonths: 12,
      status: 'Assigned',
      assignedInstitutionId: 'inst_dh_bal',
      components: [
        { id: 'eqc_mon_1_1', name: 'SpO2 Finger Sensor', description: 'Adult reusable silicone clip SpO2 sensor', partNumber: 'SPO2-GW-01', serialNumber: 'SPO2-8819', quantity: 1, componentType: 'Consumable', expiryOrWarrantyDate: '2025-03-10' },
        { id: 'eqc_mon_1_2', name: 'NIBP Cuff Adult', description: 'Reusable blood pressure cuff', partNumber: 'NIBP-GW-A', quantity: 1, componentType: 'Minor/Non-tracked' }
      ]
    },
    {
      id: 'eq_xray_01',
      name: 'Shimadzu RADspeed Fit Digital X-Ray',
      description: 'Ceiling suspension digital radiography system.',
      category: 'Radiology',
      manufacturer: 'Shimadzu Corp',
      countryOfOrigin: 'Japan',
      supplierName: 'Prime Diagnostics Ltd',
      tenderNumber: 'TND/2022/MED/115',
      purchaseOrderNumber: 'PO-2022-44102',
      modelNumber: 'RADspeed Fit',
      serialNumber: 'SN-XR-11928-SHI',
      batchNumber: 'B-SHI-2022',
      quantityReceived: 1,
      dateOfManufacture: '2022-05-18',
      dateOfReceipt: '2022-09-05',
      warrantyPeriodMonths: 36,
      status: 'Assigned',
      assignedInstitutionId: 'inst_bh_keg',
      components: [
        { id: 'eqc_xr_1_1', name: 'X-Ray Tube Assembly', description: 'Rotating anode X-ray source tube', partNumber: 'TUBE-SHI-150', serialNumber: 'TUBE-2291', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2025-09-05' },
        { id: 'eqc_xr_1_2', name: 'Digital Flat Panel Detector', description: 'Wireless DR flat panel detector image capturer', partNumber: 'FPD-SHI-CX', serialNumber: 'FPD-00392', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2025-09-05' }
      ]
    }
  ],
  assignments: [
    { id: 'asg_01', equipmentId: 'eq_defib_01', fromEntity: 'PDHS', toEntity: 'RDHS', toEntityId: 'inst_rdhs_rat', quantity: 1, assignmentDate: '2023-04-16', status: 'Delivered' },
    { id: 'asg_02', equipmentId: 'eq_defib_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_rat', quantity: 1, assignmentDate: '2023-04-18', status: 'Acknowledged' },
    { id: 'asg_03', equipmentId: 'eq_monitor_01', fromEntity: 'PDHS', toEntity: 'RDHS', toEntityId: 'inst_rdhs_rat', quantity: 1, assignmentDate: '2024-03-12', status: 'Delivered' },
    { id: 'asg_04', equipmentId: 'eq_monitor_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_dh_bal', quantity: 1, assignmentDate: '2024-03-15', status: 'Acknowledged' },
    { id: 'asg_05', equipmentId: 'eq_xray_01', fromEntity: 'PDHS', toEntity: 'RDHS', toEntityId: 'inst_rdhs_keg', quantity: 1, assignmentDate: '2022-09-08', status: 'Delivered' },
    { id: 'asg_06', equipmentId: 'eq_xray_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_keg', quantity: 1, assignmentDate: '2022-09-10', status: 'Acknowledged' }
  ],
  repairRequests: [
    {
      id: 'REQ-2026-001',
      equipmentId: 'eq_defib_01',
      equipmentName: 'Philips HeartStart XL+ Defibrillator',
      equipmentSerialNumber: 'SN-DF-77632-PHI',
      componentId: 'eqc_defib_1_2',
      componentName: 'External Defibrillating Paddles',
      faultDescription: 'Defibrillator fails to discharge shock. Warning alert on screen points to paddle calibration/connection issue.',
      priority: 'Emergency',
      submittedByUserId: 'usr_bh_rat',
      submittedByUserName: 'Dr. Saman Silva',
      submissionDate: '2026-05-24T10:30:00Z',
      institutionId: 'inst_bh_rat',
      institutionName: 'Rathnapura Base Hospital'
    },
    {
      id: 'REQ-2026-002',
      equipmentId: 'eq_monitor_01',
      equipmentName: 'Goldway G30E Patient Monitor',
      equipmentSerialNumber: 'SN-PM-55419-GW',
      componentId: 'eqc_mon_1_1',
      componentName: 'SpO2 Finger Sensor',
      faultDescription: 'SpO2 sensor cord is frayed. Monitor reads "Sensor Disconnected" constantly.',
      priority: 'Routine',
      submittedByUserId: 'usr_dh_bal',
      submittedByUserName: 'Sister Priyanthi',
      submissionDate: '2026-05-25T14:15:00Z',
      institutionId: 'inst_dh_bal',
      institutionName: 'Balangoda Divisional Hospital'
    }
  ],
  workOrders: [
    {
      id: 'WO-2026-001',
      repairRequestId: 'REQ-2026-001',
      assignedTechnicianId: 'usr_tech1',
      assignedTechnicianName: 'Nuwan Perera (Technician)',
      diagnosisNotes: 'Diagnostic check indicates internal paddle contacts are worn. The cables have continuity but discharge resistance is too high. Replaced standard wiring assembly.',
      status: 'In Repair',
      statusDate: '2026-05-25T08:00:00Z',
      inspectedComponents: [
        { componentId: 'eqc_defib_1_1', componentName: 'Rechargeable Li-Ion Battery', inspected: true, conditionNotes: 'Healthy, capacity at 92%' },
        { componentId: 'eqc_defib_1_2', componentName: 'External Defibrillating Paddles', inspected: true, conditionNotes: 'Damaged contacts, high resistance' },
        { componentId: 'eqc_defib_1_3', componentName: '3-Lead ECG Patient Cable', inspected: true, conditionNotes: 'Good condition' }
      ],
      partsUsed: []
    },
    {
      id: 'WO-2026-002',
      repairRequestId: 'REQ-2026-002',
      status: 'Submitted',
      statusDate: '2026-05-25T14:15:00Z',
      inspectedComponents: [],
      partsUsed: []
    }
  ],
  procurementPlans: [
    { id: 'plan_01', itemDescription: 'Procurement of Life Support Spare Batteries (M5070A)', estimatedQuantity: 5, estimatedCost: 125000, procurementMethod: 'Quotation' },
    { id: 'plan_02', itemDescription: 'Annual Calibration Consumables sab-province', estimatedQuantity: 100, estimatedCost: 350000, procurementMethod: 'Limited Tender' }
  ],
  purchaseOrders: [
    {
      id: 'po_01',
      planId: 'plan_01',
      supplierId: 'sup_medi',
      supplierName: 'MediEquipment Pvt Ltd',
      poNumber: 'PO-2026-00049',
      orderDate: '2026-05-10',
      approvalStatus: 'Approved',
      totalCost: 125000,
      items: [
        { description: 'Philips Defibrillator Battery M5070A', quantity: 5, unitCost: 25000, category: 'spare part' }
      ]
    }
  ],
  grns: [],
  auditLogs: [
    { id: 'aud_01', timestamp: '2026-05-24T10:30:00Z', userId: 'usr_bh_rat', userName: 'Dr. Saman Silva', userRole: 'Institution User', action: 'CREATE', entityName: 'RepairRequest', recordId: 'REQ-2026-001', description: 'Created repair request REQ-2026-001 for Phillips Defibrillator.' },
    { id: 'aud_02', timestamp: '2026-05-25T08:00:00Z', userId: 'usr_tech1', userName: 'Nuwan Perera', userRole: 'Biomedical Technician', action: 'UPDATE', entityName: 'WorkOrder', recordId: 'WO-2026-001', description: 'Acknowledged work order WO-2026-001 and assigned to self.' }
  ]
};
