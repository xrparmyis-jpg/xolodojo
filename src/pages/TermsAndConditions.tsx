import GsapPageContent from "../components/GsapPageContent";
import GsapPageSubHeading from "../components/GsapPageSubHeading";

function TermsAndConditions() {
  return (
    <>
      <section
        className="relative border-b border-[#36e9e424] bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30"
      >
      </section>
      <section className="relative overflow-hidden bg-[var(--bg)] py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl [&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
            <GsapPageSubHeading heading="Terms & Conditions" />
            <GsapPageContent as="section" className="mb-10" delay={0}>
              <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
              <p>
                Welcome to The Xoloitzquintle Collection ("we", "us", "our"). These Terms and Conditions ("Terms") govern your access to and use of https://vite-react-neon-beta-24.vercel.app/ (the "Site"), participation in the minting, purchase, ownership, or use of Xoloitzcuintle NFTs ("NFTs" or "Tokens"), and any related services.
              </p>
              <p>
                By accessing the Site, minting, purchasing, or holding any Xoloitzcuintle NFT, you agree to be bound by these Terms. If you do not agree, do not use the Site or interact with the NFTs.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-10" delay={0.06}>
              <h2 className="mb-4 text-2xl font-semibold">2. The Collection</h2>
              <p>
                The Xoloitzcuintle Collection consists of 10,001 algorithmically generated unique digital collectibles (NFTs) minted on the XRP Ledger (XRPL). Ownership of an NFT is recorded on the blockchain and confers no additional rights beyond those expressly stated in these Terms.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-10" delay={0.12}>
              <h2 className="mb-4 text-2xl font-semibold">3. Ownership and License</h2>
              <p>
                Upon acquiring lawful ownership of an Xoloitzcuintle NFT, you receive a limited, worldwide, non-exclusive, royalty-free license to display, reproduce, and use the associated artwork for personal, non-commercial purposes (including online display, social media, profile pictures, etc.).
              </p>
              <p>
                Commercial use (merchandise, advertising, derivative works for profit) requires explicit written permission from the project team. We retain all copyright and intellectual property rights in the underlying artwork except for the limited license granted above.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-10" delay={0.18}>
              <h2 className="mb-4 text-2xl font-semibold">4. No Financial Advice – High Risk</h2>
              <p>
                NFTs are digital assets with extreme price volatility. Their value may go to zero. We make no representations or warranties about future value, liquidity, or market performance. Participation is at your own risk. Cryptocurrency and blockchain technologies carry risks including smart contract bugs, hacks, regulatory changes, loss of private keys, and total loss of funds.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-10" delay={0.24}>
              <h2 className="mb-4 text-2xl font-semibold">5. Minting and Purchases</h2>
              <p>
                All sales/mints are final. No refunds except where required by applicable law. Minting requires a compatible wallet (e.g. Xaman) and sufficient XRP. Gas/network fees are your responsibility.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-10" delay={0.3}>
              <h2 className="mb-4 text-2xl font-semibold">6. Prohibited Conduct</h2>
              <ul className="list-disc pl-6">
                <li>Using the Site/NFTs for illegal activities, money laundering, or fraud</li>
                <li>Attempting to reverse-engineer, hack, or interfere with the Site or XRPL contracts</li>
                <li>Misrepresenting ownership or affiliation with the project</li>
              </ul>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-10" delay={0.36}>
              <h2 className="mb-4 text-2xl font-semibold">7. Disclaimers & Limitation of Liability</h2>
              <p>
                THE SITE AND NFTs ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SITE OR NFTs, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-10" delay={0.42}>
              <h2 className="mb-4 text-2xl font-semibold">8. Governing Law & Dispute Resolution</h2>
              <p>
                These Terms are governed by the laws of [insert jurisdiction, e.g. Singapore / State of Delaware / etc.], without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration [or courts of X jurisdiction].
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-10" delay={0.48}>
              <h2 className="mb-4 text-2xl font-semibold">9. Changes to Terms</h2>
              <p>
                We may update these Terms at any time. Continued use of the Site/NFTs after changes constitutes acceptance.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-10" delay={0.54}>
              <h2 className="mb-4 text-2xl font-semibold">10. Contact</h2>
              <p>
                Questions about these Terms? Reach out via [Twitter/Discord/email — add your actual contact].
              </p>
            </GsapPageContent>
          </div>
        </div>
      </section>
    </>
  );
}

export default TermsAndConditions;
