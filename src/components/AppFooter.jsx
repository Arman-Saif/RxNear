import { useSelector } from "react-redux";

export default function AppFooter() {
  const theme = useSelector((state) => state.app.theme);
  const isDark = theme === "dark";

  return (
    <footer
      className={[
        "w-full border-t px-4 py-5 text-center",
        "transition-colors duration-300",
        isDark
          ? "border-[#33465C] bg-[#101827] text-[#A7B5C8]"
          : "border-[#DCE5EC] bg-[#EDF5F8] text-[#718A9B]",
      ].join(" ")}
    >
      <p className="text-sm font-medium tracking-wide">
        Powered By{" "}
        <a
          href="https://www.codyza.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={[
            "font-bold underline-offset-4",
            "transition-colors duration-200",
            "hover:underline",
            "focus-visible:outline-none focus-visible:underline",
            isDark
              ? "text-[#20C7C2] hover:text-[#3ADBD5]"
              : "text-[#087F9B] hover:text-[#066A82]",
          ].join(" ")}
        >
          Codyza
        </a>
      </p>
    </footer>
  );
}
