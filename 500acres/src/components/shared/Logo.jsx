import logoPng from "../../assets/brand/500acres.png";

export default function Logo({ className = "", showText = true, style }) {
  return (
    <img
      src={logoPng}
      alt="500 Acres"
      className={className}
      style={{
        ...(showText ? {} : { objectFit: "cover", objectPosition: "top center" }),
        ...style,
      }}
    />
  );
}
