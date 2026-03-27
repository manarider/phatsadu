# PAPP API Design

Version: 1.0  
Date: 2026-03-27

## 1. API Principles
- Base Path: `/phatsadu/api`
- Response เป็น JSON
- ใช้ UTF-8
- ตรวจสิทธิ์ทุก endpoint ฝั่ง backend
- อ้างอิง role จาก UMS + role mapping ภายในระบบ
- ทุก endpoint สำคัญต้องเขียน audit log

## 2. Authentication / Session
ระบบไม่ login เอง แต่รับผลจาก UMS

### Endpoints
#### `GET /phatsadu/api/auth/me`
ใช้ดึงข้อมูล session ปัจจุบัน

#### `POST /phatsadu/api/auth/logout`
ออกจาก session ของระบบ

## 3. Master Data APIs
- `GET /phatsadu/api/departments`
- `POST /phatsadu/api/departments`
- `PUT /phatsadu/api/departments/:id`
- `GET /phatsadu/api/equipment-types`
- `POST /phatsadu/api/equipment-types`
- `PUT /phatsadu/api/equipment-types/:id`
- `GET /phatsadu/api/material-types`
- `POST /phatsadu/api/material-types`
- `PUT /phatsadu/api/material-types/:id`
- `GET /phatsadu/api/settings`
- `PUT /phatsadu/api/settings/:key`

## 4. Equipment APIs
- `GET /phatsadu/api/equipments`
- `GET /phatsadu/api/equipments/:id`
- `POST /phatsadu/api/equipments`
- `PUT /phatsadu/api/equipments/:id`
- `DELETE /phatsadu/api/equipments/:id`

Validation:
- `equipment_code` ต้องตรง `XXX-XX-XXXX`
- `price >= 0`
- `status` ต้องเป็น `ACTIVE | INACTIVE | DISPOSED`

## 5. Equipment Image APIs
- `POST /phatsadu/api/equipments/:id/images`
- `DELETE /phatsadu/api/equipments/:id/images/:imageId`

Rules:
- ไม่เกิน 4 ภาพต่อรายการ
- ไม่เกิน 2MB ต่อภาพ
- รองรับ `image/jpeg`, `image/png`, `image/webp`

## 6. Maintenance APIs
- `POST /phatsadu/api/maintenance-requests`
- `GET /phatsadu/api/maintenance-requests`
- `PATCH /phatsadu/api/maintenance-requests/:id/status`
- `POST /phatsadu/api/maintenance-requests/:id/records`

## 7. Materials APIs
- `GET /phatsadu/api/materials`
- `GET /phatsadu/api/materials/:id`
- `POST /phatsadu/api/materials`
- `PUT /phatsadu/api/materials/:id`
- `DELETE /phatsadu/api/materials/:id`

## 8. Stock Transaction APIs
- `POST /phatsadu/api/materials/:id/stock/in`
- `POST /phatsadu/api/materials/:id/stock/out`
- `POST /phatsadu/api/materials/:id/stock/adjust`
- `GET /phatsadu/api/materials/:id/stock-transactions`

Rules:
- ห้ามจ่ายเกินคงเหลือ
- ต้องบันทึก transaction log ทุกครั้ง

## 9. Withdrawal APIs
- `POST /phatsadu/api/withdrawals`
- `GET /phatsadu/api/withdrawals`
- `POST /phatsadu/api/withdrawals/:id/approve`
- `POST /phatsadu/api/withdrawals/:id/reject`
- `POST /phatsadu/api/withdrawals/:id/issue`

## 10. Audit APIs
- `GET /phatsadu/api/audit-logs`

## 11. Error Response Standard
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "equipment_code format is invalid",
    "details": {
      "equipment_code": "Must match XXX-XX-XXXX"
    }
  }
}
```

## 12. Success Response Standard
```json
{
  "message": "success",
  "data": {}
}
```

## 13. HTTP Status Guideline
- `200` OK
- `201` Created
- `400` Validation Error
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `422` Business Rule Error
- `500` Internal Server Error

## 14. Security Notes
- ตรวจ role และ permission ที่ backend เป็นหลัก
- Upload file ต้อง validate MIME/type/size
- ห้าม trust ค่าจาก frontend
- ใช้ parameterized query หรือ ORM
- บันทึก audit สำหรับ create/update/delete/approve/login
