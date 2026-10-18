import { useLang } from '../lib/i18n'

// Terms of Service (/terms). Owner-approved text (draft v1, 2026-10-18).
// Linked from the footer, the signup agreement and the post form.
// Creating an account requires agreeing to these terms.
export default function Terms() {
  const { lang } = useLang()

  if (lang === 'th') {
    return (
      <div className="page" style={{ maxWidth: 760, margin: '0 auto', lineHeight: 1.65 }}>
        <h1>ข้อกำหนดการใช้บริการ</h1>
        <p><em>อัปเดตล่าสุด: 18 ตุลาคม 2026</em></p>
        <p>
          ข้อกำหนดนี้ใช้กับการใช้งาน TruePin Property (truepinproperty.com) ของคุณ
          การสร้างบัญชีหรือลงประกาศบนเว็บไซต์นี้ถือว่าคุณยอมรับข้อกำหนดเหล่านี้
          หากคุณไม่ยอมรับ โปรดอย่าใช้บริการ
        </p>
        <h2>1. TruePin Property คืออะไร</h2>
        <p>
          TruePin Property คือบริการลงประกาศและเชื่อมต่อผู้คนเกี่ยวกับอสังหาริมทรัพย์ในประเทศไทยโดยไม่คิดค่าใช้จ่าย
          เราจัดเตรียมแผนที่ พื้นที่ลงประกาศ และเครื่องมือติดต่อ เพื่อให้ผู้ซื้อ ผู้เช่า และผู้ขายได้พบกัน
          เรา<strong>ไม่ใช่</strong>นายหน้าหรือตัวแทนอสังหาริมทรัพย์ เรา<strong>ไม่ใช่</strong>คู่สัญญาในการซื้อขายหรือเช่าใด ๆ
          และเราไม่เคยรับ เก็บ หรือโอนเงินระหว่างผู้ใช้
        </p>
        <h2>2. บัญชีของคุณ</h2>
        <p>
          บัญชีใช้งานฟรี คุณต้องให้ข้อมูลที่ถูกต้อง เก็บรักษาข้อมูลเข้าสู่ระบบเป็นความลับ
          และรับผิดชอบทุกกิจกรรมที่เกิดขึ้นภายใต้บัญชีของคุณ หนึ่งบัญชีต่อหนึ่งบุคคลหรือหนึ่งธุรกิจ
        </p>
        <h2>3. กฎการลงประกาศ</h2>
        <p>
          การลงประกาศถือว่าคุณยืนยันว่า ทรัพย์มีอยู่จริงและคุณมีสิทธิ์เสนอขายหรือให้เช่า
          หมุดบนแผนที่แสดงตำแหน่งจริงของทรัพย์ ราคาเป็นราคาเต็มตามจริง (ห้ามตั้งราคาล่อ)
          รูปภาพเป็นรูปของทรัพย์จริงและคุณมีสิทธิ์ใช้รูปเหล่านั้น และประกาศไม่ใช่ประกาศซ้ำ
          ทุกประกาศจะได้รับการตรวจสอบจากทีมงานก่อนเผยแพร่ และการแก้ไขประกาศจะส่งประกาศกลับไปตรวจสอบใหม่
          ประกาศจะหมดอายุ 30 วันหลังได้รับการอนุมัติ และต้องต่ออายุเพื่อให้แสดงต่อไป
        </p>
        <h2>4. การตรวจสอบเป็นความพยายามอย่างเต็มที่ ไม่ใช่การรับประกัน</h2>
        <p>
          ทีมงานตรวจสอบทุกประกาศด้วยความสุจริต แต่เราไม่สามารถยืนยันข้อเท็จจริงทุกอย่างของทุกทรัพย์ได้
          การที่ประกาศแสดงบนเว็บไซต์<strong>ไม่ใช่</strong>คำสัญญาหรือการรับประกันว่าประกาศนั้นเป็นของจริง
          ยังสามารถซื้อหรือเช่าได้ หรือมีรายละเอียดถูกต้อง แม้จะมีการตรวจสอบ
          ผู้ไม่หวังดีก็อาจหาวิธีหลบเลี่ยงได้ในทุกแพลตฟอร์ม โปรดระมัดระวังอยู่เสมอ
        </p>
        <h2>5. ความปลอดภัย — โปรดอ่านก่อนจ่ายเงินให้ใคร</h2>
        <p>
          <strong>ห้ามโอนเงินมัดจำหรือเงินใด ๆ ก่อนที่คุณจะได้เห็นทรัพย์ด้วยตนเอง</strong>
          และยืนยันแล้วว่าบุคคลที่คุณติดต่อด้วยเป็นเจ้าของทรัพย์หรือเป็นตัวแทนที่ถูกต้องตามกฎหมาย
          TruePin Property จะไม่มีวันขอเงินจากคุณในนามของผู้ขาย
          หากมีใครขอเงินมัดจำผ่านแชทหรือข้อความของเรา ให้ถือเป็นสัญญาณเตือนและรายงานประกาศนั้นให้เราทราบ
        </p>
        <h2>6. การติดต่อของคุณเป็นความเสี่ยงของคุณเอง</h2>
        <p>
          การติดต่อ การเจรจา การนัดชม การตกลง และการชำระเงินทั้งหมดเกิดขึ้นโดยตรงระหว่างคุณกับผู้ใช้อีกฝ่าย
          และเป็นความเสี่ยงของคุณเองทั้งหมด ภายใต้ขอบเขตสูงสุดที่กฎหมายอนุญาต TruePin Property
          เจ้าของ และทีมงาน ไม่รับผิดต่อความสูญเสีย ความเสียหาย หรือข้อพิพาทใด ๆ
          ที่เกิดจากประกาศ การหลอกลวงหรือฉ้อโกงโดยผู้ใช้ ข้อมูลที่ไม่ถูกต้อง
          หรือสิ่งใด ๆ ที่เกิดขึ้นระหว่างผู้ใช้ และการใช้บริการนี้ถือว่าคุณยอมรับว่าจะไม่ถือว่าเรา
          ต้องรับผิดต่อการกระทำของผู้ใช้รายอื่น
        </p>
        <h2>7. ข้อห้ามในการใช้งาน</h2>
        <p>
          ห้ามลงประกาศปลอม ราคาล่อ ตำแหน่งเท็จ แอบอ้างเป็นผู้อื่น สแปม คุกคาม เนื้อหาผิดกฎหมาย
          หรือพยายามเก็บข้อมูลส่วนบุคคลของผู้ใช้รายอื่น
          เราอาจปฏิเสธหรือลบประกาศใด ๆ และระงับหรือลบบัญชีใด ๆ ตามดุลยพินิจของเราโดยไม่ต้องแจ้งล่วงหน้า
          หากมีการละเมิดข้อกำหนดเหล่านี้
        </p>
        <h2>8. เนื้อหาของคุณ</h2>
        <p>
          ข้อความและรูปภาพของคุณยังเป็นทรัพย์สินของคุณ การลงประกาศถือว่าคุณอนุญาตให้เรา
          แสดงเนื้อหาเหล่านั้นบนบริการและในการประชาสัมพันธ์บริการ จนกว่าคุณจะลบประกาศหรือบัญชีของคุณ
        </p>
        <h2>9. การหมดอายุ การต่ออายุ และเครดิต</h2>
        <p>
          ประกาศมีอายุ 30 วันนับจากการอนุมัติ การต่ออายุด้วยตนเองทำได้ฟรีจากหน้า ประกาศของฉัน
          การต่ออายุอัตโนมัติ (ตัวเลือกเสริม) คิดค่าใช้จ่าย 1 บาทต่อประกาศต่อการต่ออายุหนึ่งครั้ง
          หักจากเครดิตในบัญชีที่เติมไว้ล่วงหน้าซึ่งซื้อจากผู้ดูแลระบบ เครดิตใช้สำหรับการต่ออายุอัตโนมัติเท่านั้น
          และไม่สามารถขอคืนได้เมื่อถูกใช้ในการต่ออายุไปแล้ว
        </p>
        <h2>10. ความเป็นส่วนตัว</h2>
        <p>เราจัดการข้อมูลส่วนบุคคลตามที่อธิบายไว้ในนโยบายความเป็นส่วนตัวของเรา</p>
        <h2>11. การเปลี่ยนแปลง</h2>
        <p>
          เราอาจปรับปรุงข้อกำหนดเหล่านี้เป็นครั้งคราว ฉบับปัจจุบันจะมีผลบังคับใช้เสมอ
          และการใช้บริการต่อไปถือเป็นการยอมรับ เราอาจเปลี่ยนแปลง หยุดชั่วคราว หรือยุติบริการได้ทุกเมื่อ
        </p>
        <h2>12. กฎหมายที่ใช้บังคับ</h2>
        <p>ข้อกำหนดเหล่านี้อยู่ภายใต้กฎหมายของประเทศไทย</p>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 760, margin: '0 auto', lineHeight: 1.65 }}>
      <h1>Terms of Service</h1>
      <p><em>Last updated: October 18, 2026</em></p>
      <p>
        These Terms of Service govern your use of TruePin Property
        (truepinproperty.com). By creating an account or posting a listing on
        this website, you agree to these Terms. If you do not agree, please do
        not use the service.
      </p>
      <h2>1. What TruePin Property is</h2>
      <p>
        TruePin Property is a free online listing and connection service for
        property in Thailand. We provide the map, the listing space and the
        contact tools so that buyers, renters and sellers can find each other.
        We are <strong>not</strong> a real estate agency or broker, we are{' '}
        <strong>not</strong> a party to any sale or rental, and we never
        receive, hold or transfer money between users.
      </p>
      <h2>2. Your account</h2>
      <p>
        Accounts are free. You must provide accurate information, keep your
        login details private, and you are responsible for all activity under
        your account. One account per person or business.
      </p>
      <h2>3. Posting rules</h2>
      <p>
        By posting a listing you promise that: the property is real and you
        have the right to offer it; the map pin shows the true location of the
        property; the price is the full, true asking price (no bait pricing);
        the photos show the actual property and you have the right to use
        them; and the post is not a duplicate of another post. Every post is
        reviewed by our team before it appears, and editing a post sends it
        back for review. Posts expire 30 days after approval and must be
        renewed to stay visible.
      </p>
      <h2>4. Review is best-effort, not a guarantee</h2>
      <p>
        Our team checks every post in good faith, but we cannot verify every
        fact about every property. A post appearing on this website is{' '}
        <strong>not</strong> a promise or guarantee that it is genuine, still
        available, or accurately described. Despite all checks, dishonest
        people sometimes find ways around them on every platform. Please stay
        alert.
      </p>
      <h2>5. Safety — read this before paying anyone</h2>
      <p>
        <strong>
          Never transfer a deposit or any other payment before you have seen
          the property in person
        </strong>{' '}
        and confirmed that the person you are dealing with owns it or legally
        represents the owner. TruePin Property will never ask you for money on
        behalf of a seller. If anyone asks you for a deposit through our chat
        or messages, treat it as a warning sign and report the post to us.
      </p>
      <h2>6. Your dealings are at your own risk</h2>
      <p>
        All contact, negotiation, viewing, agreement and payment take place
        directly between you and the other user, entirely at your own risk. To
        the maximum extent permitted by law, TruePin Property, its owner and
        its team are not liable for any loss, damage or dispute arising from
        listings, scams or fraud committed by users, inaccurate information,
        or anything that occurs between users; and by using this service you
        agree not to hold us responsible for the actions of other users.
      </p>
      <h2>7. Prohibited use</h2>
      <p>
        No fake listings, bait prices, false locations, impersonation, spam,
        harassment, illegal content, or attempts to collect the personal data
        of other users. We may reject or remove any post, and suspend or
        delete any account, at our discretion and without notice, if these
        Terms are broken.
      </p>
      <h2>8. Your content</h2>
      <p>
        You keep ownership of your text and photos. By posting, you give us
        permission to display them on the service, and in its promotion, until
        you delete the post or your account.
      </p>
      <h2>9. Expiry, renewal and credit</h2>
      <p>
        Posts run for 30 days from approval. Manual renewal is free from your
        My Listings page. Optional auto-renewal costs ฿1 per post per renewal,
        taken from prepaid account credit purchased from the admin. Credit is
        used only for auto-renewals and is not refundable once it has been
        spent on a renewal.
      </p>
      <h2>10. Privacy</h2>
      <p>We handle personal information as described in our Privacy Policy.</p>
      <h2>11. Changes</h2>
      <p>
        We may update these Terms from time to time; the current version
        always applies, and continued use of the service means acceptance. We
        may change, pause or end the service at any time.
      </p>
      <h2>12. Governing law</h2>
      <p>These Terms are governed by the laws of Thailand.</p>
    </div>
  )
}
