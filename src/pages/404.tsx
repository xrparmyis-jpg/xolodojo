import { Link } from "react-router-dom";
import { faArrowRightLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";

function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-3xl flex-col items-center gap-6 rounded-lg border border-white/10 bg-black/20 px-6 py-10 text-center sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <img src="/404.png" alt="Page not found" className="h-auto w-full" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="text-3xl font-bold text-white sm:text-4xl"
        >
          Page not found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="max-w-xl text-base text-white/75 sm:text-lg"
        >
          Sorry, we couldn&apos;t find your page.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
        >
          <Link
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            to="/"
          >
            Go Back Home <FontAwesomeIcon icon={faArrowRightLong} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default NotFound;
