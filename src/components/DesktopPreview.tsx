import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
export function DesktopPreview() {
  const location = useLocation();
  const [src, setSrc] = useState("");
  const url = window.location.href;
  useEffect(() => {
    let active = true;
    const update = () => {
      if (matchMedia("(min-width:780px)").matches) {
        import("qrcode")
          .then(({ default: qr }) =>
            qr.toDataURL(window.location.href, {
              width: 180,
              margin: 2,
              color: { dark: "#222222", light: "#FFFFFF" },
            }),
          )
          .then((image) => {
            if (active) setSrc(image);
          });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      active = false;
      window.removeEventListener("resize", update);
    };
  }, [location.key]);
  return (
    <aside className="desktop-note">
      <span className="wordmark">outpost</span>
      <h2>Open on your phone</h2>
      <p>Scan to continue on your phone.</p>
      {src && (
        <img
          src={src}
          className="qr"
          width="136"
          height="136"
          alt="Scan to open this page on your phone"
        />
      )}
      <a href={url}>{window.location.host}</a>
    </aside>
  );
}
