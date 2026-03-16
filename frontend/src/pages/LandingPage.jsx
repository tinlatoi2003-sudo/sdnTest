import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const CAROUSEL_SLIDES = [
    {
        img: "https://ocd.fpt.edu.vn/css/images/landing/bg5.jpg",
        title: "Kênh thông tin",
        subtitle: "Ký túc xá Đại Học FPT",
    },
    {
        img: "https://ocd.fpt.edu.vn/css/images/landing/bg1.jpg",
        title: "Không gian sống hiện đại",
        subtitle: "Tiện nghi – An toàn – Thân thiện",
    },
    {
        img: "https://ocd.fpt.edu.vn/css/images/landing/bg3.jpg",
        title: "Học tập & Sinh hoạt",
        subtitle: "Môi trường lý tưởng cho sinh viên",
    },
    {
        img: "https://ocd.fpt.edu.vn/css/images/landing/bg4.jpg",
        title: "Cộng đồng FPT",
        subtitle: "Nơi kết nối sinh viên toàn quốc",
    }

];

const QUICK_LINKS = [
    { title: "Thông tin KTX Đại học FPT", sub: "Thông tin", icon: "🏠", target: "section-info" },
    { title: "Các câu hỏi thường gặp", sub: "FAQ", icon: "❓", target: "section-faq" },
];

const FAQ_ITEMS = [
    {
        q: "1. Khi ở KTX cần lưu ý điều gì?",
        a: (
            <>
                <p><strong>Ký túc xá có một số điều cần lưu ý khi ở như sau:</strong></p>
                <ul>
                    <li>Không được nuôi vật nuôi, thú cưng (chó, mèo...).</li>
                    <li>Không được uống rượu, bia, chơi cờ bạc, sử dụng các chất kích thích và chất cấm.</li>
                    <li>Không được nấu ăn trong ký túc xá.</li>
                    <li>Không được đưa người lạ không ở trong ký túc xá vào phòng sau giờ giới nghiêm.</li>
                    <li>Giờ giới nghiêm trong ký túc xá là sau 10 giờ 30 phút tối.</li>
                    <li>Giữ gìn vệ sinh chung và đổ rác trước 9 giờ sáng.</li>
                </ul>
                <p>Tất cả các lỗi vi phạm đều bị trừ dựa trên mức độ lỗi vi phạm.</p>
            </>
        ),
    },
    {
        q: "2. Thời hạn lưu trú và thông tin phòng ở (FPTU HN)",
        a: (
            <>
                <p><strong>Thời hạn lưu trú các kỳ</strong></p>
                <ul>
                    <li>Kỳ Spring: Tháng 1 – tháng 4</li>
                    <li>Kỳ Summer: Tháng 5 – tháng 8</li>
                    <li>Kỳ Fall: Tháng 9 – tháng 12</li>
                </ul>
                <p><strong>Phụ trội Điện nước/kỳ</strong></p>
                <ul>
                    <li>Định mức miễn phí: 200 số Điện &amp; 12 số nước</li>
                    <li>Dùng vượt định mức: Nộp phí phụ trội</li>
                    <li>Đơn giá: 2.500đ/số điện, 10.000đ/số nước</li>
                </ul>
                <p><strong>Thông tin phòng ở</strong></p>
                <ul>
                    <li>Kích thước giường: 2000x1900mm (Dom CDFH), 1930x900mm (Dom AB)</li>
                    <li>CSVC cung cấp: Giường tầng, tủ để, tủ giày, bàn học (tùy loại phòng), giá phơi quần áo</li>
                    <li>Thiết bị: Đèn điều sáng, điều hòa, bình nóng lạnh</li>
                    <li>Dịch vụ nhà trường cung cấp: ăn uống, tiện ích (giặt là, cắt tóc, siêu thị, phòng gym); phí SV tự túc</li>
                    <li>Hỗ trợ mạng: KTX hỗ trợ tiếp cận cáp. Hỗ trợ hỗ trợ theo các quy định ra nội quy KTX.</li>
                    <li>Điểm tiếp nhận đăng ký mạng: Phòng trực Dom C hoặc liên hệ hotline đặt tại sảnh các Dom</li>
                    <li>Đồ cá nhân: sinh viên tự trang bị là như chăn, màn, ga, gối, đệm...</li>
                </ul>
            </>
        ),
    },
    {
        q: "3. Điểm uy tín là gì?",
        a: (
            <>
                <p>Điểm uy tín (Credibility in FPT Dormitory – CFD score) là một trong những yếu tố để tạo ra môi trường KTX văn minh và lành mạnh hơn</p>
                <ul>
                    <li>Điểm uy tín là tiêu chí để đánh giá ý thức của sinh viên khi sử dụng dịch vụ ký túc xá.</li>
                    <li>Điểm uy tín thay đổi dựa theo những hành vi, hoạt động và sử dụng góp của sinh viên trong suốt thời gian ở ký túc xá.</li>
                    <li>Phản hồi: KTX hỗ trợ tiếp cận, giam tùy ứng theo các quy định đã được đề ra trong nội quy KTX.</li>
                    <li>Điểm uy tín là một trong những tiêu chí được dùng để xét duyệt xem sinh viên có được sử dụng ký túc xá trong kỳ hay không.</li>
                </ul>
            </>
        ),
    },
    {
        q: "4. Làm thế nào để gửi yêu cầu tới Ban Quản lý KTX?",
        a: (
            <ol>
                <li>Bước 1: Vào chức năng <strong>My request</strong></li>
                <li>Bước 2: Bấm vào nút <strong>Create new request</strong> → Chọn <strong>loại yêu cầu</strong> (Type request) thích hợp.</li>
                <li>Bước 3: Điền nội dung của yêu cầu vào phần <strong>Content</strong>.</li>
                <li>Bước 4: Bấm vào nút <strong>Create request</strong>.</li>
            </ol>
        ),
    },
    {
        q: "5. Làm thế nào để báo cáo sửa chữa đồ dùng trong phòng?",
        a: (
            <ol>
                <li>Bước 1: Vào chức năng <strong>My request</strong></li>
                <li>Bước 2: Bấm vào nút <strong>Create new request</strong> → Chọn <strong>Báo cáo văn đề kỹ thuật</strong> ở mục Type request</li>
                <li>Bước 3: Hệ thống sẽ tới trang <em>https://cim.fpt.edu.vn/</em></li>
                <li>Bước 4: Điền những thông tin cần thiết và gửi ảnh tình trạng thiết bị (trên hệ thống CIM).</li>
                <li>Bước 5: Bấm vào nút <strong>Create</strong> (trên hệ thống CIM)</li>
            </ol>
        ),
    },
    {
        q: "6. Thông tin liên lạc của bảo vệ và y tế là gì?",
        a: (
            <>
                <p><strong>Thông tin liên lạc của phòng bảo vệ và phòng y tế (24/7):</strong></p>
                <ul>
                    <li>Phòng bảo vệ: (024) 668 05913</li>
                    <li>Phòng y tế: (024) 668 05917</li>
                </ul>
                <p><em>Thông tin chi tiết và cụ thể hơn, sinh viên có thể <strong>Đăng nhập</strong> và xem thêm ở trang <strong>Home</strong></em></p>
            </>
        ),
    },
];

const TOTAL = CAROUSEL_SLIDES.length;

export default function LandingPage() {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);
    const [openFaq, setOpenFaq] = useState(null);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Use functional updater to avoid stale-closure in useEffect
    const goTo = useCallback((idx) => {
        setCurrent(((idx % TOTAL) + TOTAL) % TOTAL);
    }, []);

    const next = useCallback(() => setCurrent((c) => (c + 1) % TOTAL), []);
    const prev = useCallback(() => setCurrent((c) => (c - 1 + TOTAL) % TOTAL), []);

    // Auto-play – runs only once, no dependency on 'current'
    useEffect(() => {
        const timer = setInterval(() => setCurrent((c) => (c + 1) % TOTAL), 4500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="lp-root">
            {/* ── Hero ── */}
            <div className="lp-hero">


                {/* Carousel */}
                <div className="lp-carousel">
                    {CAROUSEL_SLIDES.map((slide, i) => (
                        <div
                            key={i}
                            className={`lp-slide${i === current ? " active" : ""}`}
                            style={{ backgroundImage: `url(${slide.img})` }}
                        >
                            <div className="lp-slide-overlay" />
                            <div className="lp-slide-text">
                                <h2 className="lp-slide-title">{slide.title}</h2>
                                <p className="lp-slide-subtitle">{slide.subtitle}</p>
                            </div>
                        </div>
                    ))}

                    <button className="lp-arrow lp-arrow-prev" onClick={prev} aria-label="Trước">‹</button>
                    <button className="lp-arrow lp-arrow-next" onClick={next} aria-label="Tiếp">›</button>

                    <div className="lp-dots">
                        {CAROUSEL_SLIDES.map((_, i) => (
                            <button
                                key={i}
                                className={`lp-dot${i === current ? " active" : ""}`}
                                onClick={() => goTo(i)}
                            />
                        ))}
                    </div>
                </div>
                <br></br>
                {/* Quick-link cards */}
                <div className="lp-quicklinks">
                    {QUICK_LINKS.map((ql) => (
                        <div key={ql.title} className="lp-ql-card" onClick={() => scrollTo(ql.target)}>
                            <span className="lp-ql-icon">{ql.icon}</span>
                            <div>
                                <div className="lp-ql-title">{ql.title}</div>
                                <div className="lp-ql-sub">{ql.sub} →</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* ── Section tiêu đề ── */}
            <section id="section-info" className="lp-section-title">
                <h2>Thông tin Ký túc xá Đại Học FPT</h2>
                <div className="lp-divider" />
                <p className="lp-section-lead">
                    Để biết thêm chi tiết về KTX, các bạn có thể truy cập vào{" "}
                    <a href="#" className="lp-link-pdf">File PDF</a> để tìm hiểu thêm.
                </p>
            </section>

            {/* ── Content block 1 ── */}
            <section className="lp-content-block lp-block-right-img">
                <div className="lp-block-text">
                    <p>
                        Trường Đại học FPT là một trong những ngôi trường nổi tiếng đào tạo đa ngành,
                        với chất lượng đào tạo đạt chuẩn quốc tế. Trường không chỉ quan tâm đến chất
                        lượng đào tạo, công tác tuyển sinh mà còn chăm lo cho đời sống sinh viên.
                    </p>
                    <p>
                        Bằng việc đầu tư, xây dựng khu{" "}
                        <span className="lp-highlight">Ký túc xá</span> đầy đủ trang thiết bị căn
                        thiết, không gian thoáng mát, sạch sẽ. Để đáp ứng nhu cầu và tạo không gian
                        học tập, sinh hoạt thoải mái nhất cho sinh viên.{" "}
                        <span className="lp-highlight">KTX</span> cũng được xem như ngôi nhà thứ 2
                        của nhiều sinh viên.
                    </p>
                </div>
                <div className="lp-block-img">
                    <img
                        src="https://ocd.fpt.edu.vn/css/images/landing/content1.png"
                        alt="Ký túc xá FPT"
                        loading="lazy"
                    />
                </div>
            </section>



            {/* ── Content block 2 ── */}
            <section className="lp-content-block lp-block-left-img">
                <div className="lp-block-img">
                    <img
                        src="https://ocd.fpt.edu.vn/css/images/landing/content2.png"
                        alt="Ký túc xá FPT nội thất"
                        loading="lazy"
                    />
                </div>
                <div className="lp-block-text">
                    <p className="lp-highlight-lead">
                        Ký túc xá của trường Đại học FPT là chỗ ở dành riêng cho sinh viên của Đại học FPT.
                    </p>
                    <p>
                        Hiện nay, một vấn đề các bạn tân sinh viên sau khi biết kết quả trúng tuyển
                        Đại học. Đó là tìm kiếm cho mình một chỗ ở phù hợp, vừa tiết kiệm vừa đảm
                        bảo an ninh, môi trường học tập. Không chỉ các tân sinh viên mà các bạn sinh
                        viên các khóa trước hầu hết đều mong muốn ở tại{" "}
                        <span className="lp-highlight">KTX</span> trường để thuận lợi cho việc di
                        chuyển. Và để tiết kiệm chi phí, có một trường để học tập và sinh hoạt.
                    </p>
                </div>
            </section>

            {/* ── Full-width image ── */}
            <section className="lp-full-img">
                <img
                    src="https://ocd.fpt.edu.vn/css/images/landing/content3.png"
                    alt="Toàn cảnh Ký túc xá FPT"
                    loading="lazy"
                />
            </section>
            {/* ── Text section between blocks ── */}
            <section className="lp-text-section">
                <p className="lp-text-section-lead">
                    <em>Ký túc xá trường Đại học FPT được xây dựng với thiết kế hiện đại, thoáng mát và đầy đủ tiện nghi.</em>
                </p>
                <p>
                    Khu <span className="lp-highlight">KTX</span> gồm các tòa nhà. Mỗi tòa KTX có các tầng rộng rãi, sạch sẽ, có cả wifi,
                    máy giặt sấy tự động... Xung quanh còn là cây cối xanh mướt trong lành, dễ chịu, thoáng mát. Phòng ở được thiết kế
                    hiện đại, không gian thoải mái, thiết kế phù hợp cho từng loại phòng 3-4-6-8 người. Mỗi phòng sẽ được trang bị các
                    thiết bị căn thiết, đầy đủ phục vụ cho những nhu cầu thiết yếu của sinh viên như giường tầng, bàn học, giá phơi quần
                    áo, bình nóng lạnh, điều hòa, tủ để giày, nhà vệ sinh riêng cho mỗi phòng... giúp sinh viên an tâm học tập trong
                    quãng thời gian gắn bó với đại học FPT, đem đến cho sinh viên cảm giác thoải mái tiện nghi như ở nhà.
                </p>
            </section>

            {/* ── FAQ ── */}
            <section id="section-faq" className="lp-faq">
                <div className="lp-faq-inner">
                    <h2 className="lp-faq-title">FAQ</h2>
                    <div className="lp-faq-divider" />
                    <div className="lp-faq-list">
                        {FAQ_ITEMS.map((item, i) => (
                            <div key={i} className="lp-faq-item open">
                                <div className="lp-faq-question">
                                    <span>{item.q}</span>
                                </div>
                                <div className="lp-faq-answer">{item.a}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="lp-cta">
                <div className="lp-cta-inner">
                    <h2>Bắt đầu quản lý Ký túc xá ngay hôm nay</h2>
                    <p>Đăng nhập để truy cập hệ thống quản lý KTX Đại học FPT</p>
                    <button className="lp-cta-btn" onClick={() => navigate("/login")}>
                        Đăng nhập hệ thống →
                    </button>
                </div>
            </section>

        </div>
    );
}
