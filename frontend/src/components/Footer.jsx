import React from 'react';
import "./Footer.css";

const LOCATIONS = [
  {
    city: "Hà Nội",
    address: "Khu Giáo dục và Đào tạo - Khu Công nghệ cao Hòa Lạc - KM29 Đại Lộ Thăng Long, H. Thạch Thất, TP. Hà Nội",
    phone: "024 7300 1866",
    email: "daihocfpt@fpt.edu.vn",
  },
  {
    city: "Đà Nẵng",
    address: "Khu đô thị công nghệ FPT Đà Nẵng, P. Hòa Hải, Q. Ngũ Hành Sơn, TP. Đà Nẵng",
    phone: "024 7300 1866",
    email: "daihocfpt@fpt.edu.vn",
  },
  {
    city: "Cần Thơ",
    address: "Số 600 Đường Nguyễn Văn Cừ (nối dài), P. An Bình, Q. Ninh Kiều, TP. Cần Thơ",
    phone: "029 2360 1995",
    email: "sro.ct@fe.edu.vn",
  },
  {
    city: "Quy Nhơn",
    address: "Khu đô thị mới An Phú Thịnh, Phường Nhơn Bình & Phường Đống Đa, TP. Quy Nhơn, Bình Định",
    phone: "024 7300 1866/ 0256 7300 999",
    email: "daihocfpt@fpt.edu.vn",
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {LOCATIONS.map((loc) => (
          <div key={loc.city} className="footer-col">
            <h3 className="footer-city">{loc.city}</h3>
            <p className="footer-address">{loc.address}</p>
            <p className="footer-detail">
              Điện thoại: {loc.phone}
            </p>
            <p className="footer-detail">
              Email:{" "}
              <a href={`mailto:${loc.email}`} className="footer-email">
                {loc.email}
              </a>
            </p>
          </div>
        ))}
      </div>
    </footer>
  );
}