function NotFound() {
  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]"
      style={{ backgroundImage: "url('/Pattern.png')" }}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-10">
            <img src="/04a.png" alt="" className="max-h-56 w-auto rounded-md object-contain md:max-h-80" />
          </div>
        </div>
        <div className="mx-auto max-w-4xl [&_p]:text-[#decee9]">
          <h2 className="mb-6 text-2xl font-bold text-[#28aae4] md:text-3xl">
            Page Not Found
          </h2>

        </div>
      </div>
    </section>
  );
}

export default NotFound;
