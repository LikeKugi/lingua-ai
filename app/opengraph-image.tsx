import { ImageResponse } from "next/og";

export const alt = "Лингва — понятные объяснения языковых ошибок";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#f3f1e9",
          color: "#1c3028",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
          display: "flex",
          width: 700,
          boxSizing: "border-box",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "58px 52px 42px 68px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "15px 15px 15px 4px",
                backgroundColor: "#244d3b",
                color: "#d6e98a",
                fontFamily: "serif",
                fontSize: 31,
                fontWeight: 700,
              }}
            >
              Л
            </div>
            <div
              style={{
                color: "#1c3028",
                fontFamily: "serif",
                fontSize: 27,
                fontWeight: 700,
                letterSpacing: 5,
              }}
            >
              ЛИНГВА
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 25 }}>
            <div
              style={{
                marginBottom: 18,
                color: "#687267",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 3,
              }}
            >
              ЯЗЫКОВАЯ ПРАКТИКА С ПОНИМАНИЕМ
            </div>
            <div
              style={{
                maxWidth: 570,
                fontFamily: "serif",
                fontSize: 59,
                lineHeight: 1.12,
                letterSpacing: -1.4,
              }}
            >
              Поймите, почему ответ неверен
            </div>
            <div
              style={{
                maxWidth: 500,
                marginTop: 22,
                color: "#687267",
                fontSize: 21,
                lineHeight: 1.45,
              }}
            >
              Понятные объяснения помогают учиться на каждой ошибке.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#536f57",
              fontSize: 15,
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#91aa57" }} />
            Ваши задания и история остаются в этом браузере
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            width: 500,
            boxSizing: "border-box",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: "#244d3b",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -115,
              right: -75,
              width: 300,
              height: 300,
              border: "1px solid #ffffff2b",
              borderRadius: 150,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -165,
              left: -115,
              width: 350,
              height: 350,
              border: "1px solid #ffffff2b",
              borderRadius: 175,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 82,
              left: 57,
              color: "#d6e98a",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2.5,
            }}
          >
            ПРИМЕР РАЗБОРА
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              width: 390,
              flexDirection: "column",
              border: "1px solid #e4e2d6",
              borderRadius: 17,
              padding: "28px 29px 26px",
              backgroundColor: "#fffefa",
              boxShadow: "0 18px 40px #102b1e40",
            }}
          >
            <div style={{ marginBottom: 19, color: "#777e74", fontSize: 12, fontWeight: 700, letterSpacing: 1.6 }}>
              АНГЛИЙСКИЙ · ВРЕМЕНА
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#777e74", fontSize: 14 }}>Ваш вариант</span>
                <span style={{ color: "#b85645", fontSize: 20, fontWeight: 600 }}>I have went</span>
              </div>
              <div style={{ height: 1, backgroundColor: "#e4e2d6" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#777e74", fontSize: 14 }}>Правильно</span>
                <span style={{ color: "#244d3b", fontSize: 20, fontWeight: 700 }}>I have gone</span>
              </div>
            </div>
            <div style={{ height: 1, marginTop: 19, backgroundColor: "#e4e2d6" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 17, color: "#244d3b", fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: "#91aa57", fontSize: 18 }}>✳</span>
              Почему так?
            </div>
            <div style={{ marginTop: 8, color: "#687267", fontSize: 14, lineHeight: 1.45 }}>
              После have нужна третья форма глагола — gone.
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
