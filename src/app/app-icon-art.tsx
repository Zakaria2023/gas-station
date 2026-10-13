/**
 * The home-screen icon: a gas cylinder on the app's blue. Drawn with plain
 * boxes because ImageResponse renders a small subset of CSS, and kept in one
 * place so the favicon and the Apple icon match.
 */
export const AppIconArt = ({ size }: { size: number }) => {
  const unit = size / 32;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#17468f",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: unit * 8,
            height: unit * 3.5,
            border: `${unit * 1.6}px solid #ffffff`,
            borderBottom: "none",
            borderRadius: `${unit * 3}px ${unit * 3}px 0 0`,
          }}
        />
        <div
          style={{
            width: unit * 4,
            height: unit * 1.6,
            background: "#ffffff",
          }}
        />
        <div
          style={{
            width: unit * 14,
            height: unit * 17,
            background: "#ffffff",
            borderRadius: `${unit * 5}px ${unit * 5}px ${unit * 3}px ${unit * 3}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: unit * 14,
              height: unit * 2.4,
              background: "#d0570f",
            }}
          />
        </div>
      </div>
    </div>
  );
};
