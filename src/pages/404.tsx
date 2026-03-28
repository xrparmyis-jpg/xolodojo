import GsapPageContent from "../components/GsapPageContent";

function NotFound() {
  return (
    <section
      className="relative border-b border-[#36e9e424] bg-cover bg-center bg-no-repeat pt-16 pb-12 md:pt-30 md:pb-16"
      style={{ backgroundImage: "url('/Pattern.png')" }}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center text-center">
          <GsapPageContent className="mb-10" delay={0}>
            <img
              src="/04a.png"
              alt=""
              className="max-h-56 w-auto rounded-md object-contain md:max-h-80"
            />
          </GsapPageContent>
        </div>
        <div className="mx-auto max-w-4xl text-center [&_p]:text-[#decee9]">
          <GsapPageContent
            as="h2"
            className="mb-6 text-2xl font-bold text-[#28aae4] md:text-3xl"
            delay={0.08}
          >
            Page Not Found
          </GsapPageContent>
        </div>
      </div>
    </section>
  );
}

export default NotFound;
