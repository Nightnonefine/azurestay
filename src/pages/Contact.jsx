import { useState } from 'react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  }

  return (
    <div>
      <section className="page-banner">
        <div className="container">
          <h1>Liên hệ AzureStay</h1>
          <p>Đội ngũ hỗ trợ khách hàng luôn sẵn sàng giải đáp mọi thắc mắc về đặt phòng.</p>
        </div>
      </section>

      <div className="container static-page">
        <div className="contact-grid">
          <div className="detail-section-card">
            <h2>Thông tin liên hệ</h2>
            <dl className="info-dl" style={{ marginTop: 14 }}>
              <dt>Văn phòng</dt>
              <dd>97 Man Thiện, Phường Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh</dd>
              <dt>Hotline 24/7</dt>
              <dd>1900 6868</dd>
              <dt>Email hỗ trợ</dt>
              <dd>support@azurestay.vn</dd>
              <dt>Giờ làm việc</dt>
              <dd>Thứ 2 – Chủ nhật (07:00 – 22:00)</dd>
            </dl>
          </div>

          <form className="detail-section-card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ marginBottom: 0 }}>Gửi tin nhắn cho chúng tôi</h2>

            {submitted && (
              <div className="alert alert-success">
                Cảm ơn bạn đã liên hệ! Bộ phận hỗ trợ sẽ phản hồi qua email trong thời gian sớm nhất.
              </div>
            )}

            <div className="form-field">
              <label className="form-label" htmlFor="contact-name">
                Họ và tên
              </label>
              <input
                id="contact-name"
                type="text"
                className="form-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="contact-email">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                className="form-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="contact-message">
                Nội dung
              </label>
              <textarea
                id="contact-message"
                rows={4}
                className="form-textarea"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mã đơn đặt phòng hoặc câu hỏi của bạn..."
              />
            </div>

            <div>
              <button type="submit" className="btn btn-primary">
                Gửi yêu cầu hỗ trợ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
