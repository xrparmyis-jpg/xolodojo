import { Link } from 'react-router-dom';

import GsapPageContent from '../components/GsapPageContent';
import GsapPageSubHeading from '../components/GsapPageSubHeading';

function PrivacyPolicy() {
  return (
    <>
      <section className="relative border-b border-[#36e9e424] bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30"></section>
      <section className="relative overflow-hidden bg-[var(--bg)] py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <GsapPageSubHeading heading="Privacy Policy" />
            <GsapPageContent
              as="p"
              className="mb-16 text-center text-lg text-gray-400"
              delay={0}
            >
              Effective Date: July 11, 2026
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.06}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                Introduction
              </h2>
              <p className="mb-4 leading-relaxed">
                This Privacy Policy describes how XoloDojo (operated by Donovan
                S. Hall, Alaska, United States) collects, uses, and protects
                information when you use our website at https://xolodojo.io, the
                Xglobe platform, and related Services.
              </p>
              <p className="mb-4 leading-relaxed">
                We are committed to protecting your privacy and being
                transparent about the data we handle.
              </p>
              <p className="leading-relaxed">
                For cookies, browser storage, and consent choices, see our{' '}
                <Link
                  to="/cookie-policy"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  Cookie Policy
                </Link>
                . Your use of the Services is also subject to our{' '}
                <Link
                  to="/terms-and-conditions"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  Terms &amp; Conditions
                </Link>
                .
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.12}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                1. Information We Collect
              </h2>

              <p className="mb-4 font-semibold leading-relaxed text-white">
                a) Information You Provide Voluntarily
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-6">
                <li>
                  <strong>Wallet address</strong> — when you connect your XRPL
                  wallet to access Xglobe.
                </li>
                <li>
                  <strong>Email address</strong> — only if you choose to create
                  an account using email instead of a wallet address.
                </li>
                <li>
                  <strong>Xpin profile information</strong> — including your
                  name, bio, links, social handles, and the location you choose
                  to display on Xglobe. This information is published publicly on
                  the Xglobe map.
                </li>
              </ul>
              <p className="mb-6 leading-relaxed">
                <strong>We never request, collect, or have access to:</strong>{' '}
                private keys, seed phrases, passwords, or any sensitive wallet
                credentials.
              </p>

              <p className="mb-4 font-semibold leading-relaxed text-white">
                b) Information Collected Automatically
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-6">
                <li>
                  <strong>IP address and usage data</strong> — collected by
                  Vercel (our hosting provider). Optional privacy-friendly
                  analytics (Vercel Analytics) load only if you consent to the
                  Analytics category via our cookie notice.
                </li>
                <li>
                  <strong>Map interaction data</strong> — collected by Mapbox
                  when you interact with the Xglobe map, including general
                  location data used to render the map.
                </li>
                <li>
                  <strong>Browser and device information</strong> — standard
                  technical data collected as part of normal web hosting
                  operations.
                </li>
                <li>
                  <strong>Essential cookies and browser storage</strong> —
                  needed to run the Site (for example sessions when you sign in
                  or connect a wallet). Optional Functional, Analytics, and
                  Marketing categories are controlled through the cookie notice.
                </li>
              </ul>
              <p className="mb-4 leading-relaxed">
                For cookie categories, consent storage, and how to change or
                reset your choices, see our{' '}
                <Link
                  to="/cookie-policy"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  Cookie Policy
                </Link>
                .
              </p>
              <p className="leading-relaxed">
                <strong>Blockchain data:</strong> Interactions with the XRPL
                (connects, mints, transfers) are public and permanently recorded
                on the ledger. Wallet addresses and transaction history are
                visible to anyone via XRPL explorers — this is inherent to public
                blockchains and not controlled by us.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.18}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                2. How We Use Your Information
              </h2>
              <p className="mb-4 leading-relaxed">
                We use the information collected to:
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-6">
                <li>Verify NFT ownership and provide access to Xglobe.</li>
                <li>
                  Display your Xpin on the Xglobe map to other verified holders.
                </li>
                <li>
                  Communicate with you if you have provided an email address.
                </li>
                <li>
                  Monitor and improve site performance using Vercel Analytics
                  (only when you have consented to Analytics cookies).
                </li>
                <li>Ensure the security and integrity of the Services.</li>
              </ul>
              <p className="leading-relaxed">
                We do not sell your personal information to third parties. We do
                not use your data for advertising purposes.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.24}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                3. Public Information
              </h2>
              <p className="mb-4 leading-relaxed">
                Your Xpin profile — including your chosen display name, bio,
                links, socials, and selected location — is publicly visible to
                all verified Xolo NFT holders on Xglobe. Xpins can also be shared
                via direct link or QR code and may be viewable by non-holders who
                receive a shared link.
              </p>
              <p className="leading-relaxed">
                Please do not include sensitive personal information in your
                Xpin that you would not want to be publicly visible.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.3}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                4. Third-Party Services
              </h2>
              <p className="mb-4 leading-relaxed">
                We use the following third-party services that may collect data
                independently under their own privacy policies:
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-6">
                <li>
                  <strong>Vercel</strong> — hosting and analytics.{' '}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                  >
                    Privacy policy
                  </a>
                </li>
                <li>
                  <strong>Mapbox</strong> — interactive map rendering.{' '}
                  <a
                    href="https://www.mapbox.com/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                  >
                    Privacy policy
                  </a>
                </li>
                <li>
                  <strong>Xaman (XUMM) Wallet</strong> — wallet connection for
                  XRPL.{' '}
                  <a
                    href="https://xaman.app/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                  >
                    Privacy policy
                  </a>
                </li>
              </ul>
              <p className="leading-relaxed">
                We encourage you to review the privacy policies of these
                third-party services. External platforms we link to (such as
                marketplaces or explorers) have their own policies.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.36}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                5. Data Retention
              </h2>
              <p className="mb-4 leading-relaxed">
                We retain your Xpin profile data for as long as your account is
                active or as needed to provide the Services. If you disconnect
                your wallet or delete your account, your Xpin will be removed
                from Xglobe. Email addresses are retained until you request
                deletion.
              </p>
              <p className="leading-relaxed">
                To request deletion of your data, contact us at:{' '}
                <a
                  href="mailto:contact@xolodojo.io"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  contact@xolodojo.io
                </a>
                . Note that public blockchain records cannot be deleted by us.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.42}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                6. International Users
              </h2>
              <p className="mb-4 leading-relaxed">
                XoloDojo is operated from Alaska, United States. If you are
                accessing the Services from outside the United States, please be
                aware that your information may be transferred to and processed
                in the United States, where data protection laws may differ from
                those in your country.
              </p>
              <p className="leading-relaxed">
                If you are located in the European Economic Area (EEA) or United
                Kingdom, you may have additional rights under GDPR or UK GDPR.
                Please contact us to exercise those rights.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.48}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                7. Children&apos;s Privacy
              </h2>
              <p className="leading-relaxed">
                Our Services are not directed to individuals under the age of
                18. We do not knowingly collect personal information from minors.
                If you believe a minor has provided us with personal
                information, please contact us and we will take steps to delete
                it.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.54}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                8. Your Rights
              </h2>
              <p className="mb-4 leading-relaxed">
                Depending on your location, you may have the right to:
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-6">
                <li>
                  Access the personal information we hold about you.
                </li>
                <li>Request correction of inaccurate information.</li>
                <li>Request deletion of your personal information.</li>
                <li>
                  Object to or restrict our processing of your information.
                </li>
              </ul>
              <p className="mb-4 leading-relaxed">
                To exercise any of these rights, contact us at:{' '}
                <a
                  href="mailto:contact@xolodojo.io"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  contact@xolodojo.io
                </a>
                . You can also disconnect your wallet at any time to stop further
                processing tied to that connection on our end. Immutable
                blockchain records may limit what can be deleted.
              </p>
              <p className="leading-relaxed">
                Cookie preferences can be managed or reset via our{' '}
                <Link
                  to="/cookie-policy"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.6}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                9. Security
              </h2>
              <p className="leading-relaxed">
                We take reasonable technical and organizational measures to
                protect your information from unauthorized access, loss, or
                misuse. However, no internet transmission or electronic storage
                is completely secure, and we cannot guarantee absolute security
                — especially in web3, where user-side risks (phishing, device
                compromise) exist. Always verify connections and never share
                private keys.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.66}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                10. Changes to This Policy
              </h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify users of material changes by updating the effective date
                at the top of this page. Continued use of the Services after
                changes constitutes acceptance of the updated policy.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.72}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                11. Contact
              </h2>
              <p className="leading-relaxed">
                For questions or requests regarding this Privacy Policy, contact
                us at:{' '}
                <a
                  href="mailto:contact@xolodojo.io"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  contact@xolodojo.io
                </a>
                .
              </p>
            </GsapPageContent>
          </div>
        </div>
      </section>
    </>
  );
}

export default PrivacyPolicy;
