-- PAPP Database Initialization and Seed Data

CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed departments
INSERT INTO departments (code, name_th) VALUES
('DEP01', 'สำนักปลัดเทศบาล'),
('DEP02', 'สำนักการศึกษา'),
('DEP03', 'สำนักคลัง'),
('DEP04', 'สำนักสาธารณสุขและสิ่งแวดล้อม'),
('DEP05', 'สำนักช่าง'),
('DEP06', 'สำนักการประปา'),
('DEP07', 'กองยุทธศาสตร์และงบประมาณ'),
('DEP08', 'กองสวัสดิการสังคม'),
('DEP09', 'กองสารสนเทศภาษีและทะเบียนทรัพย์สิน'),
('DEP10', 'กองการเจ้าหน้าที่'),
('DEP11', 'หน่วยตรวจสอบภายใน')
ON CONFLICT (code) DO NOTHING;

-- Equipment Types
CREATE TABLE IF NOT EXISTS equipment_types (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO equipment_types (code, name_th) VALUES
('EQT01', 'ครุภัณฑ์สำนักงาน'),
('EQT02', 'ครุภัณฑ์ยานพาหนะและขนส่ง'),
('EQT03', 'ครุภัณฑ์ไฟฟ้าและวิทยุ'),
('EQT04', 'ครุภัณฑ์โฆษณาและเผยแพร่'),
('EQT05', 'ครุภัณฑ์การเกษตร'),
('EQT06', 'ครุภัณฑ์ก่อสร้าง'),
('EQT07', 'ครุภัณฑ์การแพทย์'),
('EQT08', 'ครุภัณฑ์วิทยาศาสตร์'),
('EQT09', 'ครุภัณฑ์การศึกษา'),
('EQT10', 'ครุภัณฑ์คอมพิวเตอร์'),
('EQT11', 'ครุภัณฑ์สนาม'),
('EQT12', 'ครุภัณฑ์ดนตรีและนาฏศิลป์'),
('EQT13', 'ครุภัณฑ์กีฬา'),
('EQT14', 'ครุภัณฑ์โรงงาน'),
('EQT15', 'ครุภัณฑ์อื่น')
ON CONFLICT (code) DO NOTHING;

-- Material Types
CREATE TABLE IF NOT EXISTS material_types (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO material_types (code, name_th) VALUES
('MAT01', 'วัสดุสำนักงาน'),
('MAT02', 'วัสดุไฟฟ้าและวิทยุ'),
('MAT03', 'วัสดุงานบ้านงานครัว'),
('MAT04', 'วัสดุก่อสร้าง'),
('MAT05', 'วัสดุยานพาหนะและขนส่ง'),
('MAT06', 'วัสดุเชื้อเพลิงและหล่อลื่น'),
('MAT07', 'วัสดุวิทยาศาสตร์หรือการแพทย์'),
('MAT08', 'วัสดุการเกษตร'),
('MAT09', 'วัสดุโฆษณาและเผยแพร่'),
('MAT10', 'วัสดุเครื่องแต่งกาย'),
('MAT11', 'วัสดุการศึกษา'),
('MAT12', 'วัสดุคอมพิวเตอร์'),
('MAT13', 'วัสดุสนาม'),
('MAT14', 'วัสดุดนตรีและนาฏศิลป์'),
('MAT15', 'วัสดุกีฬา'),
('MAT16', 'วัสดุเครื่องดับเพลิง'),
('MAT17', 'วัสดุโรงงาน'),
('MAT18', 'วัสดุอาวุธยุทธภัณฑ์'),
('MAT19', 'วัสดุอื่น')
ON CONFLICT (code) DO NOTHING;

-- App Roles
CREATE TABLE IF NOT EXISTS app_roles (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name_th VARCHAR(100) NOT NULL
);

INSERT INTO app_roles (code, name_th) VALUES
('admin', 'ผู้ดูแลระบบ'),
('manager', 'ผู้จัดการ'),
('staff', 'เจ้าหน้าที่'),
('viewer', 'ผู้ดูรายงาน')
ON CONFLICT (code) DO NOTHING;

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description) VALUES
('max_image_size', '2097152', 'Maximum image size in bytes (2MB)'),
('max_images_per_equipment', '4', 'Maximum images per equipment'),
('low_stock_alert', 'true', 'Enable low stock alert'),
('maintenance_notification', 'true', 'Enable maintenance notification'),
('withdrawal_auto_approve', 'false', 'Auto approve withdrawal requests'),
('system_timezone', 'Asia/Bangkok', 'System timezone'),
('date_format', 'dd/MM/yyyy', 'Display date format'),
('currency', 'THB', 'System currency')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();
