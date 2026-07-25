import { Link } from 'react-router-dom';

import GsapPageContent from '../components/GsapPageContent';
import GsapPageSubHeading from '../components/GsapPageSubHeading';
import { CookieSettingsLink } from '../components/CookieSettingsLink';
import { ResetCookiePreferencesLink } from '../components/ResetCookiePreferencesLink';

function CookiePolicy() {
  return (
    <>
      <section className="relative border-b border-[#36e9e424] bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30"></section>
      <section className="relative overflow-hidden bg-[var(--bg)] py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <GsapPageSubHeading heading="Cookie Policy" />
            <GsapPageContent
              as="p"
              className="mb-16 text-center text-lg text-gray-400"
              delay={0}
            >
              Effective Date: July 11, 2026
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.06}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                1. Introduction
              </h2>
              <p className="mb-4 leading-relaxed">
                This Cookie Policy explains how The Xoloitzquintli Collection
                (the &quot;Project&quot;, &quot;we&quot;, &quot;us&quot;, or
                &quot;our&quot;) uses cookies and similar technologies on
                https://xolodojo.io (the &quot;Site&quot;).
              </p>
              <p className="leading-relaxed">
                It should be read together with our{' '}
                <Link
                  to="/privacy-policy"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  Privacy Policy
                </Link>
                , which describes how we handle personal information more
                broadly. Where this policy and the Privacy Policy overlap, both
                apply.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.12}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                2. What Are Cookies &amp; Similar Technologies?
              </h2>
              <p className="mb-4 leading-relaxed">
                Cookies are small text files stored on your device when you
                visit a website. We may also use related browser storage (such
                as{' '}
                <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm text-cyan-200">
                  localStorage
                </code>
                ) for the same kinds of purposes — for example, to remember a
                choice you make on the Site.
              </p>
              <p className="leading-relaxed">
                Some of these technologies are strictly necessary to make the
                Site work. Optional categories are only used if you consent to
                them — either by accepting all, or by enabling specific
                categories under Manage preferences.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.18}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                3. Cookie Categories
              </h2>

              <p className="mb-4 font-semibold leading-relaxed text-white">
                A. Strictly Necessary
              </p>
              <p className="mb-6 leading-relaxed">
                Required for the Site to function. These cannot be turned off
                through our notice. Examples include session or authentication
                state when you sign in or connect a wallet, security measures,
                and storing your consent choice (categories, timestamp, and
                policy version) so we do not ask repeatedly and can re-prompt if
                our practices change.
              </p>

              <p className="mb-4 font-semibold leading-relaxed text-white">
                B. Functional / Preferences
              </p>
              <p className="mb-6 leading-relaxed">
                Optional. Remembers non-essential choices in this browser — for
                example social handles you enter for globe pinning in
                wallet-only mode — so they survive page reloads. Without this
                category, those values stay in memory for the current page visit
                only and are not written to browser storage.
              </p>

              <p className="mb-4 font-semibold leading-relaxed text-white">
                C. Analytics
              </p>
              <p className="mb-6 leading-relaxed">
                Optional. Privacy-friendly analytics (Vercel Analytics) to
                understand aggregate traffic and improve performance. The
                analytics script is <strong>not loaded</strong> unless you
                enable this category. We do not use Google Analytics or
                advertising trackers for this purpose.
              </p>

              <p className="mb-4 font-semibold leading-relaxed text-white">
                D. Marketing / Advertising
              </p>
              <p className="leading-relaxed">
                Optional. Retargeting pixels, ad attribution, and similar tools.
                We do not currently load any marketing scripts. When we add
                them, they will only mount through a consent gate after you
                enable this category.
              </p>

              <p className="mt-6 leading-relaxed">
                Wallet connections may also involve third-party tools (such as
                Xaman). Those providers may set their own cookies or storage
                under their policies.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.24}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                4. Your Choices
              </h2>
              <p className="mb-4 leading-relaxed">
                When you first visit the Site (or after we ask again because our
                cookie policy version changes), a notice appears at the bottom
                of the browser window. You can:
              </p>
              <ul className="legal-list">
                <li>
                  <strong>Accept all</strong> — allow Functional, Analytics, and
                  Marketing categories.
                </li>
                <li>
                  <strong>Reject non-essential</strong> — keep only Strictly
                  Necessary technology.
                </li>
                <li>
                  <strong>Manage preferences</strong> — open category toggles
                  and save a custom mix (Strictly Necessary stays on).
                </li>
              </ul>
              <p className="mb-4 leading-relaxed">
                Your choice is stored in first-party browser storage with a
                timestamp and policy version. If we materially change what we
                ask consent for, we bump that version and ask again.
              </p>
              <p className="mb-4 leading-relaxed">
                Change categories anytime at our <CookieSettingsLink />, or{' '}
                <ResetCookiePreferencesLink /> to clear your saved consent
                preferences.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.3}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                5. Third Parties
              </h2>
              <p className="leading-relaxed">
                Limited third parties help us run the Site — for example Vercel
                (hosting and, if you accept Analytics, analytics) and wallet
                providers. We do not sell cookie data. External sites we link to
                (such as marketplaces or explorers) have their own cookie
                practices.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.36}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                6. Changes to This Policy
              </h2>
              <p className="leading-relaxed">
                We may update this Cookie Policy as the Site evolves. Changes
                will be posted here with a new effective date at the top of this
                page. If we make material changes to optional cookie categories
                or uses, we may bump the consent policy version and ask for your
                choices again.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.42}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                7. Contact Us
              </h2>
              <p className="leading-relaxed">
                For questions about cookies or this policy, reach out via our
                official channels (X/Twitter, Discord — add your actual links
                here when set up). For broader privacy questions, see our{' '}
                <Link
                  to="/privacy-policy"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </GsapPageContent>
          </div>
        </div>
      </section>
    </>
  );
}

export default CookiePolicy;
