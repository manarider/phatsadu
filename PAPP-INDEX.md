# PAPP Reference Index

เอกสารอ้างอิงสำหรับระบบ  
**ระบบบริหารจัดการพัสดุ เทศบาลนครนครสวรรค์ (PAPP)**

## รายการเอกสาร
1. `README.md`
2. `PAPP-REQUIREMENTS.md`
3. `PAPP-DATABASE-DESIGN.md`
4. `PAPP-WORKFLOW-SECURITY.md`
5. `PAPP-API-DESIGN.md`
6. `PAPP-SCREEN-LIST.md`
7. `PAPP-DEVELOPMENT-PLAN.md`
8. `PAPP-NGINX-DEPLOYMENT.md`
9. `PAPP-DB-SEED-DATA.sql`

## ข้อมูลระบบ
- ชื่อระบบ: **ระบบบริหารจัดการพัสดุ เทศบาลนครนครสวรรค์ (PAPP)**
- Frontend: React
- Backend: NodeJS
- Reverse Proxy: Nginx
- Database: PostgreSQL
- Base URL:
  - `http://app.nsm.go.th/phatsadu/`
  - `http://192.168.100.152/phatsadu/`
- UMS:
  - `http://192.168.100.151/ums/`

## หมายเหตุสำคัญ
- ระบบ login ผ่าน UMS เท่านั้น
- ไม่ควรเก็บ password ของฐานข้อมูลไว้ในไฟล์ `.md`
- ควรแยกค่าจริงไปเก็บใน `.env`
- ให้ถือว่า enum ฝั่ง API/DB เป็นค่ากลางของระบบ
- label ภาษาไทยใช้สำหรับแสดงผลหน้า UI

## Footer มาตรฐาน
copyright @ Information system development and preparation work, Nakhon Sawan Municipality.by Manarider
