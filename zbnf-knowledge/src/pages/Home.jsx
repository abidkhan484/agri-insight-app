import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="page home">
      <section className="card welcome-card">
        <h2><span className="bn">স্বাগতম!</span><span className="en">Welcome!</span></h2>
        <p className="bn">জিরো বাজেট প্রাকৃতিক কৃষি (ZBNF) পদ্ধতিতে চাষাবাদ করুন। এই অ্যাপটি আপনাকে প্রয়োজনীয় সার ও কীটনাশক তৈরি করতে সাহায্য করবে।</p>
        <p className="en">Cultivate using Zero Budget Natural Farming (ZBNF). This app helps you prepare necessary fertilizers and pesticides.</p>
      </section>

      <div className="quick-links">
        <Link to="/calculator" className="card link-card">
          <span className="icon">🧮</span>
          <div>
            <span className="bn">ক্যালকুলেটর</span>
            <span className="en">Calculator</span>
          </div>
        </Link>
        <Link to="/pests" className="card link-card">
          <span className="icon">🐛</span>
          <div>
            <span className="bn">পোকামাকড় ও রোগ</span>
            <span className="en">Pests & Diseases</span>
          </div>
        </Link>
        <Link to="/calendar" className="card link-card">
          <span className="icon">📅</span>
          <div>
            <span className="bn">ফসল পঞ্জিকা</span>
            <span className="en">Crop Calendar</span>
          </div>
        </Link>
        <Link to="/glossary" className="card link-card">
          <span className="icon">📖</span>
          <div>
            <span className="bn">শব্দকোষ</span>
            <span className="en">Glossary</span>
          </div>
        </Link>
      </div>

      <section className="card note-card">
        <h3><span className="bn">সতর্কতা</span><span className="en">Caution</span></h3>
        <ul className="bn">
          <li>সব সময় দেশি গরুর গোবর ও গোমূত্র ব্যবহার করুন।</li>
          <li>কীটনাশক বিকেলে স্প্রে করা ভালো।</li>
          <li>বৃষ্টির সম্ভাবনা থাকলে স্প্রে করবেন না।</li>
        </ul>
      </section>
    </div>
  );
}
