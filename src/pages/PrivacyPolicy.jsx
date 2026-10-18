import { useLang } from '../lib/i18n'

// Privacy policy page (/privacy-policy). Needed by Google/Facebook
// OAuth app reviews and linked from the footer. Plain-language summary
// of what the site actually collects and does. Last updated 2026-10-17.
export default function PrivacyPolicy() {
  const { lang } = useLang()

  if (lang === 'th') {
    return (
      <div className="page" style={{ maxWidth: 760, margin: '0 auto', lineHeight: 1.65 }}>
        <h1>นโยบายความเป็นส่วนตัว</h1>
        <p><em>อัปเดตล่าสุด: 17 ตุลาคม 2026</em></p>
        <p>
          TruePin Property คือเว็บไซต์ประกาศอสังหาริมทรัพย์ในประเทศไทย
          นโยบายนี้อธิบายว่าเราเก็บข้อมูลอะไรและใช้อย่างไร
        </p>
        <h2>ข้อมูลที่เราเก็บ</h2>
        <p>
          ข้อมูลบัญชี — ชื่อและอีเมลของคุณเมื่อสมัครสมาชิก รวมถึงเมื่อคุณเข้าสู่ระบบด้วย
          Google หรือ Facebook (เราได้รับชื่อและอีเมลของคุณจากผู้ให้บริการเหล่านั้น)
          ประกาศที่คุณโพสต์ — รายละเอียดทรัพย์สิน รูปภาพ ราคา และตำแหน่งที่ตั้ง
          ข้อความที่คุณส่งถึงผู้ใช้รายอื่นผ่านเว็บไซต์ คะแนนและรายงานที่คุณส่ง
          และค่าภาษาที่คุณเลือกซึ่งจัดเก็บไว้ในเบราว์เซอร์ของคุณ
        </p>
        <h2>เราใช้ข้อมูลอย่างไร</h2>
        <p>
          เพื่อให้บริการเว็บไซต์ แสดงประกาศของคุณต่อสาธารณะ
          ให้ผู้ซื้อและผู้เช่าติดต่อผู้ขายได้ ตรวจสอบประกาศเพื่อความถูกต้อง
          และดูแลความปลอดภัยของเว็บไซต์ เราไม่ขายข้อมูลส่วนบุคคลของคุณ
        </p>
        <h2>ข้อมูลที่เป็นสาธารณะ</h2>
        <p>
          ประกาศอสังหาริมทรัพย์และชื่อที่แสดงของผู้ขายเป็นข้อมูลสาธารณะ
          ทุกคนสามารถเห็นได้โดยไม่ต้องเข้าสู่ระบบ
        </p>
        <h2>การจัดเก็บข้อมูล</h2>
        <p>
          ข้อมูลจัดเก็บอยู่กับผู้ให้บริการโฮสติ้งและฐานข้อมูลของเรา (Supabase และ Vercel)
          แผนที่มาจาก OpenStreetMap และ Esri
        </p>
        <h2>ทางเลือกของคุณ</h2>
        <p>
          คุณสามารถแก้ไขหรือลบประกาศของคุณได้ทุกเมื่อ
          หากต้องการลบบัญชีและข้อมูลส่วนบุคคลของคุณ โปรดติดต่อเราได้ที่
          radudon1991@gmail.com
        </p>
        <h2>การเปลี่ยนแปลง</h2>
        <p>เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว การเปลี่ยนแปลงจะเผยแพร่ในหน้านี้</p>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 760, margin: '0 auto', lineHeight: 1.65 }}>
      <h1>Privacy Policy</h1>
      <p><em>Last updated: October 17, 2026</em></p>
      <p>
        TruePin Property is a property listing website for Thailand. This policy
        explains what information we collect and how we use it.
      </p>
      <h2>What we collect</h2>
      <p>
        Account information — your name and email address when you sign up,
        including when you sign in with Google or Facebook (we receive your name
        and email from those providers). Listings you post — property details,
        photos, price and location. Messages you send to other users through the
        site. Ratings and reports you submit. Your language preference, stored
        in your browser.
      </p>
      <h2>How we use it</h2>
      <p>
        To run the website, display your listings publicly, let buyers and
        renters contact sellers, review listings for accuracy, and keep the site
        safe. We do not sell your personal information.
      </p>
      <h2>What is public</h2>
      <p>
        Property listings and sellers' display names are public — anyone can see
        them without logging in.
      </p>
      <h2>Where data is stored</h2>
      <p>
        Data is stored with our hosting and database providers (Supabase and
        Vercel). Map images come from OpenStreetMap and Esri.
      </p>
      <h2>Your choices</h2>
      <p>
        You can edit or delete your listings at any time. To delete your account
        and personal data, contact us at radudon1991@gmail.com.
      </p>
      <h2>Changes</h2>
      <p>We may update this policy from time to time. Changes will be posted on this page.</p>
    </div>
  )
}
